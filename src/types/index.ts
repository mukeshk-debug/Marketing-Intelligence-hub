// Shared TypeScript interfaces and types for Marketing Intelligence Hub

export type CurrencyCode = 'USD' | 'INR' | 'AED' | 'GBP' | 'SAR' | 'EUR';

export type LeadStatus =
  | 'New'
  | 'Contacted'
  | 'Qualified'
  | 'MQL'
  | 'SQL'
  | 'Opportunity'
  | 'Proposal'
  | 'Won'
  | 'Lost'
  | 'Invalid'
  | 'Duplicate';

export type PlatformType =
  | 'Google Ads'
  | 'Bing Ads'
  | 'Organic Search'
  | 'GoodFirms'
  | 'Clutch'
  | 'Meta Ads'
  | 'LinkedIn'
  | 'Direct'
  | 'Referral'
  | 'Other';

export type CostType =
  | 'Ad Spend'
  | 'PPL'
  | 'Sponsorship'
  | 'Subscription'
  | 'Listing'
  | 'Other';

export type SpendSource = 'Manual' | 'API' | 'Import' | 'Demo';

export type DataOrigin = 'Demo' | 'Imported' | 'API' | 'Manual';

export type UserRole = 'Admin' | 'Marketing Manager' | 'Marketing Executive' | 'Viewer';

export type ActivityType =
  | 'Campaign Optimization'
  | 'Keyword Optimization'
  | 'Negative Keywords'
  | 'Ad Copy Update'
  | 'Landing Page Update'
  | 'SEO'
  | 'Technical SEO'
  | 'Content'
  | 'UTM Update'
  | 'Analytics'
  | 'Lead Follow-up'
  | 'Platform Meeting'
  | 'Other';

export type CampaignStatus = 'Active' | 'Paused' | 'Completed' | 'Archived';

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface Organization extends BaseEntity {
  name: string;
  default_currency: CurrencyCode;
  timezone: string;
}

export interface Profile extends BaseEntity {
  organization_id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
}

export interface Platform extends BaseEntity {
  name: PlatformType;
  type: 'Paid' | 'Organic' | 'Directory' | 'Direct' | 'Referral';
  status: 'Active' | 'Paused' | 'Configuring';
  default_utm_source: string;
  default_utm_medium: string;
  last_sync: string | null;
  notes?: string;
}

export interface Campaign extends BaseEntity {
  name: string;
  platform_id: string;
  platform_name: PlatformType;
  source: string;
  medium: string;
  service: string;
  country: string;
  start_date: string;
  end_date: string | null;
  budget: number;
  currency: CurrencyCode;
  status: CampaignStatus;
  notes?: string;
}

export interface SpendEntry extends BaseEntity {
  organization_id?: string;
  date: string;
  platform_id: string;
  platform_name: PlatformType;
  campaign_id: string | null;
  campaign_name?: string;
  cost_type: CostType;
  amount: number;
  currency: CurrencyCode;
  source: SpendSource;
  origin?: DataOrigin;
  is_adjustment: boolean;
  reference_entry_id?: string | null;
  notes?: string;
}

export interface LeadAttribution extends BaseEntity {
  lead_id: string;
  // First Touch
  first_source: string;
  first_medium: string;
  first_campaign: string;
  first_landing_page: string;
  first_touch_at: string;
  // Last Touch
  last_source: string;
  last_medium: string;
  last_campaign: string;
  last_landing_page: string;
  last_touch_at: string;
  // UTM details
  utm_term?: string;
  utm_content?: string;
}

export interface Lead extends BaseEntity {
  organization_id?: string;
  date: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  country: string;
  service: string;
  source: string;
  medium: string;
  campaign: string;
  landing_page: string;
  status: LeadStatus;
  is_mql: boolean;
  is_sql: boolean;
  is_opportunity: boolean;
  is_proposal: boolean;
  is_won: boolean;
  revenue: number;
  currency: CurrencyCode;
  origin?: DataOrigin;
  assigned_to?: string;
  notes?: string;
  external_id?: string;
  attribution?: LeadAttribution;
}

export interface TrafficDaily extends BaseEntity {
  organization_id?: string;
  origin?: DataOrigin;
  date: string;
  source: string;
  medium: string;
  campaign: string;
  platform_id?: string;
  platform_name: PlatformType;
  landing_page: string;
  country?: string;
  device?: string;
  users: number;
  new_users: number;
  sessions: number;
  engaged_sessions: number;
  engagement_rate: number; // percentage 0-100
  conversions: number;
}

export interface AdMetricsDaily extends BaseEntity {
  date: string;
  platform_id: string;
  platform_name: PlatformType;
  campaign_id: string;
  campaign_name: string;
  ad_group?: string;
  impressions: number;
  clicks: number;
  spend: number;
  currency: CurrencyCode;
  conversions: number;
  conversion_value: number;
}

export interface LandingPage extends BaseEntity {
  url: string;
  page_name: string;
  service: string;
  source_default?: string;
  campaign_default?: string;
  notes?: string;
}

