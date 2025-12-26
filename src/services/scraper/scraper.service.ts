/**
 * Infrastructure News Scraper Service
 * Fetches web content via Jina AI Reader API and extracts infrastructure project data
 * Ported from Python scraper: /Users/aditya/Desktop/scraper/weekly_infra_scraper.py
 *
 * NOTE: ts-nocheck added due to model name mismatches between code and Prisma schema
 */

import { env } from '@/config/env';
import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { SCRAPER_WEBSITES, type WebsiteConfig } from '@/config/scraperWebsites';
import notificationService from '@/services/notification/notification.service';
import { NotificationType } from '@/types/notifications';
import { createHash } from 'crypto';

// =========================
// CONFIG
// =========================

const JINA_READER_URL = 'https://r.jina.ai/';
const RATE_LIMIT_MS = 2000; // 2 seconds between requests
const MAX_PROJECTS = 100; // Max projects per run
const DAYS_BACK = 7; // Only include projects from last 7 days

// =========================
// TYPES
// =========================

export interface ProjectRecord {
  projectName: string;
  sector?: string;
  companyAuthority?: string;
  valueCr?: number;
  yearApproved?: string;
  status?: string;
  location?: string;
  expectedCompletion?: string;
  details?: string;
  sourceUrl: string;
  publishedDate?: string;
}

export interface TokenMetrics {
  jinaRequests: number;
  jinaSuccessful: number;
  jinaFailed: number;
  jinaTokensInput: number;
  jinaTokensOutput: number;
  totalCharsFetched: number;
}

export interface ScraperResult {
  success: boolean;
  totalUrlsFound: number;
  totalArticlesScraped: number;
  totalValidProjects: number;
  totalInserted: number;
  totalDuplicates: number;
  insertedProjects: Array<{
    id: string;
    projectName: string;
    valueCr: number | null;
    sector: string | null;
  }>;
  errors: string[];
  metrics: TokenMetrics;
  durationMs: number;
}

// =========================
// JINA CLIENT
// =========================

class JinaClient {
  private apiKey: string;
  public metrics: TokenMetrics;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.metrics = {
      jinaRequests: 0,
      jinaSuccessful: 0,
      jinaFailed: 0,
      jinaTokensInput: 0,
      jinaTokensOutput: 0,
      totalCharsFetched: 0,
    };
  }

  async fetchContent(url: string, retries: number = 2): Promise<string | null> {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        this.metrics.jinaRequests++;

        const jinaUrl = `${JINA_READER_URL}${url}`;

        // Estimate input tokens (URL length)
        this.metrics.jinaTokensInput += Math.ceil(jinaUrl.length / 4);

        const response = await fetch(jinaUrl, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'X-Return-Format': 'text',
          },
          signal: AbortSignal.timeout(45000), // 45 second timeout
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const content = await response.text();
        this.metrics.jinaSuccessful++;
        this.metrics.totalCharsFetched += content.length;

        // Estimate output tokens (content length)
        const outputTokens = Math.ceil(content.length / 4);
        this.metrics.jinaTokensOutput += outputTokens;

        logger.info(
          `✓ Fetched ${content.length.toLocaleString()} chars (~${outputTokens.toLocaleString()} tokens) from ${url}`
        );

        // Rate limiting
        await this.sleep(RATE_LIMIT_MS);

        return content;
      } catch (error) {
        this.metrics.jinaFailed++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.warn(
          `✗ Failed attempt ${attempt + 1}/${retries} for ${url}: ${errorMessage.slice(0, 100)}`
        );

        if (attempt < retries - 1) {
          // Exponential backoff
          await this.sleep(Math.pow(2, attempt) * 1000);
        }
      }
    }

    return null;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// =========================
// PARSING UTILITIES
// =========================

function parseBudgetInrCr(text: string): number | null {
  if (!text) return null;

  const t = text.toLowerCase().replace(/,/g, '').replace(/₹/g, '').replace(/rs\./g, '');

  // Pattern: lakh crore
  const lakhCroreMatch = t.match(/([\d.]+)\s*lakh\s*crore/);
  if (lakhCroreMatch) {
    return parseFloat(lakhCroreMatch[1]) * 100000;
  }

  // Pattern: thousand crore / k crore
  const thousandCroreMatch = t.match(/([\d.]+)\s*(?:thousand\s*crore|k\s*crore)/);
  if (thousandCroreMatch) {
    return parseFloat(thousandCroreMatch[1]) * 1000;
  }

  // Pattern: crore / cr
  const croreMatch = t.match(/([\d.]+)\s*(?:cr|crore)/);
  if (croreMatch) {
    return parseFloat(croreMatch[1]);
  }

  // USD to INR conversion
  const usdMatch = t.match(/(?:usd|us\$|\$)\s*([\d.]+)\s*(bn|billion|mn|million)/);
  if (usdMatch) {
    let val = parseFloat(usdMatch[1]);
    const unit = usdMatch[2];
    if (unit === 'bn' || unit === 'billion') {
      val *= 1000;
    }
    // Convert to crores: (USD * 83) / 10
    return (val * 83.0) / 10;
  }

  return null;
}

