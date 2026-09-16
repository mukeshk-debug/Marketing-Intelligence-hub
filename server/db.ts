import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type {
  Organization,
  Profile,
  Platform,
  Campaign,
  SpendEntry,
  Lead,
  LeadAttribution,
  TrafficDaily,
  AdMetricsDaily,
  LandingPage,
  DailyMarketingActivity,
  Integration,
  SyncLog,
  Currency,
  CurrencyCode,
  LeadStatus,
  UserRole,
  ExchangeRate,
  GlobalFilterState,
  DashboardKPIs,
  ChannelPerformanceRow,
  PlatformType,
} from '../src/types/index.ts';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export interface DatabaseSchema {
  organizations: Organization[];
  profiles: Profile[];
  platforms: Platform[];
  campaigns: Campaign[];
  spend_entries: SpendEntry[];
  leads: Lead[];
  lead_attribution: LeadAttribution[];
  traffic_daily: TrafficDaily[];
  ad_metrics_daily: AdMetricsDaily[];
  landing_pages: LandingPage[];
  daily_marketing_activities: DailyMarketingActivity[];
  integrations: Integration[];
  sync_logs: SyncLog[];
  currencies: Currency[];
  exchange_rates: ExchangeRate[];
}

export class Database {
  private data: DatabaseSchema;
  private indexes = {
    trafficByDate: new Map<string, TrafficDaily[]>(),
    spendByDate: new Map<string, SpendEntry[]>(),
    leadsByDate: new Map<string, Lead[]>(),
    leadsByEmail: new Map<string, Lead>(),
    leadsByPhone: new Map<string, Lead>(),
  };

  constructor() {
    this.ensureDataDirectory();
    this.data = this.loadDatabase();
    this.rebuildIndexes();
  }

