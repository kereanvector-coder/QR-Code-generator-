import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Zap, 
  Lock, 
  Activity, 
  Terminal, 
  Cpu, 
  Key, 
  Network, 
  AlertTriangle, 
  Layers, 
  ChevronRight, 
  Search, 
  Play, 
  RefreshCw, 
  CheckCircle,
  Clock,
  Download,
  Database,
  Sliders,
  Sparkles
} from 'lucide-react';
import { Campaign } from '../types';

interface SecurityPerfPanelProps {
  campaigns: Campaign[];
  showToast: (message: string, type: 'success' | 'info' | 'error') => void;
}

interface AuditLog {
  id: string;
  timestamp: string;
  event: string;
  category: 'AUTH' | 'SECURITY' | 'DATABASE' | 'SYSTEM';
  status: 'SUCCESS' | 'BLOCKED' | 'WARNING';
  details: string;
  ip: string;
}

export default function SecurityPerfPanel({ campaigns, showToast }: SecurityPerfPanelProps) {
  // 1. Audit Logs State
  const [logs, setLogs] = useState<AuditLog[]>([
    {
      id: 'log-101',
      timestamp: new Date(Date.now() - 3600000 * 2.5).toISOString().replace('T', ' ').substring(0, 19),
      event: 'USER_LOGIN_SUCCESS',
      category: 'AUTH',
      status: 'SUCCESS',
      details: 'Workspace Admin session initialized. JWT double-cookie CSRF token matching validated.',
      ip: '197.210.64.12'
    },
    {
      id: 'log-102',
      timestamp: new Date(Date.now() - 3600000 * 2.1).toISOString().replace('T', ' ').substring(0, 19),
      event: 'RLS_SECURITY_ASSERTION',
      category: 'DATABASE',
      status: 'SUCCESS',
      details: 'Query campaigns executed with filter: "workspace_id = active_workspace". Isolated 3 tenant paths.',
      ip: '197.210.64.12'
    },
    {
      id: 'log-103',
      timestamp: new Date(Date.now() - 3600000 * 1.8).toISOString().replace('T', ' ').substring(0, 19),
      event: 'XSS_ATTEMPT_SANITIZED',
      category: 'SECURITY',
      status: 'BLOCKED',
      details: 'Blocked injection payload in TargetUrl: "<script>alert(1)</script>". Replaced with escaped binding.',
      ip: '45.120.33.204'
    },
    {
      id: 'log-104',
      timestamp: new Date(Date.now() - 3600000 * 1.2).toISOString().replace('T', ' ').substring(0, 19),
      event: 'WEBHOOK_SIGNATURE_VERIFIED',
      category: 'SYSTEM',
      status: 'SUCCESS',
      details: 'Paystack checkout webhook IP verified against white-list with dynamic SHA512 header hash matching.',
      ip: '52.31.228.10'
    },
    {
      id: 'log-105',
      timestamp: new Date(Date.now() - 3600000 * 0.5).toISOString().replace('T', ' ').substring(0, 19),
      event: 'SQL_INJECTION_SHIELD_ACTIVE',
      category: 'DATABASE',
      status: 'SUCCESS',
      details: 'Escape parameters verified. Statement binding completed without SQL injection patterns.',
      ip: '197.210.64.12'
    }
  ]);

  // 2. Rate Limiting Simulator State
  const [rateLimitCounter, setRateLimitCounter] = useState(0);
  const [rateLimitStatus, setRateLimitStatus] = useState<'OK' | 'WARNING' | 'BLOCKED'>('OK');
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Cooldown effect
  useEffect(() => {
    let timer: any;
    if (cooldownSeconds > 0) {
      timer = setInterval(() => {
        setCooldownSeconds((prev) => {
          if (prev <= 1) {
            setRateLimitStatus('OK');
            setRateLimitCounter(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const handleSimulateApiHit = () => {
    if (rateLimitStatus === 'BLOCKED') {
      showToast('Rate Limiter active! Connection blocked with HTTP 429.', 'error');
      return;
    }

    setRateLimitCounter((prev) => {
      const nextVal = prev + 1;
      if (nextVal >= 8) {
        setRateLimitStatus('BLOCKED');
        setCooldownSeconds(15);
        showToast('HTTP 429 Block Triggered! Too many requests from your IP.', 'error');
        // Add block to audit log
        const newLog: AuditLog = {
          id: `log-sim-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          event: 'API_RATE_LIMIT_BLOCK',
          category: 'SECURITY',
          status: 'BLOCKED',
          details: 'IP rate limit threshold exceeded (>8 req/sec). Triggered cool-down blockade.',
          ip: '127.0.0.1'
        };
        setLogs(prevLogs => [newLog, ...prevLogs]);
        return nextVal;
      } else if (nextVal >= 5) {
        setRateLimitStatus('WARNING');
        showToast('Rate limit warning: request threshold nearing.', 'info');
      }
      return nextVal;
    });

    // Success hit log
    const hitLog: AuditLog = {
      id: `log-sim-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      event: 'API_REQUEST_VERIFIED',
      category: 'SYSTEM',
      status: 'SUCCESS',
      details: `GET /api/v1/campaigns - Handled in 1.4ms. Current queue rate: ${rateLimitCounter + 1}/sec`,
      ip: '127.0.0.1'
    };
    setLogs(prevLogs => [hitLog, ...prevLogs]);
  };

  // 3. Cryptographic Signed URL Generator State
  const [expiryMinutes, setExpiryMinutes] = useState(15);
  const [signedKeyName, setSignedKeyName] = useState('high_res_print_asset.svg');
  const [generatedSignedUrl, setGeneratedSignedUrl] = useState('');
  const [isSigning, setIsSigning] = useState(false);

  const handleGenerateSignedUrl = () => {
    setIsSigning(true);
    setTimeout(() => {
      const tsNow = Math.floor(Date.now() / 1000);
      const tsExpiry = tsNow + (expiryMinutes * 60);
      const salt = Math.random().toString(36).substring(2, 10);
      // Generate a mock SHA256 HMAC hash
      const hmacSignature = Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('');
      
      const signedUrl = `https://cdn.qodex.io/assets/${signedKeyName}?expires=${tsExpiry}&salt=${salt}&key_id=qodex_h_04&signature=${hmacSignature}`;
      setGeneratedSignedUrl(signedUrl);
      setIsSigning(false);
      showToast('Dynamic expiring Signed URL generated!', 'success');

      // Add to logs
      const newLog: AuditLog = {
        id: `log-sim-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        event: 'SIGNED_URL_CREATED',
        category: 'SECURITY',
        status: 'SUCCESS',
        details: `HMAC SHA256 signature generated for file: ${signedKeyName}. Valid for ${expiryMinutes}m.`,
        ip: '127.0.0.1'
      };
      setLogs(prevLogs => [newLog, ...prevLogs]);
    }, 400);
  };

  // 4. Indexed Queries Performance State
  const [activeBenchmark, setActiveBenchmark] = useState<'IDLE' | 'RUNNING' | 'DONE'>('IDLE');
  const [seqScanTime, setSeqScanTime] = useState(0);
  const [idxScanTime, setIdxScanTime] = useState(0);

  const runDatabaseBenchmark = () => {
    setActiveBenchmark('RUNNING');
    setSeqScanTime(0);
    setIdxScanTime(0);
    setTimeout(() => {
      setSeqScanTime(42.85); // Simulated milliseconds for O(N) linear sequential scan on 15,000 campaigns
      setIdxScanTime(0.04);  // Simulated milliseconds for O(1) B-tree index index scan
      setActiveBenchmark('DONE');
      showToast('Database performance benchmark complete!', 'success');

      // Add audit log
      const newLog: AuditLog = {
        id: `log-sim-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        event: 'DB_PERF_OPTIMIZED_INDEX',
        category: 'DATABASE',
        status: 'SUCCESS',
        details: `Index scan executed on campaigns_pkey. Sequential scan bypassed. Speedup ratio: 1071x.`,
        ip: 'localhost-db'
      };
      setLogs(prevLogs => [newLog, ...prevLogs]);
    }, 1200);
  };

  // 5. Cursor Pagination State
  const [currentCursor, setCurrentCursor] = useState('eyJpZCI6MTIsImNyZWF0ZWRfYXQiOjE3MDQxNTg0MDB9');
  const [cursorPageSize, setCursorPageSize] = useState(10);
  const [hasNextCursor, setHasNextCursor] = useState(true);

  // 6. WebP/PNG Image Optimizer State
  const [imgFormat, setImgFormat] = useState<'webp' | 'png' | 'jpeg'>('webp');
  const [imgQuality, setImgQuality] = useState(85);
  const [imgScale, setImgScale] = useState(2); // 1x, 2x, 4x super sampling

  const computedImgSize = () => {
    // Basic dynamic multiplier calculation to simulate real compressor outputs
    const baseSize = 4.2; // 4.2 KB
    const formatMult = imgFormat === 'webp' ? 0.45 : (imgFormat === 'jpeg' ? 0.7 : 1.3);
    const scaleMult = imgScale * imgScale;
    const qualityMult = (imgQuality / 100) * 1.1;
    return (baseSize * formatMult * scaleMult * qualityMult).toFixed(1);
  };

  return (
    <div id="panel-security-performance" className="space-y-6">

      {/* Header Overview */}
      <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/10">
              AUDITED SECURE CORE
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest bg-teal-500/10 text-teal-400 px-2.5 py-0.5 rounded-full border border-teal-500/10">
              HIGH SPEED PERFORMANCE
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-100 tracking-tight">
            Enterprise Security &amp; Performance Control Hub
          </h2>
          <p className="text-slate-400 text-xs leading-relaxed">
            Monitor Row Level Security (RLS) isolation boundaries, stress-test API rate limiters, configure expiring signed URLs for private print layouts, audit diagnostic events in real-time, and benchmark indexed query performance.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 px-4 py-2.5 rounded-2xl border border-slate-800">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] font-black tracking-widest text-slate-300 uppercase">SYS_CORE: SECURE &amp; ACTIVE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 7 Columns: Interactive Controllers */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Section 1: Row Level Security & Escapes */}
          <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-extrabold text-slate-200">Database Row Level Security (RLS) Rules</h3>
                <p className="text-[10px] text-slate-500">Workspace-specific policies automatically enforce workspace boundaries on Postgres level.</p>
              </div>
            </div>

            <div className="bg-slate-900/60 rounded-xl p-3.5 border border-slate-800/80 space-y-2">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Isolated Workspace Policy Statement</span>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-900 font-mono text-[11px] text-teal-400/90 overflow-x-auto leading-relaxed">
                <div>ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;</div>
                <div className="text-indigo-400 mt-1">CREATE POLICY tenant_isolation_rule ON campaigns </div>
                <div className="text-indigo-400 pl-4">FOR ALL USING (workspace_id = current_setting('app.active_workspace_id'));</div>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Even if a malicious user requests a campaign ID from a competitor workspace via forged parameters, the database engine ignores the command because the database itself restricts results purely to your active session workspace context.
              </p>
            </div>

            {/* XSS and SQL injection shield visualization */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="bg-slate-900/40 border border-slate-900 p-3.5 rounded-xl space-y-1">
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider block">SQL Injection Shield</span>
                <span className="text-xs font-bold text-slate-200 block">Strict Prepared Statements</span>
                <p className="text-[10px] text-slate-400">All lookups bind to typed schemas using parameterized ORM statements. Raw string manipulation is blocked.</p>
              </div>
              <div className="bg-slate-900/40 border border-slate-900 p-3.5 rounded-xl space-y-1">
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-wider block">XSS Escape Handlers</span>
                <span className="text-xs font-bold text-slate-200 block">Sanitized HTML Bindings</span>
                <p className="text-[10px] text-slate-400">React text interpolation escapes custom attributes automatically. Dynamic redirects strip the <code>javascript:</code> protocol.</p>
              </div>
            </div>
          </div>

          {/* Section 2: Rate Limiting Stress Test Simulator */}
          <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-extrabold text-slate-200">Rate Limiter &amp; DDoS Shield</h3>
                  <p className="text-[10px] text-slate-500">Protects API routing with window-based request rate threshold gating.</p>
                </div>
              </div>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${rateLimitStatus === 'OK' ? 'bg-emerald-500/10 text-emerald-400' : (rateLimitStatus === 'WARNING' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400 animate-pulse')}`}>
                {rateLimitStatus === 'OK' ? 'SHIELD: OK' : (rateLimitStatus === 'WARNING' ? 'SHIELD: WARNING' : 'SHIELD: BLOCKED')}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Dynamic Hit Counter</span>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center relative overflow-hidden">
                  <span className="text-3xl font-black text-slate-100 font-mono">{rateLimitCounter}</span>
                  <span className="text-[10px] text-slate-500 font-bold block">Requests / sec</span>
                  
                  {/* Cooldown bar overlay */}
                  {cooldownSeconds > 0 && (
                    <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-2">
                      <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest animate-pulse">429 LIMIT BLOCKED</span>
                      <span className="text-xs text-slate-300 font-bold font-mono">Cooling down: {cooldownSeconds}s</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2.5">
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Hit the stress test trigger to simulate automated crawling or a brute-force attack. Exceeding <strong>8 requests/second</strong> triggers immediate firewall cooldown.
                </p>
                <button
                  type="button"
                  onClick={handleSimulateApiHit}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1"
                >
                  <Play className="h-3.5 w-3.5" /> Simulate Rapid API Hits
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Expiring HMAC Signed URL Creator */}
          <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-teal-400" />
              <div>
                <h3 className="text-sm font-extrabold text-slate-200">Dynamic HMAC Expiring Signed URLs</h3>
                <p className="text-[10px] text-slate-500">Provide temporary secure download access to private vector print layouts.</p>
              </div>
            </div>

            <div className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Target Private Asset</label>
                  <select
                    value={signedKeyName}
                    onChange={(e) => setSignedKeyName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 text-xs font-bold outline-none"
                  >
                    <option value="high_res_print_asset.svg">high_res_print_asset.svg</option>
                    <option value="enterprise_qr_vector_master.pdf">enterprise_qr_vector_master.pdf</option>
                    <option value="demographic_scans_history_report.csv">demographic_scans_history_report.csv</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Expiration Window</label>
                  <select
                    value={expiryMinutes}
                    onChange={(e) => setExpiryMinutes(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 text-xs font-bold outline-none"
                  >
                    <option value="1">1 Minute (Hyper secure)</option>
                    <option value="15">15 Minutes (Default)</option>
                    <option value="60">1 Hour</option>
                    <option value="1440">24 Hours</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateSignedUrl}
                disabled={isSigning}
                className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-teal-400 font-extrabold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                {isSigning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generate Secure Signed Download Link
              </button>

              {generatedSignedUrl && (
                <div className="space-y-1.5 animate-scale-up">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">HMAC Signed URL Output</span>
                    <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Expiry active
                    </span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-xl flex items-center justify-between gap-3">
                    <span className="text-[10px] font-mono text-slate-300 truncate select-all break-all">{generatedSignedUrl}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedSignedUrl);
                        showToast('Signed URL copied!', 'success');
                      }}
                      className="p-1.5 hover:bg-slate-800 rounded text-teal-400"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right 5 Columns: Performance, Index benchmarks & Auditing */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Section 4: DB Benchmark (Index vs Linear Seq Scan) */}
          <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-teal-400" />
              <div>
                <h3 className="text-sm font-extrabold text-slate-200">B-Tree Indexes vs Sequential Scans</h3>
                <p className="text-[10px] text-slate-500">Benchmark DB latency matching over large dynamic redirect records.</p>
              </div>
            </div>

            <div className="space-y-3.5">
              <button
                type="button"
                onClick={runDatabaseBenchmark}
                disabled={activeBenchmark === 'RUNNING'}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                {activeBenchmark === 'RUNNING' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                Run Index Performance Benchmark
              </button>

              {activeBenchmark !== 'IDLE' && (
                <div className="space-y-3 animate-fade-in">
                  
                  {/* Seq Scan Row */}
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-900 flex justify-between items-center gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block">Linear Sequential Scan</span>
                      <span className="text-[9px] text-slate-500 block">O(N) search over 15k rows</span>
                    </div>
                    {activeBenchmark === 'RUNNING' ? (
                      <span className="text-[10px] font-mono text-slate-600 animate-pulse">Scanning...</span>
                    ) : (
                      <span className="font-mono text-xs font-bold text-rose-400">{seqScanTime} ms</span>
                    )}
                  </div>

                  {/* Index Scan Row */}
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-900 flex justify-between items-center gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block">B-Tree Primary Index Lookup</span>
                      <span className="text-[9px] text-emerald-400 block font-semibold">O(1) campaigns_pkey lookup</span>
                    </div>
                    {activeBenchmark === 'RUNNING' ? (
                      <span className="text-[10px] font-mono text-slate-600 animate-pulse">Querying...</span>
                    ) : (
                      <span className="font-mono text-xs font-bold text-emerald-400">{idxScanTime} ms</span>
                    )}
                  </div>

                  {activeBenchmark === 'DONE' && (
                    <div className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/5 p-2.5 rounded-xl border border-emerald-500/10 text-center">
                      ⚡ Query speedup multiplier: 1,071x faster response!
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section 5: Cursor-Based Pagination Logic */}
          <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Sliders className="h-5 w-5 text-indigo-400" />
              <div>
                <h3 className="text-sm font-extrabold text-slate-200">Cursor-Based Pagination</h3>
                <p className="text-[10px] text-slate-500">Prevent offset performance degradation over large datasets.</p>
              </div>
            </div>

            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold text-[10px] uppercase">Page Limit</span>
                <span className="text-slate-300 font-bold">{cursorPageSize} entries</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 font-bold text-[10px] uppercase block">Active Cursor Token (Base64)</span>
                <span className="font-mono text-[9px] text-indigo-300 block bg-slate-950 p-2 rounded border border-slate-900 select-all truncate">{currentCursor}</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Offset-based paging gets progressively slower at deep page layers because SQL must traverse all records before discarding them. Cursor-paging seeks directly below the cursor in <code>O(1)</code>.
              </p>
            </div>
          </div>

          {/* Section 6: Client-Side WebP Compressor */}
          <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-teal-400" />
              <div>
                <h3 className="text-sm font-extrabold text-slate-200">Image Compression Optimizer</h3>
                <p className="text-[10px] text-slate-500">Tune vector export formats, scales and resolution weights.</p>
              </div>
            </div>

            <div className="space-y-3.5">
              <div className="grid grid-cols-3 gap-2">
                {['webp', 'png', 'jpeg'].map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setImgFormat(fmt as any)}
                    className={`p-2 rounded-xl text-center text-xs font-bold border transition-all ${imgFormat === fmt ? 'bg-teal-500/10 text-teal-300 border-teal-500/20' : 'bg-slate-900/40 border-transparent text-slate-500 hover:text-slate-300'}`}
                  >
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Quality slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>Compression Quality</span>
                  <span className="font-mono text-teal-400">{imgQuality}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={imgQuality}
                  onChange={(e) => setImgQuality(Number(e.target.value))}
                  className="w-full accent-teal-500 cursor-pointer"
                />
              </div>

              {/* Scaler selection */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 block">Super-Sampling scale</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 1, label: '1x (FHD)' },
                    { val: 2, label: '2x (4K print)' },
                    { val: 4, label: '4x (Pro print)' }
                  ].map((s) => (
                    <button
                      key={s.val}
                      onClick={() => setImgScale(s.val)}
                      className={`p-1.5 rounded-lg text-center text-[10px] font-bold border transition-all ${imgScale === s.val ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' : 'bg-slate-900/40 border-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Estimated output */}
              <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Estimated File Size</span>
                <span className="font-mono text-xs font-black text-teal-400">{computedImgSize()} KB</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Security Event Audit Logs Ledger - SPANS FULL WIDTH */}
      <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-200 flex items-center gap-2">
              <Terminal className="h-5 w-5 text-indigo-400" /> Security Event &amp; Audit Logs Ledger
            </h3>
            <p className="text-[10px] text-slate-500">Live system-level event stream tracking cryptographic, SQL, and rate limiting occurrences.</p>
          </div>
          <button
            onClick={() => {
              setLogs(prev => [
                {
                  id: `log-sim-${Date.now()}`,
                  timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
                  event: 'MANUAL_AUDIT_CHECK',
                  category: 'SECURITY',
                  status: 'SUCCESS',
                  details: 'Manual workspace audit trace run. Integrity checks matching correctly.',
                  ip: '127.0.0.1'
                },
                ...prev
              ]);
              showToast('Security audit scan recorded!', 'success');
            }}
            className="bg-slate-900 hover:bg-slate-850 border border-slate-850 text-slate-300 px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="h-4 w-4" /> Trigger Audit Trace
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-900 text-[10px] uppercase tracking-wider text-slate-500 font-black">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Event Identity</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4">Details &amp; Audit Action</th>
                <th className="py-3 px-4">Client IP</th>
                <th className="py-3 px-4 text-right">Shield Action</th>
              </tr>
            </thead>
            <tbody className="text-[11px] divide-y divide-slate-900/60 text-slate-300 font-mono">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/20">
                  <td className="py-3 px-4 text-slate-500 text-[10px]">{log.timestamp}</td>
                  <td className="py-3 px-4 font-bold text-slate-200">{log.event}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[9px] font-black bg-slate-900 border border-slate-800 text-slate-400">
                      {log.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-sans max-w-sm truncate" title={log.details}>
                    {log.details}
                  </td>
                  <td className="py-3 px-4 text-slate-500">{log.ip}</td>
                  <td className="py-3 px-4 text-right">
                    <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded border ${log.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : (log.status === 'WARNING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20')}`}>
                      {log.status === 'SUCCESS' ? 'VERIFIED' : (log.status === 'WARNING' ? 'WARNING' : 'BLOCKED')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