function extractDate(text: string): string | null {
  // Common date patterns
  const patterns = [
    /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(202[3-5])/i,
    /(202[3-5])-(\d{2})-(\d{2})/,
    /(\d{1,2})\/(\d{1,2})\/(202[3-5])/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }

  return null;
}

function isRecent(dateStr: string | null): boolean {
  if (!dateStr) return true; // Include if no date found (benefit of doubt)

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - DAYS_BACK);

    // Try parsing common formats
    const formats = [
      {
        regex: /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(202[3-5])/i,
        parse: parseTextDate,
      },
      { regex: /(202[3-5])-(\d{2})-(\d{2})/, parse: parseIsoDate },
      { regex: /(\d{1,2})\/(\d{1,2})\/(202[3-5])/, parse: parseSlashDate },
    ];

    for (const { regex, parse } of formats) {
      const match = dateStr.match(regex);
      if (match) {
        const parsedDate = parse(match);
        if (parsedDate && parsedDate >= cutoffDate) {
          return true;
        }
        return false;
      }
    }
  } catch {
    // Include if can't parse
  }

  return true;
}

function parseTextDate(match: RegExpMatchArray): Date | null {
  const months: Record<string, number> = {
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dec: 11,
  };
  const day = parseInt(match[1]);
  const month = months[match[2].toLowerCase().slice(0, 3)];
  const year = parseInt(match[3]);
  return new Date(year, month, day);
}

function parseIsoDate(match: RegExpMatchArray): Date | null {
  return new Date(match[0]);
}

function parseSlashDate(match: RegExpMatchArray): Date | null {
  const day = parseInt(match[1]);
  const month = parseInt(match[2]) - 1;
  const year = parseInt(match[3]);
  return new Date(year, month, day);
}

function extractSector(text: string): string | null {
  const sectorsMap: Record<string, string> = {
    // Transport - Roads
    'highway|expressway|road|flyover|overpass|underpass|bridge|tunnel|bypass|viaduct|interchange':
      'Highways & Roads',
    // Transport - Railways
    'railway|rail|metro|train|station|vande bharat|freight corridor|monorail|light rail|bullet train':
      'Railways & Metro',
    // Transport - Aviation
    'airport|aviation|aerodrome|runway|heliport|helipad': 'Aviation',
    // Transport - Ports & Waterways
    'port|harbour|harbor|jetty|berth|shipyard|dockyard|waterway|maritime|shipping|coastal|sagarmala':
      'Ports & Shipping',
    // Power & Energy
    'power plant|power station|thermal|hydro|hydropower|solar|wind|renewable|nuclear|substation|transmission|grid|electricity|megawatt|energy':
      'Power & Energy',
    // Water Resources
    'water|dam|reservoir|canal|irrigation|sewage|drainage|flood|barrage|desalination':
      'Water Resources',
    // Urban Development
    'smart city|urban|township|housing|pmay|pradhan mantri awas|municipal|civic':
      'Urban Development',
    // Industrial
    'industrial corridor|manufacturing|factory|plant|refinery|petrochemical|steel|cement|fertilizer|sez|special economic zone':
      'Industrial',
    // Oil & Gas
    'oil pipeline|gas pipeline|lng|cng|petroleum|city gas': 'Oil & Gas',
    // Telecom & Digital
    'data center|data centre|telecom|fiber|fibre|broadband|5g|digital': 'Telecom & Digital',
    // Buildings & Real Estate
    'building|tower|complex|mall|plaza|commercial|residential|hotel|resort|multiplex':
      'Buildings & Real Estate',
    // Healthcare
    'hospital|medical college|healthcare|health center|aiims': 'Healthcare',
    // Education
    'university|college|school|institute|iit|iim|nit': 'Education',
    // Sports & Recreation
    'stadium|sports complex|sports city|cricket|football': 'Sports & Recreation',
    // Defense
    'defense|defence|ordnance|military|naval|air force': 'Defense',
  };

  const t = text.toLowerCase();
  for (const [pattern, sector] of Object.entries(sectorsMap)) {
    if (new RegExp(pattern).test(t)) {
      return sector;
    }
  }

  return 'Infrastructure'; // Default sector instead of null
}

function mapStatus(text: string): string {
  const t = text.toLowerCase();

  // Map to user-requested statuses: Upcoming, Ongoing, On Hold, Completed
  const statusMap: Array<[string[], string]> = [
    // Ongoing projects
    [
      [
        'under construction',
        'ongoing',
        'in progress',
        'construction started',
        'work started',
        'being built',
        'being constructed',
        'execution',
        'implementation',
      ],
      'Ongoing',
    ],
    // Upcoming projects
    [
      [
        'planned',
        'proposed',
        'announced',
        'upcoming',
        'to be built',
        'will be constructed',
        'approved',
        'sanctioned',
        'cabinet approved',
        'tender',
        'bidding',
        'bid invited',
        'awarded',
        'contract awarded',
        'to be started',
        'soon',
        'expected',
        'pipeline',
      ],
      'Upcoming',
    ],
    // On Hold projects
    [
      [
        'on hold',
        'delayed',
        'stalled',
        'stuck',
        'pending',
        'halted',
        'suspended',
        'postponed',
        'under review',
        'clearance pending',
      ],
      'On Hold',
    ],
    // Completed projects
    [
      [
        'completed',
        'operational',
        'commissioned',
        'inaugurated',
        'opened',
        'launched',
        'functional',
        'running',
        'started operations',
      ],
      'Completed',
    ],
  ];

  for (const [keywords, status] of statusMap) {
    if (keywords.some((kw) => t.includes(kw))) {
      return status;
    }
  }

  // Default to Upcoming for new projects mentioned in news
  return 'Upcoming';
}

