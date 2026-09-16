import React from 'react';
import { ArrowDown, ArrowRight } from 'lucide-react';

interface FunnelStep {
  stage: string;
  count: number;
  conversionRate: number | null;
}

interface MarketingFunnelProps {
  funnel: FunnelStep[];
}

export const MarketingFunnel: React.FC<MarketingFunnelProps> = ({ funnel }) => {
  const stageColors = [
    { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-600 text-white' },
    { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', badge: 'bg-indigo-600 text-white' },
    { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-600 text-white' },
    { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-600 text-white' },
    { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-600 text-white' },
    { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', badge: 'bg-rose-600 text-white' },
    { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-600 text-white' },
  ];

  return (
    <div id="marketing-funnel-card" className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-slate-900 tracking-tight">Full Marketing & Sales Pipeline Funnel</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Step-by-step conversion progression from initial website traffic to Closed Won revenue
        </p>
      </div>

      {/* Horizontal grid for desktop, vertical for mobile */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-2 relative">
        {funnel.map((step, idx) => {
          const color = stageColors[idx % stageColors.length];
          const isLast = idx === funnel.length - 1;

          return (
            <div key={step.stage} className="relative flex flex-col items-center">
              <div
                className={`w-full h-full flex flex-col justify-between p-3.5 rounded-xl border ${color.bg} ${color.border} text-center transition-transform hover:-translate-y-0.5 duration-150`}
              >
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    {step.stage}
                  </div>
                  <div className={`text-xl font-bold ${color.text} tracking-tight`}>
                    {step.count.toLocaleString()}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/60">
                  <div className="text-[10px] text-slate-500 uppercase font-medium">Stage Conv.</div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">
                    {step.conversionRate !== null && isFinite(step.conversionRate)
                      ? `${step.conversionRate.toFixed(1)}%`
                      : '—'}
                  </div>
                </div>
              </div>

              {!isLast && (
                <div className="hidden md:flex absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 w-5 h-5 rounded-full bg-white border border-slate-200 items-center justify-center text-slate-400 shadow-xs">
                  <ArrowRight className="w-3 h-3" />
                </div>
              )}
              {!isLast && (
                <div className="md:hidden flex my-1 text-slate-400">
                  <ArrowDown className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
