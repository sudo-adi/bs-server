// Infrastructure news scraper - Website configuration
// List of 123 websites to scrape for infrastructure news

export interface WebsiteConfig {
  name: string;
  url: string;
  type?: 'government' | 'company' | 'news' | 'other';
}

export const SCRAPER_WEBSITES: WebsiteConfig[] = [
  {
    name: 'Ministry of Road Transport and Highways (MoRTH)',
    url: 'https://morth.nic.in',
    type: 'government',
  },
  {
    name: 'National Highways Authority of India (NHAI)',
    url: 'https://nhai.gov.in',
    type: 'government',
  },
  { name: 'Ministry of Railways', url: 'https://indianrailways.gov.in', type: 'government' },
  { name: 'Rail Vikas Nigam Ltd (RVNL)', url: 'https://rvnl.org', type: 'company' },
  { name: 'Indian Railways Projects Portal', url: 'https://ircep.gov.in', type: 'government' },
  { name: 'RITES', url: 'https://rites.com', type: 'company' },
  { name: 'IRCON International', url: 'https://ircon.org', type: 'company' },
  { name: 'DFCCIL (Freight Corridors)', url: 'https://dfccil.com', type: 'company' },
  {
    name: 'Ministry of Housing and Urban Affairs',
    url: 'https://mohua.gov.in',
    type: 'government',
  },
  { name: 'Smart Cities Mission', url: 'https://smartcities.gov.in', type: 'government' },
  { name: 'CPWD', url: 'https://cpwd.gov.in', type: 'government' },
  { name: 'Sagarmala (Ports)', url: 'https://sagarmala.gov.in', type: 'government' },
  { name: 'IWAI (Waterways)', url: 'https://iwai.nic.in', type: 'government' },
  { name: 'Airports Authority of India (AAI)', url: 'https://aai.aero', type: 'government' },
  {
    name: 'Ministry of Civil Aviation',
    url: 'https://www.civilaviation.gov.in',
    type: 'government',
  },
  { name: 'NTPC', url: 'https://ntpc.co.in', type: 'company' },
  { name: 'NHPC (Hydropower)', url: 'https://nhpcindia.com', type: 'company' },
  {
    name: 'Power Grid Corporation of India (PGCIL)',
    url: 'https://www.powergrid.in',
    type: 'company',
  },
  { name: 'GAIL', url: 'https://gailonline.com', type: 'company' },
  { name: 'ONGC', url: 'https://ongcindia.com', type: 'company' },
  { name: 'Bharat Petroleum (BPCL)', url: 'https://www.bharatpetroleum.in', type: 'company' },
  { name: 'Indian Oil Corporation', url: 'https://iocl.com', type: 'company' },
  { name: 'BHEL', url: 'https://bhel.com', type: 'company' },
  { name: 'Maharashtra PWD', url: 'https://mahapwd.gov.in', type: 'government' },
  { name: 'MP PWD', url: 'https://pwd.mp.gov.in', type: 'government' },
  { name: 'Gujarat PWD', url: 'https://pwd.gujarat.gov.in', type: 'government' },
  { name: 'Rajasthan PWD', url: 'https://pwd.rajasthan.gov.in', type: 'government' },
  { name: 'Telangana PWD', url: 'https://roadsbuilding.telangana.gov.in', type: 'government' },
  {
    name: 'Karnataka Infrastructure',
    url: 'https://infrastructure.karnataka.gov.in',
    type: 'government',
  },
  { name: 'Tamil Nadu Highways', url: 'https://tnhighways.tn.gov.in', type: 'government' },
  { name: 'Andhra Pradesh Roads & Buildings', url: 'https://aprdc.ap.gov.in', type: 'government' },
  {
    name: 'Uttar Pradesh Expressways (UPEIDA)',
    url: 'https://upeida.up.gov.in',
    type: 'government',
  },
  {
    name: 'Bihar Infrastructure',
    url: 'https://state.bihar.gov.in/roadconstruction',
    type: 'government',
  },
  { name: 'Odisha Works Dept', url: 'https://works.odisha.gov.in', type: 'government' },
  { name: 'Kerala PWD', url: 'https://keralapwd.gov.in', type: 'government' },
  { name: 'NBCC', url: 'https://nbccindia.in', type: 'company' },
  { name: 'EIL (Engineers India Ltd)', url: 'https://engineersindia.com', type: 'company' },
  { name: 'L&T Construction', url: 'https://www.lntecc.com', type: 'company' },
  { name: 'L&T Metro Rail', url: 'https://www.ltmetro.com', type: 'company' },
  { name: 'Tata Projects', url: 'https://www.tataprojects.com', type: 'company' },
  { name: 'Shapoorji Pallonji Infra', url: 'https://www.shapoorjipallonji.com', type: 'company' },
  { name: 'HCC (Hindustan Construction Co)', url: 'https://www.hccindia.com', type: 'company' },
  { name: 'Afcons Infrastructure', url: 'https://www.afcons.com', type: 'company' },
  { name: 'Dilip Buildcon', url: 'https://www.dilipbuildcon.co.in', type: 'company' },
  { name: 'KNR Constructions', url: 'https://www.knrcl.com', type: 'company' },
  { name: 'Sadbhav Engineering', url: 'https://www.sadbhaveng.com', type: 'company' },
  { name: 'IRB Infrastructure', url: 'https://www.irb.co.in', type: 'company' },
  {
    name: 'Adani Infra',
    url: 'https://www.adanienterprises.com/businesses/AdaniInfrastructure',
    type: 'company',
  },
  { name: 'GMR Group', url: 'https://www.gmrgroup.in', type: 'company' },
  { name: 'Ashoka Buildcon', url: 'https://www.ashokabuildcon.com', type: 'company' },
  { name: 'ET Infra', url: 'https://infra.economictimes.indiatimes.com', type: 'news' },
  {
    name: 'Business Standard Infra',
    url: 'https://www.business-standard.com/category/economy-policy/infrastructure',
    type: 'news',
  },
  {
    name: 'Financial Express Infra',
    url: 'https://www.financialexpress.com/industry/infrastructure/',
    type: 'news',
  },
  {
    name: 'Moneycontrol Infra',
    url: 'https://www.moneycontrol.com/news/business/infrastructure',
    type: 'news',
  },
  { name: 'Livemint Infra', url: 'https://www.livemint.com/industry/infrastructure', type: 'news' },
  {
    name: 'InfraCircle',
    url: 'https://infra.economictimes.indiatimes.com/tag/InfraCircle',
    type: 'news',
  },
  {
    name: 'The Hindu Infra',
    url: 'https://www.thehindu.com/business/infrastructure/',
    type: 'news',
  },
  {
    name: 'Hindustan Times Infra',
    url: 'https://www.hindustantimes.com/business/infrastructure',
    type: 'news',
  },
  {
    name: 'Business Today Infra',
    url: 'https://www.businesstoday.in/latest/infrastructure',
    type: 'news',
  },
  { name: 'Construction World', url: 'https://www.constructionworld.in', type: 'news' },
  { name: 'Infrastructure Today', url: 'https://www.infrastructuretoday.co.in', type: 'news' },
  { name: 'Urban Transport News', url: 'https://www.urbantransportnews.com', type: 'news' },
  { name: 'Metro Rail News', url: 'https://www.metrorailnews.in', type: 'news' },
  { name: 'EPC World', url: 'https://www.epcworld.in', type: 'news' },
  { name: 'Projects Today', url: 'https://projectstoday.com', type: 'news' },
  { name: 'India Investment Grid', url: 'https://indiainvestmentgrid.gov.in', type: 'government' },
  { name: 'Infraline', url: 'https://www.infraline.com', type: 'other' },
  { name: 'Invest India', url: 'https://www.investindia.gov.in', type: 'government' },
  { name: 'BidAssist', url: 'https://www.bidassist.com', type: 'other' },
  { name: 'TenderTiger', url: 'https://www.tendertiger.com', type: 'other' },
  { name: 'Tender Detail', url: 'https://www.tenderdetail.com', type: 'other' },
  { name: 'Contracts India', url: 'https://www.contractsindia.com', type: 'other' },
  { name: 'Project Reporter', url: 'https://projectreporter.co.in', type: 'other' },
  { name: 'IPFOnline Infra', url: 'https://www.ipfonline.com', type: 'other' },
  { name: 'Amar Ujala (Infra)', url: 'https://www.amarujala.com', type: 'news' },
  { name: 'Dainik Bhaskar (Infra)', url: 'https://www.bhaskar.com', type: 'news' },
  { name: 'Jagran (Projects)', url: 'https://www.jagran.com', type: 'news' },
  { name: 'Navbharat Times', url: 'https://navbharattimes.indiatimes.com', type: 'news' },
  { name: 'Lokmat', url: 'https://www.lokmat.com', type: 'news' },
  { name: 'TV9 Bharatvarsh', url: 'https://www.tv9hindi.com', type: 'news' },
  { name: 'Zee Business Infra', url: 'https://www.zeebiz.com', type: 'news' },
  { name: 'CNBC Awaaz Infra', url: 'https://hindi.cnbctv18.com', type: 'news' },
  { name: 'Metro Rail Projects', url: 'https://www.urbanrail.net', type: 'other' },
  { name: 'Power Sector India', url: 'https://powermin.gov.in', type: 'government' },
  { name: 'National Renewable Energy Portal', url: 'https://nreda.gov.in', type: 'government' },
  { name: 'Mines Projects (Govt)', url: 'https://mines.gov.in', type: 'government' },
  { name: 'Tourism Infra Projects', url: 'https://tourism.gov.in', type: 'government' },
  { name: 'Temple Trusts (Infra Work)', url: 'https://www.tirumala.org', type: 'other' },
  { name: 'Dam & Irrigation Projects', url: 'https://jalshakti-ddws.gov.in', type: 'government' },
  { name: 'Sports Infra (Stadiums)', url: 'https://yas.nic.in', type: 'government' },
  {
    name: 'PPP in India - State Projects',
    url: 'https://www.pppinindia.gov.in/infrastructure_projects_statewise',
    type: 'government',
  },
  {
    name: 'ET Infrastructure - DPIIT Review',
    url: 'https://infra.economictimes.indiatimes.com/news/urban-infrastructure/dpiit-reviews-374-high-impact-infra-projects-worth-rs-17-lakh-cr-in-fy22/90550399',
    type: 'news',
  },
  {
    name: 'Economic Times - NIP',
    url: 'https://economictimes.indiatimes.com/news/economy/infrastructure/national-infrastructure-pipeline-outlay-stands-at-rs-109-lakh-crore/articleshow/106190598.cms',
    type: 'news',
  },
  {
    name: 'Business Standard - L&T Orders',
    url: 'https://www.business-standard.com/markets/capital-market-news/larsen-toubro-wins-multiple-orders-under-its-ce-ipdd-vertical-125091900477_1.html',
    type: 'news',
  },
  { name: 'IRCON', url: 'https://www.ircon.org/index.php?lang=en', type: 'company' },
  {
    name: 'Live Hindustan - Sanatan Project',
    url: 'https://www.livehindustan.com/uttarakhand/world-largest-sanatan-sansad-1000-crore-budget-weapon-training-centre-108-cottages-for-saintscompleted-till-2032-201760608648283.html',
    type: 'news',
  },
  {
    name: 'IBEF - Infrastructure Sector',
    url: 'https://ibef.org/industry/infrastructure-sector-india',
    type: 'other',
  },
  { name: 'New Projects Tracker', url: 'https://www.newprojectstracker.com', type: 'other' },
  {
    name: 'Projects Today Portal',
    url: 'https://www.projectstoday.com/Default.aspx',
    type: 'news',
  },
  {
    name: 'PIB - Press Information Bureau',
    url: 'https://www.pib.gov.in/indexd.aspx',
    type: 'government',
  },
  { name: 'Jagran', url: 'https://www.jagran.com/', type: 'news' },
  { name: 'Moneycontrol', url: 'https://www.moneycontrol.com/', type: 'news' },
  { name: 'IPM - MOSPI', url: 'https://ipm.mospi.gov.in/', type: 'government' },
  {
    name: 'India Investment Grid Portal',
    url: 'https://indiainvestmentgrid.gov.in/index.jsp',
    type: 'government',
  },
  { name: 'PPP in India', url: 'https://www.pppinindia.gov.in/', type: 'government' },
  { name: 'India.gov.in', url: 'https://www.india.gov.in/', type: 'government' },
  { name: 'India Infra Monitor', url: 'https://indiainframonitor.com/', type: 'other' },
  { name: 'Rail Analysis', url: 'https://railanalysis.in/', type: 'other' },
  { name: 'Swarajya Mag', url: 'https://swarajyamag.com/', type: 'news' },
  { name: 'Urban Transport News', url: 'https://urbantransportnews.com/', type: 'news' },
  { name: 'Amar Ujala', url: 'https://www.amarujala.com/', type: 'news' },
  { name: 'Construction World', url: 'https://www.constructionworld.in/', type: 'news' },
  { name: 'IRCON Portal', url: 'https://www.ircon.org', type: 'company' },
  { name: 'Larsen & Toubro', url: 'https://www.larsentoubro.com', type: 'company' },
  { name: 'Livemint', url: 'https://www.livemint.com', type: 'news' },
  {
    name: 'Infrastructure Today Magazine',
    url: 'https://infrastructuretoday.co.in/',
    type: 'news',
  },
  {
    name: 'India Infrastructure Magazine',
    url: 'https://indiainfrastructure.com/magazines/',
    type: 'news',
  },
  { name: 'Projects Monitor', url: 'https://www.projectsmonitor.com/', type: 'other' },
  {
    name: 'IIG - NIP Projects',
    url: 'https://indiainvestmentgrid.gov.in/opportunities/nip-projects',
    type: 'government',
  },
  { name: 'India Investment Grid', url: 'https://indiainvestmentgrid.gov.in/', type: 'government' },
  {
    name: 'Tata Projects - Press Releases',
    url: 'https://tataprojects.com/news-media/press-releases',
    type: 'company',
  },
  { name: 'NHAI Portal', url: 'https://nhai.gov.in/', type: 'government' },
  { name: 'MoRTH Portal', url: 'https://morth.nic.in/', type: 'government' },
];

// Helper function to get random websites for scraping
export const getRandomWebsites = (count: number = 10): WebsiteConfig[] => {
  const shuffled = [...SCRAPER_WEBSITES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Helper function to get websites by type
export const getWebsitesByType = (
  type: 'government' | 'company' | 'news' | 'other'
): WebsiteConfig[] => {
  return SCRAPER_WEBSITES.filter((site) => site.type === type);
};
