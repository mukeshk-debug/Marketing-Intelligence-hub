import React from 'react';
import {
  LayoutDashboard,
  BarChart3,
  Users,
  GitFork,
  Target,
  DollarSign,
  Layers,
  FileSpreadsheet,
  CalendarCheck,
  FileText,
  Plug,
  Settings,
  Link2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'traffic'
  | 'leads'
  | 'attribution'
  | 'campaigns'
  | 'spend'
  | 'platforms'
  | 'landing-pages'
  | 'activities'
  | 'reports'
  | 'integrations'
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
  onOpenUtmBuilder: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  onOpenUtmBuilder,
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'traffic', label: 'Traffic Analytics', icon: BarChart3 },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'attribution', label: 'Attribution', icon: GitFork },
    { id: 'campaigns', label: 'Campaigns', icon: Target },
    { id: 'spend', label: 'Spend & Cost', icon: DollarSign },
    { id: 'platforms', label: 'Platforms', icon: Layers },
    { id: 'landing-pages', label: 'Landing Pages', icon: FileSpreadsheet },
    { id: 'activities', label: 'Daily Activities', icon: CalendarCheck },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'integrations', label: 'Integrations', icon: Plug },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      id="main-sidebar"
      className={`relative flex flex-col bg-slate-900 text-slate-200 border-r border-slate-800 transition-all duration-200 z-30 shrink-0 ${
        collapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              MI
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-white text-sm tracking-tight leading-none">
                Marketing Hub
              </span>
              <span className="text-[11px] text-slate-400 mt-1">Intelligence & Leads</span>
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              MI
            </div>
          </div>
        )}

        <button
          id="sidebar-collapse-toggle"
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
              title={item.label}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}

        {/* Quick Utility Tool: UTM Builder */}
        <div className="pt-4 border-t border-slate-800 mt-4">
          <button
            id="utm-builder-sidebar-button"
            type="button"
            onClick={onOpenUtmBuilder}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 hover:bg-emerald-900/40 transition-colors text-left"
            title="Open UTM Link Builder"
          >
            <Link2 className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="truncate">UTM Builder Tool</span>}
          </button>
        </div>
      </div>

      {/* User / Org Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        {!collapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-slate-200 truncate">Marketing Ops</span>
              <span className="text-[11px] text-slate-400">Internal Team</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500" title="API System Connected" />
          </div>
        ) : (
          <div className="flex justify-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
        )}
      </div>
    </aside>
  );
};
