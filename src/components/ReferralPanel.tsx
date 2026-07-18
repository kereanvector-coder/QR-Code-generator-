import React, { useState } from 'react';
import { ReferralStats, ReferralRecord, Transaction } from '../types';
import { 
  Gift, 
  Copy, 
  Check, 
  UserCheck, 
  AlertTriangle, 
  ShieldAlert, 
  Terminal, 
  Play, 
  RefreshCw, 
  TrendingUp,
  Smartphone,
  Globe
} from 'lucide-react';

interface ReferralPanelProps {
  referralStats: ReferralStats;
  setReferralStats: React.Dispatch<React.SetStateAction<ReferralStats>>;
  credits: number;
  setCredits: (credits: number) => void;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  showToast: (message: string, type: 'success' | 'info' | 'error') => void;
}

export default function ReferralPanel({
  referralStats,
  setReferralStats,
  credits,
  setCredits,
  setTransactions,
  showToast
}: ReferralPanelProps) {
  const [copied, setCopied] = useState(false);

  // Simulator State
  const [refereeName, setRefereeName] = useState('');
  const [refereeEmail, setRefereeEmail] = useState('');
  const [simulatedIp, setSimulatedIp] = useState('102.89.44.20');
  const [simulatedDevice, setSimulatedDevice] = useState('df-chrome-ios-4190');
  const [simulatedAction, setSimulatedAction] = useState<'signup' | 'purchase'>('signup');
  
  // Simulator output logs
  const [simLogs, setSimLogs] = useState<string[]>(['Referral Fraud check engine ready...']);

  // Copy referral code to clipboard
  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralStats.referralLink);
    setCopied(true);
    showToast('Referral link copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  // Run Simulated Referee Action (Fraud Check logic)
  const triggerRefereeSimulation = () => {
    if (!refereeName.trim() || !refereeEmail.trim()) {
      showToast('Please provide a simulated referee name and email.', 'error');
      return;
    }

    const currentTimestamp = new Date().toISOString().split('T')[0];
    const log = (msg: string) => setSimLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    log(`Initializing referral flow for: ${refereeName} (${refereeEmail})`);
    log(`Checking payload: IP=${simulatedIp} | DeviceSig=${simulatedDevice}`);

    // FRAUD CHECK TRIGGERS
    // Referrer's own IP/Device
    const referrerIp = '102.89.44.11'; // Owner's IP (seed)
    const referrerDevice = 'df-chrome-android-77921'; // Owner's Device

    let isFraud = false;
    let fraudReason = '';

    // Check 1: Referrer self-referral IP matching
    if (simulatedIp === referrerIp) {
      isFraud = true;
      fraudReason = 'IP matches the referrer (Self-referral check failed)';
    }
    // Check 2: Referrer self-referral Device signature matching
    else if (simulatedDevice === referrerDevice) {
      isFraud = true;
      fraudReason = 'Device fingerprint matches the referrer (Self-referral check failed)';
    }
    // Check 3: Multi-accounting check (does this IP already exist in records?)
    else {
      const duplicateIpRecord = referralStats.records.find(
        r => r.ipAddress === simulatedIp && r.status !== 'Fraud Flagged'
      );
      if (duplicateIpRecord) {
        isFraud = true;
        fraudReason = `IP matches an existing referee "${duplicateIpRecord.refereeName}" (Sybil attack check failed)`;
      } else {
        const duplicateDeviceRecord = referralStats.records.find(
          r => r.deviceFingerprint === simulatedDevice && r.status !== 'Fraud Flagged'
        );
        if (duplicateDeviceRecord) {
          isFraud = true;
          fraudReason = `Device signature matches existing referee "${duplicateDeviceRecord.refereeName}" (Sybil attack check failed)`;
        }
      }
    }

    if (isFraud) {
      log(`🚨 FRAUD TRIGGERED: ${fraudReason}`);
      log('Result: Bonus allocation blocked. Record flagged for security review.');

      const fraudRecord: ReferralRecord = {
        id: `ref-${Date.now()}`,
        refereeName,
        refereeEmail,
        signupDate: currentTimestamp,
        status: 'Fraud Flagged',
        creditsEarned: 0,
        ipAddress: simulatedIp,
        deviceFingerprint: simulatedDevice
      };

      setReferralStats(prev => ({
        ...prev,
        records: [fraudRecord, ...prev.records]
      }));

      showToast(`Security check failed: ${fraudReason}`, 'error');
    } else {
      log('✅ Verification passed: Unique IP and Device Fingerprint verified.');

      if (simulatedAction === 'signup') {
        // Sign up: Referee gets Y (5) promo credits, Referrer gets nothing yet (gets on purchase)
        log(`Reward: Referee granted +5 welcome promo credits.`);
        log(`Referrer status updated to: "Signed Up"`);

        const newRecord: ReferralRecord = {
          id: `ref-${Date.now()}`,
          refereeName,
          refereeEmail,
          signupDate: currentTimestamp,
          status: 'Signed Up',
          creditsEarned: 0,
          ipAddress: simulatedIp,
          deviceFingerprint: simulatedDevice
        };

        setReferralStats(prev => ({
          ...prev,
          totalReferrals: prev.totalReferrals + 1,
          records: [newRecord, ...prev.records]
        }));

        showToast(`Simulation: ${refereeName} signed up successfully! Check passed.`, 'success');
      } else {
        // Purchase: Referrer gets X (15) bonus credits, Referee has purchased
        log(`Reward: Referee purchased a package! Referrer "${referralStats.referralCode}" granted +15 credits.`);
        
        // Update balance
        setCredits(credits + 15);

        // Add transaction log
        const txId = `tx-${Date.now()}`;
        setTransactions(prev => [
          {
            id: txId,
            desc: `Referral Bonus: Referee "${refereeName}" purchased first package`,
            amount: '0',
            status: 'SUCCESS',
            date: currentTimestamp,
            type: 'referral_bonus',
            change: '+15',
            ref: `QTX-REF-${Math.floor(10000 + Math.random() * 90000)}`
          },
          ...prev
        ]);

        const newRecord: ReferralRecord = {
          id: `ref-${Date.now()}`,
          refereeName,
          refereeEmail,
          signupDate: currentTimestamp,
          status: 'First Purchase',
          creditsEarned: 15,
          ipAddress: simulatedIp,
          deviceFingerprint: simulatedDevice
        };

        setReferralStats(prev => ({
          ...prev,
          totalReferrals: prev.totalReferrals + 1,
          successfulPurchases: prev.successfulPurchases + 1,
          earnedCredits: prev.earnedCredits + 15,
          records: [newRecord, ...prev.records]
        }));

        showToast(`Simulation: Referral success! +15 credits funded to wallet!`, 'success');
      }
    }

    // Reset inputs
    setRefereeName('');
    setRefereeEmail('');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* REFERRAL REWARD BANNER */}
      <div className="bg-gradient-to-r from-[#0d1527] via-[#09101f] to-[#0d1527] border border-slate-900 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-indigo-500/10 text-indigo-400 font-bold text-[9px] uppercase tracking-wider px-4 py-1.5 rounded-bl-xl border-l border-b border-slate-900/40">
          Earn free credits
        </div>
        
        <div className="space-y-3 text-center md:text-left">
          <div className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs px-3 py-1 rounded-full uppercase tracking-wider font-extrabold inline-flex items-center gap-1.5 mx-auto md:mx-0">
            <Gift className="h-3.5 w-3.5" /> Qodex Partnership program
          </div>
          <h2 className="text-2xl font-black text-slate-100 tracking-tight leading-none">
            Share Qodex &amp; Get +15 Credits For Every Customer
          </h2>
          <p className="text-slate-400 text-xs max-w-2xl leading-relaxed">
            Invite local freelancers, restaurants, and startups. Your friends receive <strong className="text-emerald-400">+5 credits</strong> on signup, and you receive <strong className="text-indigo-400">+15 credits</strong> immediately on their first purchase!
          </p>
        </div>

        {/* COPY CODE CARD */}
        <div className="bg-slate-950 border border-slate-900 p-5 rounded-2xl shrink-0 w-full md:w-auto min-w-[280px]">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block mb-2 text-center md:text-left">Your Referral Link</span>
          
          <div className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-xl">
            <input
              type="text"
              readOnly
              value={referralStats.referralLink}
              className="bg-transparent text-slate-200 text-xs font-mono font-bold outline-none px-2 flex-1 w-full"
            />
            <button
              onClick={handleCopyLink}
              className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg transition-colors shrink-0"
              title="Copy link"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
          <span className="text-[9px] text-slate-500 block mt-2 text-center">Referral Code: <strong className="text-slate-300 font-mono font-bold">{referralStats.referralCode}</strong></span>
        </div>
      </div>

      {/* STATS COUNT GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Signups Referrals', value: referralStats.totalReferrals, color: 'text-indigo-400' },
          { label: 'Successful Purchases', value: referralStats.successfulPurchases, color: 'text-emerald-400' },
          { label: 'Credits Earned', value: `${referralStats.earnedCredits} Credits`, color: 'text-amber-400' },
          { label: 'Pending Potential Credits', value: `${referralStats.pendingBonus} Credits`, color: 'text-slate-400' }
        ].map((stat, idx) => (
          <div key={idx} className="bg-slate-950 border border-slate-900 rounded-2xl p-5 text-center space-y-1">
            <span className="text-[9px] uppercase font-black text-slate-500 tracking-wider block">{stat.label}</span>
            <span className={`text-xl font-black ${stat.color} block`}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* TWO COLUMNS: REFERRALS LOGS vs. FRAUD SIMULATOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* REFERRAL LOGS LIST (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-900 rounded-3xl p-6 space-y-4">
          <h3 className="text-xs uppercase font-extrabold text-slate-300 tracking-wider flex items-center gap-2 border-b border-slate-900 pb-3">
            <UserCheck className="h-4 w-4 text-emerald-400" />
            Verification Log &amp; Reward Ledgers
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-900 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  <th className="py-2.5 px-3">Friend / Referee</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 font-mono">IP Address</th>
                  <th className="py-2.5 px-3">Reward</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-900/50 text-slate-300">
                {referralStats.records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-900/10">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-200">{rec.refereeName}</div>
                      <div className="text-[10px] text-slate-500">{rec.refereeEmail}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">{rec.signupDate}</td>
                    <td className="py-3 px-3 text-slate-400 font-mono text-[10px]">{rec.ipAddress}</td>
                    <td className="py-3 px-3 font-extrabold text-emerald-400 font-mono">
                      {rec.creditsEarned > 0 ? `+${rec.creditsEarned} Cr` : '—'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${rec.status === 'First Purchase' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : (rec.status === 'Signed Up' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20')}`}>
                        {rec.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FRAUD-CHECK SIGNUP SIMULATOR (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-950 border border-slate-900 rounded-3xl p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-900 pb-3">
              <h3 className="text-xs uppercase font-extrabold text-slate-300 tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-indigo-400" />
                Anti-Fraud Engine Simulator
              </h3>
              <span className="text-[9px] uppercase font-mono bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-indigo-300">
                IP &amp; Cookie Fingerprints
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-normal">
              Test dynamic sybil defense triggers. Referrers attempting self-referral, duplicate browser configs, or matching subnet ranges will be blocked and flagged automatically.
            </p>

            {/* SIMULATOR INPUT FIELDS */}
            <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-2xl space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Referee Name</label>
                  <input
                    type="text"
                    value={refereeName}
                    onChange={(e) => setRefereeName(e.target.value)}
                    placeholder="Amadi Nwachukwu"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Referee Email</label>
                  <input
                    type="email"
                    value={refereeEmail}
                    onChange={(e) => setRefereeEmail(e.target.value)}
                    placeholder="amadi@ikejafoods.ng"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
                    <Globe className="h-3 w-3 text-indigo-400" /> IP Address
                  </label>
                  <input
                    type="text"
                    value={simulatedIp}
                    onChange={(e) => setSimulatedIp(e.target.value)}
                    placeholder="102.89.44.20"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
                    <Smartphone className="h-3 w-3 text-indigo-400" /> Device Signature
                  </label>
                  <input
                    type="text"
                    value={simulatedDevice}
                    onChange={(e) => setSimulatedDevice(e.target.value)}
                    placeholder="df-chrome-ios-4190"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 items-center pt-1.5">
                <span className="text-[10px] text-slate-500 font-bold">Simulate Action:</span>
                <button
                  type="button"
                  onClick={() => setSimulatedAction('signup')}
                  className={`px-3 py-1 rounded text-[10px] font-bold border transition-all ${simulatedAction === 'signup' ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/40' : 'bg-transparent border-slate-800 text-slate-400'}`}
                >
                  Welcome Signup
                </button>
                <button
                  type="button"
                  onClick={() => setSimulatedAction('purchase')}
                  className={`px-3 py-1 rounded text-[10px] font-bold border transition-all ${simulatedAction === 'purchase' ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/40' : 'bg-transparent border-slate-800 text-slate-400'}`}
                >
                  First Credit Purchase
                </button>
              </div>

              {/* QUICK CLICK PRESETS FOR TESTING FRAUD */}
              <div className="pt-2 border-t border-slate-850/60 flex flex-wrap gap-2 justify-between items-center">
                <span className="text-[9px] text-slate-500">Test Preset Scenarios:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRefereeName('Kunle Fake Account');
                      setRefereeEmail('kunle.fraud@fake.com');
                      setSimulatedIp('102.89.44.11'); // Referrer's IP!
                      setSimulatedDevice('df-chrome-android-77921'); // Referrer's Device!
                      showToast('Loaded self-referral cheat scenario', 'info');
                    }}
                    className="text-[9px] font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded"
                  >
                    Self-Referral Fraud
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRefereeName('Emeka Okafor');
                      setRefereeEmail('emeka@lekki.ng');
                      setSimulatedIp('102.89.20.105');
                      setSimulatedDevice('df-safari-ios-44111');
                      showToast('Loaded clean referee signup scenario', 'info');
                    }}
                    className="text-[9px] font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded"
                  >
                    Clean Referral
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SIMULATOR LOG OUTPUT */}
          <div className="space-y-2 mt-4">
            <span className="text-[10px] uppercase font-bold text-slate-500 block flex items-center gap-1">
              <Terminal className="h-3.5 w-3.5 text-indigo-400" /> Security Engine Terminal Log
            </span>
            <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4 font-mono text-[10px] text-slate-300 space-y-1.5 h-36 overflow-y-auto max-w-full leading-relaxed">
              {simLogs.map((logStr, lIdx) => (
                <div key={lIdx} className={logStr.includes('FRAUD') ? 'text-rose-400' : logStr.includes('passed') ? 'text-emerald-400' : 'text-slate-300'}>
                  {logStr}
                </div>
              ))}
            </div>

            <button
              onClick={triggerRefereeSimulation}
              className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-extrabold py-3 rounded-2xl text-xs shadow-md flex items-center justify-center gap-1.5"
            >
              <Play className="h-3.5 w-3.5" /> Execute Simulated Check
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