export interface DailyMarketingActivity extends BaseEntity {
  date: string;
  platform_id: string;
  platform_name: PlatformType;
  campaign_id?: string | null;
  campaign_name?: string;
  activity_type: ActivityType;
  description: string;
  spend: number;
  leads_attributed: number;
  mql_attributed: number;
  status: 'Completed' | 'In Progress' | 'Planned';
  owner: string;
  remarks?: string;
}

export interface Integration extends BaseEntity {
  service_key:
    | 'google_analytics_4'
    | 'google_ads'
    | 'google_sheets'
    | 'bing_ads'
    | 'google_search_console'
    | 'clutch'
    | 'goodfirms'
    | 'meta_ads'
    | 'linkedin_ads';
  name: string;
  category: 'Analytics' | 'Advertising' | 'Directory' | 'Data';
  status: 'Connected' | 'Not Connected' | 'Syncing' | 'Error';
  last_sync: string | null;
  next_sync?: string | null;
  sync_frequency?: string;
  records_imported: number;
  last_new_records?: number;
  last_updated_records?: number;
  last_duplicates_count?: number;
  last_errors_count?: number;
  error_message?: string | null;
  config?: Record<string, any>;
}

export interface SyncLog extends BaseEntity {
  integration_id: string;
  service_name: string;
  timestamp: string;
  status: 'Success' | 'Warning' | 'Error';
  records_processed: number;
  new_records?: number;
  updated_records?: number;
  duplicates_count?: number;
  errors_count?: number;
  duration_ms?: number;
  message: string;
  details?: string;
}

export interface Currency extends BaseEntity {
  code: CurrencyCode;
  symbol: string;
  name: string;
}

export interface ExchangeRate extends BaseEntity {
  from_currency: CurrencyCode;
  to_currency: CurrencyCode;
  rate: number; // multiply from_currency amount by rate to get to_currency amount
  updated_date: string;
}

// Global Filter State
export interface GlobalFilterState {
  dateRange: 'today' | 'yesterday' | 'last7' | 'last30' | 'thisMonth' | 'prevMonth' | 'custom';
  startDate: string;
  endDate: string;
  platform: string; // 'all' or PlatformType
  source: string; // 'all' or specific
  medium: string; // 'all' or specific
  campaign: string; // 'all' or specific
  country: string; // 'all' or specific
  service: string; // 'all' or specific
  landingPage: string; // 'all' or specific
  leadStatus: string; // 'all' or LeadStatus
  mqlOnly: boolean;
  sqlOnly: boolean;
}

// KPI Results
export interface DashboardKPIs {
  currentSpend: number;
  previousSpend: number;
  spendChangePct: number | null;
  users: number;
  sessions: number;
  leads: number;
  mql: number;
  sql: number;
  opportunity: number;
  proposal: number;
  won: number;
  revenue: number;
  cpl: number | null;
  costPerMql: number | null;
  conversionRate: number | null; // leads / sessions * 100
  mqlRate: number | null; // mql / leads * 100
  sqlRate: number | null; // sql / mql * 100
  opportunityRate: number | null; // opp / sql * 100
}

export interface ChannelPerformanceRow {
  channel: PlatformType;
  spend: number;
  users: number;
  sessions: number;
  leads: number;
  mql: number;
  sql: number;
  cpl: number | null;
  costPerMql: number | null;
}

export interface DailyActivity {
  id: string;
  date: string;
  platform: PlatformType;
  activity_type: string;
  description: string;
  campaign?: string;
  performed_by: string;
  impact_notes?: string;
}

export interface IntegrationState {
  id: string;
  platform: string;
  status: 'connected' | 'disconnected' | 'error';
  last_sync: string | null;
  next_sync: string | null;
  sync_frequency: string;
  error_message?: string | null;
}

export interface LandingPageMetric {
  id: string;
  url: string;
  page_name: string;
  service: string;
  sessions: number;
  users: number;
  leads: number;
  mql: number;
  conversion_rate: number | null;
  sources?: Record<string, number>;
}

export interface PlatformSummary {
  name: PlatformType;
  type: string;
  connected: boolean;
  metrics: {
    spend: number;
    sessions: number;
    leads: number;
  };
}

export interface EODReportData {
  date: string;
  summary: {
    totalSpend: number;
    totalSessions: number;
    totalUsers: number;
    totalLeads: number;
    totalMql: number;
    totalSql: number;
    cpl: number | null;
  };
  platforms: {
    platform: PlatformType;
    spend: number;
    sessions: number;
    leads: number;
    mql: number;
    sql: number;
    cpl: number | null;
    activities: string[];
  }[];
}

export interface MonthlyReportData {
  month: string;
  executiveSummary: {
    totalSpend: number;
    sessions: number;
    leads: number;
    mql: number;
    sql: number;
    cpl: number | null;
    costPerMql: number | null;
  };
  channelBreakdown: {
    channel: PlatformType;
    spend: number;
    sessions: number;
    leads: number;
    mql: number;
    sql: number;
    cpl: number | null;
    costPerMql: number | null;
  }[];
}

export interface SpendRecord {
  id: string;
  date: string;
  platform: PlatformType;
  campaign?: string;
  amount: number;
  currency: CurrencyCode;
  cost_type: CostType | string;
  notes?: string;
  is_manual_adjustment?: boolean;
  original_record_id?: string;
}

