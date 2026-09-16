import React, { useState } from 'react';
import { FilterProvider } from './context/FilterContext.tsx';
import { Sidebar, type ActiveTab } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { GlobalFiltersBar } from './components/GlobalFiltersBar.tsx';
import { UTMBuilderModal } from './components/UTMBuilderModal.tsx';

// Views
import { DashboardView } from './views/DashboardView.tsx';
import { TrafficAnalyticsView } from './views/TrafficAnalyticsView.tsx';
import { LeadsView } from './views/LeadsView.tsx';
import { AttributionView } from './views/AttributionView.tsx';
import { CampaignsView } from './views/CampaignsView.tsx';
import { SpendCostView } from './views/SpendCostView.tsx';
import { PlatformsView } from './views/PlatformsView.tsx';
import { LandingPagesView } from './views/LandingPagesView.tsx';
import { DailyActivitiesView } from './views/DailyActivitiesView.tsx';
import { ReportsView } from './views/ReportsView.tsx';
import { IntegrationsView } from './views/IntegrationsView.tsx';
import { SettingsView } from './views/SettingsView.tsx';

function MainAppContent() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [utmModalOpen, setUtmModalOpen] = useState(false);

  const tabConfig: Record<ActiveTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Marketing Intelligence Dashboard',
      subtitle: 'Executive overview of spend, traffic attribution, leads, and conversion velocity',
    },
    traffic: {
      title: 'Traffic Analytics',
      subtitle: 'Session volume, user engagement, bounce rates, and source/medium breakdowns',
    },
    leads: {
      title: 'Lead Management & CRM Pipeline',
      subtitle: 'Inquiries, qualification stages, duplicate validation, and multi-touch attribution',
    },
    attribution: {
      title: 'Multi-Touch Attribution',
      subtitle: 'First Touch vs. Last Touch comparative models and channel touchpoint correlation',
    },
    campaigns: {
      title: 'Campaign Performance & Budgets',
      subtitle: 'Active and planned marketing campaigns, budgets, and status tracking',
    },
    spend: {
      title: 'Spend & Cost Tracking',
      subtitle: 'Cross-channel marketing expenditures, cost types, and audited manual adjustments',
    },
    platforms: {
      title: 'Marketing Platforms & Directories',
      subtitle: 'Channel metrics with dedicated Clutch and GoodFirms sponsorship and PPL logs',
    },
    'landing-pages': {
      title: 'Landing Pages & Funnel Optimization',
      subtitle: 'Page conversion rates, visitor entrance volume, and inquiry distribution',
    },
    activities: {
      title: 'Daily Marketing Activities',
      subtitle: 'Log of bid changes, budget updates, creative tests, and team interventions',
    },
    reports: {
      title: 'Performance Reports & Exports',
      subtitle: 'Formatted End-of-Day (EOD) team briefings and executive monthly audits',
    },
    integrations: {
      title: 'Platform Integrations & Sync',
      subtitle: 'Data adapters for GA4, Google Ads, Google Sheets, directories, and sync logs',
    },
    settings: {
      title: 'System Settings',
      subtitle: 'Currencies, baseline exchange rates, and database initialization controls',
    },
  };

  const currentTab = tabConfig[activeTab];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-800 antialiased">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        onOpenUtmBuilder={() => setUtmModalOpen(true)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <Header
          title={currentTab.title}
          subtitle={currentTab.subtitle}
          onOpenUtmBuilder={() => setUtmModalOpen(true)}
          showFiltersToggle={activeTab === 'dashboard' || activeTab === 'traffic' || activeTab === 'leads' || activeTab === 'attribution'}
          filtersOpen={filtersOpen}
          setFiltersOpen={setFiltersOpen}
        />

        {/* Global Filters Panel */}
        {filtersOpen && (activeTab === 'dashboard' || activeTab === 'traffic' || activeTab === 'leads' || activeTab === 'attribution') && (
          <GlobalFiltersBar />
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-100">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'traffic' && <TrafficAnalyticsView />}
          {activeTab === 'leads' && <LeadsView />}
          {activeTab === 'attribution' && <AttributionView />}
          {activeTab === 'campaigns' && <CampaignsView />}
          {activeTab === 'spend' && <SpendCostView />}
          {activeTab === 'platforms' && <PlatformsView />}
          {activeTab === 'landing-pages' && <LandingPagesView />}
          {activeTab === 'activities' && <DailyActivitiesView />}
          {activeTab === 'reports' && <ReportsView />}
          {activeTab === 'integrations' && (
            <IntegrationsView
              onNavigateToLeads={() => setActiveTab('leads')}
              onNavigateToTraffic={() => setActiveTab('traffic')}
            />
          )}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* UTM Link Builder Modal */}
      <UTMBuilderModal isOpen={utmModalOpen} onClose={() => setUtmModalOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <FilterProvider>
      <MainAppContent />
    </FilterProvider>
  );
}