  private ensureDataDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private saveDatabase() {
    this.ensureDataDirectory();
    const tempFile = `${DB_FILE}.${Date.now()}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
    this.rebuildIndexes();
  }

  private rebuildIndexes() {
    this.indexes.trafficByDate.clear();
    this.indexes.spendByDate.clear();
    this.indexes.leadsByDate.clear();
    this.indexes.leadsByEmail.clear();
    this.indexes.leadsByPhone.clear();

    for (const t of this.data.traffic_daily) {
      const arr = this.indexes.trafficByDate.get(t.date) || [];
      arr.push(t);
      this.indexes.trafficByDate.set(t.date, arr);
    }

    for (const s of this.data.spend_entries) {
      const arr = this.indexes.spendByDate.get(s.date) || [];
      arr.push(s);
      this.indexes.spendByDate.set(s.date, arr);
    }

    for (const l of this.data.leads) {
      const arr = this.indexes.leadsByDate.get(l.date) || [];
      arr.push(l);
      this.indexes.leadsByDate.set(l.date, arr);

      if (l.email) {
        this.indexes.leadsByEmail.set(l.email.trim().toLowerCase(), l);
      }
      if (l.phone) {
        this.indexes.leadsByPhone.set(l.phone.trim(), l);
      }
    }
  }

  private loadDatabase(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      } catch (err) {
        console.error('Failed to parse existing db.json, creating initial demo dataset', err);
      }
    }
    const initial = this.createInitialDemoData();
    const tempFile = `${DB_FILE}.${Date.now()}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(initial, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
    return initial;
  }

  // Generate 30 days of realistic demo data up to 2026-09-15
  public createInitialDemoData(): DatabaseSchema {
    const now = new Date('2026-09-15T18:00:00Z');
    const nowIso = now.toISOString();

    const orgId = 'org-marketing-hub-1';
    const organizations: Organization[] = [
      {
        id: orgId,
        name: 'Enterprise Marketing Solutions Ltd',
        default_currency: 'USD',
        timezone: 'UTC',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: nowIso,
      },
    ];

    const profiles: Profile[] = [
      {
        id: 'user-sarah-jenkins',
        organization_id: orgId,
        email: 'sarah.jenkins@marketinghub.internal',
        name: 'Sarah Jenkins',
        role: 'Marketing Manager',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: nowIso,
      },
      {
        id: 'user-alex-chen',
        organization_id: orgId,
        email: 'alex.chen@marketinghub.internal',
        name: 'Alex Chen',
        role: 'Marketing Executive',
        created_at: '2026-02-15T00:00:00Z',
        updated_at: nowIso,
      },
    ];

    const platformNames: { name: PlatformType; type: Platform['type']; src: string; med: string }[] = [
      { name: 'Google Ads', type: 'Paid', src: 'google', med: 'cpc' },
      { name: 'Bing Ads', type: 'Paid', src: 'bing', med: 'cpc' },
      { name: 'Organic Search', type: 'Organic', src: 'google', med: 'organic' },
      { name: 'GoodFirms', type: 'Directory', src: 'goodfirms', med: 'referral' },
      { name: 'Clutch', type: 'Directory', src: 'clutch', med: 'referral' },
      { name: 'Meta Ads', type: 'Paid', src: 'meta', med: 'cpc' },
      { name: 'LinkedIn', type: 'Paid', src: 'linkedin', med: 'paid-social' },
      { name: 'Direct', type: 'Direct', src: 'direct', med: 'none' },
      { name: 'Referral', type: 'Referral', src: 'partner-directory', med: 'referral' },
      { name: 'Other', type: 'Paid', src: 'industry-portal', med: 'display' },
    ];

    const platforms: Platform[] = platformNames.map((p, idx) => ({
      id: `plat-${idx + 1}`,
      name: p.name,
      type: p.type,
      status: 'Active',
      default_utm_source: p.src,
      default_utm_medium: p.med,
      last_sync: '2026-09-15T16:45:00Z',
      notes: `Standard ${p.name} attribution mapping`,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: nowIso,
    }));

    const campaignsList: { name: string; platform: PlatformType; service: string; budget: number }[] = [
      { name: 'AI Development', platform: 'Google Ads', service: 'AI Development', budget: 14000 },
      { name: 'Custom Software Development', platform: 'Google Ads', service: 'Custom Software', budget: 18000 },
      { name: 'Blockchain Development', platform: 'Meta Ads', service: 'Blockchain Engineering', budget: 9000 },
      { name: 'Mobile App Development', platform: 'Bing Ads', service: 'Mobile Apps', budget: 11000 },
      { name: 'SEO High Intent B2B', platform: 'Organic Search', service: 'Enterprise Solutions', budget: 5000 },
      { name: 'GoodFirms Top Tier Directory', platform: 'GoodFirms', service: 'AI & Custom Dev', budget: 6500 },
      { name: 'Clutch Leaders Matrix', platform: 'Clutch', service: 'Custom Software', budget: 8500 },
      { name: 'LinkedIn B2B Decision Makers', platform: 'LinkedIn', service: 'Cloud Architecture', budget: 12000 },
    ];

    const campaigns: Campaign[] = campaignsList.map((c, i) => {
      const plat = platforms.find((p) => p.name === c.platform) || platforms[0];
      return {
        id: `camp-${i + 1}`,
        name: c.name,
        platform_id: plat.id,
        platform_name: c.platform,
        source: plat.default_utm_source,
        medium: plat.default_utm_medium,
        service: c.service,
        country: 'Global',
        start_date: '2026-08-01',
        end_date: null,
        budget: c.budget,
        currency: 'USD',
        status: 'Active',
        notes: `Focus campaign for ${c.service}`,
        created_at: '2026-08-01T00:00:00Z',
        updated_at: nowIso,
      };
    });

    const landingPagesList = [
      { url: 'https://example.com/ai-development', page_name: 'AI & Machine Learning Solutions', service: 'AI Development' },
      { url: 'https://example.com/custom-software', page_name: 'Custom Enterprise Software', service: 'Custom Software' },
      { url: 'https://example.com/mobile-apps', page_name: 'iOS & Android App Engineering', service: 'Mobile Apps' },
      { url: 'https://example.com/blockchain', page_name: 'Decentralized & Web3 Systems', service: 'Blockchain Engineering' },
      { url: 'https://example.com/cloud-architecture', page_name: 'Cloud & DevOps Migration', service: 'Cloud Architecture' },
    ];

    const landing_pages: LandingPage[] = landingPagesList.map((lp, i) => ({
      id: `lp-${i + 1}`,
      url: lp.url,
      page_name: lp.page_name,
      service: lp.service,
      source_default: 'google',
      campaign_default: 'ai-development',
      notes: 'High conversion target page',
      created_at: '2026-06-01T00:00:00Z',
      updated_at: nowIso,
    }));

    const currencies: Currency[] = [
      { id: 'cur-1', code: 'USD', symbol: '$', name: 'US Dollar', created_at: nowIso, updated_at: nowIso },
      { id: 'cur-2', code: 'INR', symbol: '₹', name: 'Indian Rupee', created_at: nowIso, updated_at: nowIso },
      { id: 'cur-3', code: 'AED', symbol: 'AED', name: 'UAE Dirham', created_at: nowIso, updated_at: nowIso },
      { id: 'cur-4', code: 'GBP', symbol: '£', name: 'British Pound', created_at: nowIso, updated_at: nowIso },
      { id: 'cur-5', code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal', created_at: nowIso, updated_at: nowIso },
      { id: 'cur-6', code: 'EUR', symbol: '€', name: 'Euro', created_at: nowIso, updated_at: nowIso },
    ];

    const exchange_rates: ExchangeRate[] = [
      { id: 'xr-1', from_currency: 'USD', to_currency: 'USD', rate: 1.0, updated_date: '2026-09-15', created_at: nowIso, updated_at: nowIso },
      { id: 'xr-2', from_currency: 'INR', to_currency: 'USD', rate: 0.0118, updated_date: '2026-09-15', created_at: nowIso, updated_at: nowIso },
      { id: 'xr-3', from_currency: 'AED', to_currency: 'USD', rate: 0.2723, updated_date: '2026-09-15', created_at: nowIso, updated_at: nowIso },
      { id: 'xr-4', from_currency: 'GBP', to_currency: 'USD', rate: 1.315, updated_date: '2026-09-15', created_at: nowIso, updated_at: nowIso },
      { id: 'xr-5', from_currency: 'SAR', to_currency: 'USD', rate: 0.2667, updated_date: '2026-09-15', created_at: nowIso, updated_at: nowIso },
      { id: 'xr-6', from_currency: 'EUR', to_currency: 'USD', rate: 1.092, updated_date: '2026-09-15', created_at: nowIso, updated_at: nowIso },
    ];

    const integrations: Integration[] = [
      {
        id: 'integ-1',
        service_key: 'google_analytics_4',
        name: 'Google Analytics 4',
        category: 'Analytics',
        status: 'Not Connected',
        last_sync: null,
        records_imported: 0,
        created_at: nowIso,
        updated_at: nowIso,
      },
      {
        id: 'integ-2',
        service_key: 'google_ads',
        name: 'Google Ads',
        category: 'Advertising',
        status: 'Not Connected',
        last_sync: null,
        records_imported: 0,
        created_at: nowIso,
        updated_at: nowIso,
      },
      {
        id: 'integ-3',
        service_key: 'google_sheets',
        name: 'Google Sheets',
        category: 'Data',
        status: 'Not Connected',
        last_sync: null,
        records_imported: 0,
        created_at: nowIso,
        updated_at: nowIso,
      },
      {
        id: 'integ-4',
        service_key: 'bing_ads',
        name: 'Bing Ads',
        category: 'Advertising',
        status: 'Not Connected',
        last_sync: null,
        records_imported: 0,
        created_at: nowIso,
        updated_at: nowIso,
      },
      {
        id: 'integ-5',
        service_key: 'google_search_console',
        name: 'Google Search Console',
        category: 'Analytics',
        status: 'Not Connected',
        last_sync: null,
        records_imported: 0,
        created_at: nowIso,
        updated_at: nowIso,
      },
      {
        id: 'integ-6',
        service_key: 'clutch',
        name: 'Clutch Portal',
        category: 'Directory',
        status: 'Not Connected',
        last_sync: null,
        records_imported: 0,
        created_at: nowIso,
        updated_at: nowIso,
      },
      {
        id: 'integ-7',
        service_key: 'goodfirms',
        name: 'GoodFirms Portal',
        category: 'Directory',
        status: 'Not Connected',
        last_sync: null,
        records_imported: 0,
        created_at: nowIso,
        updated_at: nowIso,
      },
      {
        id: 'integ-8',
        service_key: 'meta_ads',
        name: 'Meta Ads Manager',
        category: 'Advertising',
        status: 'Not Connected',
        last_sync: null,
        records_imported: 0,
        created_at: nowIso,
        updated_at: nowIso,
      },
      {
        id: 'integ-9',
        service_key: 'linkedin_ads',
        name: 'LinkedIn Campaign Manager',
        category: 'Advertising',
        status: 'Not Connected',
        last_sync: null,
        records_imported: 0,
        created_at: nowIso,
        updated_at: nowIso,
      },
    ];

    const sync_logs: SyncLog[] = [
      {
        id: 'log-1',
        integration_id: 'integ-3',
        service_name: 'Google Sheets',
        timestamp: '2026-09-15T09:00:00Z',
        status: 'Success',
        records_processed: 48,
        message: 'Manual CSV pipeline processed records successfully',
        created_at: nowIso,
        updated_at: nowIso,
      },
    ];

    // Seed 30 days of data from 2026-08-17 to 2026-09-15
    const traffic_daily: TrafficDaily[] = [];
    const spend_entries: SpendEntry[] = [];
    const ad_metrics_daily: AdMetricsDaily[] = [];
    const leads: Lead[] = [];
    const lead_attribution: LeadAttribution[] = [];
    const daily_marketing_activities: DailyMarketingActivity[] = [];

    // Helper for pseudo-random deterministic numbers based on seed
    let seed = 42;
    const random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    const companies = [
      'Apex Logistics Corp',
      'Quantum Fintech',
      'Nordic Health Systems',
      'Horizon Energy Partners',
      'Vanguard Retail Global',
      'Beacon Telemetry Labs',
      'AeroSpace Dynamics',
      'CyberShield Network',
      'OmniCommerce Solutions',
      'Zenith BioTech',
      'BluePeak Real Estate',
      'Silverline Capital',
      'Nova Automotive',
      'Starlight Media',
      'Elevate Consulting Group',
      'Pinnacle Supply Chain',
      'Terraform AgTech',
      'Vertex AI Cloud',
      'Solstice Payment Systems',
      'Krypton Security',
      'Titan Manufacturing',
      'Alpine Robotics',
      'Elysium Digital',
      'Aegis Healthcare',
      'Nexus Smart Grid',
      'Solaris Marine',
      'Vector Precision Labs',
      'Cadence Audio Tech',
      'Meridian Freight Global',
      'Orion Genomics',
    ];

    const contactFirstNames = [
      'Marcus', 'Elena', 'David', 'Sophia', 'James', 'Aria', 'Robert', 'Priya', 'Julian', 'Chloe',
      'Liam', 'Zoe', 'Nathan', 'Maya', 'Lucas', 'Leila', 'Daniel', 'Fatima', 'Vikram', 'Olivia',
      'Ethan', 'Hannah', 'Gabriel', 'Grace', 'Benjamin', 'Amara', 'Christopher', 'Isabella', 'Alexander', 'Tara'
    ];
    const contactLastNames = [
      'Vance', 'Rossi', 'Kim', 'Patel', 'Schneider', 'Dubois', 'Morales', 'Al-Mansoor', 'O’Connor', 'Lindqvist',
      'Chen', 'Nakamura', 'Gupta', 'Davies', 'Fischer', 'Moreau', 'Silva', 'Kowalski', 'Novak', 'Santos'
    ];

    const countries = ['United States', 'United Kingdom', 'Germany', 'United Arab Emirates', 'India', 'Canada', 'Singapore'];

    // Generate daily traffic & spend entries
    for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
      const d = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().slice(0, 10);
      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const dayMultiplier = isWeekend ? 0.65 : 1.05 + random() * 0.2;

      // Platform loop
      for (const plat of platforms) {
        let baseSessions = 0;
        let baseSpend = 0;
        let costType: SpendEntry['cost_type'] = 'Ad Spend';

        switch (plat.name) {
          case 'Google Ads':
            baseSessions = Math.floor(220 * dayMultiplier + random() * 45);
            baseSpend = Math.round((480 + random() * 120) * dayMultiplier);
            costType = 'Ad Spend';
            break;
          case 'Bing Ads':
            baseSessions = Math.floor(95 * dayMultiplier + random() * 25);
            baseSpend = Math.round((180 + random() * 50) * dayMultiplier);
            costType = 'Ad Spend';
            break;
          case 'Organic Search':
            baseSessions = Math.floor(310 * dayMultiplier + random() * 60);
            baseSpend = 0; // Organic is not a paid source
            break;
          case 'GoodFirms':
            baseSessions = Math.floor(65 * dayMultiplier + random() * 15);
            baseSpend = Math.round(110 * (dayOffset % 7 === 0 ? 3 : 1)); // Subscription & PPL
            costType = dayOffset % 14 === 0 ? 'Subscription' : 'PPL';
            break;
          case 'Clutch':
            baseSessions = Math.floor(80 * dayMultiplier + random() * 20);
            baseSpend = Math.round(145 * (dayOffset % 7 === 0 ? 3.5 : 1));
            costType = dayOffset % 15 === 0 ? 'Sponsorship' : 'PPL';
            break;
          case 'Meta Ads':
            baseSessions = Math.floor(140 * dayMultiplier + random() * 30);
            baseSpend = Math.round((210 + random() * 40) * dayMultiplier);
            costType = 'Ad Spend';
            break;
          case 'LinkedIn':
            baseSessions = Math.floor(85 * dayMultiplier + random() * 20);
            baseSpend = Math.round((320 + random() * 60) * dayMultiplier);
            costType = 'Ad Spend';
            break;
          case 'Direct':
            baseSessions = Math.floor(180 * dayMultiplier + random() * 30);
            baseSpend = 0;
            break;
          case 'Referral':
            baseSessions = Math.floor(55 * dayMultiplier + random() * 15);
            baseSpend = 0;
            break;
          default:
            baseSessions = Math.floor(40 * dayMultiplier + random() * 10);
            baseSpend = Math.round(50 * dayMultiplier);
            break;
        }

        const users = Math.round(baseSessions * (0.82 + random() * 0.08));
        const newUsers = Math.round(users * (0.65 + random() * 0.1));
        const engagedSessions = Math.round(baseSessions * (0.62 + random() * 0.12));
        const engagementRate = Math.round((engagedSessions / Math.max(1, baseSessions)) * 100);
        const lp = landing_pages[Math.floor(random() * landing_pages.length)];
        const camp = campaigns.find((c) => c.platform_id === plat.id) || campaigns[0];

        // Add traffic entry
        traffic_daily.push({
          id: `trf-${dateStr}-${plat.id}`,
          organization_id: orgId,
          origin: 'Demo',
          date: dateStr,
          source: plat.default_utm_source,
          medium: plat.default_utm_medium,
          campaign: camp.name,
          platform_id: plat.id,
          platform_name: plat.name,
          landing_page: lp.url,
          country: countries[Math.floor(random() * countries.length)],
          users,
          new_users: newUsers,
          sessions: baseSessions,
          engaged_sessions: engagedSessions,
          engagement_rate: engagementRate,
          conversions: Math.floor(baseSessions * 0.028 + random() * 2),
          created_at: nowIso,
          updated_at: nowIso,
        });

        // Add spend entry if paid
        if (baseSpend > 0) {
          spend_entries.push({
            id: `sp-${dateStr}-${plat.id}`,
            organization_id: orgId,
            origin: 'Demo',
            date: dateStr,
            platform_id: plat.id,
            platform_name: plat.name,
            campaign_id: camp.id,
            campaign_name: camp.name,
            cost_type: costType,
            amount: baseSpend,
            currency: 'USD',
            source: 'Demo',
            is_adjustment: false,
            reference_entry_id: null,
            notes: `Recorded spend for ${plat.name} on ${dateStr}`,
            created_at: nowIso,
            updated_at: nowIso,
          });

          // Add ad metrics daily
          ad_metrics_daily.push({
            id: `admet-${dateStr}-${plat.id}`,
            date: dateStr,
            platform_id: plat.id,
            platform_name: plat.name,
            campaign_id: camp.id,
            campaign_name: camp.name,
            ad_group: `${camp.service} - Standard B2B`,
            impressions: Math.round(baseSessions * (18 + random() * 12)),
            clicks: baseSessions,
            spend: baseSpend,
            currency: 'USD',
            conversions: Math.floor(baseSessions * 0.035),
            conversion_value: Math.floor(baseSpend * 2.8),
            created_at: nowIso,
            updated_at: nowIso,
          });
        }
      }

      // Add Daily Marketing Activities
      if (!isWeekend || random() > 0.6) {
        const actPlat = platforms[Math.floor(random() * 5)];
        const actCamp = campaigns.find((c) => c.platform_id === actPlat.id) || campaigns[0];
        const activityTypes: DailyMarketingActivity['activity_type'][] = [
          'Negative Keywords',
          'Campaign Optimization',
          'Keyword Optimization',
          'Ad Copy Update',
          'Landing Page Update',
          'SEO',
          'Content',
          'Lead Follow-up',
          'Analytics',
        ];
        const actType = activityTypes[Math.floor(random() * activityTypes.length)];

        daily_marketing_activities.push({
          id: `act-${dateStr}-${random().toString(36).slice(2, 6)}`,
          date: dateStr,
          platform_id: actPlat.id,
          platform_name: actPlat.name,
          campaign_id: actCamp.id,
          campaign_name: actCamp.name,
          activity_type: actType,
          description:
            actType === 'Negative Keywords'
              ? 'Audited search queries and added 14 irrelevant query strings as exact match negative keywords.'
              : actType === 'Campaign Optimization'
              ? 'Adjusted target CPA bidding strategy based on 14-day conversion trajectory.'
              : actType === 'Ad Copy Update'
              ? 'Deployed 2 responsive search ad variants focusing on ROI & speed to delivery.'
              : actType === 'SEO'
              ? 'Optimized schema markup and meta descriptions for B2B engineering landing pages.'
              : `Completed ${actType} operational review for ${actPlat.name}.`,
          spend: Math.round(random() * 150),
          leads_attributed: Math.floor(random() * 3),
          mql_attributed: Math.floor(random() * 2),
          status: 'Completed',
          owner: random() > 0.5 ? 'Sarah Jenkins' : 'Alex Chen',
          remarks: 'Reviewed and confirmed in daily standup',
          created_at: nowIso,
          updated_at: nowIso,
        });
      }
    }

    // Add sample manual adjustment spend entry to demonstrate requirement:
    // "If imported/API data exists, never overwrite the original data. Example: Google Ads API Spend: ₹8,000, Manual Adjustment: ₹500, Reported Spend: ₹8,500. Store these as separate records."
    spend_entries.push({
      id: 'sp-adj-2026-09-14-1',
      date: '2026-09-14',
      platform_id: platforms[0].id,
      platform_name: 'Google Ads',
      campaign_id: campaigns[0].id,
      campaign_name: campaigns[0].name,
      cost_type: 'Ad Spend',
      amount: 45,
      currency: 'USD',
      source: 'Manual',
      is_adjustment: true,
      reference_entry_id: `sp-2026-09-14-${platforms[0].id}`,
      notes: 'Agency management surcharge audit adjustment (stored as separate adjustment record)',
      created_at: nowIso,
      updated_at: nowIso,
    });

    // Generate 75 realistic Leads across the 30 days
    for (let i = 0; i < 75; i++) {
      const dayOffset = Math.floor(random() * 30);
      const leadDate = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
      const dateStr = leadDate.toISOString().slice(0, 10);

      const fName = contactFirstNames[i % contactFirstNames.length];
      const lName = contactLastNames[(i * 3) % contactLastNames.length];
      const comp = companies[i % companies.length];
      const cleanCompName = comp.toLowerCase().replace(/[^a-z0-9]/g, '');
      const email = `${fName.toLowerCase()}.${lName.toLowerCase()}@${cleanCompName}.com`;
      const phone = `+1 (${200 + (i * 17) % 700}) ${100 + (i * 23) % 899}-${1000 + (i * 79) % 8999}`;

      // Distribute across platforms
      const platIdx = i % platforms.length;
      const plat = platforms[platIdx];
      const camp = campaigns.find((c) => c.platform_id === plat.id) || campaigns[i % campaigns.length];
      const lp = landing_pages[i % landing_pages.length];
      const country = countries[i % countries.length];

      // Funnel qualification progression
      // Stage: New -> Contacted -> Qualified -> MQL -> SQL -> Opportunity -> Proposal -> Won / Lost
      const funnelScore = random();
      let status: Lead['status'] = 'New';
      let is_mql = false;
      let is_sql = false;
      let is_opportunity = false;
      let is_proposal = false;
      let is_won = false;
      let revenue = 0;

      if (funnelScore > 0.88) {
        status = 'Won';
        is_mql = true;
        is_sql = true;
        is_opportunity = true;
        is_proposal = true;
        is_won = true;
        revenue = Math.round(25000 + random() * 45000);
      } else if (funnelScore > 0.76) {
        status = 'Proposal';
        is_mql = true;
        is_sql = true;
        is_opportunity = true;
        is_proposal = true;
        revenue = Math.round(20000 + random() * 35000);
      } else if (funnelScore > 0.62) {
        status = 'Opportunity';
        is_mql = true;
        is_sql = true;
        is_opportunity = true;
      } else if (funnelScore > 0.45) {
        status = 'SQL';
        is_mql = true;
        is_sql = true;
      } else if (funnelScore > 0.28) {
        status = 'MQL';
        is_mql = true;
      } else if (funnelScore > 0.15) {
        status = 'Qualified';
      } else if (funnelScore > 0.06) {
        status = 'Contacted';
      } else if (funnelScore > 0.02) {
        status = 'Lost';
      } else {
        status = 'New';
      }

      const leadId = `lead-${1000 + i}`;

      // First touch vs Last touch details
      // Some leads have a prior first touch on organic or direct, and converted on paid (or vice versa)
      const hadPriorTouch = i % 3 === 0;
      const firstPlat = hadPriorTouch ? platforms[2] /* Organic Search */ : plat;
      const firstCamp = hadPriorTouch ? campaigns[4] : camp;
      const firstLp = hadPriorTouch ? landing_pages[0] : lp;

      const leadAttr: LeadAttribution = {
        id: `attr-${leadId}`,
        lead_id: leadId,
        first_source: firstPlat.default_utm_source,
        first_medium: firstPlat.default_utm_medium,
        first_campaign: firstCamp.name,
        first_landing_page: firstLp.url,
        first_touch_at: new Date(leadDate.getTime() - (hadPriorTouch ? 12 : 0) * 86400000).toISOString(),
        last_source: plat.default_utm_source,
        last_medium: plat.default_utm_medium,
        last_campaign: camp.name,
        last_landing_page: lp.url,
        last_touch_at: leadDate.toISOString(),
        utm_term: camp.service.toLowerCase().replace(/\s+/g, '+'),
        utm_content: 'b2b-cta-v2',
        created_at: nowIso,
        updated_at: nowIso,
      };

      const leadRecord: Lead = {
        id: leadId,
        organization_id: orgId,
        origin: 'Demo',
        date: dateStr,
        name: `${fName} ${lName}`,
        company: comp,
        email,
        phone,
        country,
        service: camp.service,
        source: plat.default_utm_source,
        medium: plat.default_utm_medium,
        campaign: camp.name,
        landing_page: lp.url,
        status,
        is_mql,
        is_sql,
        is_opportunity,
        is_proposal,
        is_won,
        revenue,
        currency: 'USD',
        assigned_to: i % 2 === 0 ? 'Sarah Jenkins' : 'Alex Chen',
        notes: `Initial request for ${camp.service}. Budget confirmed in B2B discovery.`,
        external_id: `EXT-${5000 + i}`,
        attribution: leadAttr,
        created_at: leadDate.toISOString(),
        updated_at: nowIso,
      };

      leads.push(leadRecord);
      lead_attribution.push(leadAttr);
    }

    return {
      organizations,
      profiles,
      platforms,
      campaigns,
      spend_entries,
      leads,
      lead_attribution,
      traffic_daily,
      ad_metrics_daily,
      landing_pages,
      daily_marketing_activities,
      integrations,
      sync_logs,
      currencies,
      exchange_rates,
    };
  }

  // Database Accessors
  public getSchema(): DatabaseSchema {
    return this.data;
  }

  public resetDemoData() {
    this.data = this.createInitialDemoData();
    this.saveDatabase();
    return { success: true, message: 'Database reset to initial 30-day realistic demo dataset.' };
  }

  public purgeDemoData() {
    const prevLeadsCount = this.data.leads.length;
    const prevSpendCount = this.data.spend_entries.length;
    const prevTrafficCount = this.data.traffic_daily.length;

    this.data.leads = this.data.leads.filter((l) => l.origin !== 'Demo');
    this.data.lead_attribution = this.data.lead_attribution.filter((a) =>
      this.data.leads.some((l) => l.id === a.lead_id)
    );
    this.data.spend_entries = this.data.spend_entries.filter(
      (s) => s.origin !== 'Demo' && s.source !== 'Demo'
    );
    this.data.traffic_daily = this.data.traffic_daily.filter((t) => t.origin !== 'Demo');
    this.data.ad_metrics_daily = this.data.ad_metrics_daily.filter((m) =>
      this.data.spend_entries.some((s) => s.platform_id === m.platform_id && s.date === m.date)
    );
    this.saveDatabase();

    const removedLeads = prevLeadsCount - this.data.leads.length;
    const removedSpend = prevSpendCount - this.data.spend_entries.length;
    const removedTraffic = prevTrafficCount - this.data.traffic_daily.length;

    return {
      success: true,
      removedLeads,
      removedSpend,
      removedTraffic,
      remainingLeads: this.data.leads.length,
      remainingSpend: this.data.spend_entries.length,
      remainingTraffic: this.data.traffic_daily.length,
      message: `Purged demo records (${removedLeads} leads, ${removedSpend} spend, ${removedTraffic} traffic rows). Live imported & API data preserved.`,
    };
  }

  public clearDemoData() {
    this.data.leads = [];
    this.data.lead_attribution = [];
    this.data.spend_entries = [];
    this.data.traffic_daily = [];
    this.data.ad_metrics_daily = [];
    this.data.daily_marketing_activities = [];
    this.saveDatabase();
    return { success: true, message: 'Demo metrics, leads, spend, and activities cleared.' };
  }

  // --- LEADS ---
  public getLeads(filters?: Partial<GlobalFilterState> & { search?: string; page?: number; limit?: number }) {
    let list = [...this.data.leads];

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.company.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.phone.includes(q) ||
          l.campaign.toLowerCase().includes(q) ||
          (l.external_id && l.external_id.toLowerCase().includes(q))
      );
    }