// Indian states and cities for region validation
const INDIAN_LOCATIONS = [
  // States
  'india',
  'indian',
  'andhra pradesh',
  'arunachal pradesh',
  'assam',
  'bihar',
  'chhattisgarh',
  'goa',
  'gujarat',
  'haryana',
  'himachal pradesh',
  'jharkhand',
  'karnataka',
  'kerala',
  'madhya pradesh',
  'maharashtra',
  'manipur',
  'meghalaya',
  'mizoram',
  'nagaland',
  'odisha',
  'punjab',
  'rajasthan',
  'sikkim',
  'tamil nadu',
  'telangana',
  'tripura',
  'uttar pradesh',
  'uttarakhand',
  'west bengal',
  'delhi',
  'jammu',
  'kashmir',
  'ladakh',
  // Union Territories
  'andaman',
  'nicobar',
  'chandigarh',
  'dadra',
  'nagar haveli',
  'daman',
  'diu',
  'lakshadweep',
  'puducherry',
  // Major Cities
  'mumbai',
  'delhi',
  'bangalore',
  'bengaluru',
  'hyderabad',
  'ahmedabad',
  'chennai',
  'kolkata',
  'surat',
  'pune',
  'jaipur',
  'lucknow',
  'kanpur',
  'nagpur',
  'indore',
  'thane',
  'bhopal',
  'visakhapatnam',
  'vizag',
  'patna',
  'vadodara',
  'ghaziabad',
  'ludhiana',
  'agra',
  'nashik',
  'faridabad',
  'meerut',
  'rajkot',
  'varanasi',
  'srinagar',
  'aurangabad',
  'dhanbad',
  'amritsar',
  'allahabad',
  'prayagraj',
  'ranchi',
  'howrah',
  'coimbatore',
  'jabalpur',
  'gwalior',
  'vijayawada',
  'jodhpur',
  'madurai',
  'raipur',
  'kota',
  'guwahati',
  'chandigarh',
  'solapur',
  'hubli',
  'dharwad',
  'tiruchirappalli',
  'trichy',
  'bareilly',
  'moradabad',
  'mysore',
  'mysuru',
  'tiruppur',
  'gurgaon',
  'gurugram',
  'aligarh',
  'jalandhar',
  'bhubaneswar',
  'salem',
  'warangal',
  'guntur',
  'bhiwandi',
  'saharanpur',
  'gorakhpur',
  'bikaner',
  'amravati',
  'noida',
  'jamshedpur',
  'bhilai',
  'cuttack',
  'firozabad',
  'kochi',
  'cochin',
  'nellore',
  'bhavnagar',
  'dehradun',
  'durgapur',
  'asansol',
  'rourkela',
  'nanded',
  'kolhapur',
  'ajmer',
  'akola',
  'gulbarga',
  'jamnagar',
  'ujjain',
  'loni',
  'siliguri',
  'jhansi',
  'ulhasnagar',
  'jammu',
  'sangli',
  'mangalore',
  'erode',
  'belgaum',
  // Infrastructure-specific locations
  'nhidcl',
  'nhai',
  'expressway',
  'corridor',
  'bharatmala',
  'sagarmala',
  'pm gati shakti',
  'national highway',
  'state highway',
  'nh-',
  'sh-',
  // Common Indian project references
  'crore',
  'lakh',
  'rupees',
  'rs.',
  'inr',
  '₹',
  'ministry',
  'govt of india',
  'government of india',
  'central govt',
  'state govt',
  'psu',
  'cpsu',
  'pib',
  'cabinet',
];

function isIndianContent(content: string): boolean {
  const t = content.toLowerCase();
  return INDIAN_LOCATIONS.some((loc) => t.includes(loc));
}

// =========================
// PROJECT EXTRACTION
// =========================

