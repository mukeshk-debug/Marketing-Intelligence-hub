import React, { useState, useMemo } from 'react';
import { X, Copy, Check, ExternalLink, Link2, Sparkles } from 'lucide-react';

interface UTMBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UTMBuilderModal: React.FC<UTMBuilderModalProps> = ({ isOpen, onClose }) => {
  const [baseUrl, setBaseUrl] = useState('https://example.com/ai-development');
  const [source, setSource] = useState('goodfirms');
  const [medium, setMedium] = useState('referral');
  const [campaign, setCampaign] = useState('ai-development');
  const [term, setTerm] = useState('machine+learning+consulting');
  const [content, setContent] = useState('directory-listing-cta');
  const [copied, setCopied] = useState(false);

  // Quick preset loader
  const loadPreset = (preset: { src: string; med: string; camp: string }) => {
    setSource(preset.src);
    setMedium(preset.med);
    setCampaign(preset.camp);
  };

  const generatedUrl = useMemo(() => {
    if (!baseUrl.trim()) return '';
    try {
      // Validate and parse url
      const url = new URL(baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`);
      if (source.trim()) url.searchParams.set('utm_source', source.trim());
      if (medium.trim()) url.searchParams.set('utm_medium', medium.trim());
      if (campaign.trim()) url.searchParams.set('utm_campaign', campaign.trim());
      if (term.trim()) url.searchParams.set('utm_term', term.trim());
      if (content.trim()) url.searchParams.set('utm_content', content.trim());
      return url.toString();
    } catch {
      // Fallback simple query string assembly
      const params: string[] = [];
      if (source.trim()) params.push(`utm_source=${encodeURIComponent(source.trim())}`);
      if (medium.trim()) params.push(`utm_medium=${encodeURIComponent(medium.trim())}`);
      if (campaign.trim()) params.push(`utm_campaign=${encodeURIComponent(campaign.trim())}`);
      if (term.trim()) params.push(`utm_term=${encodeURIComponent(term.trim())}`);
      if (content.trim()) params.push(`utm_content=${encodeURIComponent(content.trim())}`);

      const separator = baseUrl.includes('?') ? '&' : '?';
      return params.length > 0 ? `${baseUrl}${separator}${params.join('&')}` : baseUrl;
    }
  }, [baseUrl, source, medium, campaign, term, content]);

  const handleCopy = () => {
    if (!generatedUrl) return;
    navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Campaign URL / UTM Builder</h3>
              <p className="text-xs text-slate-500">
                Generate tracking URLs with validated UTM parameters for multi-channel attribution
              </p>
            </div>
          </div>
          <button
            id="close-utm-modal"
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Quick Presets
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => loadPreset({ src: 'google', med: 'cpc', camp: 'custom-software' })}
                className="px-2.5 py-1 text-xs rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                Google Ads
              </button>
              <button
                type="button"
                onClick={() => loadPreset({ src: 'goodfirms', med: 'referral', camp: 'ai-development' })}
                className="px-2.5 py-1 text-xs rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                GoodFirms
              </button>
              <button
                type="button"
                onClick={() => loadPreset({ src: 'clutch', med: 'referral', camp: 'blockchain' })}
                className="px-2.5 py-1 text-xs rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                Clutch
              </button>
              <button
                type="button"
                onClick={() => loadPreset({ src: 'linkedin', med: 'paid-social', camp: 'cloud-devops' })}
                className="px-2.5 py-1 text-xs rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                LinkedIn Ads
              </button>
              <button
                type="button"
                onClick={() => loadPreset({ src: 'newsletter', med: 'email', camp: 'product-update' })}
                className="px-2.5 py-1 text-xs rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                Email Newsletter
              </button>
            </div>
          </div>

          {/* Base URL */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Base URL <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="utm-base-url-input"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://example.com/landing-page"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          {/* Parameters grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                utm_source <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="utm-source-input"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="google, clutch, goodfirms, linkedin"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                utm_medium <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="utm-medium-input"
                value={medium}
                onChange={(e) => setMedium(e.target.value)}
                placeholder="cpc, referral, paid-social, email"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                utm_campaign <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="utm-campaign-input"
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
                placeholder="ai-development, spring-promo"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">utm_term (Keyword)</label>
              <input
                type="text"
                id="utm-term-input"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="custom+software+development"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                utm_content (Ad Creative / Placement)
              </label>
              <input
                type="text"
                id="utm-content-input"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="sidebar-banner, header-cta, textlink"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Generated URL Box */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>Generated Tracking URL</span>
              <span className="text-[11px] text-slate-400 font-normal">URL Encoded</span>
            </label>
            <div className="p-3 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono break-all border border-slate-800 flex items-start justify-between gap-3">
              <span className="select-all">{generatedUrl || 'Enter valid base URL above...'}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setBaseUrl('https://example.com/ai-development');
              setSource('');
              setMedium('');
              setCampaign('');
              setTerm('');
              setContent('');
            }}
            className="text-xs text-slate-500 hover:text-slate-800"
          >
            Clear Fields
          </button>

          <div className="flex items-center gap-2">
            <button
              id="copy-utm-url-button"
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy URL'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