    if (filters?.startDate && filters?.endDate) {
      list = list.filter((l) => l.date >= filters.startDate! && l.date <= filters.endDate!);
    }

    if (filters?.source && filters.source !== 'all') {
      list = list.filter((l) => l.source.toLowerCase() === filters.source!.toLowerCase());
    }

    if (filters?.medium && filters.medium !== 'all') {
      list = list.filter((l) => l.medium.toLowerCase() === filters.medium!.toLowerCase());
    }

    if (filters?.campaign && filters.campaign !== 'all') {
      list = list.filter((l) => l.campaign === filters.campaign);
    }

    if (filters?.country && filters.country !== 'all') {
      list = list.filter((l) => l.country === filters.country);
    }

    if (filters?.service && filters.service !== 'all') {
      list = list.filter((l) => l.service === filters.service);
    }

    if (filters?.landingPage && filters.landingPage !== 'all') {
      list = list.filter((l) => l.landing_page === filters.landingPage);
    }

    if (filters?.leadStatus && filters.leadStatus !== 'all') {
      list = list.filter((l) => l.status === filters.leadStatus);
    }

    if (filters?.mqlOnly) {
      list = list.filter((l) => l.is_mql);
    }

    if (filters?.sqlOnly) {
      list = list.filter((l) => l.is_sql);
    }

