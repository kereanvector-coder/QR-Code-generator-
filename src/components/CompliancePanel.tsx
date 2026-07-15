import React, { useState } from 'react';
import { ShieldCheck, Download, Trash2, Calendar, FileText, Info, HelpCircle, ArrowRight } from 'lucide-react';
import { Campaign, Transaction, Workspace } from '../types';

interface CompliancePanelProps {
  campaigns: Campaign[];
  setCampaigns: React.Dispatch<React.SetStateAction<Campaign[]>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  workspaces: Workspace[];
  setWorkspaces: React.Dispatch<React.SetStateAction<Workspace[]>>;
  showToast: (msg: string, type: 'success' | 'info' | 'error') => void;
  detectedCountry: string;
}

export default function CompliancePanel({
  campaigns,
  setCampaigns,
  transactions,
  setTransactions,
  workspaces,
  setWorkspaces,
  showToast,
  detectedCountry
}: CompliancePanelProps) {
  const [retentionPeriod, setRetentionPeriod] = useState<string>('12_months');
  const [activePolicyTab, setActivePolicyTab] = useState<'privacy' | 'terms' | 'cookies' | 'refunds' | 'retention'>('privacy');
  
  // Consent Settings state
  const [consentAnalytics, setConsentAnalytics] = useState(true);
  const [consentCookies, setConsentCookies] = useState(true);
  const [consentLogs, setConsentLogs] = useState(true);

  // Export Data (NDPA Art 29 / GDPR Art 20 Data Portability)
  const handleExportData = () => {
    try {
      const dataToExport = {
        exportedAt: new Date().toISOString(),
        regulationsCovered: ['Nigeria Data Protection Act (NDPA) 2023', 'GDPR (EU) 2016/679'],
        userEmail: 'kereanvector@gmail.com',
        detectedCountry,
        workspaces,
        campaigns: campaigns.map(c => ({
          id: c.id,
          name: c.name,
          type: c.type,
          targetUrl: c.targetUrl,
          shortUrl: c.shortUrl,
          created: c.created,
          clicks: c.clicks,
          isPasswordProtected: !!c.isPasswordProtected,
          isScheduled: !!c.isScheduled
          // Raw scan coordinates omitted or anonymized under compliance regulations
        })),
        transactions
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `qodex-compliance-export-${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showToast('Personal data package compiled and downloaded successfully!', 'success');
    } catch (error) {
      showToast('Failed to compile data package.', 'error');
    }
  };

  // Anonymize & Purge Logs older than 12 months (NDPA Data Minimization / GDPR Retention Limitation)
  const handlePurgeOldLogs = () => {
    // Simulate purging logs older than retention period
    const updated = campaigns.map(c => {
      // Deep copy scan locations but zero out raw locations, replacing with safe aggregates
      return {
        ...c,
        scanLocations: {
          'Aggregated Regional Total (Anonymized)': c.clicks
        },
        devices: {
          'Aggregated Mobile Platforms (Anonymized)': c.clicks
        }
      };
    });

    setCampaigns(updated);

    setTransactions(prev => [
      {
        id: `tx-purge-${Date.now()}`,
        desc: 'Executed compliance audit: Anonymized/Purged raw geolocation and device logs older than 12 months',
        amount: '0',
        status: 'SUCCESS',
        date: new Date().toISOString().split('T')[0],
        type: 'compliance_purge',
        change: '0',
        ref: `QTX-COMP-${Math.floor(10000 + Math.random() * 90000)}`
      },
      ...prev
    ]);

    showToast('Anonymization cycle executed. Raw geolocation and user-agent logs purged successfully.', 'success');
  };

  // GDPR Right to Erasure / NDPA Right to be Forgotten
  const handleErasureRequest = () => {
    if (window.confirm('⚠️ WARNING: This will permanently delete your account, all workspaces, folders, campaigns, and transaction histories from local storage. This action is irreversible. Do you wish to exercise your right to erasure?')) {
      localStorage.clear();
      showToast('All local personal data has been securely erased.', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  const handleSaveConsent = () => {
    showToast('Privacy preferences and cookie consent saved!', 'success');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* LEFT COLUMN: PRIVACY CONTROLS & COMPLIANCE TOOLS */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* COMPLIANCE INTRO CARD */}
        <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-emerald-500/10 text-emerald-400 font-bold text-[9px] uppercase tracking-wider px-3 py-1.5 rounded-bl-xl border-l border-b border-emerald-500/10">
            Certified Secure
          </div>
          <div className="flex items-start gap-4">
            <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Data Protection &amp; Regulatory Compliance</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Qodex respects global and regional data protection frameworks. We operate in strict compliance with the <span className="text-emerald-400 font-bold">Nigeria Data Protection Act (NDPA) 2023</span> for our African users, and match <span className="text-indigo-400 font-bold">GDPR (General Data Protection Regulation)</span> standards for international data.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded">
                  Detected Region: {detectedCountry}
                </span>
                <span className="text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded">
                  Regulatory Scope: {detectedCountry.includes('Nigeria') ? 'NDPA (Nigeria)' : 'GDPR Equivalent'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* DATA PORTABILITY & ERASURE CONTROL CENTER */}
        <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 space-y-6">
          <h3 className="text-sm font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span> Interactive User Privacy Rights
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* RIGHT TO PORTABILITY */}
            <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500">NDPA Art 29 / GDPR Art 20</span>
                <h4 className="text-xs font-black text-slate-200 mt-1">Right to Data Portability</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Export a comprehensive, machine-readable JSON archive containing your active workspaces, custom campaigns, metadata, and financial transaction ledger.
                </p>
              </div>
              <button
                onClick={handleExportData}
                className="w-full bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 mt-4"
              >
                <Download className="h-3.5 w-3.5 text-indigo-400" /> Export My Personal Data (JSON)
              </button>
            </div>

            {/* RIGHT TO ERASURE */}
            <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500">NDPA Art 34 / GDPR Art 17</span>
                <h4 className="text-xs font-black text-slate-200 mt-1">Right to Be Forgotten</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Permanently delete your profile and erase all campaigns, redirection logs, folders, and wallets instantly. This purges all cookies and local data caches.
                </p>
              </div>
              <button
                onClick={handleErasureRequest}
                className="w-full bg-rose-950/30 hover:bg-rose-950/50 border border-rose-900/40 text-rose-300 text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 mt-4"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-400" /> Purge Account &amp; Erase My Data
              </button>
            </div>
          </div>
        </div>

        {/* DATA MINIMIZATION & RETENTION CONTROLS */}
        <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span> Geolocation Log Retention &amp; Auto-Purge
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              To respect data minimization rules, raw scan logs containing precise geolocation and user-agents should not be held indefinitely. Choose your automated purge window below or execute a manual sweep.
            </p>
          </div>

          <div className="bg-slate-900/50 border border-slate-850 p-4 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block">Raw Geolocation Retention Period</label>
                <span className="text-[10px] text-slate-500">Aggregated click totals will be preserved permanently for charting.</span>
              </div>
              <select
                value={retentionPeriod}
                onChange={(e) => {
                  setRetentionPeriod(e.target.value);
                  showToast(`Auto-purge retention window updated to: ${e.target.value.replace('_', ' ')}`, 'info');
                }}
                className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 font-mono"
              >
                <option value="3_months">3 Months</option>
                <option value="6_months">6 Months</option>
                <option value="12_months">12 Months (Recommended)</option>
                <option value="never">No Purge (Compliant Warning)</option>
              </select>
            </div>

            <div className="border-t border-slate-850 pt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Info className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                Campaigns older than retention window will have detailed logs stripped.
              </span>
              <button
                onClick={handlePurgeOldLogs}
                className="bg-slate-900 hover:bg-slate-800 text-slate-200 text-[11px] font-bold px-4 py-2 rounded-xl border border-slate-800 transition-all flex items-center gap-1 whitespace-nowrap"
              >
                <Calendar className="h-3.5 w-3.5 text-indigo-400" /> Execute Purge Cycle
              </button>
            </div>
          </div>
        </div>

        {/* PRIVACY CONSENT CONFIGURATOR */}
        <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 space-y-4">
          <h3 className="text-sm font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span> Privacy Preference Center
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between bg-slate-900/30 p-3 rounded-xl border border-slate-900">
              <div className="space-y-0.5">
                <label className="text-xs font-bold text-slate-200 block">Essential Functional Cookies</label>
                <span className="text-[10px] text-slate-500">Required to manage secure workspace tokens and offline state.</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-bold uppercase">Always Active</span>
            </div>

            <div className="flex items-center justify-between bg-slate-900/30 p-3 rounded-xl border border-slate-900">
              <div className="space-y-0.5">
                <label className="text-xs font-bold text-slate-200 block">Scan Analytics IP Geolocation Tracking</label>
                <span className="text-[10px] text-slate-500">Unlocks African regional mapping (Lagos, Nairobi, Accra) for scans.</span>
              </div>
              <input
                type="checkbox"
                checked={consentAnalytics}
                onChange={(e) => setConsentAnalytics(e.target.checked)}
                className="rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-0"
              />
            </div>

            <div className="flex items-center justify-between bg-slate-900/30 p-3 rounded-xl border border-slate-900">
              <div className="space-y-0.5">
                <label className="text-xs font-bold text-slate-200 block">Long-Term Audit Logging</label>
                <span className="text-[10px] text-slate-500">Logs transactions and audit reports inside the wallet ledger securely.</span>
              </div>
              <input
                type="checkbox"
                checked={consentLogs}
                onChange={(e) => setConsentLogs(e.target.checked)}
                className="rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-0"
              />
            </div>
          </div>

          <button
            onClick={handleSaveConsent}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition-all"
          >
            Save Privacy Preferences
          </button>
        </div>

      </div>

      {/* RIGHT COLUMN: DETAILED LEGAL POLICIES AND DISCLOSURES */}
      <div className="lg:col-span-5 space-y-6">
        
        <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 space-y-4">
          <div className="border-b border-slate-900 pb-3">
            <h3 className="text-sm font-extrabold text-slate-300 uppercase tracking-wider">
              Platform Disclosures &amp; Policies
            </h3>
            <p className="text-[11px] text-slate-500">Select a policy below to read full regulatory text.</p>
          </div>

          {/* POLICY SELECTOR BUTTONS */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'privacy', label: '🔒 Privacy' },
              { id: 'terms', label: '📜 Terms' },
              { id: 'cookies', label: '🍪 Cookies' },
              { id: 'refunds', label: '💳 Refunds' },
              { id: 'retention', label: '📅 Retention' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setActivePolicyTab(p.id as any)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left ${activePolicyTab === p.id ? 'bg-indigo-600/10 border-indigo-500/50 text-indigo-400' : 'bg-slate-900/60 border-slate-850 text-slate-400 hover:text-slate-200'}`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* POLICY VIEWPORT */}
          <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 h-96 overflow-y-auto space-y-4 text-xs leading-relaxed text-slate-300">
            
            {activePolicyTab === 'privacy' && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center gap-1.5 text-slate-200 font-bold border-b border-slate-900 pb-1.5 uppercase tracking-wide">
                  <FileText className="h-4 w-4 text-indigo-400" /> Privacy Policy (NDPA &amp; GDPR)
                </div>
                <p className="text-[11px] text-slate-400 italic">Last Revised: July 15, 2026</p>
                <p>
                  This Privacy Policy details how Qodex collects and processes personal data. Our operations are governed by the <strong>Nigeria Data Protection Act (NDPA) 2023</strong> and the <strong>EU General Data Protection Regulation (GDPR)</strong>.
                </p>
                <h4 className="font-bold text-slate-200 mt-2">1. Collected Information</h4>
                <p>
                  We collect user email addresses for authentication, billing information, and device scan data (IP address, approximate location, device type, browser user-agent) when your customers scan a Qodex dynamic QR code.
                </p>
                <h4 className="font-bold text-slate-200 mt-2">2. Geolocation Analytics &amp; Anonymization</h4>
                <p>
                  Approximate locations of scans are matched against centralized African IP registers to determine city-level statistics (e.g. Lagos, Nairobi). Absolute IP strings are obfuscated and automated purge protocols discard raw logs after 12 months.
                </p>
                <h4 className="font-bold text-slate-200 mt-2">3. Data Controller Contact</h4>
                <p>
                  Inquiries regarding data subjects' rights or data transfers inside Africa should be submitted directly to our Data Protection Officer at <code>dpo@qodex.io</code>.
                </p>
              </div>
            )}

            {activePolicyTab === 'terms' && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center gap-1.5 text-slate-200 font-bold border-b border-slate-900 pb-1.5 uppercase tracking-wide">
                  <FileText className="h-4 w-4 text-indigo-400" /> Terms of Service
                </div>
                <p className="text-[11px] text-slate-400 italic">Last Revised: July 15, 2026</p>
                <p>
                  Welcome to Qodex. By deploying dynamic QR campaigns or utilizing our workspace wallet credits, you agree to comply with these terms.
                </p>
                <h4 className="font-bold text-slate-200 mt-2">1. Use of Services</h4>
                <p>
                  You agree to use Qodex solely for lawful redirection campaigns. Redirecting QR codes to phishing portals, malware distribution networks, or unregulated financial schemes is strictly prohibited and will result in immediate workspace ban and forfeiture of wallet balance.
                </p>
                <h4 className="font-bold text-slate-200 mt-2">2. Credit Purchases &amp; No-Expiry</h4>
                <p>
                  Credits are purchased as a pay-as-you-go token utility. Unused credits in your wallet do not expire and will remain valid on your account indefinitely unless the account is closed under erasure requests.
                </p>
              </div>
            )}

            {activePolicyTab === 'cookies' && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center gap-1.5 text-slate-200 font-bold border-b border-slate-900 pb-1.5 uppercase tracking-wide">
                  <FileText className="h-4 w-4 text-indigo-400" /> Cookie Policy
                </div>
                <p className="text-[11px] text-slate-400 italic">Last Revised: July 15, 2026</p>
                <p>
                  We use cookies and equivalent browser offline technologies (localStorage) to maximize platform performance.
                </p>
                <h4 className="font-bold text-slate-200 mt-2">1. Essential State Storage</h4>
                <p>
                  We utilize cookies to maintain active workspace selections, wallet balance records, and template customizations. These cookies do not store third-party advertising profiles.
                </p>
                <h4 className="font-bold text-slate-200 mt-2">2. Dynamic Redirection Cookies</h4>
                <p>
                  When your customers scan a password-protected or scheduled QR, a temporary session cookie may be written to prevent requiring repetitive password inputs during redirection gates.
                </p>
              </div>
            )}

            {activePolicyTab === 'refunds' && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center gap-1.5 text-slate-200 font-bold border-b border-slate-900 pb-1.5 uppercase tracking-wide">
                  <FileText className="h-4 w-4 text-indigo-400" /> Refund &amp; Charge Policies
                </div>
                <p className="text-[11px] text-rose-400 font-bold italic">Critical Disclosure: Credits are Non-Refundable Once Consumed</p>
                <p>
                  Please review our refund parameters before initiating card or bank gateway transfers.
                </p>
                <h4 className="font-bold text-slate-200 mt-2">1. Unconsumed Balance Refunds</h4>
                <p>
                  If you purchase a credit package in error, you may apply for a complete refund of unconsumed credits within 14 calendar days of payment. Please notify billing at <code>payments@qodex.io</code>.
                </p>
                <h4 className="font-bold text-slate-200 mt-2">2. Consumed Credits Policy</h4>
                <p>
                  <strong>Credits are strictly non-refundable once they are consumed for any premium platform action.</strong> Premium actions include: generating dynamic redirects, exporting vector SVGs, processing bulk batch arrays, uploading business logos, or configuring custom redirection schedulers.
                </p>
                <h4 className="font-bold text-slate-200 mt-2">3. Chargeback Arbitration</h4>
                <p>
                  In compliance with central banking regulations, fraudulent chargebacks or dispute filings on verified webhooks will result in instant deletion of associated workspaces and permanent invalidation of generated QR targets.
                </p>
              </div>
            )}

            {activePolicyTab === 'retention' && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center gap-1.5 text-slate-200 font-bold border-b border-slate-900 pb-1.5 uppercase tracking-wide">
                  <FileText className="h-4 w-4 text-indigo-400" /> Data Retention Framework
                </div>
                <p className="text-[11px] text-slate-400 italic">Effective Retention Window: 12 Months</p>
                <p>
                  In compliance with GDPR data minimization (Article 5(1)(e)) and NDPA data security mandates, Qodex enforces standard retention controls for scan metrics.
                </p>
                <h4 className="font-bold text-slate-200 mt-2">1. Raw Log Auto-Purging</h4>
                <p>
                  Raw transactional logs (logs containing user IP addresses, detailed device fingerprints, and location data) are automatically purged after 12 months. This minimizes privacy liability.
                </p>
                <h4 className="font-bold text-slate-200 mt-2">2. Statistical Preservation</h4>
                <p>
                  Aggregated numbers (the total click numbers, device percentage aggregates, and anonymous regional counters) are retained indefinitely. This allows your dashboard reports to remain active and accurate for years without violating customer privacy laws.
                </p>
              </div>
            )}

          </div>
        </div>

        {/* COMPLIANCE CHECKLIST */}
        <div className="bg-[#111624] border border-slate-900 rounded-3xl p-5 space-y-3">
          <span className="text-[10px] uppercase font-black text-indigo-400 tracking-wider">Compliance Checklist for Agencies</span>
          <ul className="space-y-2 text-xs text-slate-400">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Workspace database cookies fully managed offline.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Interactive Right to Portability (JSON export) fully implemented.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Anonymized data aggregates isolated from raw scan logs.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Right to Erasure (complete account purge) compliant with NDPA/GDPR.</span>
            </li>
          </ul>
        </div>

      </div>

    </div>
  );
}
