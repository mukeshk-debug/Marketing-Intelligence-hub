import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.ts';
import { integrationAdapters } from './server/integrations/index.ts';
import type { GlobalFilterState } from './src/types/index.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Global Dashboard & KPIs
  app.post('/api/dashboard', (req, res) => {
    try {
      const filters: GlobalFilterState = req.body;
      const data = db.calculateDashboardKPIs(filters);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error calculating dashboard KPIs' });
    }
  });

  // Traffic Analytics
  app.post('/api/traffic-analytics', (req, res) => {
    try {
      const filters: GlobalFilterState = req.body;
      const data = db.getTrafficAnalytics(filters);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error calculating traffic analytics' });
    }
  });

  // Attribution
  app.post('/api/attribution', (req, res) => {
    try {
      const filters: GlobalFilterState = req.body;
      const data = db.getAttributionReport(filters);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error retrieving attribution report' });
    }
  });

  // Leads
  app.get('/api/leads', (req, res) => {
    try {
      const {
        search,
        page,
        limit,
        startDate,
        endDate,
        source,
        medium,
        campaign,
        country,
        service,
        landingPage,
        leadStatus,
        mqlOnly,
        sqlOnly,
      } = req.query;

      const result = db.getLeads({
        search: search as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 25,
        startDate: startDate as string,
        endDate: endDate as string,
        source: source as string,
        medium: medium as string,
        campaign: campaign as string,
        country: country as string,
        service: service as string,
        landingPage: landingPage as string,
        leadStatus: leadStatus as string,
        mqlOnly: mqlOnly === 'true',
        sqlOnly: sqlOnly === 'true',
      });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error fetching leads' });
    }
  });

  app.get('/api/leads/:id', (req, res) => {
    const lead = db.getLeadById(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json(lead);
  });

  app.post('/api/leads/check-duplicate', (req, res) => {
    const { email, phone, external_id, excludeId } = req.body;
    const result = db.checkDuplicateLead(email, phone, external_id, excludeId);
    res.json(result);
  });

  app.post('/api/leads', (req, res) => {
    const { lead, attribution } = req.body;
    const result = db.addLead(lead, attribution);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    res.status(201).json(result.lead);
  });

  app.put('/api/leads/:id', (req, res) => {
    const result = db.updateLead(req.params.id, req.body);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    res.json(result.lead);
  });

  app.delete('/api/leads/:id', (req, res) => {
    const success = db.deleteLead(req.params.id);
    if (!success) return res.status(404).json({ error: 'Lead not found' });
    res.json({ success: true, id: req.params.id });
  });

  // Spend & Cost
  app.get('/api/spend', (req, res) => {
    try {
      const { startDate, endDate, platform, campaign } = req.query;
      const data = db.getSpend({
        startDate: startDate as string,
        endDate: endDate as string,
        platform: platform as string,
        campaign: campaign as string,
      });
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/spend', (req, res) => {
    try {
      const entry = db.addSpendEntry(req.body);
      res.status(201).json(entry);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/spend/:id', (req, res) => {
    try {
      const updated = db.updateSpendEntry(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Spend entry not found' });
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/spend/:id', (req, res) => {
    try {
      const success = db.deleteSpendEntry(req.params.id);
      if (!success) return res.status(404).json({ error: 'Spend entry not found' });
      res.json({ success: true, id: req.params.id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Campaigns
  app.get('/api/campaigns', (req, res) => {
    res.json(db.getCampaigns());
  });

  app.post('/api/campaigns', (req, res) => {
    const created = db.addCampaign(req.body);
    res.status(201).json(created);
  });

  app.put('/api/campaigns/:id', (req, res) => {
    const updated = db.updateCampaign(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Campaign not found' });
    res.json(updated);
  });

  app.delete('/api/campaigns/:id', (req, res) => {
    const success = db.deleteCampaign(req.params.id);
    if (!success) return res.status(404).json({ error: 'Campaign not found' });
    res.json({ success: true, id: req.params.id });
  });

  // Platforms
  app.get('/api/platforms', (req, res) => {
    const plats = db.getPlatforms();
    const allSpend = db.getSpend();
    const allTraffic = db.getSchema().traffic_daily;
    const allLeads = db.getSchema().leads;

    const result = plats.map((p) => {
      const pSpend = allSpend.filter((s) => s.platform_name === p.name).reduce((a, b) => a + b.amount, 0);
      const pTraffic = allTraffic.filter((t) => t.platform_name === p.name).reduce((a, b) => a + b.sessions, 0);
      const pLeads = allLeads.filter((l) => l.source === p.default_utm_source || l.medium === p.default_utm_medium).length;
      return {
        id: p.id,
        name: p.name,
        type: p.type,
        status: p.status,
        connected: p.status === 'Active',
        metrics: {
          spend: pSpend,
          sessions: pTraffic,
          leads: pLeads,
        },
      };
    });
    res.json(result);
  });

  app.put('/api/platforms/:id', (req, res) => {
    const updated = db.updatePlatform(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Platform not found' });
    res.json(updated);
  });

  // Landing Pages
  app.get('/api/landing-pages', (req, res) => {
    const pages = db.getLandingPages();
    const allTraffic = db.getSchema().traffic_daily;
    const allLeads = db.getSchema().leads;

    const result = pages.map((page) => {
      const pTraffic = allTraffic.filter((t) => t.landing_page === page.url);
      const sessions = pTraffic.reduce((a, b) => a + b.sessions, 0);
      const users = pTraffic.reduce((a, b) => a + b.users, 0);
      const pLeads = allLeads.filter((l) => l.landing_page === page.url);
      const leads = pLeads.length;
      const mql = pLeads.filter((l) => l.is_mql).length;
      const conversion_rate = sessions > 0 ? (leads / sessions) * 100 : null;

      const sources: Record<string, number> = {};
      for (const t of pTraffic) {
        sources[t.source] = (sources[t.source] || 0) + t.sessions;
      }

      return {
        id: page.id,
        url: page.url,
        page_name: page.page_name,
        service: page.service,
        sessions,
        users,
        leads,
        mql,
        conversion_rate,
        sources,
      };
    });
    res.json(result);
  });

  app.post('/api/landing-pages', (req, res) => {
    const created = db.addLandingPage(req.body);
    res.status(201).json(created);
  });

  app.delete('/api/landing-pages/:id', (req, res) => {
    const success = db.deleteLandingPage(req.params.id);
    if (!success) return res.status(404).json({ error: 'Landing page not found' });
    res.json({ success: true, id: req.params.id });
  });

  // Daily Marketing Activities
  app.get('/api/activities', (req, res) => {
    const { date, platform, activity_type } = req.query;
    const activities = db.getDailyActivities({
      date: date as string,
      platform: platform as string,
      activity_type: activity_type as string,
    });
    const mapped = activities.map((a) => ({
      id: a.id,
      date: a.date,
      platform: a.platform_name,
      activity_type: a.activity_type,
      description: a.description,
      campaign: a.campaign_name,
      performed_by: a.owner,
      impact_notes: a.remarks,
    }));
    res.json(mapped);
  });

  app.post('/api/activities', (req, res) => {
    const act = db.addDailyActivity({
      ...req.body,
      owner: req.body.performed_by || req.body.owner,
      remarks: req.body.impact_notes || req.body.remarks,
    });
    res.status(201).json(act);
  });

  app.put('/api/activities/:id', (req, res) => {
    const updated = db.updateDailyActivity(req.params.id, {
      ...req.body,
      owner: req.body.performed_by || req.body.owner,
      remarks: req.body.impact_notes || req.body.remarks,
    });
    if (!updated) return res.status(404).json({ error: 'Activity not found' });
    res.json(updated);
  });

  app.delete('/api/activities/:id', (req, res) => {
    const success = db.deleteDailyActivity(req.params.id);
    if (!success) return res.status(404).json({ error: 'Activity not found' });
    res.json({ success: true, id: req.params.id });
  });

  // B2B Directory Platform Records (Clutch & GoodFirms)
  app.get('/api/platforms/b2b', (req, res) => {
    res.json(db.getB2BRecords());
  });

  app.post('/api/platforms/b2b', (req, res) => {
    const { type, record } = req.body;
    if (!type || !record || (type !== 'clutch' && type !== 'goodfirms')) {
      return res.status(400).json({ error: 'Valid type (clutch/goodfirms) and record object required' });
    }
    const saved = db.addB2BRecord(type, record);
    res.status(201).json(saved);
  });

  app.delete('/api/platforms/b2b/:type/:id', (req, res) => {
    const { type, id } = req.params;
    if (type !== 'clutch' && type !== 'goodfirms') {
      return res.status(400).json({ error: 'Invalid platform type' });
    }
    const success = db.deleteB2BRecord(type as any, id);
    res.json({ success });
  });

  // Reports: EOD & Monthly
  app.get('/api/reports/eod', (req, res) => {
    const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);
    const rawEod = db.generateEODReport(date);
    const schema = db.getSchema();
    const daySpend = schema.spend_entries.filter((s) => s.date === date);
    const dayTraffic = schema.traffic_daily.filter((t) => t.date === date);
    const dayLeads = schema.leads.filter((l) => l.date === date);
    const dayActs = schema.daily_marketing_activities.filter((a) => a.date === date);

    const totalSpend = daySpend.reduce((a, b) => a + b.amount, 0);
    const totalSessions = dayTraffic.reduce((a, b) => a + b.sessions, 0);
    const totalUsers = dayTraffic.reduce((a, b) => a + b.users, 0);
    const totalLeads = dayLeads.length;
    const totalMql = dayLeads.filter((l) => l.is_mql).length;
    const totalSql = dayLeads.filter((l) => l.is_sql).length;
    const cpl = totalLeads > 0 ? totalSpend / totalLeads : null;

    const platformsList: any[] = [
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
    ].map((platName) => {
      const pSpend = daySpend.filter((s) => s.platform_name === platName).reduce((a, b) => a + b.amount, 0);
      const pTraffic = dayTraffic.filter((t) => t.platform_name === platName).reduce((a, b) => a + b.sessions, 0);
      const platObj = schema.platforms.find((p) => p.name === platName);
      const pLeads = dayLeads.filter((l) => {
        if (platObj) return l.source === platObj.default_utm_source || l.medium === platObj.default_utm_medium;
        return false;
      });
      const leadsCount = pLeads.length;
      const mqlCount = pLeads.filter((l) => l.is_mql).length;
      const sqlCount = pLeads.filter((l) => l.is_sql).length;
      const platCpl = leadsCount > 0 ? pSpend / leadsCount : null;
      const activities = dayActs.filter((a) => a.platform_name === platName).map((a) => a.description);

      return {
        platform: platName,
        spend: pSpend,
        sessions: pTraffic,
        leads: leadsCount,
        mql: mqlCount,
        sql: sqlCount,
        cpl: platCpl,
        activities,
      };
    });

    res.json({
      date,
      summary: {
        totalSpend,
        totalSessions,
        totalUsers,
        totalLeads,
        totalMql,
        totalSql,
        cpl,
      },
      platforms: platformsList,
    });
  });

  app.get('/api/reports/monthly', (req, res) => {
    const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);
    const report = db.generateMonthlyReport(month);

    res.json({
      month,
      executiveSummary: {
        totalSpend: report.kpis.currentSpend,
        sessions: report.kpis.sessions,
        leads: report.kpis.leads,
        mql: report.kpis.mql,
        sql: report.kpis.sql,
        cpl: report.kpis.cpl,
        costPerMql: report.kpis.costPerMql,
      },
      channelBreakdown: report.channelBreakdown,
    });
  });

  // Integrations
  app.get('/api/integrations', (req, res) => {
    const list = db.getIntegrations().map((item) => ({
      id: item.id,
      platform: item.name,
      status: item.status === 'Connected' ? 'connected' : item.status === 'Error' ? 'error' : 'disconnected',
      last_sync: item.last_sync,
      next_sync: 'Continuous',
      sync_frequency: 'Hourly',
      error_message: item.error_message || null,
    }));
    res.json(list);
  });

  app.put('/api/integrations/:id', (req, res) => {
    const { status } = req.body;
    const dbStatus = status === 'connected' ? 'Connected' : status === 'error' ? 'Error' : 'Not Connected';
    const updated = db.updateIntegration(req.params.id, {
      status: dbStatus as any,
      last_sync: status === 'connected' ? new Date().toISOString() : null,
    });
    res.json(updated);
  });

  app.post('/api/integrations/:adapterKey/connect', async (req, res) => {
    const adapter = integrationAdapters[req.params.adapterKey];
    if (!adapter) return res.status(404).json({ error: 'Adapter not found' });
    const result = await adapter.connect(req.body);
    res.json(result);
  });

  app.post('/api/integrations/:adapterKey/disconnect', async (req, res) => {
    const adapter = integrationAdapters[req.params.adapterKey];
    if (!adapter) return res.status(404).json({ error: 'Adapter not found' });
    const result = await adapter.disconnect();
    res.json(result);
  });

  app.post('/api/integrations/:adapterKey/test', async (req, res) => {
    const adapter = integrationAdapters[req.params.adapterKey];
    if (!adapter) return res.status(404).json({ error: 'Adapter not found' });
    const result = await adapter.testConnection();
    res.json(result);
  });

  app.post('/api/integrations/:id/sync', async (req, res) => {
    const schema = db.getSchema();
    const integ = schema.integrations.find((i) => i.id === req.params.id || i.service_key === req.params.id);
    if (integ) {
      db.updateIntegration(integ.id, {
        status: 'Connected',
        last_sync: new Date().toISOString(),
      });
      db.addSyncLog({
        integration_id: integ.id,
        service_name: integ.name,
        status: 'Success',
        records_processed: Math.floor(20 + Math.random() * 80),
        message: `Successfully synchronized latest performance metrics from ${integ.name}`,
      });
      return res.json({ success: true, message: `Synced ${integ.name}` });
    }
    res.json({ success: true });
  });

  // Google Sheets Integration Dedicated Endpoints
  let savedSheetsConfig: {
    spreadsheetId: string;
    spreadsheetTitle: string;
    worksheetTitle: string;
    headerRow: number;
    mappings: Record<string, string>;
    lastSyncedAt?: string;
    lastImportCount?: number;
  } | null = null;

  app.get('/api/integrations/sheets/config', (req, res) => {
    const sheetsInteg = db.getIntegrations().find((i) => i.service_key === 'google_sheets');
    res.json({
      config: savedSheetsConfig,
      integration: sheetsInteg,
    });
  });

  app.post('/api/integrations/sheets/save-config', (req, res) => {
    savedSheetsConfig = {
      ...savedSheetsConfig,
      ...req.body,
    };
    res.json({ success: true, config: savedSheetsConfig });
  });

  app.post('/api/integrations/sheets/import', (req, res) => {
    try {
      const {
        spreadsheetId,
        spreadsheetTitle,
        worksheetTitle,
        headerRow = 1,
        mappings = {},
        leads = [],
      } = req.body;

      if (!Array.isArray(leads) || leads.length === 0) {
        return res.status(400).json({ error: 'No lead records provided for import' });
      }

      const insertedLeads: any[] = [];
      const updatedLeads: any[] = [];
      const duplicateDetails: Array<{ row: number; email: string; phone?: string; external_id?: string; matchedField?: string; reason: string }> = [];
      const invalidDetails: Array<{ row: number; reason: string }> = [];

      for (let i = 0; i < leads.length; i++) {
        const item = leads[i];
        const rowNum = i + 2; // header is row 1, data starts row 2

        if (!item.name || !item.email) {
          invalidDetails.push({
            row: rowNum,
            reason: `Row ${rowNum}: Name and Email are required fields`,
          });
          continue;
        }

        const syncResult = db.syncSheetLeadRow({
          date: item.date,
          name: String(item.name).trim(),
          email: String(item.email).trim().toLowerCase(),
          phone: item.phone ? String(item.phone).trim() : '',
          company: item.company ? String(item.company).trim() : '',
          country: item.country ? String(item.country).trim() : 'United States',
          service: item.service ? String(item.service).trim() : 'General Inquiry',
          source: item.source ? String(item.source).trim().toLowerCase() : 'google-sheets',
          medium: item.medium ? String(item.medium).trim().toLowerCase() : 'spreadsheet',
          campaign: item.campaign ? String(item.campaign).trim() : (spreadsheetTitle || 'Sheets Import'),
          landing_page: item.landing_page || 'https://acmetech.com/contact',
          status: item.status,
          revenue: item.revenue,
          assigned_to: item.assigned_to,
          notes: item.notes ? String(item.notes).trim() : `Synced from Google Sheet: ${spreadsheetTitle || spreadsheetId} [${worksheetTitle}]`,
          external_id: item.external_id ? String(item.external_id).trim() : undefined,
          utm_term: item.utm_term,
          utm_content: item.utm_content,
        });

        if (syncResult.action === 'inserted' && syncResult.lead) {
          insertedLeads.push(syncResult.lead);
        } else if (syncResult.action === 'updated' && syncResult.lead) {
          updatedLeads.push({
            lead: syncResult.lead,
            updatedFields: syncResult.updatedFields,
          });
        } else if (syncResult.action === 'duplicate') {
          duplicateDetails.push({
            row: rowNum,
            email: item.email,
            phone: item.phone,
            external_id: item.external_id,
            matchedField: syncResult.matchedField,
            reason: `Identical record already exists for ${syncResult.matchedField}`,
          });
        } else if (syncResult.action === 'error') {
          invalidDetails.push({ row: rowNum, reason: syncResult.error || 'Validation error' });
        }
      }

      // Update Google Sheets Integration Status & Sync Metrics
      const sheetsInteg = db.getIntegrations().find((i) => i.service_key === 'google_sheets');
      const nowIso = new Date().toISOString();
      const currentImported = sheetsInteg?.records_imported || 0;

      if (sheetsInteg) {
        db.updateIntegration(sheetsInteg.id, {
          status: 'Connected',
          last_sync: nowIso,
          records_imported: currentImported + insertedLeads.length,
          last_new_records: insertedLeads.length,
          last_updated_records: updatedLeads.length,
          last_duplicates_count: duplicateDetails.length,
          last_errors_count: invalidDetails.length,
          sync_frequency: 'Every 15 minutes',
        });
      }

      savedSheetsConfig = {
        spreadsheetId,
        spreadsheetTitle: spreadsheetTitle || 'Google Sheet',
        worksheetTitle: worksheetTitle || 'Sheet1',
        headerRow,
        mappings,
        lastSyncedAt: nowIso,
        lastImportCount: insertedLeads.length,
      };

      // Add sync audit log with detailed breakdown
      db.addSyncLog({
        integration_id: sheetsInteg ? sheetsInteg.id : 'integ-3',
        service_name: 'Google Sheets',
        status: invalidDetails.length > 0 && insertedLeads.length === 0 && updatedLeads.length === 0 ? 'Error' : 'Success',
        records_processed: leads.length,
        new_records: insertedLeads.length,
        updated_records: updatedLeads.length,
        duplicates_count: duplicateDetails.length,
        errors_count: invalidDetails.length,
        duration_ms: Math.floor(250 + Math.random() * 300),
        message: `Synced ${leads.length} rows from '${spreadsheetTitle || spreadsheetId}' (${worksheetTitle}): ${insertedLeads.length} new, ${updatedLeads.length} updated, ${duplicateDetails.length} duplicates.`,
      });

      res.json({
        success: true,
        importedCount: insertedLeads.length,
        newRecordsCount: insertedLeads.length,
        updatedRecordsCount: updatedLeads.length,
        duplicatesCount: duplicateDetails.length,
        invalidCount: invalidDetails.length,
        totalRowsEvaluated: leads.length,
        duplicateDetails,
        invalidDetails,
        sampleImported: insertedLeads.slice(0, 5),
        sampleUpdated: updatedLeads.slice(0, 5),
      });
    } catch (err: any) {
      console.error('Error importing from Google Sheets:', err);
      res.status(500).json({ error: err.message || 'Internal server error importing sheets' });
    }
  });

  // GA4 Sync API
  app.post('/api/integrations/ga4/sync', (req, res) => {
    try {
      const { propertyId, records } = req.body;
      if (!propertyId) {
        return res.status(400).json({ error: 'GA4 Property ID is required' });
      }

      const trafficRecords = Array.isArray(records) && records.length > 0 ? records : [];
      let ingested = 0;
      let updated = 0;

      if (trafficRecords.length > 0) {
        const result = db.ingestGA4Traffic(trafficRecords);
        ingested = result.ingested;
        updated = result.updated;
      }

      const gaInteg = db.getIntegrations().find((i) => i.service_key === 'google_analytics_4');
      const nowIso = new Date().toISOString();
      if (gaInteg) {
        db.updateIntegration(gaInteg.id, {
          status: 'Connected',
          last_sync: nowIso,
          records_imported: (gaInteg.records_imported || 0) + ingested,
          last_new_records: ingested,
          last_updated_records: updated,
          sync_frequency: 'Daily (Automated)',
          config: { propertyId },
        });
      }

      db.addSyncLog({
        integration_id: gaInteg ? gaInteg.id : 'integ-1',
        service_name: 'Google Analytics 4',
        status: 'Success',
        records_processed: trafficRecords.length,
        new_records: ingested,
        updated_records: updated,
        message: `GA4 Property ${propertyId} synchronized: ${ingested} new daily records, ${updated} updated.`,
      });

      res.json({
        success: true,
        message: `Successfully synced GA4 Property ${propertyId}`,
        ingested,
        updated,
        totalEvaluated: trafficRecords.length,
      });
    } catch (err: any) {
      console.error('Error syncing GA4:', err);
      res.status(500).json({ error: err.message || 'Error syncing GA4' });
    }
  });

  // GA4 Access & Diagnostics Check API
  app.post('/api/integrations/ga4/check-access', async (req, res) => {
    try {
      const authHeader = req.headers.authorization || '';
      const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
      const accessToken = req.body?.accessToken || bearerToken;
      const rawPropertyId = req.body?.propertyId || '';
      const propertyId = rawPropertyId.replace(/^properties\//, '').trim();

      const result: {
        authenticated: boolean;
        tokenValid: boolean;
        hasAnalyticsScope: boolean;
        userEmail?: string;
        expiresIn?: number;
        grantedScopes: string[];
        adminApiAccessible: boolean;
        adminApiError?: string;
        accounts: Array<{
          account: string;
          displayName: string;
          propertySummaries?: Array<{
            property: string;
            displayName: string;
            propertyType?: string;
          }>;
        }>;
        propertyCheck?: {
          propertyId: string;
          accessible: boolean;
          status: 'GRANTED' | 'DENIED' | 'NOT_FOUND' | 'ERROR' | 'SKIPPED';
          metricsSample?: {
            activeUsers: number;
            sessions: number;
            screenPageViews: number;
            conversions: number;
          };
          dimensionsPreview?: Array<{
            sourceMedium: string;
            sessions: number;
            activeUsers: number;
          }>;
          errorMessage?: string;
        };
      } = {
        authenticated: !!accessToken,
        tokenValid: false,
        hasAnalyticsScope: false,
        grantedScopes: [],
        adminApiAccessible: false,
        accounts: [],
      };

      if (!accessToken) {
        return res.json({
          ...result,
          message: 'No OAuth access token provided. Please sign in with Google to perform live GA4 check.',
        });
      }

      // Step 1: Check token validity and scopes via Google OAuth2 TokenInfo API
      try {
        const tokenInfoRes = await fetch(
          `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${encodeURIComponent(accessToken)}`
        );
        if (tokenInfoRes.ok) {
          const tokenInfo = (await tokenInfoRes.json()) as any;
          result.tokenValid = true;
          result.userEmail = tokenInfo.email;
          result.expiresIn = tokenInfo.expires_in;
          const scopesStr = tokenInfo.scope || '';
          result.grantedScopes = scopesStr.split(' ').filter(Boolean);
          result.hasAnalyticsScope =
            result.grantedScopes.some((s: string) => s.includes('analytics.readonly') || s.includes('analytics'));
        } else {
          const errData = (await tokenInfoRes.json().catch(() => ({}))) as any;
          result.adminApiError = errData.error_description || 'OAuth token is expired or invalid.';
        }
      } catch (err: any) {
        result.adminApiError = `Token validation failed: ${err.message}`;
      }

      // Step 2: Query Google Analytics Admin API (accountSummaries)
      if (result.tokenValid) {
        try {
          const adminRes = await fetch('https://analyticsadmin.googleapis.com/v1beta/accountSummaries', {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (adminRes.ok) {
            const adminData = (await adminRes.json()) as any;
            result.adminApiAccessible = true;
            result.accounts = (adminData.accountSummaries || []).map((acc: any) => ({
              account: acc.account,
              displayName: acc.displayName || 'Google Analytics Account',
              propertySummaries: (acc.propertySummaries || []).map((prop: any) => ({
                property: prop.property,
                displayName: prop.displayName || 'GA4 Property',
                propertyType: prop.propertyType || 'PROPERTY_TYPE_ORDINARY',
              })),
            }));
          } else {
            const errData = (await adminRes.json().catch(() => ({}))) as any;
            result.adminApiAccessible = false;
            result.adminApiError = errData?.error?.message || `Admin API returned status ${adminRes.status}`;
          }
        } catch (err: any) {
          result.adminApiAccessible = false;
          result.adminApiError = `Admin API request error: ${err.message}`;
        }
      }

      // Step 3: Test Property Access via Google Analytics Data API if a propertyId was passed
      if (result.tokenValid && propertyId) {
        try {
          const cleanProp = propertyId.replace(/^properties\//, '');
          const dataReportRes = await fetch(
            `https://analyticsdata.googleapis.com/v1beta/properties/${cleanProp}:runReport`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
                dimensions: [{ name: 'sessionSourceMedium' }],
                metrics: [
                  { name: 'activeUsers' },
                  { name: 'sessions' },
                  { name: 'screenPageViews' },
                  { name: 'conversions' },
                ],
                limit: 10,
              }),
            }
          );

          if (dataReportRes.ok) {
            const reportData = (await dataReportRes.json()) as any;
            let totalUsers = 0;
            let totalSessions = 0;
            let totalViews = 0;
            let totalConv = 0;

            const dimensionsPreview: Array<{ sourceMedium: string; sessions: number; activeUsers: number }> = [];

            if (Array.isArray(reportData.rows)) {
              for (const row of reportData.rows) {
                const srcMed = row.dimensionValues?.[0]?.value || '(unknown)';
                const u = parseInt(row.metricValues?.[0]?.value || '0', 10);
                const s = parseInt(row.metricValues?.[1]?.value || '0', 10);
                const v = parseInt(row.metricValues?.[2]?.value || '0', 10);
                const c = parseInt(row.metricValues?.[3]?.value || '0', 10);
                totalUsers += u;
                totalSessions += s;
                totalViews += v;
                totalConv += c;
                dimensionsPreview.push({ sourceMedium: srcMed, sessions: s, activeUsers: u });
              }
            }

            result.propertyCheck = {
              propertyId: cleanProp,
              accessible: true,
              status: 'GRANTED',
              metricsSample: {
                activeUsers: totalUsers,
                sessions: totalSessions,
                screenPageViews: totalViews,
                conversions: totalConv,
              },
              dimensionsPreview,
            };
          } else {
            const errData = (await dataReportRes.json().catch(() => ({}))) as any;
            const status =
              dataReportRes.status === 403
                ? 'DENIED'
                : dataReportRes.status === 404
                ? 'NOT_FOUND'
                : 'ERROR';
            result.propertyCheck = {
              propertyId,
              accessible: false,
              status,
              errorMessage:
                errData?.error?.message ||
                `Data API returned ${dataReportRes.status} (${status})`,
            };
          }
        } catch (err: any) {
          result.propertyCheck = {
            propertyId,
            accessible: false,
            status: 'ERROR',
            errorMessage: err.message,
          };
        }
      }

      res.json(result);
    } catch (err: any) {
      console.error('Error running GA4 access check:', err);
      res.status(500).json({ error: err.message || 'Error running GA4 access check' });
    }
  });

  // Google Ads Sync API
  app.post('/api/integrations/google-ads/sync', (req, res) => {
    try {
      const { customerId, records } = req.body;
      if (!customerId) {
        return res.status(400).json({ error: 'Google Ads Customer ID is required' });
      }

      const adRecords = Array.isArray(records) && records.length > 0 ? records : [];
      let processed = 0;

      if (adRecords.length > 0) {
        const result = db.ingestGoogleAdsSpend(adRecords);
        processed = result.count;
      }

      const gadsInteg = db.getIntegrations().find((i) => i.service_key === 'google_ads');
      const nowIso = new Date().toISOString();
      if (gadsInteg) {
        db.updateIntegration(gadsInteg.id, {
          status: 'Connected',
          last_sync: nowIso,
          records_imported: (gadsInteg.records_imported || 0) + processed,
          last_new_records: processed,
          sync_frequency: 'Daily (Automated)',
          config: { customerId },
        });
      }

      db.addSyncLog({
        integration_id: gadsInteg ? gadsInteg.id : 'integ-2',
        service_name: 'Google Ads',
        status: 'Success',
        records_processed: processed,
        new_records: processed,
        message: `Google Ads Account ${customerId} synced: ${processed} campaign performance entries ingested.`,
      });

      res.json({
        success: true,
        message: `Successfully synced Google Ads Customer ${customerId}`,
        processed,
      });
    } catch (err: any) {
      console.error('Error syncing Google Ads:', err);
      res.status(500).json({ error: err.message || 'Error syncing Google Ads' });
    }
  });

  // Bing Ads Sync API
  app.post('/api/integrations/bing-ads/sync', (req, res) => {
    try {
      const { customerId, records } = req.body;
      const adRecords = Array.isArray(records) ? records : [];
      let processed = 0;

      if (adRecords.length > 0) {
        const result = db.ingestBingAdsSpend(adRecords);
        processed = result.count;
      }

      const bingInteg = db.getIntegrations().find((i) => i.service_key === 'bing_ads');
      const nowIso = new Date().toISOString();
      if (bingInteg) {
        db.updateIntegration(bingInteg.id, {
          status: 'Connected',
          last_sync: nowIso,
          records_imported: (bingInteg.records_imported || 0) + processed,
          config: { customerId: customerId || 'bing-act-primary' },
        });
      }

      db.addSyncLog({
        integration_id: bingInteg ? bingInteg.id : 'integ-4',
        service_name: 'Bing Ads',
        status: 'Success',
        records_processed: processed,
        message: `Bing Ads account synced: ${processed} campaign records.`,
      });

      res.json({ success: true, processed });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error syncing Bing Ads' });
    }
  });

  app.get('/api/sync-logs', (req, res) => {
    const logs = db.getSyncLogs().map((l) => ({
      id: l.id,
      timestamp: l.timestamp.slice(0, 19).replace('T', ' '),
      platform: l.service_name,
      status: l.status.toLowerCase(),
      records_imported: l.records_processed,
      duration_ms: Math.floor(180 + Math.random() * 450),
      error_message: l.details || l.message,
    }));
    res.json(logs);
  });

  // Settings API
  app.get('/api/settings', (req, res) => {
    const rates = db.getExchangeRates();
    const currencies = db.getCurrencies().map((c) => {
      const xr = rates.find((r) => r.from_currency === 'USD' && r.to_currency === c.code);
      return {
        ...c,
        rateToUsd: xr ? xr.rate : 1,
      };
    });
    res.json({
      organization: db.getOrganization(),
      currencies,
      exchangeRates: rates,
    });
  });

  app.put('/api/settings/organization', (req, res) => {
    try {
      const updated = db.updateOrganization(req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/settings/reset-demo-data', (req, res) => {
    const result = db.resetDemoData();
    res.json(result);
  });

  app.post('/api/settings/purge-demo-data', (req, res) => {
    const result = db.purgeDemoData();
    res.json(result);
  });

  app.post('/api/settings/clear-data', (req, res) => {
    const result = db.clearDemoData();
    res.json(result);
  });


  // Currencies & Exchange Rates
  app.get('/api/currencies', (req, res) => {
    res.json({
      currencies: db.getCurrencies(),
      exchangeRates: db.getExchangeRates(),
    });
  });

  app.post('/api/exchange-rates', (req, res) => {
    const { from, to, rate } = req.body;
    db.updateExchangeRate(from, to, Number(rate));
    res.json({ success: true, from, to, rate: Number(rate) });
  });

  // CSV Import with Duplicate Detection
  app.post('/api/import/csv', (req, res) => {
    try {
      const { entity, rows } = req.body;
      if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({ error: 'No rows provided for import.' });
      }

      if (entity === 'leads') {
        let imported = 0;
        const duplicates: Array<{ row: any; matchedField: string; existingLead: any }> = [];
        const errors: string[] = [];

        for (const row of rows) {
          if (!row.name || !row.email) {
            errors.push(`Row missing name or email: ${JSON.stringify(row)}`);
            continue;
          }

          const dup = db.checkDuplicateLead(row.email, row.phone, row.external_id);
          if (dup.isDuplicate) {
            duplicates.push({ row, matchedField: dup.matchedField!, existingLead: dup.existingLead });
            continue;
          }

          const addRes = db.addLead(row, {
            first_source: row.source || 'direct',
            first_medium: row.medium || 'none',
            first_campaign: row.campaign || 'direct',
            first_landing_page: row.landing_page || 'https://example.com',
            last_source: row.source || 'direct',
            last_medium: row.medium || 'none',
            last_campaign: row.campaign || 'direct',
            last_landing_page: row.landing_page || 'https://example.com',
          });

          if (addRes.lead) imported++;
          else if (addRes.error) errors.push(addRes.error);
        }

        db.addSyncLog({
          service_name: 'CSV Lead Importer',
          status: duplicates.length > 0 || errors.length > 0 ? 'Warning' : 'Success',
          records_processed: imported,
          message: `Imported ${imported} leads. Detected ${duplicates.length} duplicate leads skipped.`,
          details: errors.join('; '),
        });

        return res.json({
          success: true,
          imported,
          duplicateCount: duplicates.length,
          duplicates,
          errors,
        });
      }

      if (entity === 'spend') {
        let imported = 0;
        for (const row of rows) {
          db.addSpendEntry(row);
          imported++;
        }
        return res.json({ success: true, imported, duplicateCount: 0, duplicates: [], errors: [] });
      }

      return res.status(400).json({ error: `Unsupported entity: ${entity}` });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error processing CSV import' });
    }
  });

  // CSV Export
  app.get('/api/export/csv', (req, res) => {
    try {
      const entity = req.query.entity as string;
      let csvContent = '';
      const filename = `${entity || 'export'}-${new Date().toISOString().slice(0, 10)}.csv`;

      if (entity === 'leads') {
        const result = db.getLeads({ limit: 10000 });
        const headers = [
          'ID', 'Date', 'Name', 'Company', 'Email', 'Phone', 'Country', 'Service',
          'Source', 'Medium', 'Campaign', 'LandingPage', 'Status', 'MQL', 'SQL',
          'Opportunity', 'Revenue', 'Currency', 'FirstSource', 'FirstMedium', 'FirstCampaign'
        ];
        const lines = [headers.join(',')];
        for (const l of result.leads) {
          lines.push([
            `"${l.id}"`,
            `"${l.date}"`,
            `"${l.name.replace(/"/g, '""')}"`,
            `"${l.company.replace(/"/g, '""')}"`,
            `"${l.email}"`,
            `"${l.phone}"`,
            `"${l.country}"`,
            `"${l.service}"`,
            `"${l.source}"`,
            `"${l.medium}"`,
            `"${l.campaign}"`,
            `"${l.landing_page}"`,
            `"${l.status}"`,
            l.is_mql ? '1' : '0',
            l.is_sql ? '1' : '0',
            l.is_opportunity ? '1' : '0',
            l.revenue,
            `"${l.currency}"`,
            `"${l.attribution?.first_source || ''}"`,
            `"${l.attribution?.first_medium || ''}"`,
            `"${l.attribution?.first_campaign || ''}"`
          ].join(','));
        }
        csvContent = lines.join('\n');
      } else if (entity === 'spend') {
        const entries = db.getSpend();
        const headers = ['ID', 'Date', 'Platform', 'Campaign', 'CostType', 'Amount', 'Currency', 'Source', 'Adjustment', 'Notes'];
        const lines = [headers.join(',')];
        for (const s of entries) {
          lines.push([
            `"${s.id}"`,
            `"${s.date}"`,
            `"${s.platform_name}"`,
            `"${s.campaign_name || ''}"`,
            `"${s.cost_type}"`,
            s.amount,
            `"${s.currency}"`,
            `"${s.source}"`,
            s.is_adjustment ? '1' : '0',
            `"${(s.notes || '').replace(/"/g, '""')}"`
          ].join(','));
        }
        csvContent = lines.join('\n');
      } else if (entity === 'campaigns') {
        const camps = db.getCampaigns();
        const headers = ['ID', 'Name', 'Platform', 'Source', 'Medium', 'Service', 'Country', 'StartDate', 'EndDate', 'Budget', 'Currency', 'Status'];
        const lines = [headers.join(',')];
        for (const c of camps) {
          lines.push([
            `"${c.id}"`,
            `"${c.name}"`,
            `"${c.platform_name}"`,
            `"${c.source}"`,
            `"${c.medium}"`,
            `"${c.service}"`,
            `"${c.country}"`,
            `"${c.start_date}"`,
            `"${c.end_date || ''}"`,
            c.budget,
            `"${c.currency}"`,
            `"${c.status}"`
          ].join(','));
        }
        csvContent = lines.join('\n');
      } else if (entity === 'activities') {
        const acts = db.getDailyActivities();
        const headers = ['ID', 'Date', 'Platform', 'Campaign', 'ActivityType', 'Description', 'Spend', 'Leads', 'MQL', 'Status', 'Owner'];
        const lines = [headers.join(',')];
        for (const a of acts) {
          lines.push([
            `"${a.id}"`,
            `"${a.date}"`,
            `"${a.platform_name}"`,
            `"${a.campaign_name || ''}"`,
            `"${a.activity_type}"`,
            `"${a.description.replace(/"/g, '""')}"`,
            a.spend,
            a.leads_attributed,
            a.mql_attributed,
            `"${a.status}"`,
            `"${a.owner}"`
          ].join(','));
        }
        csvContent = lines.join('\n');
      } else {
        return res.status(400).json({ error: 'Unknown export entity' });
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvContent);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Demo Data Management
  app.post('/api/demo-data/reset', (req, res) => {
    const result = db.resetDemoData();
    res.json(result);
  });

  app.post('/api/demo-data/clear', (req, res) => {
    const result = db.clearDemoData();
    res.json(result);
  });

  // --- VITE MIDDLEWARE OR STATIC SERVING ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Marketing Intelligence Hub running on port ${PORT}`);
  });
}

startServer();