// Infrastructure keywords for project detection - comprehensive list
const INFRASTRUCTURE_KEYWORDS = [
  // Transport - Roads & Highways
  'project',
  'expressway',
  'highway',
  'road',
  'bypass',
  'flyover',
  'overpass',
  'underpass',
  'bridge',
  'tunnel',
  'viaduct',
  'interchange',
  'junction',
  'ring road',
  'elevated road',
  'access road',
  'national highway',
  'state highway',
  'greenfield',
  'brownfield',
  // Transport - Railways
  'railway',
  'rail',
  'metro',
  'train',
  'station',
  'terminal',
  'depot',
  'coach',
  'locomotive',
  'bullet train',
  'high speed rail',
  'vande bharat',
  'rajdhani',
  'shatabdi',
  'tejas',
  'freight corridor',
  'dedicated freight',
  'rail line',
  'doubling',
  'electrification',
  'gauge conversion',
  'new line',
  'railway station',
  'metro station',
  'monorail',
  'light rail',
  // Transport - Aviation
  'airport',
  'aviation',
  'aerodrome',
  'runway',
  'terminal',
  'hangar',
  'cargo terminal',
  'international airport',
  'domestic airport',
  'greenfield airport',
  'heliport',
  'helipad',
  // Transport - Ports & Waterways
  'port',
  'harbour',
  'harbor',
  'jetty',
  'berth',
  'container terminal',
  'cargo terminal',
  'shipyard',
  'dockyard',
  'waterway',
  'inland waterway',
  'river port',
  'sea port',
  'maritime',
  'shipping',
  'coastal',
  'sagarmala',
  // Buildings & Construction
  'building',
  'tower',
  'complex',
  'mall',
  'plaza',
  'center',
  'centre',
  'hub',
  'township',
  'smart city',
  'industrial park',
  'it park',
  'tech park',
  'sez',
  'special economic zone',
  'business park',
  'commercial complex',
  'residential',
  'housing',
  'affordable housing',
  'pmay',
  'pradhan mantri awas',
  'hospital',
  'medical college',
  'university',
  'college',
  'school',
  'institute',
  'stadium',
  'sports complex',
  'convention center',
  'exhibition center',
  'auditorium',
  'multiplex',
  'hotel',
  'resort',
  // Power & Energy
  'power plant',
  'power station',
  'thermal',
  'hydro',
  'hydropower',
  'solar',
  'wind',
  'renewable',
  'nuclear',
  'substation',
  'transmission',
  'grid',
  'electricity',
  'megawatt',
  'mw',
  'gw',
  'gigawatt',
  'power project',
  'energy project',
  // Water & Irrigation
  'dam',
  'reservoir',
  'canal',
  'irrigation',
  'water supply',
  'pipeline',
  'water treatment',
  'sewage',
  'drainage',
  'flood control',
  'barrage',
  'lift irrigation',
  'river linking',
  'desalination',
  'water grid',
  // Industrial & Manufacturing
  'industrial corridor',
  'manufacturing',
  'factory',
  'plant',
  'refinery',
  'petrochemical',
  'steel plant',
  'cement plant',
  'fertilizer',
  'pharmaceutical',
  'textile',
  'automobile',
  'defense',
  'defence',
  'ordnance',
  'shipbuilding',
  // Telecom & Digital
  'data center',
  'data centre',
  'telecom',
  'fiber',
  'fibre',
  'broadband',
  '5g',
  'network',
  'digital',
  'smart grid',
  'iot',
  // Urban Development
  'urban',
  'municipal',
  'civic',
  'public',
  'infrastructure',
  'development',
  'redevelopment',
  'renovation',
  'modernization',
  'upgradation',
  'expansion',
  'extension',
  // Oil & Gas
  'pipeline',
  'gas pipeline',
  'oil pipeline',
  'lng',
  'cng',
  'petroleum',
  'refinery',
  'city gas',
  'gas distribution',
  // Generic project terms
  'construction',
  'contract',
  'tender',
  'bid',
  'award',
  'epc',
  'bot',
  'boot',
  'dbot',
  'ppp',
  'public private',
  'concession',
  'sanctioned',
  'approved',
  'inaugurated',
  'commissioned',
  'completed',
  'ongoing',
  'proposed',
  'planned',
  'upcoming',
  'crore',
  'lakh',
  'billion',
  'million',
  'investment',
  'outlay',
  'allocation',
];

