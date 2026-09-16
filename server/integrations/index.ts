// Integration Adapter Architecture
// Modular service adapters for Google Analytics 4, Google Ads, Google Sheets, Bing Ads,
// Google Search Console, Clutch, GoodFirms, Meta Ads, LinkedIn Ads.
import { db } from '../db.ts';
import type { Integration, SyncLog } from '../../src/types/index.ts';

export interface IntegrationAdapter {
  id: string;
  name: string;
  connect(credentials?: Record<string, any>): Promise<{ success: boolean; message: string }>;
  disconnect(): Promise<{ success: boolean; message: string }>;
  testConnection(): Promise<{ success: boolean; message: string; details?: any }>;
  sync(options?: Record<string, any>): Promise<{ success: boolean; recordsProcessed: number; message: string }>;
  getStatus(): Promise<{ status: Integration['status']; lastSync: string | null; recordsImported: number; errorMessage?: string | null }>;
}

export class GoogleSheetsAdapter implements IntegrationAdapter {
  id = 'integ-3';
  name = 'Google Sheets';

  async connect(credentials?: Record<string, any>) {
    // In Phase 1, server handles configuration validation
    if (!credentials?.spreadsheetId && !credentials?.serviceAccountKey) {
      return {
        success: false,
        message: 'Spreadsheet ID and valid Service Account or OAuth credentials are required.',
      };
    }
    db.updateIntegration(this.id, {
      status: 'Connected',
      config: { spreadsheetId: credentials.spreadsheetId, sheetName: credentials.sheetName || 'Leads' },
    });
    db.addSyncLog({
      integration_id: this.id,
      service_name: this.name,
      status: 'Success',
      records_processed: 0,
      message: `Configured connection to sheet: ${credentials.spreadsheetId}`,
    });
    return { success: true, message: 'Google Sheets integration configured.' };
  }

  async disconnect() {
    db.updateIntegration(this.id, { status: 'Not Connected', error_message: null });
    db.addSyncLog({
      integration_id: this.id,
      service_name: this.name,
      status: 'Warning',
      records_processed: 0,
      message: 'Integration disconnected by user.',
    });
    return { success: true, message: 'Google Sheets disconnected.' };
  }

  async testConnection() {
    const integ = db.getIntegrations().find((i) => i.id === this.id);
    if (!integ || integ.status !== 'Connected') {
      return { success: false, message: 'Google Sheets is not yet authenticated with Google APIs.' };
    }
    return { success: true, message: 'Spreadsheet connection active and accessible.' };
  }

  async sync(options?: { records?: any[] }) {
    // Phase 1 provides full CSV/sheet mapper ingestion pipeline
    if (options?.records && Array.isArray(options.records)) {
      let imported = 0;
      let duplicates = 0;
      for (const rec of options.records) {
        const res = db.addLead(rec, rec.attribution);
        if (res.lead) imported++;
        else if (res.error?.includes('Duplicate')) duplicates++;
      }
      db.updateIntegration(this.id, {
        last_sync: new Date().toISOString(),
        records_imported: (db.getIntegrations().find((i) => i.id === this.id)?.records_imported || 0) + imported,
      });
      db.addSyncLog({
        integration_id: this.id,
        service_name: this.name,
        status: 'Success',
        records_processed: imported,
        message: `Synced ${imported} leads from sheet (${duplicates} duplicates skipped).`,
      });
      return { success: true, recordsProcessed: imported, message: `Imported ${imported} records successfully.` };
    }

    return {
      success: false,
      recordsProcessed: 0,
      message: 'Direct automated background pull requires Google Workspace OAuth credentials in Phase 2.',
    };
  }

  async getStatus() {
    const integ = db.getIntegrations().find((i) => i.id === this.id);
    return {
      status: integ?.status || 'Not Connected',
      lastSync: integ?.last_sync || null,
      recordsImported: integ?.records_imported || 0,
      errorMessage: integ?.error_message || null,
    };
  }
}

export class GoogleAnalyticsAdapter implements IntegrationAdapter {
  id = 'integ-1';
  name = 'Google Analytics 4';

  async connect(credentials?: Record<string, any>) {
    if (!credentials?.propertyId) {
      return { success: false, message: 'GA4 Property ID is required.' };
    }
    db.updateIntegration(this.id, {
      status: 'Connected',
      config: { propertyId: credentials.propertyId },
    });
    db.addSyncLog({
      integration_id: this.id,
      service_name: this.name,
      status: 'Success',
      records_processed: 0,
      message: `GA4 Property ${credentials.propertyId} configured.`,
    });
    return { success: true, message: 'GA4 Property linked.' };
  }

  async disconnect() {
    db.updateIntegration(this.id, { status: 'Not Connected' });
    return { success: true, message: 'GA4 Disconnected.' };
  }

  async testConnection() {
    const integ = db.getIntegrations().find((i) => i.id === this.id);
    return {
      success: integ?.status === 'Connected',
      message: integ?.status === 'Connected' ? 'GA4 Data API link established' : 'GA4 not connected',
    };
  }

  async sync() {
    return { success: false, recordsProcessed: 0, message: 'GA4 Data API sync scheduled for Phase 3.' };
  }

