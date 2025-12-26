// Infrastructure news scraper - Website configuration
// Comprehensive list of Indian infrastructure websites to scrape

export interface WebsiteConfig {
  name: string;
  url: string;
  type?: 'government' | 'company' | 'news' | 'other';
}

export const SCRAPER_WEBSITES: WebsiteConfig[] = [
  // ============================================
  // GOVERNMENT - Central Ministries & Departments
  // ============================================
  { name: 'MoRTH - Ministry of Road Transport', url: 'https://morth.nic.in', type: 'government' },
  {
    name: 'MoRTH Press Releases',
    url: 'https://pib.gov.in/indexd.aspx?mincode=47',
    type: 'government',
  },
  { name: 'NHAI - National Highways', url: 'https://nhai.gov.in', type: 'government' },
  { name: 'NHAI News & Updates', url: 'https://nhai.gov.in/nhai/whatsnew', type: 'government' },
  { name: 'Ministry of Railways', url: 'https://indianrailways.gov.in', type: 'government' },
  {
    name: 'Railways Press Releases',
    url: 'https://pib.gov.in/indexd.aspx?mincode=62',
    type: 'government',
  },
  { name: 'MoHUA - Housing & Urban Affairs', url: 'https://mohua.gov.in', type: 'government' },
  { name: 'Smart Cities Mission', url: 'https://smartcities.gov.in', type: 'government' },
  { name: 'Ministry of Power', url: 'https://powermin.gov.in', type: 'government' },
  {
    name: 'Power Press Releases',
    url: 'https://pib.gov.in/indexd.aspx?mincode=54',
    type: 'government',
  },
  {
    name: 'Ministry of Civil Aviation',
    url: 'https://www.civilaviation.gov.in',
    type: 'government',
  },
  { name: 'Ministry of Ports & Shipping', url: 'https://shipmin.gov.in', type: 'government' },
  { name: 'Sagarmala Programme', url: 'https://sagarmala.gov.in', type: 'government' },
  { name: 'Ministry of Jal Shakti', url: 'https://jalshakti-ddws.gov.in', type: 'government' },
  { name: 'Ministry of Mines', url: 'https://mines.gov.in', type: 'government' },
  { name: 'Ministry of Steel', url: 'https://steel.gov.in', type: 'government' },
  { name: 'Ministry of Petroleum', url: 'https://petroleum.gov.in', type: 'government' },
  { name: 'DPIIT - Industrial Policy', url: 'https://dpiit.gov.in', type: 'government' },
  {
    name: 'PIB - Press Information Bureau',
    url: 'https://www.pib.gov.in/indexd.aspx',
    type: 'government',
  },
  { name: 'PIB Infrastructure News', url: 'https://pib.gov.in/allRel.aspx', type: 'government' },
  { name: 'CPWD - Central PWD', url: 'https://cpwd.gov.in', type: 'government' },
  { name: 'IPM MOSPI - Project Monitoring', url: 'https://ipm.mospi.gov.in', type: 'government' },
  { name: 'India Investment Grid', url: 'https://indiainvestmentgrid.gov.in', type: 'government' },
  {
    name: 'IIG NIP Projects',
    url: 'https://indiainvestmentgrid.gov.in/opportunities/nip-projects',
    type: 'government',
  },
  { name: 'PPP India', url: 'https://www.pppinindia.gov.in', type: 'government' },
  { name: 'Invest India', url: 'https://www.investindia.gov.in', type: 'government' },
  { name: 'NITI Aayog', url: 'https://niti.gov.in', type: 'government' },

  // ============================================
  // GOVERNMENT - PSUs & Agencies
  // ============================================
  // Railways
  { name: 'RVNL - Rail Vikas Nigam', url: 'https://rvnl.org', type: 'company' },
  { name: 'IRCON International', url: 'https://ircon.org', type: 'company' },
  { name: 'IRCON News', url: 'https://www.ircon.org/index.php?lang=en', type: 'company' },
  { name: 'RITES Ltd', url: 'https://rites.com', type: 'company' },
  { name: 'DFCCIL - Freight Corridors', url: 'https://dfccil.com', type: 'company' },
  { name: 'IRCEP - Railways Projects', url: 'https://ircep.gov.in', type: 'government' },
  { name: 'CRIS - Railway IT', url: 'https://cris.org.in', type: 'company' },
  { name: 'CONCOR', url: 'https://concorindia.co.in', type: 'company' },

  // Metro Corporations
  { name: 'DMRC - Delhi Metro', url: 'https://delhimetrorail.com', type: 'government' },
  { name: 'DMRC News', url: 'https://delhimetrorail.com/press-release', type: 'government' },
  { name: 'Mumbai Metro MMRDA', url: 'https://mmrda.maharashtra.gov.in', type: 'government' },
  { name: 'BMRCL - Bangalore Metro', url: 'https://english.bmrc.co.in', type: 'government' },
  { name: 'CMRL - Chennai Metro', url: 'https://chennaimetrorail.org', type: 'government' },
  { name: 'Hyderabad Metro', url: 'https://hmrl.co.in', type: 'government' },
  { name: 'KMRL - Kochi Metro', url: 'https://kochimetro.org', type: 'government' },
  { name: 'LMRC - Lucknow Metro', url: 'https://lmrcl.com', type: 'government' },
  { name: 'NMRC - Noida Metro', url: 'https://nmrcnoida.com', type: 'government' },
  { name: 'Jaipur Metro', url: 'https://jaipurmetrorail.in', type: 'government' },
  { name: 'Nagpur Metro', url: 'https://mahametro.org', type: 'government' },
  { name: 'Pune Metro', url: 'https://punemetrorail.org', type: 'government' },
  { name: 'GMRC - Gujarat Metro', url: 'https://gujaratmetrorail.com', type: 'government' },
  { name: 'Kolkata Metro', url: 'https://mtp.indianrailways.gov.in', type: 'government' },

  // Highways & Roads
  { name: 'NHIDCL', url: 'https://nhidcl.com', type: 'government' },
  { name: 'BRO - Border Roads', url: 'https://bro.gov.in', type: 'government' },
  { name: 'MSRDC - Maharashtra Roads', url: 'https://msrdc.org', type: 'government' },
  { name: 'UPEIDA - UP Expressways', url: 'https://upeida.up.gov.in', type: 'government' },
  {
    name: 'YEIDA - Yamuna Expressway',
    url: 'https://yamunaexpresswayauthority.in',
    type: 'government',
  },

  // Airports & Aviation
  { name: 'AAI - Airports Authority', url: 'https://aai.aero', type: 'government' },
  { name: 'AAI Tenders', url: 'https://aai.aero/en/tenders', type: 'government' },
  { name: 'DIAL - Delhi Airport', url: 'https://newdelhiairport.in', type: 'company' },
  { name: 'MIAL - Mumbai Airport', url: 'https://csmia.aero', type: 'company' },
  { name: 'BIAL - Bangalore Airport', url: 'https://www.bengaluruairport.com', type: 'company' },

  // Ports
  { name: 'IWAI - Waterways', url: 'https://iwai.nic.in', type: 'government' },
  { name: 'JNPT - Nhava Sheva', url: 'https://jnport.gov.in', type: 'government' },
  { name: 'Deendayal Port', url: 'https://deendayalport.gov.in', type: 'government' },
  { name: 'Paradip Port', url: 'https://paradipport.gov.in', type: 'government' },
  { name: 'Visakhapatnam Port', url: 'https://vizagport.com', type: 'government' },
  { name: 'Chennai Port', url: 'https://chennaiport.gov.in', type: 'government' },
  { name: 'Cochin Port', url: 'https://cochinport.gov.in', type: 'government' },
  { name: 'Kolkata Port', url: 'https://kolkataporttrust.gov.in', type: 'government' },
  { name: 'Mumbai Port', url: 'https://mumbaiport.gov.in', type: 'government' },
  { name: 'New Mangalore Port', url: 'https://newmangaloreport.gov.in', type: 'government' },

  // Power & Energy
  { name: 'NTPC Ltd', url: 'https://ntpc.co.in', type: 'company' },
  { name: 'NTPC News', url: 'https://ntpc.co.in/en/media/press-releases', type: 'company' },
  { name: 'NHPC - Hydropower', url: 'https://nhpcindia.com', type: 'company' },
  { name: 'Power Grid PGCIL', url: 'https://www.powergrid.in', type: 'company' },
  { name: 'SJVN - Hydro Projects', url: 'https://sjvn.nic.in', type: 'company' },
  { name: 'THDC India', url: 'https://thdc.co.in', type: 'company' },
  { name: 'NEEPCO', url: 'https://neepco.co.in', type: 'company' },
  { name: 'NLC India', url: 'https://nlcindia.in', type: 'company' },
  { name: 'SECI - Solar Energy', url: 'https://www.seci.co.in', type: 'government' },
  { name: 'IREDA - Renewable Energy', url: 'https://www.ireda.in', type: 'government' },
  { name: 'MNRE - Renewable Energy Ministry', url: 'https://mnre.gov.in', type: 'government' },

  // Oil & Gas
  { name: 'GAIL India', url: 'https://gailonline.com', type: 'company' },
  { name: 'ONGC', url: 'https://ongcindia.com', type: 'company' },
  { name: 'BPCL', url: 'https://www.bharatpetroleum.in', type: 'company' },
  { name: 'IOCL', url: 'https://iocl.com', type: 'company' },
  { name: 'HPCL', url: 'https://hindustanpetroleum.com', type: 'company' },
  { name: 'Oil India', url: 'https://oil-india.com', type: 'company' },
  { name: 'PNGRB - Gas Regulator', url: 'https://pngrb.gov.in', type: 'government' },

  // Manufacturing & Heavy Industry
  { name: 'BHEL', url: 'https://bhel.com', type: 'company' },
  { name: 'SAIL - Steel Authority', url: 'https://sail.co.in', type: 'company' },
  { name: 'NMDC', url: 'https://nmdc.co.in', type: 'company' },
  { name: 'Coal India', url: 'https://coalindia.in', type: 'company' },
  { name: 'HAL - Hindustan Aeronautics', url: 'https://hal-india.co.in', type: 'company' },
  { name: 'BEL - Bharat Electronics', url: 'https://bel-india.in', type: 'company' },
  { name: 'BEML', url: 'https://bemlindia.in', type: 'company' },

  // Construction & Real Estate
  { name: 'NBCC', url: 'https://nbccindia.in', type: 'company' },
  { name: 'HUDCO', url: 'https://hudco.org', type: 'company' },
  { name: 'EIL - Engineers India', url: 'https://engineersindia.com', type: 'company' },
  { name: 'WAPCOS', url: 'https://wapcos.gov.in', type: 'company' },
  { name: 'NPCC', url: 'https://npcc.gov.in', type: 'company' },

  // ============================================
  // GOVERNMENT - State Level
  // ============================================
  // Maharashtra
  { name: 'Maharashtra PWD', url: 'https://mahapwd.gov.in', type: 'government' },
  { name: 'MSRDC', url: 'https://msrdc.org', type: 'government' },
  { name: 'CIDCO', url: 'https://cidco.maharashtra.gov.in', type: 'government' },
  { name: 'MMRDA', url: 'https://mmrda.maharashtra.gov.in', type: 'government' },
  { name: 'Maharashtra Industry', url: 'https://maitri.mahaonline.gov.in', type: 'government' },

  // Gujarat
  { name: 'Gujarat PWD', url: 'https://pwd.gujarat.gov.in', type: 'government' },
  { name: 'GIDC - Gujarat Industrial', url: 'https://gidc.gujarat.gov.in', type: 'government' },
  { name: 'Gujarat Infrastructure', url: 'https://gujipdcl.gujarat.gov.in', type: 'government' },

  // Uttar Pradesh
  { name: 'UPEIDA', url: 'https://upeida.up.gov.in', type: 'government' },
  { name: 'UP PWD', url: 'https://uppwd.gov.in', type: 'government' },
  { name: 'YEIDA', url: 'https://yamunaexpresswayauthority.in', type: 'government' },
  { name: 'NOIDA Authority', url: 'https://noidaauthorityonline.in', type: 'government' },

  // Karnataka
  { name: 'Karnataka PWD', url: 'https://kpwd.karnataka.gov.in', type: 'government' },
  {
    name: 'Karnataka Infrastructure',
    url: 'https://infrastructure.karnataka.gov.in',
    type: 'government',
  },
  { name: 'KIADB', url: 'https://kiadb.in', type: 'government' },
  { name: 'BDA Bangalore', url: 'https://bdabangalore.org', type: 'government' },

  // Tamil Nadu
  { name: 'Tamil Nadu Highways', url: 'https://tnhighways.tn.gov.in', type: 'government' },
  { name: 'TNRDC', url: 'https://tnrdc.com', type: 'government' },
  { name: 'TIDCO', url: 'https://tidco.com', type: 'government' },

  // Telangana
  { name: 'Telangana Roads', url: 'https://roadsbuilding.telangana.gov.in', type: 'government' },
  { name: 'TSIIC - Industrial Infra', url: 'https://tsiic.telangana.gov.in', type: 'government' },
  { name: 'HMDA', url: 'https://hmda.gov.in', type: 'government' },

  // Andhra Pradesh
  { name: 'AP Roads & Buildings', url: 'https://aprdc.ap.gov.in', type: 'government' },
  { name: 'APIIC', url: 'https://apiic.in', type: 'government' },
  { name: 'CRDA - Capital Region', url: 'https://crda.ap.gov.in', type: 'government' },

  // Rajasthan
  { name: 'Rajasthan PWD', url: 'https://pwd.rajasthan.gov.in', type: 'government' },
  { name: 'RIICO', url: 'https://riico.co.in', type: 'government' },

  // Madhya Pradesh
  { name: 'MP PWD', url: 'https://pwd.mp.gov.in', type: 'government' },
  { name: 'MPRDC', url: 'https://mprdc.gov.in', type: 'government' },

  // Kerala
  { name: 'Kerala PWD', url: 'https://keralapwd.gov.in', type: 'government' },
  { name: 'KIIFB', url: 'https://kiifb.org', type: 'government' },

  // West Bengal
  { name: 'West Bengal PWD', url: 'https://wbpwd.gov.in', type: 'government' },
  { name: 'WBIDC', url: 'https://wbidc.com', type: 'government' },
  { name: 'KMDA', url: 'https://kmdaonline.org', type: 'government' },

  // Bihar
  {
    name: 'Bihar Road Construction',
    url: 'https://state.bihar.gov.in/roadconstruction',
    type: 'government',
  },
  { name: 'BSRDCL', url: 'https://bsrdcl.bihar.gov.in', type: 'government' },

  // Odisha
  { name: 'Odisha Works Dept', url: 'https://works.odisha.gov.in', type: 'government' },
  { name: 'IDCO Odisha', url: 'https://idco.in', type: 'government' },

  // Punjab & Haryana
  { name: 'Punjab PWD', url: 'https://pwdpunjab.gov.in', type: 'government' },
  { name: 'Haryana PWD', url: 'https://pwdharyana.gov.in', type: 'government' },
  { name: 'HSIIDC', url: 'https://hsiidc.org.in', type: 'government' },
  { name: 'GMDA Gurugram', url: 'https://gmda.gov.in', type: 'government' },

  // Northeast
  { name: 'NEC - North Eastern Council', url: 'https://necouncil.gov.in', type: 'government' },
  { name: 'NHIDCL Projects', url: 'https://nhidcl.com/projects', type: 'government' },

  // ============================================
  // PRIVATE COMPANIES - Large EPC & Infra
  // ============================================
  { name: 'L&T Construction', url: 'https://www.lntecc.com', type: 'company' },
  { name: 'L&T Metro Rail', url: 'https://www.ltmetro.com', type: 'company' },
  { name: 'Larsen & Toubro', url: 'https://www.larsentoubro.com', type: 'company' },
  {
    name: 'L&T News',
    url: 'https://www.larsentoubro.com/corporate/media-centre/press-releases',
    type: 'company',
  },
  { name: 'Tata Projects', url: 'https://www.tataprojects.com', type: 'company' },
  {
    name: 'Tata Projects News',
    url: 'https://tataprojects.com/news-media/press-releases',
    type: 'company',
  },
  { name: 'Shapoorji Pallonji', url: 'https://www.shapoorjipallonji.com', type: 'company' },
  { name: 'Hindustan Construction HCC', url: 'https://www.hccindia.com', type: 'company' },
  { name: 'Afcons Infrastructure', url: 'https://www.afcons.com', type: 'company' },
  { name: 'Dilip Buildcon', url: 'https://www.dilipbuildcon.co.in', type: 'company' },
  { name: 'KNR Constructions', url: 'https://www.knrcl.com', type: 'company' },
  { name: 'Sadbhav Engineering', url: 'https://www.sadbhaveng.com', type: 'company' },
  { name: 'IRB Infrastructure', url: 'https://www.irb.co.in', type: 'company' },
  { name: 'Ashoka Buildcon', url: 'https://www.ashokabuildcon.com', type: 'company' },
  { name: 'PNC Infratech', url: 'https://pncinfratech.com', type: 'company' },
  { name: 'NCC Ltd', url: 'https://ncclimited.com', type: 'company' },
  { name: 'JMC Projects', url: 'https://jmcprojects.com', type: 'company' },
  { name: 'Simplex Infrastructures', url: 'https://simplexinfra.com', type: 'company' },
  { name: 'Gayatri Projects', url: 'https://gayatri.co.in', type: 'company' },
  { name: 'Megha Engineering MEIL', url: 'https://www.maboromeilinfra.com', type: 'company' },
  { name: 'Kalpataru Projects', url: 'https://kalpataruprojects.com', type: 'company' },
  { name: 'Welspun Enterprises', url: 'https://www.welspunenterprises.com', type: 'company' },
  { name: 'GR Infraprojects', url: 'https://grfrp.com', type: 'company' },
  { name: 'Techno Electric', url: 'https://techno.co.in', type: 'company' },

  // Adani Group
  {
    name: 'Adani Infrastructure',
    url: 'https://www.adanienterprises.com/businesses/AdaniInfrastructure',
    type: 'company',
  },
  { name: 'Adani Ports', url: 'https://www.adaniports.com', type: 'company' },
  { name: 'Adani Green', url: 'https://www.adanigreenenergy.com', type: 'company' },
  { name: 'Adani Transmission', url: 'https://www.adanitransmission.com', type: 'company' },

  // GMR & GVK
  { name: 'GMR Group', url: 'https://www.gmrgroup.in', type: 'company' },
  { name: 'GMR Airports', url: 'https://www.gmrairports.com', type: 'company' },
  { name: 'GVK', url: 'https://www.gvk.com', type: 'company' },

  // Reliance
  { name: 'Reliance Infrastructure', url: 'https://www.rfrp.co.in', type: 'company' },
  { name: 'Reliance Industries', url: 'https://www.ril.com', type: 'company' },

  // JSW & Jindal
  { name: 'JSW Infrastructure', url: 'https://www.jsw.in/infrastructure', type: 'company' },
  { name: 'JSW Steel', url: 'https://www.jsw.in/steel', type: 'company' },
  { name: 'Jindal Steel', url: 'https://www.jindalsteelpower.com', type: 'company' },

  // Renewable Energy Companies
  { name: 'ReNew Power', url: 'https://renewpower.in', type: 'company' },
  { name: 'Greenko', url: 'https://www.greenkogroup.com', type: 'company' },
  { name: 'Azure Power', url: 'https://www.azurepower.com', type: 'company' },
  { name: 'Suzlon Energy', url: 'https://www.suzlon.com', type: 'company' },
  { name: 'Tata Power Solar', url: 'https://www.tatapowersolar.com', type: 'company' },
  { name: 'Hero Future Energies', url: 'https://www.herofutureenergies.com', type: 'company' },

  // ============================================
  // NEWS SOURCES - Infrastructure Focus
  // ============================================
  { name: 'ET Infra', url: 'https://infra.economictimes.indiatimes.com', type: 'news' },
  {
    name: 'ET Infra - Urban',
    url: 'https://infra.economictimes.indiatimes.com/news/urban-infrastructure',
    type: 'news',
  },
  {
    name: 'ET Infra - Transport',
    url: 'https://infra.economictimes.indiatimes.com/news/urban-transport',
    type: 'news',
  },
  {
    name: 'ET Infra - Construction',
    url: 'https://infra.economictimes.indiatimes.com/news/construction',
    type: 'news',
  },
  {
    name: 'ET Infra - Ports',
    url: 'https://infra.economictimes.indiatimes.com/news/ports-shipping',
    type: 'news',
  },
  {
    name: 'ET Infra - Aviation',
    url: 'https://infra.economictimes.indiatimes.com/news/aviation',
    type: 'news',
  },
  {
    name: 'ET Infra - Roads',
    url: 'https://infra.economictimes.indiatimes.com/news/roads-highways',
    type: 'news',
  },
  { name: 'ET Energy', url: 'https://energy.economictimes.indiatimes.com', type: 'news' },
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
    name: 'The Hindu Infra',
    url: 'https://www.thehindu.com/business/infrastructure/',
    type: 'news',
  },
  {
    name: 'Hindustan Times Business',
    url: 'https://www.hindustantimes.com/business',
    type: 'news',
  },
  {
    name: 'Business Today Infra',
    url: 'https://www.businesstoday.in/latest/infrastructure',
    type: 'news',
  },
  { name: 'NDTV Profit', url: 'https://www.ndtvprofit.com', type: 'news' },
  { name: 'Reuters India', url: 'https://www.reuters.com/places/india', type: 'news' },

  // Construction & Infrastructure Magazines
  { name: 'Construction World', url: 'https://www.constructionworld.in', type: 'news' },
  {
    name: 'Construction World News',
    url: 'https://www.constructionworld.in/latest-construction-news',
    type: 'news',
  },
  { name: 'Infrastructure Today', url: 'https://www.infrastructuretoday.co.in', type: 'news' },
  { name: 'EPC World', url: 'https://www.epcworld.in', type: 'news' },
  { name: 'India Infrastructure', url: 'https://indiainfrastructure.com', type: 'news' },
  { name: 'Projects Today', url: 'https://projectstoday.com', type: 'news' },
  { name: 'Projects Monitor', url: 'https://www.projectsmonitor.com', type: 'news' },

  // Metro & Urban Transport
  { name: 'Metro Rail News', url: 'https://www.metrorailnews.in', type: 'news' },
  { name: 'Urban Transport News', url: 'https://www.urbantransportnews.com', type: 'news' },
  { name: 'Rail Analysis India', url: 'https://railanalysis.in', type: 'news' },
  { name: 'The Metro Rail Guy', url: 'https://themetrorailguy.com', type: 'news' },

  // Power & Energy News
  { name: 'Saur Energy', url: 'https://www.saurenergy.com', type: 'news' },
  { name: 'Mercom India', url: 'https://mercomindia.com', type: 'news' },
  { name: 'ETEnergyworld', url: 'https://energy.economictimes.indiatimes.com', type: 'news' },
  { name: 'Power Line Magazine', url: 'https://powerline.net.in', type: 'news' },

  // Hindi News Sources
  { name: 'Amar Ujala', url: 'https://www.amarujala.com', type: 'news' },
  { name: 'Dainik Bhaskar', url: 'https://www.bhaskar.com', type: 'news' },
  { name: 'Dainik Jagran', url: 'https://www.jagran.com', type: 'news' },
  { name: 'Live Hindustan', url: 'https://www.livehindustan.com', type: 'news' },
  { name: 'Navbharat Times', url: 'https://navbharattimes.indiatimes.com', type: 'news' },
  { name: 'TV9 Bharatvarsh', url: 'https://www.tv9hindi.com', type: 'news' },
  { name: 'Zee News Hindi', url: 'https://zeenews.india.com/hindi', type: 'news' },
  { name: 'News18 Hindi', url: 'https://hindi.news18.com', type: 'news' },

  // Regional News
  { name: 'Lokmat', url: 'https://www.lokmat.com', type: 'news' },
  { name: 'Maharashtra Times', url: 'https://maharashtratimes.com', type: 'news' },
  { name: 'Eenadu', url: 'https://www.eenadu.net', type: 'news' },
  { name: 'Sakshi', url: 'https://www.sakshi.com', type: 'news' },
  { name: 'Dinamalar', url: 'https://www.dinamalar.com', type: 'news' },
  { name: 'Mathrubhumi', url: 'https://www.mathrubhumi.com', type: 'news' },
  { name: 'Anandabazar Patrika', url: 'https://www.anandabazar.com', type: 'news' },

  // Business TV
  { name: 'CNBC TV18', url: 'https://www.cnbctv18.com', type: 'news' },
  { name: 'Zee Business', url: 'https://www.zeebiz.com', type: 'news' },
  { name: 'ET Now', url: 'https://www.etnownews.com', type: 'news' },

  // Opinion & Analysis
  { name: 'Swarajya', url: 'https://swarajyamag.com', type: 'news' },
  {
    name: 'IBEF Infrastructure',
    url: 'https://ibef.org/industry/infrastructure-sector-india',
    type: 'news',
  },

  // ============================================
  // TENDER & PROJECT PORTALS
  // ============================================
  { name: 'CPPP - Central Procurement', url: 'https://eprocure.gov.in', type: 'government' },
  { name: 'GeM - Govt e-Marketplace', url: 'https://gem.gov.in', type: 'government' },
  { name: 'BidAssist', url: 'https://www.bidassist.com', type: 'other' },
  { name: 'TenderTiger', url: 'https://www.tendertiger.com', type: 'other' },
  { name: 'Tender Detail', url: 'https://www.tenderdetail.com', type: 'other' },
  { name: 'Contracts India', url: 'https://www.contractsindia.com', type: 'other' },
  { name: 'Project Reporter', url: 'https://projectreporter.co.in', type: 'other' },
  { name: 'New Projects Tracker', url: 'https://www.newprojectstracker.com', type: 'other' },
  { name: 'Infraline', url: 'https://www.infraline.com', type: 'other' },
  { name: 'IPF Online', url: 'https://www.ipfonline.com', type: 'other' },
  { name: 'India Infra Monitor', url: 'https://indiainframonitor.com', type: 'other' },

  // ============================================
  // INTERNATIONAL REFERENCES
  // ============================================
  {
    name: 'Urban Rail - India',
    url: 'https://www.urbanrail.net/as/india/india.htm',
    type: 'other',
  },
  { name: 'World Bank India', url: 'https://www.worldbank.org/en/country/india', type: 'other' },
  { name: 'ADB India', url: 'https://www.adb.org/countries/india/main', type: 'other' },
  { name: 'JICA India', url: 'https://www.jica.go.jp/india/english', type: 'other' },
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