    // Sort by date desc
    list.sort((a, b) => b.date.localeCompare(a.date));

    const total = list.length;
    const page = filters?.page || 1;
    const limit = filters?.limit || 25;
    const paginated = list.slice((page - 1) * limit, page * limit);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      leads: paginated,
    };
  }

  public getLeadById(id: string): Lead | undefined {
    return this.data.leads.find((l) => l.id === id);
  }

  public checkDuplicateLead(email?: string, phone?: string, external_id?: string, excludeId?: string) {
    const cleanExt = external_id ? external_id.trim().toLowerCase() : null;
    const cleanEmail = email ? email.trim().toLowerCase() : null;
    const cleanPhone = phone ? phone.trim().replace(/\D/g, '') : null;

    for (const lead of this.data.leads) {
      if (excludeId && lead.id === excludeId) continue;

      // 1. External ID (Strongest identifier)
      if (cleanExt && lead.external_id && lead.external_id.trim().toLowerCase() === cleanExt) {
        return { isDuplicate: true, matchedField: 'external_id', existingLead: lead };
      }

      // 2. Email matching
      if (cleanEmail && lead.email.trim().toLowerCase() === cleanEmail) {
        return { isDuplicate: true, matchedField: 'email', existingLead: lead };
      }

      // 3. Phone matching (minimum 6 digits)
      if (cleanPhone && cleanPhone.length > 5) {
        const leadCleanPhone = lead.phone.trim().replace(/\D/g, '');
        if (leadCleanPhone === cleanPhone) {
          return { isDuplicate: true, matchedField: 'phone', existingLead: lead };
        }
      }
    }

    return { isDuplicate: false };
  }

  public normalizeLeadStatus(status?: string): LeadStatus {
    if (!status) return 'New';
    const s = status.trim().toLowerCase();
    if (s.includes('won') || s === 'closed won') return 'Won';
    if (s.includes('lost') || s === 'closed lost') return 'Lost';
    if (s.includes('proposal')) return 'Proposal';
    if (s.includes('opportunity')) return 'Opportunity';
    if (s.includes('sql') || s.includes('sales qual')) return 'SQL';
    if (s.includes('mql') || s.includes('marketing qual')) return 'MQL';
    if (s.includes('qualified')) return 'Qualified';
    if (s.includes('contacted') || s.includes('in touch')) return 'Contacted';
    if (s.includes('invalid') || s.includes('junk') || s.includes('spam')) return 'Invalid';
    if (s.includes('duplicate')) return 'Duplicate';
    return 'New';
  }

  public syncSheetLeadRow(item: {
    date?: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    country?: string;
    service?: string;
    source?: string;
    medium?: string;
    campaign?: string;
    landing_page?: string;
    status?: string;
    revenue?: number | string;
    assigned_to?: string;
    notes?: string;
    external_id?: string;
    utm_term?: string;
    utm_content?: string;
    organization_id?: string;
  }): {
    action: 'inserted' | 'updated' | 'duplicate' | 'error';
    lead?: Lead;
    error?: string;
    matchedField?: string;
    updatedFields?: string[];
  } {
    const effectiveName = item.name?.trim() || (item.email ? item.email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '');
    if (!effectiveName || !item.email) {
      return { action: 'error', error: 'Name and Email are required fields' };
    }

    const nowIso = new Date().toISOString();
    const cleanStatus = this.normalizeLeadStatus(item.status);
    const revNum = Number(item.revenue) || 0;

    // Check duplicate/existing lead: 1. External ID, 2. Email, 3. Phone
    const dupCheck = this.checkDuplicateLead(item.email, item.phone, item.external_id);

    if (dupCheck.isDuplicate && dupCheck.existingLead) {
      const existing = dupCheck.existingLead;
      const idx = this.data.leads.findIndex((l) => l.id === existing.id);

      // Check if anything has changed between sheet row and existing record
      const updatedFields: string[] = [];

      if (cleanStatus && cleanStatus !== existing.status) {
        updatedFields.push(`status: ${existing.status} -> ${cleanStatus}`);
      }
      if (revNum > 0 && revNum !== existing.revenue) {
        updatedFields.push(`revenue: ${existing.revenue} -> ${revNum}`);
      }
      if (item.company && item.company.trim() && item.company.trim() !== existing.company) {
        updatedFields.push('company');
      }
      if (item.service && item.service.trim() && item.service.trim() !== existing.service) {
        updatedFields.push('service');
      }
      if (item.assigned_to && item.assigned_to.trim() && item.assigned_to.trim() !== existing.assigned_to) {
        updatedFields.push('assigned_to');
      }
      if (item.external_id && item.external_id.trim() && !existing.external_id) {
        updatedFields.push('external_id');
      }

      if (updatedFields.length > 0 && idx !== -1) {
        // UPDATE existing lead - preserve first touch!
        const updatedLead: Lead = {
          ...existing,
          status: cleanStatus || existing.status,
          is_mql: ['MQL', 'SQL', 'Opportunity', 'Proposal', 'Won'].includes(cleanStatus || existing.status),
          is_sql: ['SQL', 'Opportunity', 'Proposal', 'Won'].includes(cleanStatus || existing.status),
          is_opportunity: ['Opportunity', 'Proposal', 'Won'].includes(cleanStatus || existing.status),
          is_proposal: ['Proposal', 'Won'].includes(cleanStatus || existing.status),
          is_won: (cleanStatus || existing.status) === 'Won',
          revenue: revNum > 0 ? revNum : existing.revenue,
          company: item.company ? item.company.trim() : existing.company,
          service: item.service ? item.service.trim() : existing.service,
          assigned_to: item.assigned_to ? item.assigned_to.trim() : existing.assigned_to,
          external_id: item.external_id ? item.external_id.trim() : existing.external_id,
          notes: item.notes ? `${existing.notes ? existing.notes + ' | ' : ''}${item.notes}` : existing.notes,
          updated_at: nowIso,
        };

        // If attribution exists, preserve first touch and update last touch
        if (existing.attribution) {
          updatedLead.attribution = {
            ...existing.attribution,
            last_touch_at: nowIso,
            last_source: item.source ? item.source.trim().toLowerCase() : existing.attribution.last_source,
            last_medium: item.medium ? item.medium.trim().toLowerCase() : existing.attribution.last_medium,
            last_campaign: item.campaign ? item.campaign.trim() : existing.attribution.last_campaign,
          };
        }

        this.data.leads[idx] = updatedLead;
        this.saveDatabase();
        return {
          action: 'updated',
          lead: updatedLead,
          matchedField: dupCheck.matchedField,
          updatedFields,
        };
      }

      // No changes detected -> identical record, count as duplicate
      return {
        action: 'duplicate',
        lead: existing,
        matchedField: dupCheck.matchedField,
      };
    }

    // Insert brand new lead
    const id = `lead-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const date = item.date || nowIso.slice(0, 10);
    const source = item.source ? item.source.trim().toLowerCase() : 'google-sheets';
    const medium = item.medium ? item.medium.trim().toLowerCase() : 'spreadsheet';
    const campaign = item.campaign ? item.campaign.trim() : 'Google Sheets Sync';
    const landing_page = item.landing_page || 'https://acmetech.com/contact';

    const newAttr: LeadAttribution = {
      id: `attr-${id}`,
      lead_id: id,
      first_source: source,
      first_medium: medium,
      first_campaign: campaign,
      first_landing_page: landing_page,
      first_touch_at: nowIso,
      last_source: source,
      last_medium: medium,
      last_campaign: campaign,
      last_landing_page: landing_page,
      last_touch_at: nowIso,
      utm_term: item.utm_term,
      utm_content: item.utm_content,
      created_at: nowIso,
      updated_at: nowIso,
    };

    const newLead: Lead = {
      id,
      organization_id: item.organization_id || 'org-marketing-hub-1',
      date,
      name: effectiveName,
      company: item.company ? item.company.trim() : '',
      email: item.email.trim().toLowerCase(),
      phone: item.phone ? item.phone.trim() : '',
      country: item.country ? item.country.trim() : 'United States',
      service: item.service ? item.service.trim() : 'General Inquiry',
      source,
      medium,
      campaign,
      landing_page,
      status: cleanStatus,
      is_mql: ['MQL', 'SQL', 'Opportunity', 'Proposal', 'Won'].includes(cleanStatus),
      is_sql: ['SQL', 'Opportunity', 'Proposal', 'Won'].includes(cleanStatus),
      is_opportunity: ['Opportunity', 'Proposal', 'Won'].includes(cleanStatus),
      is_proposal: ['Proposal', 'Won'].includes(cleanStatus),
      is_won: cleanStatus === 'Won',
      revenue: revNum,
      currency: 'USD',
      origin: 'Imported',
      assigned_to: item.assigned_to ? item.assigned_to.trim() : '',
      notes: item.notes ? item.notes.trim() : 'Synchronized from Google Sheet',
      external_id: item.external_id ? item.external_id.trim() : undefined,
      attribution: newAttr,
      created_at: nowIso,
      updated_at: nowIso,
    };

    this.data.leads.unshift(newLead);
    this.data.lead_attribution.unshift(newAttr);
    this.saveDatabase();

    return { action: 'inserted', lead: newLead };
  }

  public addLead(leadData: Partial<Lead>, attributionData?: Partial<LeadAttribution>): { lead?: Lead; error?: string } {
    if (!leadData.name || !leadData.email) {
      return { error: 'Name and Email are required fields' };
    }

    // Duplicate detection check
    const dupCheck = this.checkDuplicateLead(leadData.email, leadData.phone, leadData.external_id);
    if (dupCheck.isDuplicate) {
      return {
        error: `Duplicate lead detected: Matched existing lead #${dupCheck.existingLead?.id} on ${dupCheck.matchedField}`,
      };
    }

    const nowIso = new Date().toISOString();
    const id = `lead-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const date = leadData.date || nowIso.slice(0, 10);

    const newAttr: LeadAttribution = {
      id: `attr-${id}`,
      lead_id: id,
      first_source: attributionData?.first_source || leadData.source || 'direct',
      first_medium: attributionData?.first_medium || leadData.medium || 'none',
      first_campaign: attributionData?.first_campaign || leadData.campaign || 'direct',
      first_landing_page: attributionData?.first_landing_page || leadData.landing_page || 'https://example.com',
      first_touch_at: attributionData?.first_touch_at || nowIso,
      last_source: leadData.source || attributionData?.last_source || 'direct',
      last_medium: leadData.medium || attributionData?.last_medium || 'none',
      last_campaign: leadData.campaign || attributionData?.last_campaign || 'direct',
      last_landing_page: leadData.landing_page || attributionData?.last_landing_page || 'https://example.com',
      last_touch_at: nowIso,
      utm_term: attributionData?.utm_term,
      utm_content: attributionData?.utm_content,
      created_at: nowIso,
      updated_at: nowIso,
    };

    const newLead: Lead = {
      id,
      date,
      name: leadData.name,
      company: leadData.company || '',
      email: leadData.email,
      phone: leadData.phone || '',
      country: leadData.country || 'Global',
      service: leadData.service || 'General Inquiries',
      source: leadData.source || newAttr.last_source,
      medium: leadData.medium || newAttr.last_medium,
      campaign: leadData.campaign || newAttr.last_campaign,
      landing_page: leadData.landing_page || newAttr.last_landing_page,
      status: leadData.status || 'New',
      is_mql: Boolean(leadData.is_mql),
      is_sql: Boolean(leadData.is_sql),
      is_opportunity: Boolean(leadData.is_opportunity),
      is_proposal: Boolean(leadData.is_proposal),
      is_won: Boolean(leadData.is_won),
      revenue: Number(leadData.revenue || 0),
      currency: leadData.currency || 'USD',
      assigned_to: leadData.assigned_to || '',
      notes: leadData.notes || '',
      external_id: leadData.external_id || '',
      attribution: newAttr,
      created_at: nowIso,
      updated_at: nowIso,
    };

    this.data.leads.unshift(newLead);
    this.data.lead_attribution.unshift(newAttr);
    this.saveDatabase();
    return { lead: newLead };
  }

  public updateLead(id: string, updates: Partial<Lead>): { lead?: Lead; error?: string } {
    const idx = this.data.leads.findIndex((l) => l.id === id);
    if (idx === -1) return { error: 'Lead not found' };

    const existing = this.data.leads[idx];

    // Check duplicate with other leads if email or phone is being changed
    if (updates.email || updates.phone || updates.external_id) {
      const dup = this.checkDuplicateLead(
        updates.email || existing.email,
        updates.phone || existing.phone,
        updates.external_id || existing.external_id,
        id
      );
      if (dup.isDuplicate) {
        return {
          error: `Duplicate conflict with existing lead #${dup.existingLead?.id} on ${dup.matchedField}`,
        };
      }
    }

    const updatedLead: Lead = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // Ensure first-touch is preserved if attribution updated
    if (existing.attribution) {
      updatedLead.attribution = {
        ...existing.attribution,
        ...(updates.attribution || {}),
        // Never overwrite first touch
        first_source: existing.attribution.first_source,
        first_medium: existing.attribution.first_medium,
        first_campaign: existing.attribution.first_campaign,
        first_landing_page: existing.attribution.first_landing_page,
        first_touch_at: existing.attribution.first_touch_at,
        last_touch_at: new Date().toISOString(),
      };
    }

    this.data.leads[idx] = updatedLead;
    this.saveDatabase();
    return { lead: updatedLead };
  }

  public deleteLead(id: string): boolean {
    const idx = this.data.leads.findIndex((l) => l.id === id);
    if (idx === -1) return false;
    this.data.leads.splice(idx, 1);
    this.data.lead_attribution = this.data.lead_attribution.filter((a) => a.lead_id !== id);
    this.saveDatabase();
    return true;
  }

  // --- SPEND & COST ---
  public getSpend(filters?: Partial<GlobalFilterState>) {
    let list = [...this.data.spend_entries];

    if (filters?.startDate && filters?.endDate) {
      list = list.filter((s) => s.date >= filters.startDate! && s.date <= filters.endDate!);
    }

    if (filters?.platform && filters.platform !== 'all') {
      list = list.filter((s) => s.platform_name === filters.platform);
    }

    if (filters?.campaign && filters.campaign !== 'all') {
      list = list.filter((s) => s.campaign_name === filters.campaign);
    }

    list.sort((a, b) => b.date.localeCompare(a.date));
    return list;
  }

  public addSpendEntry(entry: Partial<SpendEntry>) {
    const nowIso = new Date().toISOString();
    const plat = this.data.platforms.find((p) => p.name === entry.platform_name || p.id === entry.platform_id);
    const platName = plat ? plat.name : (entry.platform_name || 'Other');
    const platId = plat ? plat.id : (entry.platform_id || 'plat-other');

    const newEntry: SpendEntry = {
      id: `sp-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      organization_id: entry.organization_id || 'org-marketing-hub-1',
      origin: entry.origin || (entry.source === 'API' ? 'API' : 'Manual'),
      date: entry.date || nowIso.slice(0, 10),
      platform_id: platId,
      platform_name: platName as PlatformType,
      campaign_id: entry.campaign_id || null,
      campaign_name: entry.campaign_name || 'General Platform Spend',
      cost_type: entry.cost_type || 'Ad Spend',
      amount: Number(entry.amount) || 0,
      currency: entry.currency || 'USD',
      source: entry.source || 'Manual',
      is_adjustment: Boolean(entry.is_adjustment),
      reference_entry_id: entry.reference_entry_id || null,
      notes: entry.notes || '',
      created_at: nowIso,
      updated_at: nowIso,
    };

    this.data.spend_entries.unshift(newEntry);
    this.saveDatabase();
    return newEntry;
  }

  // --- TRAFFIC DAILY & REAL INGESTION ---
  public getTraffic(filters?: Partial<GlobalFilterState>) {
    let list = [...this.data.traffic_daily];
    if (filters?.startDate && filters?.endDate) {
      list = list.filter((t) => t.date >= filters.startDate! && t.date <= filters.endDate!);
    }
    if (filters?.platform && filters.platform !== 'all') {
      list = list.filter((t) => t.platform_name === filters.platform);
    }
    return list;
  }

  public addTrafficDaily(entry: Partial<TrafficDaily>) {
    const nowIso = new Date().toISOString();
    const newTrf: TrafficDaily = {
      id: `trf-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      organization_id: entry.organization_id || 'org-marketing-hub-1',
      origin: entry.origin || 'API',
      date: entry.date || nowIso.slice(0, 10),
      source: entry.source || 'google',
      medium: entry.medium || 'organic',
      campaign: entry.campaign || '(organic)',
      platform_id: entry.platform_id || 'plat-seo',
      platform_name: entry.platform_name || 'Organic Search',
      landing_page: entry.landing_page || 'https://acmetech.com',
      country: entry.country || 'Global',
      device: entry.device || 'desktop',
      users: Number(entry.users) || 0,
      new_users: Number(entry.new_users) || 0,
      sessions: Number(entry.sessions) || 0,
      engaged_sessions: Number(entry.engaged_sessions) || 0,
      engagement_rate: Number(entry.engagement_rate) || 0,
      conversions: Number(entry.conversions) || 0,
      created_at: nowIso,
      updated_at: nowIso,
    };

    this.data.traffic_daily.unshift(newTrf);
    this.saveDatabase();
    return newTrf;
  }

  public ingestGA4Traffic(records: Partial<TrafficDaily>[]): { ingested: number; updated: number } {
    let ingested = 0;
    let updated = 0;
    const nowIso = new Date().toISOString();

    for (const rec of records) {
      if (!rec.date) continue;
      // Match on date + source + medium + campaign + landing_page
      const existingIdx = this.data.traffic_daily.findIndex(
        (t) =>
          t.date === rec.date &&
          t.source?.toLowerCase() === (rec.source || '').toLowerCase() &&
          t.medium?.toLowerCase() === (rec.medium || '').toLowerCase() &&
          t.landing_page === rec.landing_page
      );

      if (existingIdx !== -1) {
        this.data.traffic_daily[existingIdx] = {
          ...this.data.traffic_daily[existingIdx],
          ...rec,
          origin: 'API',
          updated_at: nowIso,
        };
        updated++;
      } else {
        this.data.traffic_daily.unshift({
          id: `trf-ga4-${rec.date}-${crypto.randomBytes(3).toString('hex')}`,
          organization_id: 'org-marketing-hub-1',
          origin: 'API',
          date: rec.date,
          source: rec.source || 'google',
          medium: rec.medium || 'organic',
          campaign: rec.campaign || '(organic)',
          platform_id: rec.platform_id || 'plat-seo',
          platform_name: rec.platform_name || 'Organic Search',
          landing_page: rec.landing_page || 'https://acmetech.com',
          country: rec.country || 'Global',
          device: rec.device || 'desktop',
          users: Number(rec.users) || 0,
          new_users: Number(rec.new_users) || 0,
          sessions: Number(rec.sessions) || 0,
          engaged_sessions: Number(rec.engaged_sessions) || 0,
          engagement_rate: Number(rec.engagement_rate) || 0,
          conversions: Number(rec.conversions) || 0,
          created_at: nowIso,
          updated_at: nowIso,
        });
        ingested++;
      }
    }

    this.saveDatabase();
    return { ingested, updated };
  }

  public ingestGoogleAdsSpend(
    records: {
      date: string;
      campaign_name: string;
      campaign_id?: string;
      ad_group?: string;
      impressions: number;
      clicks: number;
      spend: number;
      currency?: CurrencyCode;
      conversions?: number;
      conversion_value?: number;
    }[]
  ): { count: number } {
    const nowIso = new Date().toISOString();
    const plat = this.data.platforms.find((p) => p.name === 'Google Ads') || this.data.platforms[0];

    for (const r of records) {
      // Add or update daily spend entry
      const existingIdx = this.data.spend_entries.findIndex(
        (s) =>
          s.date === r.date &&
          s.platform_name === 'Google Ads' &&
          s.campaign_name === r.campaign_name &&
          s.source === 'API'
      );

      if (existingIdx !== -1) {
        this.data.spend_entries[existingIdx].amount = r.spend;
        this.data.spend_entries[existingIdx].updated_at = nowIso;
      } else {
        this.data.spend_entries.unshift({
          id: `sp-gads-${r.date}-${crypto.randomBytes(3).toString('hex')}`,
          organization_id: 'org-marketing-hub-1',
          origin: 'API',
          date: r.date,
          platform_id: plat.id,
          platform_name: 'Google Ads',
          campaign_id: r.campaign_id || null,
          campaign_name: r.campaign_name,
          cost_type: 'Ad Spend',
          amount: r.spend,
          currency: r.currency || 'USD',
          source: 'API',
          is_adjustment: false,
          reference_entry_id: null,
          notes: 'Automated ingestion from Google Ads API',
          created_at: nowIso,
          updated_at: nowIso,
        });
      }

      // Record in ad_metrics_daily
      const adMetIdx = this.data.ad_metrics_daily.findIndex(
        (m) => m.date === r.date && m.platform_name === 'Google Ads' && m.campaign_name === r.campaign_name
      );

      if (adMetIdx !== -1) {
        this.data.ad_metrics_daily[adMetIdx] = {
          ...this.data.ad_metrics_daily[adMetIdx],
          impressions: r.impressions,
          clicks: r.clicks,
          spend: r.spend,
          conversions: r.conversions || 0,
          conversion_value: r.conversion_value || 0,
          updated_at: nowIso,
        };
      } else {
        this.data.ad_metrics_daily.unshift({
          id: `admet-gads-${r.date}-${crypto.randomBytes(3).toString('hex')}`,
          date: r.date,
          platform_id: plat.id,
          platform_name: 'Google Ads',
          campaign_id: r.campaign_id || 'camp-gads',
          campaign_name: r.campaign_name,
          ad_group: r.ad_group || 'All Ad Groups',
          impressions: r.impressions,
          clicks: r.clicks,
          spend: r.spend,
          currency: r.currency || 'USD',
          conversions: r.conversions || 0,
          conversion_value: r.conversion_value || 0,
          created_at: nowIso,
          updated_at: nowIso,
        });
      }
    }

    this.saveDatabase();
    return { count: records.length };
  }

  public ingestBingAdsSpend(
    records: {
      date: string;
      campaign_name: string;
      campaign_id?: string;
      impressions: number;
      clicks: number;
      spend: number;
      currency?: CurrencyCode;
      conversions?: number;
    }[]
  ): { count: number } {
    const nowIso = new Date().toISOString();
    const plat = this.data.platforms.find((p) => p.name === 'Bing Ads') || this.data.platforms[0];

    for (const r of records) {
      const existingIdx = this.data.spend_entries.findIndex(
        (s) =>
          s.date === r.date &&
          s.platform_name === 'Bing Ads' &&
          s.campaign_name === r.campaign_name &&
          s.source === 'API'
      );

      if (existingIdx !== -1) {
        this.data.spend_entries[existingIdx].amount = r.spend;
        this.data.spend_entries[existingIdx].updated_at = nowIso;
      } else {
        this.data.spend_entries.unshift({
          id: `sp-bing-${r.date}-${crypto.randomBytes(3).toString('hex')}`,
          organization_id: 'org-marketing-hub-1',
          origin: 'API',
          date: r.date,
          platform_id: plat.id,
          platform_name: 'Bing Ads',
          campaign_id: r.campaign_id || null,
          campaign_name: r.campaign_name,
          cost_type: 'Ad Spend',
          amount: r.spend,
          currency: r.currency || 'USD',
          source: 'API',
          is_adjustment: false,
          reference_entry_id: null,
          notes: 'Automated ingestion from Bing Ads API',
          created_at: nowIso,
          updated_at: nowIso,
        });
      }

      // Record in ad_metrics_daily
      this.data.ad_metrics_daily.unshift({
        id: `admet-bing-${r.date}-${crypto.randomBytes(3).toString('hex')}`,
        date: r.date,
        platform_id: plat.id,
        platform_name: 'Bing Ads',
        campaign_id: r.campaign_id || 'camp-bing',
        campaign_name: r.campaign_name,
        ad_group: 'All Ad Groups',
        impressions: r.impressions,
        clicks: r.clicks,
        spend: r.spend,
        currency: r.currency || 'USD',
        conversions: r.conversions || 0,
        conversion_value: 0,
        created_at: nowIso,
        updated_at: nowIso,
      });
    }

    this.saveDatabase();
    return { count: records.length };
  }

  // --- CAMPAIGNS ---
  public getCampaigns() {
    return this.data.campaigns;
  }

  public addCampaign(camp: Partial<Campaign>) {
    const nowIso = new Date().toISOString();
    const plat = this.data.platforms.find((p) => p.name === camp.platform_name || p.id === camp.platform_id);
    const newCamp: Campaign = {
      id: `camp-${Date.now()}`,
      name: camp.name || 'Untitled Campaign',
      platform_id: plat ? plat.id : 'plat-1',
      platform_name: plat ? plat.name : 'Google Ads',
      source: camp.source || plat?.default_utm_source || 'google',
      medium: camp.medium || plat?.default_utm_medium || 'cpc',
      service: camp.service || 'General',
      country: camp.country || 'Global',
      start_date: camp.start_date || nowIso.slice(0, 10),
      end_date: camp.end_date || null,
      budget: Number(camp.budget) || 0,
      currency: camp.currency || 'USD',
      status: camp.status || 'Active',
      notes: camp.notes || '',
      created_at: nowIso,
      updated_at: nowIso,
    };
    this.data.campaigns.unshift(newCamp);
    this.saveDatabase();
    return newCamp;
  }

  public updateCampaign(id: string, updates: Partial<Campaign>) {
    const idx = this.data.campaigns.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    this.data.campaigns[idx] = {
      ...this.data.campaigns[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.saveDatabase();
    return this.data.campaigns[idx];
  }

  // --- PLATFORMS ---
  public getPlatforms() {
    return this.data.platforms;
  }

  public updatePlatform(id: string, updates: Partial<Platform>) {
    const idx = this.data.platforms.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    this.data.platforms[idx] = {
      ...this.data.platforms[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.saveDatabase();
    return this.data.platforms[idx];
  }

  // --- LANDING PAGES ---
  public getLandingPages() {
    return this.data.landing_pages;
  }

  public addLandingPage(lp: Partial<LandingPage>) {
    const nowIso = new Date().toISOString();
    const newPage: LandingPage = {
      id: `lp-${Date.now()}`,
      url: lp.url || 'https://example.com/new-page',
      page_name: lp.page_name || 'New Landing Page',
      service: lp.service || 'General',
      source_default: lp.source_default || 'google',
      campaign_default: lp.campaign_default || '',
      notes: lp.notes || '',
      created_at: nowIso,
      updated_at: nowIso,
    };
    this.data.landing_pages.push(newPage);
    this.saveDatabase();
    return newPage;
  }

  // --- DAILY MARKETING ACTIVITIES ---
  public getDailyActivities(filters?: { date?: string; platform?: string; activity_type?: string }) {
    let list = [...this.data.daily_marketing_activities];
    if (filters?.date) {
      list = list.filter((a) => a.date === filters.date);
    }
    if (filters?.platform && filters.platform !== 'all') {
      list = list.filter((a) => a.platform_name === filters.platform);
    }
    if (filters?.activity_type && filters.activity_type !== 'all') {
      list = list.filter((a) => a.activity_type === filters.activity_type);
    }
    list.sort((a, b) => b.date.localeCompare(a.date));
    return list;
  }

  public addDailyActivity(act: Partial<DailyMarketingActivity>) {
    const nowIso = new Date().toISOString();
    const plat = this.data.platforms.find((p) => p.name === act.platform_name || p.id === act.platform_id);
    const newAct: DailyMarketingActivity = {
      id: `act-${Date.now()}`,
      date: act.date || nowIso.slice(0, 10),
      platform_id: plat ? plat.id : 'plat-1',
      platform_name: plat ? plat.name : 'Google Ads',
      campaign_id: act.campaign_id || null,
      campaign_name: act.campaign_name || '',
      activity_type: act.activity_type || 'Campaign Optimization',
      description: act.description || '',
      spend: Number(act.spend) || 0,
      leads_attributed: Number(act.leads_attributed) || 0,
      mql_attributed: Number(act.mql_attributed) || 0,
      status: act.status || 'Completed',
      owner: act.owner || 'Marketing Team',
      remarks: act.remarks || '',
      created_at: nowIso,
      updated_at: nowIso,
    };
    this.data.daily_marketing_activities.unshift(newAct);
    this.saveDatabase();
    return newAct;
  }

  // --- INTEGRATIONS & SYNC LOGS ---
  public getIntegrations() {
    return this.data.integrations;
  }

  public updateIntegration(id: string, updates: Partial<Integration>) {
    const idx = this.data.integrations.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    this.data.integrations[idx] = {
      ...this.data.integrations[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.saveDatabase();
    return this.data.integrations[idx];
  }

  public getSyncLogs(limit = 50) {
    return [...this.data.sync_logs].slice(0, limit);
  }

  public addSyncLog(log: Partial<SyncLog>) {
    const nowIso = new Date().toISOString();
    const newLog: SyncLog = {
      id: `log-${Date.now()}`,
      integration_id: log.integration_id || '',
      service_name: log.service_name || 'System',
      timestamp: nowIso,
      status: log.status || 'Success',
      records_processed: log.records_processed || 0,
      new_records: log.new_records ?? 0,
      updated_records: log.updated_records ?? 0,
      duplicates_count: log.duplicates_count ?? 0,
      errors_count: log.errors_count ?? 0,
      duration_ms: log.duration_ms,
      message: log.message || '',
      details: log.details || '',
      created_at: nowIso,
      updated_at: nowIso,
    };
    this.data.sync_logs.unshift(newLog);
    this.saveDatabase();
    return newLog;
  }

  // --- CURRENCIES & EXCHANGE RATES ---
  public getCurrencies() {
    return this.data.currencies;
  }

  public getExchangeRates() {
    return this.data.exchange_rates;
  }

  public updateExchangeRate(from: string, to: string, rate: number) {
    const idx = this.data.exchange_rates.findIndex((r) => r.from_currency === from && r.to_currency === to);
    const nowIso = new Date().toISOString();
    if (idx !== -1) {
      this.data.exchange_rates[idx].rate = rate;
      this.data.exchange_rates[idx].updated_date = nowIso.slice(0, 10);
      this.data.exchange_rates[idx].updated_at = nowIso;
    } else {
      this.data.exchange_rates.push({
        id: `xr-${Date.now()}`,
        from_currency: from as any,
        to_currency: to as any,
        rate,
        updated_date: nowIso.slice(0, 10),
        created_at: nowIso,
        updated_at: nowIso,
      });
    }
    this.saveDatabase();
  }

  // --- AGGREGATIONS & METRICS CALCULATIONS ---
  // Calculates factual KPIs from database records without hardcoding
  public calculateDashboardKPIs(filters: GlobalFilterState): {
    kpis: DashboardKPIs;
    previousKpis: Partial<DashboardKPIs>;
    channelPerformance: ChannelPerformanceRow[];
    trafficTimeSeries: { date: string; users: number; sessions: number; leads: number; mql: number }[];
    spendTimeSeries: { date: string; spend: number; [platform: string]: any }[];
    leadsTimeSeries: { date: string; leads: number; mql: number; sql: number }[];
    funnel: { stage: string; count: number; conversionRate: number | null }[];
  } {
    const { startDate, endDate, platform, source, medium, campaign, country, service, landingPage } = filters;

    // Filter helper
    const filterTraffic = (t: TrafficDaily, sDate: string, eDate: string) => {
      if (t.date < sDate || t.date > eDate) return false;
      if (platform !== 'all' && t.platform_name !== platform) return false;
      if (source !== 'all' && t.source.toLowerCase() !== source.toLowerCase()) return false;
      if (medium !== 'all' && t.medium.toLowerCase() !== medium.toLowerCase()) return false;
      if (campaign !== 'all' && t.campaign !== campaign) return false;
      if (country !== 'all' && t.country !== country) return false;
      if (landingPage !== 'all' && t.landing_page !== landingPage) return false;
      return true;
    };

    const filterSpend = (s: SpendEntry, sDate: string, eDate: string) => {
      if (s.date < sDate || s.date > eDate) return false;
      if (platform !== 'all' && s.platform_name !== platform) return false;
      if (campaign !== 'all' && s.campaign_name !== campaign) return false;
      return true;
    };

    const filterLead = (l: Lead, sDate: string, eDate: string) => {
      if (l.date < sDate || l.date > eDate) return false;
      if (platform !== 'all') {
        const plat = this.data.platforms.find((p) => p.name === platform);
        if (plat && l.source !== plat.default_utm_source && l.medium !== plat.default_utm_medium) {
          return false;
        }
      }
      if (source !== 'all' && l.source.toLowerCase() !== source.toLowerCase()) return false;
      if (medium !== 'all' && l.medium.toLowerCase() !== medium.toLowerCase()) return false;
      if (campaign !== 'all' && l.campaign !== campaign) return false;
      if (country !== 'all' && l.country !== country) return false;
      if (service !== 'all' && l.service !== service) return false;
      if (landingPage !== 'all' && l.landing_page !== landingPage) return false;
      return true;
    };

    // 1. Current period metrics
    const currentTraffic = this.data.traffic_daily.filter((t) => filterTraffic(t, startDate, endDate));
    const currentSpendEntries = this.data.spend_entries.filter((s) => filterSpend(s, startDate, endDate));
    const currentLeads = this.data.leads.filter((l) => filterLead(l, startDate, endDate));

    const totalSpend = currentSpendEntries.reduce((acc, curr) => acc + curr.amount, 0);
    const totalUsers = currentTraffic.reduce((acc, curr) => acc + curr.users, 0);
    const totalSessions = currentTraffic.reduce((acc, curr) => acc + curr.sessions, 0);

    const leadCount = currentLeads.length;
    const mqlCount = currentLeads.filter((l) => l.is_mql).length;
    const sqlCount = currentLeads.filter((l) => l.is_sql).length;
    const oppCount = currentLeads.filter((l) => l.is_opportunity).length;
    const propCount = currentLeads.filter((l) => l.is_proposal).length;
    const wonCount = currentLeads.filter((l) => l.is_won).length;
    const totalRevenue = currentLeads.reduce((acc, curr) => acc + (curr.revenue || 0), 0);

    // Calculations respecting "Never divide by zero; display '—' / null if unavailable"
    const cpl = leadCount > 0 ? totalSpend / leadCount : null;
    const costPerMql = mqlCount > 0 ? totalSpend / mqlCount : null;
    const conversionRate = totalSessions > 0 ? (leadCount / totalSessions) * 100 : null;
    const mqlRate = leadCount > 0 ? (mqlCount / leadCount) * 100 : null;
    const sqlRate = mqlCount > 0 ? (sqlCount / mqlCount) * 100 : null;
    const opportunityRate = sqlCount > 0 ? (oppCount / sqlCount) * 100 : null;

    // 2. Previous period calculation for comparison
    const startMs = new Date(startDate).getTime();
    const endMs = new Date(endDate).getTime();
    const durationMs = Math.max(86400000, endMs - startMs + 86400000);
    const prevStart = new Date(startMs - durationMs).toISOString().slice(0, 10);
    const prevEnd = new Date(startMs - 86400000).toISOString().slice(0, 10);

    const prevSpendEntries = this.data.spend_entries.filter((s) => filterSpend(s, prevStart, prevEnd));
    const previousSpend = prevSpendEntries.reduce((acc, curr) => acc + curr.amount, 0);
    const spendChangePct =
      previousSpend > 0 ? ((totalSpend - previousSpend) / previousSpend) * 100 : null;

    // 3. Channel Performance Table
    const channels: PlatformType[] = [
      'Google Ads',
      'Bing Ads',
      'Organic Search',
      'GoodFirms',
      'Clutch',
      'Meta Ads',
      'LinkedIn',
      'Direct',
      'Referral',
      'Other',
    ];

    const channelPerformance: ChannelPerformanceRow[] = channels.map((chan) => {
      const cTraffic = currentTraffic.filter((t) => t.platform_name === chan);
      const cSpend = currentSpendEntries
        .filter((s) => s.platform_name === chan)
        .reduce((acc, curr) => acc + curr.amount, 0);

      const chanPlat = this.data.platforms.find((p) => p.name === chan);
      const cLeads = currentLeads.filter((l) => {
        if (chanPlat) {
          return l.source === chanPlat.default_utm_source || l.medium === chanPlat.default_utm_medium;
        }
        return false;
      });

      const chanUsers = cTraffic.reduce((acc, curr) => acc + curr.users, 0);
      const chanSessions = cTraffic.reduce((acc, curr) => acc + curr.sessions, 0);
      const chanLeadsCount = cLeads.length;
      const chanMqlCount = cLeads.filter((l) => l.is_mql).length;
      const chanSqlCount = cLeads.filter((l) => l.is_sql).length;

      return {
        channel: chan,
        spend: cSpend,
        users: chanUsers,
        sessions: chanSessions,
        leads: chanLeadsCount,
        mql: chanMqlCount,
        sql: chanSqlCount,
        cpl: chanLeadsCount > 0 ? cSpend / chanLeadsCount : null,
        costPerMql: chanMqlCount > 0 ? cSpend / chanMqlCount : null,
      };
    });

    // 4. Time series grouping by date
    const dateMap = new Map<
      string,
      {
        users: number;
        sessions: number;
        leads: number;
        mql: number;
        sql: number;
        spend: number;
        platSpend: Record<string, number>;
      }
    >();

    // Seed all dates in the range
    let curDate = new Date(startDate);
    const targetEnd = new Date(endDate);
    while (curDate <= targetEnd) {
      const dStr = curDate.toISOString().slice(0, 10);
      dateMap.set(dStr, {
        users: 0,
        sessions: 0,
        leads: 0,
        mql: 0,
        sql: 0,
        spend: 0,
        platSpend: {},
      });
      curDate = new Date(curDate.getTime() + 86400000);
    }

    for (const t of currentTraffic) {
      const entry = dateMap.get(t.date);
      if (entry) {
        entry.users += t.users;
        entry.sessions += t.sessions;
      }
    }

    for (const s of currentSpendEntries) {
      const entry = dateMap.get(s.date);
      if (entry) {
        entry.spend += s.amount;
        entry.platSpend[s.platform_name] = (entry.platSpend[s.platform_name] || 0) + s.amount;
      }
    }

    for (const l of currentLeads) {
      const entry = dateMap.get(l.date);
      if (entry) {
        entry.leads += 1;
        if (l.is_mql) entry.mql += 1;
        if (l.is_sql) entry.sql += 1;
      }
    }

    const sortedDates = Array.from(dateMap.keys()).sort();

    const trafficTimeSeries = sortedDates.map((date) => {
      const d = dateMap.get(date)!;
      return {
        date,
        users: d.users,
        sessions: d.sessions,
        leads: d.leads,
        mql: d.mql,
      };
    });

    const spendTimeSeries = sortedDates.map((date) => {
      const d = dateMap.get(date)!;
      return {
        date,
        spend: d.spend,
        ...d.platSpend,
      };
    });

    const leadsTimeSeries = sortedDates.map((date) => {
      const d = dateMap.get(date)!;
      return {
        date,
        leads: d.leads,
        mql: d.mql,
        sql: d.sql,
      };
    });

    // 5. Marketing Funnel
    // Traffic -> Leads -> MQL -> SQL -> Opportunity -> Proposal -> Won
    const funnel = [
      { stage: 'Traffic (Sessions)', count: totalSessions, conversionRate: 100 },
      {
        stage: 'Leads',
        count: leadCount,
        conversionRate: totalSessions > 0 ? (leadCount / totalSessions) * 100 : null,
      },
      {
        stage: 'MQL',
        count: mqlCount,
        conversionRate: leadCount > 0 ? (mqlCount / leadCount) * 100 : null,
      },
      {
        stage: 'SQL',
        count: sqlCount,
        conversionRate: mqlCount > 0 ? (sqlCount / mqlCount) * 100 : null,
      },
      {
        stage: 'Opportunity',
        count: oppCount,
        conversionRate: sqlCount > 0 ? (oppCount / sqlCount) * 100 : null,
      },
      {
        stage: 'Proposal',
        count: propCount,
        conversionRate: oppCount > 0 ? (propCount / oppCount) * 100 : null,
      },
      {
        stage: 'Won',
        count: wonCount,
        conversionRate: propCount > 0 ? (wonCount / propCount) * 100 : null,
      },
    ];

    return {
      kpis: {
        currentSpend: totalSpend,
        previousSpend,
        spendChangePct,
        users: totalUsers,
        sessions: totalSessions,
        leads: leadCount,
        mql: mqlCount,
        sql: sqlCount,
        opportunity: oppCount,
        proposal: propCount,
        won: wonCount,
        revenue: totalRevenue,
        cpl,
        costPerMql,
        conversionRate,
        mqlRate,
        sqlRate,
        opportunityRate,
      },
      previousKpis: {
        currentSpend: previousSpend,
      },
      channelPerformance,
      trafficTimeSeries,
      spendTimeSeries,
      leadsTimeSeries,
      funnel,
    };
  }

  // Traffic Analytics Breakdowns
  public getTrafficAnalytics(filters: GlobalFilterState) {
    const { startDate, endDate } = filters;
    const traffic = this.data.traffic_daily.filter((t) => t.date >= startDate && t.date <= endDate);
    const leads = this.data.leads.filter((l) => l.date >= startDate && l.date <= endDate);

    // Overview numbers
    const users = traffic.reduce((a, b) => a + b.users, 0);
    const newUsers = traffic.reduce((a, b) => a + b.new_users, 0);
    const sessions = traffic.reduce((a, b) => a + b.sessions, 0);
    const engagedSessions = traffic.reduce((a, b) => a + b.engaged_sessions, 0);
    const engagementRate = sessions > 0 ? (engagedSessions / sessions) * 100 : null;
    const conversions = traffic.reduce((a, b) => a + b.conversions, 0);

    // Source / Medium table
    const smMap = new Map<string, { source: string; medium: string; users: number; sessions: number; leads: number; mql: number }>();
    for (const t of traffic) {
      const key = `${t.source} / ${t.medium}`;
      if (!smMap.has(key)) {
        smMap.set(key, { source: t.source, medium: t.medium, users: 0, sessions: 0, leads: 0, mql: 0 });
      }
      const item = smMap.get(key)!;
      item.users += t.users;
      item.sessions += t.sessions;
    }

    for (const l of leads) {
      const key = `${l.source} / ${l.medium}`;
      if (smMap.has(key)) {
        const item = smMap.get(key)!;
        item.leads += 1;
        if (l.is_mql) item.mql += 1;
      }
    }

    // Campaign table
    const campMap = new Map<string, { campaign: string; users: number; sessions: number; leads: number; mql: number }>();
    for (const t of traffic) {
      const c = t.campaign || 'Direct / None';
      if (!campMap.has(c)) {
        campMap.set(c, { campaign: c, users: 0, sessions: 0, leads: 0, mql: 0 });
      }
      const item = campMap.get(c)!;
      item.users += t.users;
      item.sessions += t.sessions;
    }

    for (const l of leads) {
      const c = l.campaign || 'Direct / None';
      if (campMap.has(c)) {
        const item = campMap.get(c)!;
        item.leads += 1;
        if (l.is_mql) item.mql += 1;
      }
    }

    // Landing Page table
    const lpMap = new Map<string, { landingPage: string; users: number; sessions: number; leads: number; mql: number; conversionRate: number | null }>();
    for (const t of traffic) {
      const lp = t.landing_page;
      if (!lpMap.has(lp)) {
        lpMap.set(lp, { landingPage: lp, users: 0, sessions: 0, leads: 0, mql: 0, conversionRate: null });
      }
      const item = lpMap.get(lp)!;
      item.users += t.users;
      item.sessions += t.sessions;
    }

    for (const l of leads) {
      const lp = l.landing_page;
      if (lpMap.has(lp)) {
        const item = lpMap.get(lp)!;
        item.leads += 1;
        if (l.is_mql) item.mql += 1;
      }
    }

    for (const item of lpMap.values()) {
      item.conversionRate = item.sessions > 0 ? (item.leads / item.sessions) * 100 : null;
    }

    return {
      overview: {
        users,
        newUsers,
        sessions,
        engagedSessions,
        engagementRate,
        conversions,
      },
      sourceMedium: Array.from(smMap.values()).sort((a, b) => b.sessions - a.sessions),
      campaigns: Array.from(campMap.values()).sort((a, b) => b.sessions - a.sessions),
      landingPages: Array.from(lpMap.values()).sort((a, b) => b.sessions - a.sessions),
    };
  }

  // Attribution comparison: First touch vs Last touch
  public getAttributionReport(filters: GlobalFilterState) {
    const { startDate, endDate } = filters;
    const leads = this.data.leads.filter((l) => l.date >= startDate && l.date <= endDate);

    const attrMap = new Map<
      string,
      {
        source: string;
        medium: string;
        campaign: string;
        firstTouchLeads: number;
        lastTouchLeads: number;
        mql: number;
        sql: number;
        revenue: number;
      }
    >();

    for (const lead of leads) {
      const attr = lead.attribution;
      if (!attr) continue;

      // First touch tracking
      const firstKey = `${attr.first_source} | ${attr.first_medium} | ${attr.first_campaign}`;
      if (!attrMap.has(firstKey)) {
        attrMap.set(firstKey, {
          source: attr.first_source,
          medium: attr.first_medium,
          campaign: attr.first_campaign,
          firstTouchLeads: 0,
          lastTouchLeads: 0,
          mql: 0,
          sql: 0,
          revenue: 0,
        });
      }
      attrMap.get(firstKey)!.firstTouchLeads += 1;

      // Last touch tracking
      const lastKey = `${attr.last_source} | ${attr.last_medium} | ${attr.last_campaign}`;
      if (!attrMap.has(lastKey)) {
        attrMap.set(lastKey, {
          source: attr.last_source,
          medium: attr.last_medium,
          campaign: attr.last_campaign,
          firstTouchLeads: 0,
          lastTouchLeads: 0,
          mql: 0,
          sql: 0,
          revenue: 0,
        });
      }
      const lastItem = attrMap.get(lastKey)!;
      lastItem.lastTouchLeads += 1;
      if (lead.is_mql) lastItem.mql += 1;
      if (lead.is_sql) lastItem.sql += 1;
      if (lead.revenue) lastItem.revenue += lead.revenue;
    }

    return Array.from(attrMap.values()).sort((a, b) => b.lastTouchLeads - a.lastTouchLeads);
  }

  // EOD Report Generator
  public generateEODReport(date: string) {
    const activities = this.data.daily_marketing_activities.filter((a) => a.date === date);
    const spendEntries = this.data.spend_entries.filter((s) => s.date === date);
    const traffic = this.data.traffic_daily.filter((t) => t.date === date);
    const leads = this.data.leads.filter((l) => l.date === date);

    const getMetrics = (platName: string, defaultSrc?: string) => {
      const platActivities = activities.filter((a) => a.platform_name === platName);
      const platSpend = spendEntries
        .filter((s) => s.platform_name === platName)
        .reduce((a, b) => a + b.amount, 0);
      const platTraffic = traffic
        .filter((t) => t.platform_name === platName)
        .reduce((a, b) => a + b.sessions, 0);
      const platLeads = leads.filter((l) => {
        const plat = this.data.platforms.find((p) => p.name === platName);
        return plat && (l.source === plat.default_utm_source || l.medium === plat.default_utm_medium);
      });

      return {
        activities: platActivities.map((a) => a.description),
        spend: platSpend > 0 ? `$${platSpend.toLocaleString()}` : 'Not available',
        traffic: platTraffic > 0 ? platTraffic.toLocaleString() : 'Not available',
        leads: platLeads.length > 0 ? platLeads.length : 0,
        mql: platLeads.filter((l) => l.is_mql).length,
      };
    };

    const googleAds = getMetrics('Google Ads');
    const goodfirms = getMetrics('GoodFirms');
    const clutch = getMetrics('Clutch');
    const seo = getMetrics('Organic Search');
    const otherActs = activities.filter(
      (a) => !['Google Ads', 'GoodFirms', 'Clutch', 'Organic Search'].includes(a.platform_name)
    );

    return {
      date,
      googleAds,
      goodfirms,
      clutch,
      seo,
      otherActivities: otherActs.map((a) => `${a.platform_name} (${a.activity_type}): ${a.description}`),
      totalLeadsToday: leads.length,
      totalSpendToday: spendEntries.reduce((a, b) => a + b.amount, 0),
    };
  }

  // Monthly Marketing Report
  public generateMonthlyReport(yearMonth: string) {
    // yearMonth: e.g. "2026-09"
    const startDate = `${yearMonth}-01`;
    const endDate = `${yearMonth}-31`;

    const filter: GlobalFilterState = {
      dateRange: 'custom',
      startDate,
      endDate,
      platform: 'all',
      source: 'all',
      medium: 'all',
      campaign: 'all',
      country: 'all',
      service: 'all',
      landingPage: 'all',
      leadStatus: 'all',
      mqlOnly: false,
      sqlOnly: false,
    };

    const dashboard = this.calculateDashboardKPIs(filter);
    const trafficBreakdown = this.getTrafficAnalytics(filter);
    const attribution = this.getAttributionReport(filter);
    const activities = this.data.daily_marketing_activities.filter(
      (a) => a.date >= startDate && a.date <= endDate
    );

    return {
      month: yearMonth,
      kpis: dashboard.kpis,
      previousKpis: dashboard.previousKpis,
      channelBreakdown: dashboard.channelPerformance,
      campaignBreakdown: trafficBreakdown.campaigns,
      landingPageBreakdown: trafficBreakdown.landingPages,
      leadAttribution: attribution,
      dailyActivitiesSummary: {
        totalCompleted: activities.filter((a) => a.status === 'Completed').length,
        totalPlanned: activities.filter((a) => a.status === 'Planned').length,
        activitiesCount: activities.length,
      },
    };
  }
}

export const db = new Database();