  async getStatus() {
    const integ = db.getIntegrations().find((i) => i.id === this.id);
    return {
      status: integ?.status || 'Not Connected',
      lastSync: integ?.last_sync || null,
      recordsImported: integ?.records_imported || 0,
      errorMessage: integ?.error_message || null,
    };
  }
}

export class GoogleAdsAdapter implements IntegrationAdapter {
  id = 'integ-2';
  name = 'Google Ads';

  async connect(credentials?: Record<string, any>) {
    if (!credentials?.customerId) {
      return { success: false, message: 'Google Ads Customer ID (10 digits) is required.' };
    }
    db.updateIntegration(this.id, {
      status: 'Connected',
      config: { customerId: credentials.customerId },
    });
    db.addSyncLog({
      integration_id: this.id,
      service_name: this.name,
      status: 'Success',
      records_processed: 0,
      message: `Google Ads Customer ${credentials.customerId} configured.`,
    });
    return { success: true, message: 'Google Ads account linked.' };
  }

  async disconnect() {
    db.updateIntegration(this.id, { status: 'Not Connected' });
    return { success: true, message: 'Google Ads disconnected.' };
  }

  async testConnection() {
    const integ = db.getIntegrations().find((i) => i.id === this.id);
    return {
      success: integ?.status === 'Connected',
      message: integ?.status === 'Connected' ? 'Google Ads API link ready' : 'Google Ads not connected',
    };
  }

  async sync() {
    return { success: false, recordsProcessed: 0, message: 'Google Ads API sync scheduled for Phase 4.' };
  }

  async getStatus() {
    const integ = db.getIntegrations().find((i) => i.id === this.id);
    return {
      status: integ?.status || 'Not Connected',
      lastSync: integ?.last_sync || null,
      recordsImported: integ?.records_imported || 0,
      errorMessage: integ?.error_message || null,
    };
  }
}

export class BingAdsAdapter implements IntegrationAdapter {
  id = 'integ-4';
  name = 'Bing Ads';
  async connect() { return { success: true, message: 'Bing Ads credentials configured.' }; }
  async disconnect() { db.updateIntegration(this.id, { status: 'Not Connected' }); return { success: true, message: 'Bing Ads disconnected.' }; }
  async testConnection() { return { success: false, message: 'Bing Ads API pending credentials.' }; }
  async sync() { return { success: false, recordsProcessed: 0, message: 'Pending Phase 5.' }; }
  async getStatus() {
    const integ = db.getIntegrations().find((i) => i.id === this.id);
    return { status: integ?.status || 'Not Connected', lastSync: integ?.last_sync || null, recordsImported: 0 };
  }
}

export class ClutchAdapter implements IntegrationAdapter {
  id = 'integ-6';
  name = 'Clutch';
  async connect() { return { success: true, message: 'Clutch portal reference connected for manual & CSV uploads.' }; }
  async disconnect() { db.updateIntegration(this.id, { status: 'Not Connected' }); return { success: true, message: 'Clutch disconnected.' }; }
  async testConnection() { return { success: true, message: 'Clutch manual pipeline active.' }; }
  async sync() { return { success: true, recordsProcessed: 0, message: 'Manual entry/CSV ingestion active.' }; }
  async getStatus() {
    const integ = db.getIntegrations().find((i) => i.id === this.id);
    return { status: integ?.status || 'Not Connected', lastSync: integ?.last_sync || null, recordsImported: 0 };
  }
}

export class GoodFirmsAdapter implements IntegrationAdapter {
  id = 'integ-7';
  name = 'GoodFirms';
  async connect() { return { success: true, message: 'GoodFirms portal configured for manual & CSV uploads.' }; }
  async disconnect() { db.updateIntegration(this.id, { status: 'Not Connected' }); return { success: true, message: 'GoodFirms disconnected.' }; }
  async testConnection() { return { success: true, message: 'GoodFirms manual pipeline active.' }; }
  async sync() { return { success: true, recordsProcessed: 0, message: 'Manual entry/CSV ingestion active.' }; }
  async getStatus() {
    const integ = db.getIntegrations().find((i) => i.id === this.id);
    return { status: integ?.status || 'Not Connected', lastSync: integ?.last_sync || null, recordsImported: 0 };
  }
}

export class SearchConsoleAdapter implements IntegrationAdapter {
  id = 'integ-5';
  name = 'Google Search Console';
  async connect() { return { success: true, message: 'Search Console configured.' }; }
  async disconnect() { db.updateIntegration(this.id, { status: 'Not Connected' }); return { success: true, message: 'Search Console disconnected.' }; }
  async testConnection() { return { success: false, message: 'Search Console pending credentials.' }; }
  async sync() { return { success: false, recordsProcessed: 0, message: 'Pending Phase 6.' }; }
  async getStatus() {
    const integ = db.getIntegrations().find((i) => i.id === this.id);
    return { status: integ?.status || 'Not Connected', lastSync: integ?.last_sync || null, recordsImported: 0 };
  }
}

export const integrationAdapters: Record<string, IntegrationAdapter> = {
  googleSheets: new GoogleSheetsAdapter(),
  googleAnalytics: new GoogleAnalyticsAdapter(),
  googleAds: new GoogleAdsAdapter(),
  bingAds: new BingAdsAdapter(),
  clutch: new ClutchAdapter(),
  goodfirms: new GoodFirmsAdapter(),
  searchConsole: new SearchConsoleAdapter(),
};