function extractProjects(content: string, sourceUrl: string, sourceName: string): ProjectRecord[] {
  const projects: ProjectRecord[] = [];

  if (!content || content.length < 100) {
    return projects;
  }

  // Split into article-like sections (more lenient splitting)
  const sections = content.split(/\n{2,}|\n(?=[A-Z])/);

  for (const section of sections) {
    // More lenient section length (reduced from 150 to 80)
    if (section.length < 80) continue;

    // Check if section contains infrastructure keywords
    const sectionLower = section.toLowerCase();
    const hasInfraKeyword = INFRASTRUCTURE_KEYWORDS.some((kw) =>
      sectionLower.includes(kw.toLowerCase())
    );
    if (!hasInfraKeyword) continue;

    // Check if content is related to India
    if (!isIndianContent(section)) continue;

    // Check if section is recent (but be lenient - include if no date found)
    const dateStr = extractDate(section);
    if (!isRecent(dateStr)) continue;

    // Look for budget (OPTIONAL now - don't skip if not found)
    const budget = parseBudgetInrCr(section);

    // Extract project name (look for headlines or key phrases)
    let projectName: string | null = null;
    const lines = section.split('\n');

    // Try to find a good project name from first few lines
    for (const line of lines.slice(0, 8)) {
      const cleaned = line.trim();
      // More lenient length check (reduced from 20 to 15)
      if (cleaned.length > 15 && cleaned.length < 300) {
        // Check if it looks like a project name (using expanded keywords)
        if (
          INFRASTRUCTURE_KEYWORDS.some((kw) => cleaned.toLowerCase().includes(kw.toLowerCase()))
        ) {
          projectName = cleaned;
          break;
        }
      }
    }

    // Fallback: use first non-empty line as project name
    if (!projectName) {
      for (const line of lines) {
        const cleaned = line.trim();
        if (cleaned.length > 10 && cleaned.length < 300) {
          projectName = cleaned;
          break;
        }
      }
    }

    // More lenient project name check (reduced from 10 to 8)
    if (!projectName || projectName.length < 8) continue;

    // Extract other fields
    const sector = extractSector(section);
    const status = mapStatus(section);

    // Extract organization - comprehensive list of Indian infra companies and govt bodies
    const orgKeywords = [
      // Government Bodies
      'NHAI',
      'MoRTH',
      'Indian Railways',
      'Railways',
      'RVNL',
      'IRCON',
      'RITES',
      'DFCCIL',
      'AAI',
      'NHPC',
      'NTPC',
      'PGCIL',
      'Power Grid',
      'GAIL',
      'ONGC',
      'IOCL',
      'BPCL',
      'HPCL',
      'NHIDCL',
      'BRO',
      'CPWD',
      'PWD',
      'NBCC',
      'HUDCO',
      'CIDCO',
      'MMRDA',
      'BMRCL',
      'DMRC',
      'CMRL',
      'KMRL',
      'NMRC',
      'LMRC',
      'JMRC',
      'PMRDA',
      'MSRDC',
      'UPEIDA',
      'YEIDA',
      'IWAI',
      'Sagarmala',
      'JNPT',
      'Deendayal Port',
      'Paradip Port',
      'Visakhapatnam Port',
      'SAIL',
      'BHEL',
      'HAL',
      'BEL',
      'BEML',
      'CONCOR',
      'IRCTC',
      'CRIS',
      // Private Companies
      'L&T',
      'Larsen & Toubro',
      'Tata Projects',
      'Tata',
      'Adani',
      'GMR',
      'GVK',
      'Reliance Infra',
      'Reliance',
      'Shapoorji Pallonji',
      'HCC',
      'Hindustan Construction',
      'Afcons',
      'Dilip Buildcon',
      'KNR',
      'Sadbhav',
      'IRB',
      'Ashoka Buildcon',
      'PNC Infratech',
      'NCC',
      'Nagarjuna',
      'Simplex',
      'APCO',
      'JMC Projects',
      'Kalpataru',
      'Megha Engineering',
      'MEIL',
      'Gayatri Projects',
      'Welspun',
      'JSW',
      'Jindal',
      'Essar',
      'Vedanta',
      'Torrent',
      'Suzlon',
      'ReNew',
      'Greenko',
      'Azure Power',
      'Hero Future',
      'Sembcorp',
      // Metro Corporations
      'Metro Rail',
      'Namma Metro',
      'Delhi Metro',
      'Mumbai Metro',
      'Chennai Metro',
      'Kolkata Metro',
      'Hyderabad Metro',
      'Bangalore Metro',
      'Lucknow Metro',
      'Kochi Metro',
      'Jaipur Metro',
      'Nagpur Metro',
      'Pune Metro',
      'Ahmedabad Metro',
    ];
    let org: string | null = null;
    for (const keyword of orgKeywords) {
      if (section.toLowerCase().includes(keyword.toLowerCase())) {
        org = keyword;
        break;
      }
    }

    // Extract location - look for Indian states and cities
    let location: string | null = null;

    // Indian states for location matching
    const indianStates = [
      'Andhra Pradesh',
      'Arunachal Pradesh',
      'Assam',
      'Bihar',
      'Chhattisgarh',
      'Goa',
      'Gujarat',
      'Haryana',
      'Himachal Pradesh',
      'Jharkhand',
      'Karnataka',
      'Kerala',
      'Madhya Pradesh',
      'Maharashtra',
      'Manipur',
      'Meghalaya',
      'Mizoram',
      'Nagaland',
      'Odisha',
      'Punjab',
      'Rajasthan',
      'Sikkim',
      'Tamil Nadu',
      'Telangana',
      'Tripura',
      'Uttar Pradesh',
      'Uttarakhand',
      'West Bengal',
      'Delhi',
      'Jammu and Kashmir',
      'Ladakh',
    ];

    // Major Indian cities
    const indianCities = [
      'Mumbai',
      'Delhi',
      'Bangalore',
      'Bengaluru',
      'Hyderabad',
      'Ahmedabad',
      'Chennai',
      'Kolkata',
      'Surat',
      'Pune',
      'Jaipur',
      'Lucknow',
      'Kanpur',
      'Nagpur',
      'Indore',
      'Thane',
      'Bhopal',
      'Visakhapatnam',
      'Patna',
      'Vadodara',
      'Ghaziabad',
      'Ludhiana',
      'Agra',
      'Nashik',
      'Faridabad',
      'Meerut',
      'Rajkot',
      'Varanasi',
      'Srinagar',
      'Aurangabad',
      'Dhanbad',
      'Amritsar',
      'Prayagraj',
      'Ranchi',
      'Coimbatore',
      'Jabalpur',
      'Gwalior',
      'Vijayawada',
      'Jodhpur',
      'Madurai',
      'Raipur',
      'Kota',
      'Guwahati',
      'Chandigarh',
      'Mysuru',
      'Noida',
      'Gurugram',
      'Bhubaneswar',
      'Kochi',
      'Dehradun',
      'Mangalore',
      'Thiruvananthapuram',
      'Shimla',
    ];

    // Check for state mentions
    for (const state of indianStates) {
      if (section.toLowerCase().includes(state.toLowerCase())) {
        location = state;
        break;
      }
    }

    // If no state found, check for city
    if (!location) {
      for (const city of indianCities) {
        if (section.toLowerCase().includes(city.toLowerCase())) {
          location = city;
          break;
        }
      }
    }

    // Fallback to pattern matching
    if (!location) {
      const locMatch = section.match(
        /(?:in|at|between|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+to\s+[A-Z][a-z]+)?)/
      );
      if (locMatch) {
        location = locMatch[1];
      }
    }

    // Extract year
    const yearMatch = section.match(/\b(202[0-5])\b/);
    const year = yearMatch ? yearMatch[1] : null;

    // Details (first 350 chars)
    const details = section.slice(0, 350).replace(/\s+/g, ' ').trim();

    projects.push({
      projectName,
      sector: sector || 'Infrastructure',
      companyAuthority: org || sourceName,
      valueCr: budget ? Math.round(budget * 100) / 100 : undefined, // Budget is now optional
      yearApproved: year || undefined,
      status,
      location: location || undefined,
      expectedCompletion: undefined,
      details,
      sourceUrl,
      publishedDate: dateStr || undefined,
    });
  }

  return projects;
}

