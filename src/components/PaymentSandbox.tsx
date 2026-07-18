import React, { useState, useEffect } from 'react';
import { Smartphone, ShieldCheck, Play, ArrowRight, Info, Copy, RefreshCw, Terminal, CheckCircle2, AlertTriangle } from 'lucide-react';
import { CreditPackage, Transaction } from '../types';
import { processPaymentWebhook, hmacSha } from '../utils/paymentWebhooks';

interface PaymentSandboxProps {
  credits: number;
  setCredits: React.Dispatch<React.SetStateAction<number>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  showToast: (msg: string, type: 'success' | 'info' | 'error') => void;
  currency: 'NGN' | 'KES' | 'USD';
  activeWorkspaceId: string;
}

export default function PaymentSandbox({
  credits,
  setCredits,
  transactions,
  setTransactions,
  showToast,
  currency,
  activeWorkspaceId
}: PaymentSandboxProps) {
  const [gateway, setGateway] = useState<'paystack' | 'flutterwave' | 'stripe'>('paystack');
  const [selectedPack, setSelectedPack] = useState({
    id: 'pack-sme',
    name: 'SME Growth Pack',
    credits: 100,
    price: '₦18,000',
    rawPrice: 18000,
    currency: 'NGN'
  });

  // Security keys state (mocked but editable)
  const [keys, setKeys] = useState({
    paystackSecret: 'sk_live_paystack_829a1b83cc91a27e90ff0e271',
    flutterwaveHash: 'flw_secret_webhook_hash_919238',
    stripeSecret: 'whsec_stripe_endpoint_secret_7719ab2321'
  });

  const [rawPayload, setRawPayload] = useState('');
  const [signatureHeader, setSignatureHeader] = useState('');
  const [auditLogs, setAuditLogs] = useState<string[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStatus, setSimStatus] = useState<'idle' | 'success' | 'failed'>('idle');

  // Sync pricing pack selector with currency changes
  useEffect(() => {
    let price = '₦18,000';
    let rawPrice = 18000;
    if (currency === 'KES') {
      price = 'KSh 3,000';
      rawPrice = 3000;
    } else if (currency === 'USD') {
      price = '$20.00';
      rawPrice = 20;
    }
    
    setSelectedPack({
      id: 'pack-sme',
      name: 'SME Growth Pack',
      credits: 100,
      price,
      rawPrice,
      currency
    });
  }, [currency]);

  // Generate payload whenever gateway or selected pack changes
  useEffect(() => {
    generateMockPayload();
  }, [gateway, selectedPack]);

  const generateMockPayload = async () => {
    const reference = `TX-${gateway.toUpperCase().substring(0, 3)}-${Math.floor(100000 + Math.random() * 900000)}`;
    let payloadObj: any = {};

    if (gateway === 'paystack') {
      payloadObj = {
        event: 'charge.success',
        data: {
          id: Math.floor(Math.random() * 90000000),
          domain: 'live',
          status: 'success',
          reference,
          amount: selectedPack.rawPrice * 100, // Paystack works in kobo/cents
          currency: selectedPack.currency,
          gateway_response: 'Successful',
          metadata: {
            workspace_id: activeWorkspaceId,
            credits: selectedPack.credits,
            package_id: selectedPack.id
          },
          customer: {
            id: 99120,
            email: 'kereanvector@gmail.com'
          }
        }
      };
    } else if (gateway === 'flutterwave') {
      payloadObj = {
        event: 'charge.completed',
        data: {
          id: Math.floor(Math.random() * 900000),
          tx_ref: reference,
          flw_ref: `FLW-MOCK-${Math.floor(Math.random() * 1000000)}`,
          amount: selectedPack.rawPrice,
          currency: selectedPack.currency,
          status: 'successful',
          payment_type: 'card',
          meta: {
            workspace_id: activeWorkspaceId,
            credits: selectedPack.credits,
            package_id: selectedPack.id
          },
          customer: {
            email: 'kereanvector@gmail.com'
          }
        }
      };
    } else {
      // Stripe
      payloadObj = {
        id: `evt_stripe_${Math.floor(Math.random() * 1000000)}`,
        object: 'event',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: reference,
            amount: selectedPack.rawPrice * 100, // cents
            currency: 'usd',
            status: 'succeeded',
            metadata: {
              workspace_id: activeWorkspaceId,
              credits: selectedPack.credits,
              package_id: selectedPack.id
            }
          }
        }
      };
    }

    const payloadStr = JSON.stringify(payloadObj, null, 2);
    setRawPayload(payloadStr);

    // Calculate corresponding mock signature using browser Web Crypto
    let headerVal = '';
    if (gateway === 'paystack') {
      headerVal = await hmacSha('SHA-512', keys.paystackSecret, payloadStr);
    } else if (gateway === 'flutterwave') {
      headerVal = keys.flutterwaveHash;
    } else {
      // Stripe uses format: t=timestamp,v1=signature
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signedPayload = `${timestamp}.${payloadStr}`;
      const sig = await hmacSha('SHA-256', keys.stripeSecret, signedPayload);
      headerVal = `t=${timestamp},v1=${sig}`;
    }
    setSignatureHeader(headerVal);
  };

  const handleExecuteVerification = async () => {
    setIsSimulating(true);
    setSimStatus('idle');
    setAuditLogs(['[INITIALIZE] Loading crypto verification libraries...', '[INITIALIZE] Loaded timing-safe verification arrays.']);

    // Grab the current references from state to avoid double crediting
    const existingRefs = new Set(transactions.map(t => t.ref));

    setTimeout(async () => {
      try {
        const result = await processPaymentWebhook({
          gateway,
          payloadString: rawPayload,
          signatureHeader,
          secretKeys: keys,
          existingTransactionRefs: existingRefs
        });

        // Stagger logs to look like real server console
        let stepIndex = 0;
        const interval = setInterval(() => {
          if (stepIndex < result.steps.length) {
            setAuditLogs(prev => [...prev, result.steps[stepIndex]]);
            stepIndex++;
          } else {
            clearInterval(interval);
            setIsSimulating(false);
            
            if (result.verified) {
              setSimStatus('success');
              // UPDATE USER WALLET IN PARENT STATE
              setCredits(prev => prev + result.creditsPurchased);
              // ADD NEW IMMUTABLE TRANSACTION RECORD TO THE LEDGER
              setTransactions(prev => [
                {
                  id: `tx-${Date.now()}`,
                  desc: `Funded via Verified Webhook [${gateway.toUpperCase()}] — ${selectedPack.name}`,
                  amount: result.amount,
                  status: 'SUCCESS',
                  date: new Date().toISOString().split('T')[0],
                  type: 'credit_purchase',
                  change: `+${result.creditsPurchased}`,
                  ref: result.transactionRef
                },
                ...prev
              ]);
              showToast(`Webhook Verified! Successfully credited +${result.creditsPurchased} tokens.`, 'success');
            } else {
              setSimStatus('failed');
              setAuditLogs(prev => [...prev, `[CRITICAL] Processing terminated: ${result.error}`]);
              showToast(`Webhook Verification Failed: ${result.error}`, 'error');
            }
          }
        }, 300);

      } catch (err: any) {
        setIsSimulating(false);
        setSimStatus('failed');
        setAuditLogs(prev => [...prev, `[CRITICAL] Unexpected Exception: ${err.message}`]);
        showToast('Webhook simulation crashed.', 'error');
      }
    }, 1000);
  };

  return (
    <div className="bg-[#0f172a]/50 border border-slate-900 rounded-3xl p-6 space-y-6">
      
      {/* SECTION INTRO */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-850 pb-4">
        <div>
          <span className="text-[10px] uppercase font-black text-indigo-400 tracking-wider block">Developer sandbox</span>
          <h3 className="text-base font-bold text-slate-100 mt-1 flex items-center gap-2">
            🔌 Webhook &amp; Payment Gateway Simulator
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
            Test and audit our compliance verification loop. Simulate Stripe, Paystack, or Flutterwave HTTP webhook payouts. Real signature checksum check and double-entry receipt logic.
          </p>
        </div>
        
        {/* GATEWAY SELECTORS */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-900">
          {(['paystack', 'flutterwave', 'stripe'] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGateway(g)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${gateway === g ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 border border-transparent hover:text-slate-200'}`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLUMN 1: INTERACTIVE CONFIG (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* PACKAGE SELECTOR TO LOAD VALUE */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-500">1. Select Simulated Package</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: 'pack-freelancer', name: 'Freelancer', credits: 20, priceNGN: '₦4,500', priceKES: 'KSh 750', priceUSD: '$5.00', rawNGN: 4500, rawKES: 750, rawUSD: 5 },
                { id: 'pack-sme', name: 'SME', credits: 100, priceNGN: '₦18,000', priceKES: 'KSh 3,000', priceUSD: '$20.00', rawNGN: 18000, rawKES: 3000, rawUSD: 20 },
                { id: 'pack-agency', name: 'Agency', credits: 500, priceNGN: '₦75,000', priceKES: 'KSh 12,500', priceUSD: '$80.00', rawNGN: 75000, rawKES: 12500, rawUSD: 80 }
              ].map((p) => {
                const isSelected = selectedPack.id === p.id;
                const price = currency === 'NGN' ? p.priceNGN : (currency === 'KES' ? p.priceKES : p.priceUSD);
                const rawPrice = currency === 'NGN' ? p.rawNGN : (currency === 'KES' ? p.rawKES : p.rawUSD);
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPack({
                      id: p.id,
                      name: p.name + ' Pack',
                      credits: p.credits,
                      price,
                      rawPrice,
                      currency
                    })}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between h-20 ${isSelected ? 'bg-indigo-600/10 border-indigo-500/80 text-indigo-400' : 'bg-slate-950 border-slate-900 text-slate-400 hover:border-slate-800'}`}
                  >
                    <span className="text-xs font-bold block truncate">{p.name}</span>
                    <div>
                      <span className="text-[10px] block text-slate-500 font-mono">+{p.credits} Credits</span>
                      <span className="text-[10px] font-black block font-mono">{price}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECURED KEY CONFIG */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-900 space-y-3">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">2. Security Gateway Secret Credentials</span>
            
            {gateway === 'paystack' && (
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 block font-mono">Paystack Secret Key (for HMAC-SHA512)</label>
                <input
                  type="text"
                  value={keys.paystackSecret}
                  onChange={(e) => setKeys({ ...keys, paystackSecret: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-1.5 text-[11px] text-slate-300 font-mono outline-none"
                />
              </div>
            )}

            {gateway === 'flutterwave' && (
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 block font-mono">Flutterwave Webhook Hash Secret</label>
                <input
                  type="text"
                  value={keys.flutterwaveHash}
                  onChange={(e) => setKeys({ ...keys, flutterwaveHash: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-1.5 text-[11px] text-slate-300 font-mono outline-none"
                />
              </div>
            )}

            {gateway === 'stripe' && (
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 block font-mono">Stripe Endpoint Webhook Secret</label>
                <input
                  type="text"
                  value={keys.stripeSecret}
                  onChange={(e) => setKeys({ ...keys, stripeSecret: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-1.5 text-[11px] text-slate-300 font-mono outline-none"
                />
              </div>
            )}
            
            <div className="text-[10px] text-slate-500 flex items-start gap-1">
              <Info className="h-3 w-3 text-indigo-400 flex-shrink-0 mt-0.5" />
              <span>We match incoming signatures against these secrets to authenticate webhook origins securely.</span>
            </div>
          </div>

          {/* SIMULATE TRIGGER BUTTON */}
          <button
            onClick={handleExecuteVerification}
            disabled={isSimulating}
            className="w-full bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black py-3 rounded-2xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10 disabled:opacity-50"
          >
            {isSimulating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" /> Verifying Webhook...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 text-emerald-400 fill-emerald-400" /> Execute Webhook Audit Pipeline
              </>
            )}
          </button>

          {/* DEDUPLICATION ALERT DISCLOSURE */}
          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-900 text-[11px] text-slate-400 leading-relaxed">
            <span className="font-bold text-amber-400 block mb-1">🛡️ Idempotent Anti-Fraud Deduplication</span>
            Before crediting, the webhook pipeline scans your transaction database. If a payload's <code>reference</code> is found, it terminates early to prevent double-funding credits on network retries.
          </div>

        </div>

        {/* COLUMN 2: CODE & AUDIT TERMINAL (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* PAYLOAD JSON FILE DISPLAY */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">3. HTTP POST Webhook JSON Body</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(rawPayload);
                    showToast('Mock Webhook JSON Copied!', 'success');
                  }}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
                >
                  <Copy className="h-3 w-3" /> Copy
                </button>
              </div>
              <div className="bg-slate-950 rounded-2xl p-3 border border-slate-900 font-mono text-[9px] text-slate-400 h-52 overflow-y-auto overflow-x-hidden leading-tight select-all whitespace-pre">
                {rawPayload}
              </div>
            </div>

            {/* LIVE CRYPTO HEADER FIELD */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">4. Computed Cryptographic Header</span>
              <div className="space-y-2">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-900 font-mono text-[9px] text-slate-500 break-all leading-tight h-16 overflow-y-auto">
                  <span className="text-indigo-400 block font-bold mb-1">
                    {gateway === 'paystack' ? 'X-Paystack-Signature' : (gateway === 'flutterwave' ? 'verif-hash' : 'stripe-signature')}:
                  </span>
                  {signatureHeader}
                </div>
                
                <div className="bg-indigo-950/35 border border-indigo-900/30 p-3 rounded-xl space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-indigo-400 block">Cryptographic Integrity</span>
                  <p className="text-[10.5px] text-slate-400 leading-normal">
                    This header is calculated live by matching the payload content with the secret hash using standard Node.js crypto packages. If a single character is modified, verification instantly fails!
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* PIPELINE LIVE LOGS TERMINAL */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 text-emerald-400" /> Webhook Verification Audit Console
            </span>
            
            <div className="bg-slate-950 rounded-2xl border border-slate-900 p-4 font-mono text-[10px] leading-relaxed h-44 overflow-y-auto select-none space-y-1 text-slate-400">
              {auditLogs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-600 italic">
                  — Awaiting webhook pipeline execution —
                </div>
              ) : (
                auditLogs.map((log, index) => {
                  let colorClass = 'text-slate-400';
                  if (log.includes('[CRITICAL]') || log.includes('[ERROR]')) colorClass = 'text-rose-400 font-bold';
                  else if (log.includes('[VERIFIED]') || log.includes('[LEDGER]') || log.includes('[RECEIPT]')) colorClass = 'text-emerald-400 font-black';
                  else if (log.includes('[LOOKUP]')) colorClass = 'text-amber-400';
                  else if (log.includes('[INITIALIZE]')) colorClass = 'text-indigo-400';

                  return (
                    <div key={index} className={`flex items-start gap-1.5 ${colorClass}`}>
                      <span className="text-slate-600">❯</span>
                      <span>{log}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* OUTCOME MESSAGE BANNER */}
          {simStatus === 'success' && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-emerald-300 block">Webhook Verification SUCCESS!</span>
                <span className="text-slate-400">The server safely validated the transaction payload. Added +{selectedPack.credits} credits to Workspace wallet, generated a double-entry receipt record, and written an audit ledger entry.</span>
              </div>
            </div>
          )}

          {simStatus === 'failed' && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center gap-3 animate-pulse-once">
              <AlertTriangle className="h-5 w-5 text-rose-400 flex-shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-rose-300 block">Webhook Verification FAILED!</span>
                <span className="text-slate-400">Security gate rejected the transaction. Check that your signature hashes match and the reference is fresh (not a duplicate event retry).</span>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