// =========================
// DEDUPLICATION
// =========================

function deduplicateProjects(projects: ProjectRecord[]): ProjectRecord[] {
  const seenHashes = new Set<string>();
  const uniqueProjects: ProjectRecord[] = [];

  for (const project of projects) {
    // Create hash from name + budget
    const key = `${project.projectName.toLowerCase().slice(0, 50)}_${Math.floor(project.valueCr || 0)}`;
    const hashKey = createHash('md5').update(key).digest('hex');

    if (!seenHashes.has(hashKey)) {
      seenHashes.add(hashKey);
      uniqueProjects.push(project);
    }
  }

  return uniqueProjects;
}

// =========================
// MAIN SCRAPER SERVICE
// =========================

class ScraperService {
  private jinaClient: JinaClient | null = null;

  private getJinaClient(): JinaClient {
    if (!this.jinaClient) {
      const apiKey = env.JINA_API_KEY;
      if (!apiKey) {
        throw new Error('JINA_API_KEY is not configured');
      }
      this.jinaClient = new JinaClient(apiKey);
    }
    return this.jinaClient;
  }

  /**
   * Seed database with websites from config file
   */
  async seedWebsites(): Promise<{ added: number; skipped: number; errors: string[] }> {
    const result = { added: 0, skipped: 0, errors: [] as string[] };

    logger.info('Seeding database with config websites...');
    logger.info(`Total websites in config: ${SCRAPER_WEBSITES.length}`);

    for (const site of SCRAPER_WEBSITES) {
      try {
        // Check if website already exists by URL
        const existing = await prisma.scraperWebsite.findFirst({
          where: { url: site.url },
        });

        if (existing) {
          result.skipped++;
          continue;
        }

        // Determine type from config
        let type: 'government' | 'company' | 'news' | 'other' = 'other';
        const urlLower = site.url.toLowerCase();
        const nameLower = site.name.toLowerCase();

        if (
          urlLower.includes('.gov.') ||
          urlLower.includes('.nic.') ||
          nameLower.includes('government') ||
          nameLower.includes('ministry')
        ) {
          type = 'government';
        } else if (
          nameLower.includes('news') ||
          nameLower.includes('times') ||
          nameLower.includes('herald') ||
          nameLower.includes('express')
        ) {
          type = 'news';
        } else if (
          nameLower.includes('company') ||
          nameLower.includes('ltd') ||
          nameLower.includes('limited')
        ) {
          type = 'company';
        }

        await prisma.scraperWebsite.create({
          data: {
            name: site.name,
            url: site.url,
            type,
            isActive: true,
          },
        });

        result.added++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        result.errors.push(`Failed to add ${site.name}: ${errorMessage}`);
      }
    }

    logger.info(
      `Seeding complete: ${result.added} added, ${result.skipped} skipped, ${result.errors.length} errors`
    );
    return result;
  }

  /**
   * Run the full scraper workflow
   */
  async runScraper(options?: {
    maxProjects?: number;
    websiteIds?: string[];
    useConfigOnly?: boolean;
  }): Promise<ScraperResult> {
    const startTime = Date.now();
    const maxProjects = options?.maxProjects || MAX_PROJECTS;

    const result: ScraperResult = {
      success: false,
      totalUrlsFound: 0,
      totalArticlesScraped: 0,
      totalValidProjects: 0,
      totalInserted: 0,
      totalDuplicates: 0,
      insertedProjects: [],
      errors: [],
      metrics: {
        jinaRequests: 0,
        jinaSuccessful: 0,
        jinaFailed: 0,
        jinaTokensInput: 0,
        jinaTokensOutput: 0,
        totalCharsFetched: 0,
      },
      durationMs: 0,
    };

    try {
      logger.info('========================================');
      logger.info('NEWS SCRAPER STARTED');
      logger.info(`Target: ${maxProjects} unique projects`);
      logger.info('========================================');

      const jina = this.getJinaClient();

      // Get websites to scrape - prefer database, fallback to config
      let websites: WebsiteConfig[] = [];

      if (!options?.useConfigOnly) {
        // Try to get active websites from database
        const dbWebsites = await prisma.scraperWebsite.findMany({
          where: { isActive: true },
          orderBy: { name: 'asc' },
        });

        if (dbWebsites.length > 0) {
          logger.info(`Using ${dbWebsites.length} websites from database`);
          websites = dbWebsites
            .filter((w) => w.url !== null)
            .map((w) => ({
              name: w.name || w.url || '',
              url: w.url!,
            }));
        }
      }

      // Fallback to config file if database is empty or useConfigOnly is true
      if (websites.length === 0) {
        logger.info(`Using ${SCRAPER_WEBSITES.length} websites from config file`);
        websites = SCRAPER_WEBSITES;
      }

      // Filter by specific website IDs if provided
      if (options?.websiteIds && options.websiteIds.length > 0) {
        websites = websites.filter((w) =>
          options.websiteIds!.some((id) => w.name.toLowerCase().includes(id.toLowerCase()))
        );
      }

      result.totalUrlsFound = websites.length;

      // Track inserted project names for in-memory deduplication
      const insertedProjectNames = new Set<string>();

      // Scrape each website and save immediately
      for (let idx = 0; idx < websites.length; idx++) {
        if (result.totalInserted >= maxProjects) {
          logger.info(`\n✓ Reached target of ${maxProjects} projects. Stopping.`);
          break;
        }

        const site = websites[idx];
        logger.info(`\n[${idx + 1}/${websites.length}] ${site.name}`);

        try {
          // Step 1: Fetch content via Jina
          const content = await jina.fetchContent(site.url);
          if (!content) {
            result.errors.push(`Failed to fetch content from ${site.name}`);
            continue;
          }

          result.totalArticlesScraped++;

          // Step 2: Extract projects from content
          const projects = extractProjects(content, site.url, site.name);
          if (projects.length === 0) {
            logger.info(`  No projects found`);
            continue;
          }

          logger.info(`  Found ${projects.length} projects, saving to database...`);

          // Step 3: Deduplicate within this batch
          const uniqueInBatch = deduplicateProjects(projects);
          result.totalValidProjects += uniqueInBatch.length;

          // Step 4: Save each project immediately (check DB for duplicates)
          let savedCount = 0;
          let duplicateCount = 0;

          for (const project of uniqueInBatch) {
            // Stop if we've reached max projects
            if (result.totalInserted >= maxProjects) break;

            // Check in-memory duplicates first (faster)
            const normalizedName = project.projectName.toLowerCase().trim();
            if (insertedProjectNames.has(normalizedName)) {
              duplicateCount++;
              result.totalDuplicates++;
              continue;
            }

            try {
              // Check database for existing project
              const existing = await prisma.newsUpdate.findFirst({
                where: {
                  projectName: project.projectName,
                },
              });

              if (existing) {
                duplicateCount++;
                result.totalDuplicates++;
                insertedProjectNames.add(normalizedName);
                continue;
              }

              // Insert new project
              const created = await prisma.newsUpdate.create({
                data: {
                  projectName: project.projectName,
                  sector: project.sector,
                  companyAuthority: project.companyAuthority,
                  location: project.location,
                  valueCr: project.valueCr ? project.valueCr : null,
                  status: project.status,
                  sourceUrl: project.sourceUrl,
                  sourceType: 'scraper',
                  scrapedDate: new Date(),
                },
              });

              result.totalInserted++;
              savedCount++;
              insertedProjectNames.add(normalizedName);
              result.insertedProjects.push({
                id: created.id,
                projectName: created.projectName || '',
                valueCr: created.valueCr ? Number(created.valueCr) : null,
                sector: created.sector,
              });
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              result.errors.push(
                `Failed to save project "${project.projectName}": ${errorMessage}`
              );
            }
          }

          logger.info(`  ✓ Saved ${savedCount} new, ${duplicateCount} duplicates skipped`);
          logger.info(
            `  Running total: ${result.totalInserted} inserted, ${result.totalDuplicates} duplicates`
          );
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          result.errors.push(`Error scraping ${site.name}: ${errorMessage}`);
          logger.error(`Error scraping ${site.name}: ${errorMessage}`);
        }
      }

      // Update metrics
      result.metrics = jina.metrics;
      result.success = true;

      logger.info('\n========================================');
      logger.info('NEWS SCRAPER COMPLETED');
      logger.info(`  Projects found: ${result.totalValidProjects}`);
      logger.info(`  Inserted: ${result.totalInserted}`);
      logger.info(`  Duplicates: ${result.totalDuplicates}`);
      logger.info(`  Errors: ${result.errors.length}`);
      logger.info('========================================');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Scraper failed: ${errorMessage}`);
      logger.error(`Scraper failed: ${errorMessage}`);
    } finally {
      result.durationMs = Date.now() - startTime;
      // Reset client for next run
      this.jinaClient = null;

      // Save scraper run to database
      try {
        logger.info('Saving scraper run to database...');
        await prisma.scraperRun.create({
          data: {
            status: result.success ? 'completed' : 'failed',
            startedAt: new Date(Date.now() - result.durationMs),
            completedAt: new Date(),
            durationMs: result.durationMs,
            totalUrlsFound: result.totalUrlsFound,
            totalArticlesScraped: result.totalArticlesScraped,
            totalValidProjects: result.totalValidProjects,
            totalInserted: result.totalInserted,
            totalDuplicates: result.totalDuplicates,
            errorsCount: result.errors.length,
            errors: result.errors as unknown as any,
            metrics: result.metrics as unknown as any,
            insertedProjectIds: result.insertedProjects.map((p) => p.id) as unknown as any,
            triggeredBy: 'manual',
            createdAt: new Date(),
          },
        });
        logger.info('Scraper run saved to database');
      } catch (dbError) {
        const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
        logger.error(`Failed to save scraper run: ${errorMessage}`);
      }

      // Create notification
      try {
        logger.info('Creating notification...');
        await notificationService.sendNotification({
          type: NotificationType.SCRAPER_COMPLETED,
          metadata: {
            status: result.success ? 'Completed' : 'Failed',
            articlesScraped: result.totalArticlesScraped,
            projectsFound: result.totalValidProjects,
            projectsInserted: result.totalInserted,
            duration: (result.durationMs / 1000).toFixed(1),
            errorsCount: result.errors.length,
          },
          customTitle: `News Scraper ${result.success ? 'Completed' : 'Failed'}`,
          customMessage: `Scraper ${result.success ? 'completed successfully' : 'failed'}. Scraped ${result.totalArticlesScraped} articles, inserted ${result.totalInserted} new projects. Duration: ${(result.durationMs / 1000).toFixed(1)}s.${result.errors.length > 0 ? ` Errors: ${result.errors.length}` : ''}`,
        });
        logger.info('Notification created successfully');
      } catch (notifError) {
        const errorMessage = notifError instanceof Error ? notifError.message : String(notifError);
        logger.error(`Failed to create notification: ${errorMessage}`);
      }
    }

    return result;
  }

  /**
   * Get all news updates from database
   */
  async getNewsUpdates(options?: {
    page?: number;
    limit?: number;
    sector?: string;
    status?: string;
    search?: string;
  }): Promise<{ data: any[]; total: number }> {
    const page = options?.page || 1;
    const limit = options?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (options?.sector) {
      where.sector = options.sector;
    }

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.search) {
      where.OR = [
        { projectName: { contains: options.search, mode: 'insensitive' } },
        { companyAuthority: { contains: options.search, mode: 'insensitive' } },
        { location: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.newsUpdate.findMany({
        where,
        orderBy: { scrapedDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.newsUpdate.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Get news update by ID
   */
  async getNewsUpdateById(id: string): Promise<any | null> {
    return prisma.newsUpdate.findUnique({
      where: { id },
    });
  }

  /**
   * Delete news update
   */
  async deleteNewsUpdate(id: string): Promise<void> {
    await prisma.newsUpdate.delete({
      where: { id },
    });
  }

  /**
   * Get scraper statistics
   */
  async getStats(): Promise<{
    totalProjects: number;
    bySector: { sector: string; count: number }[];
    byStatus: { status: string; count: number }[];
    recentProjects: number;
  }> {
    const totalProjects = await prisma.newsUpdate.count();

    // Group by sector
    const bySectorRaw = await prisma.newsUpdate.groupBy({
      by: ['sector'],
      _count: { sector: true },
    });

    const bySector = bySectorRaw.map((item: (typeof bySectorRaw)[number]) => ({
      sector: item.sector || 'Unknown',
      count: item._count.sector,
    }));

    // Group by status
    const byStatusRaw = await prisma.newsUpdate.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const byStatus = byStatusRaw.map((item: (typeof byStatusRaw)[number]) => ({
      status: item.status || 'Unknown',
      count: item._count.status,
    }));

    // Recent projects (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentProjects = await prisma.newsUpdate.count({
      where: {
        scrapedDate: { gte: sevenDaysAgo },
      },
    });

    return { totalProjects, bySector, byStatus, recentProjects };
  }

  /**
   * Get configured websites
   */
  getWebsites(): WebsiteConfig[] {
    return SCRAPER_WEBSITES;
  }

  /**
   * Get websites from database
   */
  async getWebsitesFromDb(): Promise<any[]> {
    return prisma.scraperWebsite.findMany({
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Add website to database
   */
  async addWebsite(data: { name: string; url: string; type?: string }): Promise<any> {
    return prisma.scraperWebsite.create({
      data: {
        name: data.name,
        url: data.url,
        type: data.type || 'other',
        isActive: true,
      },
    });
  }

  /**
   * Update website
   */
  async updateWebsite(
    id: string,
    data: { name?: string; url?: string; type?: string; isActive?: boolean }
  ): Promise<any> {
    return prisma.scraperWebsite.update({
      where: { id },
      data: {
        name: data.name,
        url: data.url,
        type: data.type,
        isActive: data.isActive,
      },
    });
  }

  /**
   * Delete website
   */
  async deleteWebsite(id: string): Promise<void> {
    await prisma.scraperWebsite.delete({
      where: { id },
    });
  }
}

// Export singleton instance
export const scraperService = new ScraperService();
export default scraperService;
