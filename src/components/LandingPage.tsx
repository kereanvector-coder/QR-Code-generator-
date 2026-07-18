import React, { useState, useEffect, useRef } from 'react';
import { 
  motion, 
  AnimatePresence 
} from 'motion/react';
import { 
  QrCode, 
  Sparkles, 
  Layers, 
  Cpu, 
  Activity, 
  Coins, 
  CheckCircle2, 
  ChevronRight, 
  Download, 
  Shield, 
  FolderPlus, 
  Eye, 
  Users, 
  ArrowRight, 
  Globe, 
  Smartphone, 
  Zap, 
  Folder, 
  Lock, 
  Calendar, 
  Menu as MenuIcon, 
  Share2, 
  ExternalLink,
  ChevronDown,
  Info,
  DollarSign
} from 'lucide-react';
import QRCode from 'qrcode';

interface LandingPageProps {
  onLaunchApp: () => void;
}

export default function LandingPage({ onLaunchApp }: LandingPageProps) {
  // Mini Generator States
  const [heroInput, setHeroInput] = useState('https://qodex.io/reveal');
  const [qrType, setQrType] = useState<'url' | 'wifi' | 'text' | 'email'>('url');
  const [fgColor, setFgColor] = useState('#10b981');
  const [bgColor, setBgColor] = useState('#090a0d');
  const [dotType, setDotType] = useState<'square' | 'rounded' | 'dots'>('rounded');
  const [frameType, setFrameType] = useState<'none' | 'card' | 'bubble' | 'tag'>('card');
  const [frameText, setFrameText] = useState('SCAN ME');
  const [generatedUrl, setGeneratedUrl] = useState('');
  
  // Wi-Fi details
  const [wifiSsid, setWifiSsid] = useState('Free_Lagos_WiFi');
  const [wifiPass, setWifiPass] = useState('qodex2026');
  const [wifiSec, setWifiSec] = useState('WPA');
  
  // Email details
  const [emailTo, setEmailTo] = useState('hello@qodex.io');
  const [emailSubject, setEmailSubject] = useState('Inquiry');
  const [emailBody, setEmailBody] = useState('Hi Emmanuel, I am interested in Qodex.');

  // Canvas ref for mini-generator
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Active FAQ index
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Custom Currency representation
  const [currency, setCurrency] = useState<'NGN' | 'KES' | 'USD'>('NGN');

  // Custom pack slider
  const [customCredits, setCustomCredits] = useState<number>(150);

  // Handle active qr type text payload compilation
  const getPayload = () => {
    switch (qrType) {
      case 'wifi':
        return `WIFI:S:${wifiSsid};T:${wifiSec};P:${wifiPass};;`;
      case 'email':
        return `mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      case 'text':
      default:
        return heroInput;
    }
  };

  // Re-generate QR preview on canvas whenever options update
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const payload = getPayload();

    QRCode.toCanvas(canvas, payload, {
      width: 280,
      margin: 3,
      color: {
        dark: fgColor,
        light: bgColor,
      },
      errorCorrectionLevel: 'H'
    }, (error) => {
      if (error) console.error('Mini generator failed:', error);
      else {
        // Post-draw custom framing layer on top of standard QR
        drawFrameOverlay(ctx, canvas);
      }
    });
  }, [qrType, heroInput, wifiSsid, wifiPass, wifiSec, emailTo, emailSubject, emailBody, fgColor, bgColor, dotType, frameType, frameText]);

  // Frame Overlay Drawer
  const drawFrameOverlay = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    if (frameType === 'none') return;
    ctx.save();
    
    ctx.strokeStyle = fgColor;
    ctx.lineWidth = 5;

    if (frameType === 'card') {
      // Draw standard outline
      ctx.beginPath();
      ctx.roundRect(5, 5, canvas.width - 10, canvas.height - 10, 16);
      ctx.stroke();

      // Bottom bar
      ctx.fillStyle = fgColor;
      ctx.beginPath();
      ctx.roundRect(8, canvas.height - 42, canvas.width - 16, 34, 8);
      ctx.fill();

      // Label
      ctx.fillStyle = bgColor === '#090a0d' ? '#090a0d' : '#ffffff';
      ctx.font = 'bold 11px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(frameText.toUpperCase(), canvas.width / 2, canvas.height - 25);
    } else if (frameType === 'bubble') {
      // Draw speech capsule
      ctx.beginPath();
      ctx.roundRect(10, 10, canvas.width - 20, canvas.height - 52, 12);
      ctx.stroke();

      ctx.fillStyle = fgColor;
      ctx.beginPath();
      ctx.roundRect(24, canvas.height - 36, canvas.width - 48, 28, 14);
      ctx.fill();

      ctx.fillStyle = bgColor === '#090a0d' ? '#090a0d' : '#ffffff';
      ctx.font = 'bold 10px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(frameText.toUpperCase(), canvas.width / 2, canvas.height - 22);
    } else if (frameType === 'tag') {
      ctx.beginPath();
      ctx.roundRect(10, 24, canvas.width - 20, canvas.height - 34, 8);
      ctx.stroke();

      // Tag eyelet
      ctx.fillStyle = fgColor;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, 12, 4, 0, 2 * Math.PI);
      ctx.fill();

      // Bottom bar
      ctx.fillStyle = fgColor;
      ctx.fillRect(12, canvas.height - 26, canvas.width - 24, 18);

      ctx.fillStyle = bgColor === '#090a0d' ? '#090a0d' : '#ffffff';
      ctx.font = 'bold 9px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(frameText.toUpperCase(), canvas.width / 2, canvas.height - 17);
    }

    ctx.restore();
  };

  const downloadMiniQr = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `qodex_quick_qr.png`;
    link.href = url;
    link.click();
  };

  // Convert Credit price based on selected currency
  const getPackagePriceStr = (creditsNum: number) => {
    if (currency === 'NGN') {
      const price = creditsNum === 20 ? 4500 : creditsNum === 100 ? 18000 : creditsNum === 500 ? 75000 : Math.round(creditsNum * 160);
      return `₦${price.toLocaleString()}`;
    } else if (currency === 'KES') {
      const price = creditsNum === 20 ? 750 : creditsNum === 100 ? 3000 : creditsNum === 500 ? 12500 : Math.round(creditsNum * 26);
      return `KSh ${price.toLocaleString()}`;
    } else {
      const price = creditsNum === 20 ? 5 : creditsNum === 100 ? 20 : creditsNum === 500 ? 80 : Math.round(creditsNum * 0.17);
      return `$${price.toLocaleString()}`;
    }
  };

  return (
    <div id="landing-root" className="min-h-screen bg-[#090a0d] text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 overflow-x-hidden relative">
      
      {/* GLOW BACKGROUND ORBS */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-[1200px] right-10 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-[800px] left-1/3 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* FIXED FLOATING GRID FRAME (Aesthetic Grid Lines echoing a QR pattern) */}
      <div className="fixed inset-0 grid grid-cols-6 grid-rows-6 pointer-events-none border border-slate-900/40 -z-20 opacity-30">
        {Array.from({ length: 36 }).map((_, i) => (
          <div key={i} className="border-r border-b border-slate-900/40 relative">
            {/* Tiny finder dots at intersection vertices */}
            <div className="absolute bottom-0 right-0 w-[3px] h-[3px] bg-slate-800 rounded-full translate-x-[1.5px] translate-y-[1.5px]" />
          </div>
        ))}
      </div>

      {/* HEADER NAVBAR */}
      <nav className="border-b border-slate-900 bg-[#090a0d]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-tr from-emerald-500 to-emerald-400 rounded-lg flex items-center justify-center relative shadow-md shadow-emerald-500/10">
              <QrCode className="h-6 w-6 text-slate-950" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-ping" />
            </div>
            <div>
              <span className="font-mono text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                QODEX
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-md border border-emerald-500/30">PAYG</span>
              </span>
              <p className="text-[9px] uppercase font-bold tracking-widest text-slate-500 font-mono">No Subscription SaaS</p>
            </div>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-400">
            <a href="#how-it-works" className="hover:text-emerald-400 transition-colors">How Credits Work</a>
            <a href="#features" className="hover:text-emerald-400 transition-colors">Core Features</a>
            <a href="#qr-types" className="hover:text-emerald-400 transition-colors">QR Matrix Grid</a>
            <a href="#pricing" className="hover:text-emerald-400 transition-colors">Pay-As-You-Go Rates</a>
            <a href="#testimonials" className="hover:text-emerald-400 transition-colors">Testimonials</a>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={onLaunchApp}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2.5 rounded-xl text-xs font-bold font-mono transition-all duration-300 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-[1.02] flex items-center gap-2 cursor-pointer"
            >
              <Zap className="h-4 w-4 fill-slate-950" />
              LAUNCH CONSOLE
            </button>
          </div>
        </div>
      </nav>

      {/* 1. HERO SECTION */}
      <section className="pt-12 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
        
        {/* TOP BADGE */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 bg-slate-900/80 border border-slate-800 rounded-full px-4 py-1.5 text-xs text-slate-300 font-mono">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Ditch the Monthly Tax. Pay Only Per Action.</span>
          </div>
        </div>

        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl sm:text-6xl font-black font-mono tracking-tight text-white mb-6 leading-[1.1] uppercase">
            Dense Data Grids. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-amber-400 to-indigo-400">
              No Subscriptions.
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-8 font-sans">
            Qodex is the custom-branded QR code generator built for modern African startups and global businesses. Stop committing to $20/month retainers. Buy tokenized credits, design stunning dynamic codes, and track scans live. Unused credits never expire.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 items-center">
            <button 
              onClick={onLaunchApp}
              className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold font-mono px-8 py-4 rounded-xl text-sm transition-all duration-300 shadow-xl shadow-emerald-500/10 hover:shadow-emerald-500/25 flex items-center justify-center gap-2.5 cursor-pointer"
            >
              Start Generating Free
              <ArrowRight className="h-4 w-4" />
            </button>
            <a 
              href="#how-it-works"
              className="w-full sm:w-auto bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold font-mono px-8 py-4 rounded-xl text-sm transition-all text-center"
            >
              See How Credits Work
            </a>
          </div>
        </div>

        {/* HERO INTERACTIVE SIGNATURE COMPONENT (Live-operating QR Generator Box) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-5xl mx-auto bg-slate-900/30 border border-slate-850 p-6 sm:p-8 rounded-3xl relative overflow-hidden backdrop-blur-sm shadow-2xl">
          
          {/* Subtle grid styling watermark */}
          <div className="absolute top-0 right-0 w-48 h-48 border-l border-b border-slate-800/20 grid grid-cols-6 grid-rows-6 opacity-30 pointer-events-none">
            {Array.from({ length: 36 }).map((_, i) => (
              <div key={i} className="border-r border-b border-slate-800/10" />
            ))}
          </div>

          {/* Form Side - 7 cols */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] uppercase tracking-widest font-bold font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">Live Playground</span>
                <p className="text-xs text-slate-400 font-mono">Test drive the encoding engine right now</p>
              </div>

              {/* QR TYPE PICKER */}
              <div className="grid grid-cols-4 gap-2 mb-5">
                {[
                  { id: 'url', label: 'URL Redirect' },
                  { id: 'wifi', label: 'Wi-Fi Network' },
                  { id: 'email', label: 'Direct Email' },
                  { id: 'text', label: 'Raw Text' }
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setQrType(type.id as any)}
                    className={`py-2 px-1 rounded-xl text-[10px] font-bold font-mono transition-all border ${
                      qrType === type.id 
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              {/* FIELD INPUT CONTROLS */}
              <div className="space-y-4">
                {qrType === 'url' && (
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1.5 font-mono">Redirect Destination URL</label>
                    <input
                      type="url"
                      value={heroInput}
                      onChange={(e) => setHeroInput(e.target.value)}
                      placeholder="e.g. https://my-lagos-cafe.com/menu"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                )}

                {qrType === 'wifi' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1.5 font-mono">Wi-Fi SSID</label>
                      <input
                        type="text"
                        value={wifiSsid}
                        onChange={(e) => setWifiSsid(e.target.value)}
                        placeholder="Network Name"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1.5 font-mono">Password</label>
                      <input
                        type="text"
                        value={wifiPass}
                        onChange={(e) => setWifiPass(e.target.value)}
                        placeholder="Network Pass"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1.5 font-mono">Security</label>
                      <select
                        value={wifiSec}
                        onChange={(e) => setWifiSec(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-500 font-mono"
                      >
                        <option value="WPA">WPA/WPA2</option>
                        <option value="WEP">WEP</option>
                        <option value="nopass">Unsecured</option>
                      </select>
                    </div>
                  </div>
                )}

                {qrType === 'email' && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1 font-mono">Target Email</label>
                        <input
                          type="email"
                          value={emailTo}
                          onChange={(e) => setEmailTo(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1 font-mono">Subject Line</label>
                        <input
                          type="text"
                          value={emailSubject}
                          onChange={(e) => setEmailSubject(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1 font-mono">Pre-filled Body</label>
                      <textarea
                        value={emailBody}
                        rows={2}
                        onChange={(e) => setEmailBody(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>
                )}

                {qrType === 'text' && (
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1.5 font-mono">Raw Text Data</label>
                    <textarea
                      value={heroInput}
                      onChange={(e) => setHeroInput(e.target.value)}
                      rows={2}
                      placeholder="Enter raw text data to encode"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                )}
              </div>

              {/* DESIGN CONTROLS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 pt-3 border-t border-slate-800/60">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1.5 font-mono">Active Theme Color</label>
                  <div className="flex gap-2">
                    {[
                      { hex: '#10b981', label: 'Teal' },
                      { hex: '#f59e0b', label: 'Laser' },
                      { hex: '#3b82f6', label: 'Lagos' },
                      { hex: '#ec4899', label: 'Accent' }
                    ].map((color) => (
                      <button
                        key={color.hex}
                        onClick={() => setFgColor(color.hex)}
                        style={{ backgroundColor: color.hex }}
                        className={`w-6 h-6 rounded-full border transition-all cursor-pointer ${
                          fgColor === color.hex ? 'border-white scale-125' : 'border-transparent hover:scale-110'
                        }`}
                        title={color.label}
                      />
                    ))}
                    <input
                      type="color"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="w-6 h-6 rounded-full bg-transparent border-0 cursor-pointer p-0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1.5 font-mono">Frame CTA Style</label>
                  <select
                    value={frameType}
                    onChange={(e) => setFrameType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-emerald-500 font-mono"
                  >
                    <option value="none">No Frame</option>
                    <option value="card">Standard Card Frame</option>
                    <option value="bubble">Speech Bubble Frame</option>
                    <option value="tag">Hang Tag Frame</option>
                  </select>
                </div>
              </div>

              {frameType !== 'none' && (
                <div className="mt-3">
                  <label className="block text-[9px] uppercase tracking-widest font-bold text-slate-500 mb-1 font-mono">Custom Frame Label</label>
                  <input
                    type="text"
                    value={frameText}
                    maxLength={14}
                    onChange={(e) => setFrameText(e.target.value)}
                    className="w-full sm:w-1/2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-[10px] text-slate-300 outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-slate-800/40">
              <Info className="h-4 w-4 text-emerald-400 shrink-0" />
              <p className="text-[11px] text-slate-400">
                This generated code is a standard static QR, perfect for offline menus or flyers. It encodes data permanently.
              </p>
            </div>
          </div>

          {/* Canvas Preview Side - 5 cols */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center bg-slate-950/80 border border-slate-850 p-6 rounded-2xl relative text-center">
            
            <span className="absolute top-3 left-3 text-[9px] font-mono font-bold text-slate-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              LIVE VECTOR FEED
            </span>

            <div className="p-3 bg-[#090a0d] border border-slate-800 rounded-2xl shadow-inner relative group mb-5">
              {/* QR Finder Corners Styling */}
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-500" />
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-500" />
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-500" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-500" />

              <canvas 
                ref={canvasRef} 
                className="max-w-full rounded-lg w-[220px] h-[220px] sm:w-[240px] sm:h-[240px] transition-all" 
              />
            </div>

            <p className="text-[10px] text-slate-500 font-mono uppercase font-black tracking-widest mb-4">
              Encoded payload length: {getPayload().length} bytes
            </p>

            <button
              onClick={downloadMiniQr}
              className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-200 py-3.5 px-4 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Download className="h-4 w-4 text-emerald-400" />
              DOWNLOAD STYLED QR (.PNG)
            </button>

            <button
              onClick={onLaunchApp}
              className="mt-3 text-[11px] text-emerald-400 hover:text-emerald-300 font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              Unlock Vector SVG & high-res print outputs in console
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>

        </div>

      </section>

      {/* 2. HOW CREDITS WORK SECTION */}
      <section id="how-it-works" className="py-24 border-t border-slate-900 bg-slate-950/40 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-amber-500 tracking-widest uppercase font-mono">The PAYG Shift</span>
            <h2 className="text-3xl sm:text-5xl font-black font-mono uppercase text-white mt-2 mb-4">
              Pay For Actions. Not Idle Days.
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Monthly subscriptions are a hidden tax on small businesses. If you generate 1 QR code or 1,000 QR codes, you pay the same retainer. On Qodex, you buy a package of credits once, and spend them exactly on what you need.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-16">
            
            {/* The Comparison Box */}
            <div className="lg:col-span-5 bg-slate-900/40 border border-slate-850 p-6 sm:p-8 rounded-3xl space-y-6 relative">
              <div className="absolute top-4 right-4 text-[9px] font-mono font-black tracking-widest text-slate-600">DEBIT LEDGER</div>
              
              <h3 className="text-xl font-bold font-mono text-white flex items-center gap-2">
                <Coins className="h-5 w-5 text-amber-500" />
                No Monthly Expirations
              </h3>
              <p className="text-xs text-slate-400 font-sans">
                Every credit purchased on Qodex lives in your digital workspace wallet indefinitely. You can use them this week, next month, or in 2028.
              </p>

              <div className="space-y-3.5 pt-3 border-t border-slate-800/60">
                {[
                  { text: "Free static QR codes forever", value: "0 Credits" },
                  { text: "Advanced logo overlay watermark-free", value: "1 Credit" },
                  { text: "Dynamic URL redirects (trackable)", value: "2 Credits" },
                  { text: "Lagos/Africa Geolocation scanning analytics", value: "3 Credits" },
                  { text: "Password lock & scheduling triggers", value: "2 Credits" },
                  { text: "Unlimited subsequent redirects changes", value: "FREE" }
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-semibold flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      {item.text}
                    </span>
                    <span className={`font-mono font-bold ${item.value === 'FREE' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Explanatory blocks */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                {
                  title: "1. Lock-in Free Workspace",
                  desc: "Create an account instantly without inputting any debit or credit card. Get free standard credits to test design templates before committing NGN or KSh.",
                  icon: Shield
                },
                {
                  title: "2. Absolute Redirection Control",
                  desc: "Once a Dynamic QR is generated, you can change its destination URL 1,000 times. You do not pay any credit for editing your destination link later.",
                  icon: Layers
                },
                {
                  title: "3. Shared Team Wallets",
                  desc: "Run a creative studio or marketing department? Invite team members to your Qodex workspace to pool credit usage and organize assets in shared folders.",
                  icon: Users
                },
                {
                  title: "4. Multi-Gateway Native Integrations",
                  desc: "Enjoy simple, localized billing powered securely by Paystack, Flutterwave, and Stripe. Complete checkout with Card, Bank Transfer, or USSD instantly.",
                  icon: Globe
                }
              ].map((box, idx) => {
                const IconComp = box.icon;
                return (
                  <div key={idx} className="bg-slate-900/20 border border-slate-900 p-6 rounded-2xl hover:border-slate-800 transition-all group">
                    <div className="h-10 w-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-emerald-400 mb-4 group-hover:bg-slate-850 transition-colors">
                      <IconComp className="h-5 w-5" />
                    </div>
                    <h4 className="text-sm font-black font-mono text-white mb-2 uppercase">{box.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{box.desc}</p>
                  </div>
                );
              })}
            </div>

          </div>

        </div>
      </section>

      {/* 3. CORE FEATURES (Aesthetic Risk: Scan-to-Reveal Interactive Grid) */}
      <section id="features" className="py-24 border-t border-slate-900 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold text-emerald-400 tracking-widest uppercase font-mono">Precision Architecture</span>
          <h2 className="text-3xl sm:text-5xl font-black font-mono uppercase text-white mt-2 mb-4">
            Ground-up Engineering
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Hover over any technical module below. Watch the binary laser grid decodes raw computer instructions into fully-realized high-fidelity brand assets.
          </p>
        </div>

        {/* BENTO GRID REVEAL INTERACTION */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1: Design Module */}
          <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-3xl relative group overflow-hidden flex flex-col justify-between min-h-[340px]">
            {/* The laser scanning animation sweep overlay */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-emerald-400 opacity-0 group-hover:opacity-100 group-hover:animate-bounce pointer-events-none z-10 shadow-[0_0_15px_#10b981]" />
            {/* Background grid simulation */}
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />

            <div>
              <div className="flex justify-between items-center mb-6">
                <div className="h-10 w-10 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
                  <Sparkles className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">MODULE_01 // STYLE</span>
              </div>

              <h3 className="text-lg font-black font-mono uppercase text-white mb-3">Aesthetic Styling Matrix</h3>
              
              <ul className="space-y-3 text-xs text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Custom corner eye shapes (Rounded, Leaf, Circle, Star)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Liquid, square, and circular dot densities</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Linear custom gradients & isolated pupil colors</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>CTA Text frames to boost offline scan rates by 42%</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 border-t border-slate-800/40 flex justify-between items-center">
              <span className="text-[10px] text-slate-500 font-mono">DECODE STABILITY: 100%</span>
              <button onClick={onLaunchApp} className="text-xs text-emerald-400 font-bold font-mono hover:underline flex items-center gap-1 cursor-pointer">
                Enter Designer
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Card 2: Manage Module */}
          <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-3xl relative group overflow-hidden flex flex-col justify-between min-h-[340px]">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-amber-400 opacity-0 group-hover:opacity-100 group-hover:animate-bounce pointer-events-none z-10 shadow-[0_0_15px_#f59e0b]" />
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />

            <div>
              <div className="flex justify-between items-center mb-6">
                <div className="h-10 w-10 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl flex items-center justify-center">
                  <Layers className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">MODULE_02 // SYSTEM</span>
              </div>

              <h3 className="text-lg font-black font-mono uppercase text-white mb-3">Enterprise Fleet Control</h3>
              
              <ul className="space-y-3 text-xs text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span>Organize assets in workspace folders for multiple clients</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span>Schedule active redirect link release dates</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span>Password-restrict sensitive portals with custom pins</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span>Multi-seat shared wallets for team co-generation</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 border-t border-slate-800/40 flex justify-between items-center">
              <span className="text-[10px] text-slate-500 font-mono">LATENCY RATIO: &lt;12MS</span>
              <button onClick={onLaunchApp} className="text-xs text-amber-500 font-bold font-mono hover:underline flex items-center gap-1 cursor-pointer">
                Manage Fleet
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Card 3: Track Module */}
          <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-3xl relative group overflow-hidden flex flex-col justify-between min-h-[340px]">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-indigo-400 opacity-0 group-hover:opacity-100 group-hover:animate-bounce pointer-events-none z-10 shadow-[0_0_15px_#818cf8]" />
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />

            <div>
              <div className="flex justify-between items-center mb-6">
                <div className="h-10 w-10 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center">
                  <Activity className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">MODULE_03 // TELEMETRY</span>
              </div>

              <h3 className="text-lg font-black font-mono uppercase text-white mb-3">Live African Telemetry</h3>
              
              <ul className="space-y-3 text-xs text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                  <span>Real-time scan counter and hourly charts</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                  <span>Device profiling (e.g. Chrome iOS, Android Signature)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                  <span>IP Geolocation down to specific African states</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                  <span>Export ready CSV file formats for quick presentation deck</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 border-t border-slate-800/40 flex justify-between items-center">
              <span className="text-[10px] text-slate-500 font-mono">METRIC CHANNELS: 16/S</span>
              <button onClick={onLaunchApp} className="text-xs text-indigo-400 font-bold font-mono hover:underline flex items-center gap-1 cursor-pointer">
                View Geocharts
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>

        </div>

      </section>

      {/* 4. QR TYPES SECTION */}
      <section id="qr-types" className="py-24 border-t border-slate-900 bg-slate-950/20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-amber-500 tracking-widest uppercase font-mono">Grid Modalities</span>
            <h2 className="text-3xl sm:text-5xl font-black font-mono uppercase text-white mt-2 mb-4">
              Encoded Modality Library
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Design specialized codes tailored for distinct use cases. Every pattern is high-density and optimized for old smartphone cameras.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Category 1: Personal Solutions */}
            <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-3xl space-y-6">
              <div className="flex items-center gap-2 mb-2 pb-3 border-b border-slate-800">
                <span className="h-2 w-2 bg-emerald-500 rounded-full" />
                <h3 className="font-mono font-bold text-sm text-slate-200 uppercase">Personal & Portfolio Tools</h3>
              </div>
              <p className="text-xs text-slate-400">
                Perfect for content creators, independent consultants, and personal portfolios. Keep contacts updated smoothly.
              </p>

              <div className="space-y-4">
                {[
                  { name: "Dynamic Redirect URL", desc: "Redirect scans to personal blogs or linktrees, update URL destinations live.", icon: Globe },
                  { name: "Digital vCard", desc: "Deliver full business addresses, phone numbers, and job titles direct to dialers.", icon: Users },
                  { name: "Social Handles", desc: "Direct scans to TikTok accounts, Instagram handles, or YouTube channel URLs.", icon: Share2 }
                ].map((type, idx) => {
                  const IconC = type.icon;
                  return (
                    <div key={idx} className="flex gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-900">
                      <div className="h-8 w-8 bg-slate-900 text-emerald-400 rounded-lg flex items-center justify-center shrink-0 border border-slate-800">
                        <IconC className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white mb-0.5">{type.name}</h4>
                        <p className="text-[10px] text-slate-400">{type.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category 2: Business Portals */}
            <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-3xl space-y-6">
              <div className="flex items-center gap-2 mb-2 pb-3 border-b border-slate-800">
                <span className="h-2 w-2 bg-amber-500 rounded-full" />
                <h3 className="font-mono font-bold text-sm text-slate-200 uppercase">Operational Touchpoints</h3>
              </div>
              <p className="text-xs text-slate-400">
                Streamline operations across dining tables, co-working desks, retail stores, and service desks.
              </p>

              <div className="space-y-4">
                {[
                  { name: "Lagos Wi-Fi Portal", desc: "Allow cafe customers to join unsecured or secured networks without typing keys.", icon: Smartphone },
                  { name: "Contactless Menus", desc: "Display digital menus directly, save on print overheads during adjustments.", icon: MenuIcon },
                  { name: "Operational Documents", desc: "Deliver product operation manuals, pricing guides, or blueprints instantly.", icon: Layers }
                ].map((type, idx) => {
                  const IconC = type.icon;
                  return (
                    <div key={idx} className="flex gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-900">
                      <div className="h-8 w-8 bg-slate-900 text-amber-400 rounded-lg flex items-center justify-center shrink-0 border border-slate-800">
                        <IconC className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white mb-0.5">{type.name}</h4>
                        <p className="text-[10px] text-slate-400">{type.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category 3: Marketing & Payments */}
            <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-3xl space-y-6">
              <div className="flex items-center gap-2 mb-2 pb-3 border-b border-slate-800">
                <span className="h-2 w-2 bg-indigo-500 rounded-full" />
                <h3 className="font-mono font-bold text-sm text-slate-200 uppercase">Marketing & Conversion</h3>
              </div>
              <p className="text-xs text-slate-400">
                Accelerate customer acquisition pipelines, direct payments securely, and gather campaign conversion analytics.
              </p>

              <div className="space-y-4">
                {[
                  { name: "Event Calendar Sync", desc: "Promote block parties or tech summits with automated time sync files.", icon: Calendar },
                  { name: "Instant Payment Triggers", desc: "Redirect to active checkout channels on Paystack, Flutterwave, or Stripe.", icon: Coins },
                  { name: "Bulk Campaign Matrices", desc: "Generate 100 codes in one click for segmented inventory labels.", icon: Zap }
                ].map((type, idx) => {
                  const IconC = type.icon;
                  return (
                    <div key={idx} className="flex gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-900">
                      <div className="h-8 w-8 bg-slate-900 text-indigo-400 rounded-lg flex items-center justify-center shrink-0 border border-slate-800">
                        <IconC className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white mb-0.5">{type.name}</h4>
                        <p className="text-[10px] text-slate-400">{type.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 5. PRICING & CREDIT RATES SECTION */}
      <section id="pricing" className="py-24 border-t border-slate-900 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-emerald-400 tracking-widest uppercase font-mono">Localized Wallet Packages</span>
          <h2 className="text-3xl sm:text-5xl font-black font-mono uppercase text-white mt-2 mb-4">
            Buy Credits Once. Keep Forever.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Configure your pricing based on your active operating geography. Zero monthly subscription taxes, no lock-ins, 100% flexibility.
          </p>

          {/* CURRENCY TOGGLE */}
          <div className="inline-flex bg-slate-950 border border-slate-850 p-1.5 rounded-2xl mt-6">
            {[
              { id: 'NGN', label: '🇳🇬 NGN (₦)' },
              { id: 'KES', label: '🇰🇪 KES (KSh)' },
              { id: 'USD', label: '🇺🇸 USD ($)' }
            ].map((cur) => (
              <button
                key={cur.id}
                onClick={() => setCurrency(cur.id as any)}
                className={`py-2 px-3 rounded-xl text-xs font-bold font-mono transition-all ${
                  currency === cur.id ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cur.label}
              </button>
            ))}
          </div>
        </div>

        {/* CREDIT CARDS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-16">
          
          {/* Freelancer Pack */}
          <div className="bg-slate-900/30 border border-slate-850 p-6 sm:p-8 rounded-3xl relative flex flex-col justify-between hover:border-slate-800 transition-all">
            <span className="absolute top-4 right-4 text-[9px] font-mono font-bold text-slate-500 uppercase">Tier_01</span>
            <div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full font-mono uppercase">
                Freelancer Pack
              </span>
              <div className="my-6">
                <span className="text-3xl sm:text-4xl font-black font-mono text-white">20 Credits</span>
                <p className="text-xs text-slate-500 mt-1">Excellent for single campaigns or personal cards</p>
              </div>

              <div className="text-3xl font-black font-mono text-emerald-400 mb-6">
                {getPackagePriceStr(20)}
                <span className="text-xs font-normal text-slate-500 font-sans"> (one-off payment)</span>
              </div>

              <ul className="space-y-3 text-xs text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Unused credits never expire</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Custom SVG vector exports</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Advanced Geolocation scanning maps</span>
                </li>
              </ul>
            </div>

            <button 
              onClick={onLaunchApp}
              className="mt-8 w-full bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 py-3 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer"
            >
              PURCHASE WALLET TIER
            </button>
          </div>

          {/* SME Growth Pack */}
          <div className="bg-gradient-to-b from-slate-900/60 to-slate-900/30 border-2 border-emerald-500 p-6 sm:p-8 rounded-3xl relative flex flex-col justify-between shadow-xl shadow-emerald-500/5">
            <div className="absolute top-4 right-4 text-[9px] font-mono font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-500/30">
              RECOMMENDED
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full font-mono uppercase">
                SME Growth Pack
              </span>
              <div className="my-6">
                <span className="text-3xl sm:text-4xl font-black font-mono text-white">100 Credits</span>
                <p className="text-xs text-slate-500 mt-1">Best for active local stores, restaurants & startups</p>
              </div>

              <div className="text-3xl font-black font-mono text-emerald-400 mb-6">
                {getPackagePriceStr(100)}
                <span className="text-xs font-normal text-slate-500 font-sans"> (one-off payment)</span>
              </div>

              <ul className="space-y-3 text-xs text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Includes all Freelancer features</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Remove Qodex watermark from all assets</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Dedicated Lagos-based developer support</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Advanced bulk codes generation triggers</span>
                </li>
              </ul>
            </div>

            <button 
              onClick={onLaunchApp}
              className="mt-8 w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3 rounded-xl text-xs font-mono font-bold transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
            >
              PURCHASE WALLET TIER
            </button>
          </div>

          {/* Agency Power Pack */}
          <div className="bg-slate-900/30 border border-slate-850 p-6 sm:p-8 rounded-3xl relative flex flex-col justify-between hover:border-slate-800 transition-all">
            <span className="absolute top-4 right-4 text-[9px] font-mono font-bold text-slate-500 uppercase">Tier_03</span>
            <div>
              <span className="text-[10px] font-bold text-indigo-400 bg-indigo-400/10 px-2.5 py-1 rounded-full font-mono uppercase">
                Agency Power Pack
              </span>
              <div className="my-6">
                <span className="text-3xl sm:text-4xl font-black font-mono text-white">500 Credits</span>
                <p className="text-xs text-slate-500 mt-1">Tailored for busy creative agencies & design studios</p>
              </div>

              <div className="text-3xl font-black font-mono text-emerald-400 mb-6">
                {getPackagePriceStr(500)}
                <span className="text-xs font-normal text-slate-500 font-sans"> (one-off payment)</span>
              </div>

              <ul className="space-y-3 text-xs text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Includes all SME level features</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Unlimited seat workspace members invitation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>White-labeled client-facing redirection portals</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Instant high-priority geochart updates API</span>
                </li>
              </ul>
            </div>

            <button 
              onClick={onLaunchApp}
              className="mt-8 w-full bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 py-3 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer"
            >
              PURCHASE WALLET TIER
            </button>
          </div>

        </div>

        {/* CUSTOM AMOUNT CONFIGURATOR (SLIDER) */}
        <div className="bg-slate-950 border border-slate-850 p-6 sm:p-8 rounded-3xl max-w-3xl mx-auto">
          <h3 className="text-lg font-black font-mono uppercase text-white mb-1">Custom Workspace Wallet Pool</h3>
          <p className="text-xs text-slate-400 mb-6">Need a precise credit volume for your company fleet? Slide to configure.</p>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
            
            <div className="sm:col-span-8 space-y-4">
              <div className="flex justify-between text-xs font-bold font-mono">
                <span className="text-slate-400">CREDIT COUNT</span>
                <span className="text-emerald-400">{customCredits} Credits</span>
              </div>
              <input 
                type="range"
                min={20}
                max={1000}
                step={10}
                value={customCredits}
                onChange={(e) => setCustomCredits(Number(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Min: 20 Credits</span>
                <span>Max: 1,000 Credits</span>
              </div>
            </div>

            <div className="sm:col-span-4 bg-slate-900/60 border border-slate-850 rounded-2xl p-4 text-center">
              <span className="text-[10px] font-mono font-black text-slate-500 uppercase">ESTIMATED PRICE</span>
              <div className="text-2xl font-black font-mono text-emerald-400 my-1">
                {getPackagePriceStr(customCredits)}
              </div>
              <p className="text-[10px] text-slate-500">Only NGN {Math.round(getPackagePriceStr(customCredits).includes('₦') ? customCredits * 140 : customCredits * 0.15)} per dynamic asset</p>
            </div>

          </div>
        </div>

      </section>

      {/* 6. TEAM & AGENCY CALLOUT */}
      <section className="py-24 border-t border-slate-900 bg-slate-950/40 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Visual element side - 5 cols */}
          <div className="lg:col-span-5 relative">
            <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-3xl relative overflow-hidden">
              <div className="absolute top-2 right-2 text-[8px] font-mono text-slate-600">WORKSPACE_CONFIG // MULTI-USER</div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-900">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-xs font-bold text-slate-200">Shared Wallet Active</span>
                  </div>
                  <span className="text-xs text-amber-400 font-mono font-bold">128 Cr</span>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] text-slate-500 font-mono uppercase font-black tracking-widest">Active Seats</p>
                  {[
                    { name: "Kunle Adeleke (Owner)", role: "Owner" },
                    { name: "Tunde Bakare (Editor)", role: "Editor" },
                    { name: "Chioma Obi (Viewer)", role: "Viewer" }
                  ].map((member, idx) => (
                    <div key={idx} className="flex justify-between text-xs text-slate-400 p-2 bg-slate-900/20 rounded border border-slate-900/40">
                      <span>{member.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{member.role}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-center text-[10px] text-emerald-400 font-mono">
                  ✓ White-Label domain: scans.yabacreative.com
                </div>
              </div>
            </div>

            {/* Float visual card decoration */}
            <div className="absolute -bottom-6 -right-6 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl hidden sm:block max-w-[200px]">
              <p className="text-[9px] font-mono text-slate-500 uppercase font-black mb-1">CLIENT ACCESS</p>
              <p className="text-xs text-slate-300 font-semibold">Zero Qodex watermarks inside PDFs & high-res prints</p>
            </div>
          </div>

          {/* Text content side - 7 cols */}
          <div className="lg:col-span-7 space-y-6">
            <span className="text-xs font-bold text-indigo-400 tracking-widest uppercase font-mono">Creative Fleets</span>
            <h2 className="text-3xl sm:text-5xl font-black font-mono uppercase text-white leading-tight">
              Shared Wallets Built For Busy Agencies
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Managing dozens of distinct clients? Stop forcing your accountants to handle multiple monthly subscription receipts. With Qodex Shared Workspace, you establish a centralized wallet balance that your whole creative team can draw from. 
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex gap-2 text-xs text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />
                <span>Invite infinite members to specific folder scopes</span>
              </div>
              <div className="flex gap-2 text-xs text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />
                <span>Export clean white-label redirection links</span>
              </div>
              <div className="flex gap-2 text-xs text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />
                <span>Zero monthly billing contracts or surprise rates</span>
              </div>
              <div className="flex gap-2 text-xs text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />
                <span>Download batch zip sheets for label inventory</span>
              </div>
            </div>

            <button
              onClick={onLaunchApp}
              className="mt-4 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-white font-mono font-bold px-6 py-3.5 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              Configure Agency Workspace
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

        </div>
      </section>

      {/* 7. TESTIMONIALS SECTION */}
      <section id="testimonials" className="py-24 border-t border-slate-900 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold text-amber-500 tracking-widest uppercase font-mono">Decoded Feedback</span>
          <h2 className="text-3xl sm:text-5xl font-black font-mono uppercase text-white mt-2 mb-4">
            Aesthetic Verification
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Read from founders, small business owners, and creative directors who traded complex subscription plans for straightforward credits.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              quote: "We spent years paying $19/month to standard US QR tools, even when we made zero modifications to our restaurant menus. Switching to Qodex saved us ₦150,000 annually. We only spend credits when changing layouts.",
              author: "Amadi Nwachukwu",
              role: "CEO, Ikeja Foods & Co.",
              location: "Ikeja, Lagos",
              avatar_bg: "bg-gradient-to-tr from-emerald-500 to-indigo-500"
            },
            {
              quote: "The ability to generate clean vector SVGs of our brand's QR codes directly with embedded logos for billboard density print is stellar. The PAYG structure fits our creative agency launch flow perfectly.",
              author: "Kunle Adeleke",
              role: "Design Director, Yaba Spaces",
              location: "Yaba, Lagos",
              avatar_bg: "bg-gradient-to-tr from-amber-500 to-rose-500"
            },
            {
              quote: "Client menus change seasonally. On standard tools, we're locked into subscriptions. On Qodex, I bought 500 credits once and split the balance across three restaurant clients. The White-label redirect scans keep us looking custom.",
              author: "Fatoumata Diallo",
              role: "Marketing Architect, Accra Grills",
              location: "Accra, Ghana",
              avatar_bg: "bg-gradient-to-tr from-cyan-500 to-blue-500"
            }
          ].map((test, idx) => (
            <div key={idx} className="bg-slate-900/30 border border-slate-850 p-6 sm:p-8 rounded-3xl relative flex flex-col justify-between hover:border-slate-800 transition-all">
              <span className="absolute top-4 right-4 text-slate-800 text-5xl font-serif">“</span>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic z-10 mb-6">
                {test.quote}
              </p>

              <div className="flex items-center gap-3 border-t border-slate-800/60 pt-4">
                <div className={`h-10 w-10 rounded-full shrink-0 ${test.avatar_bg} flex items-center justify-center font-black text-xs text-slate-950 font-mono`}>
                  {test.author.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{test.author}</h4>
                  <p className="text-[10px] text-slate-400">{test.role} — <span className="text-slate-500 font-mono font-bold">{test.location}</span></p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </section>

      {/* 8. FAQ INTERACTIVE SECTION */}
      <section className="py-24 border-t border-slate-900 bg-slate-950/40 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-indigo-400 tracking-widest uppercase font-mono">Answers En-Coded</span>
            <h2 className="text-3xl sm:text-5xl font-black font-mono uppercase text-white mt-2 mb-4">
              Frequently Queried Bytes
            </h2>
            <p className="text-slate-400 text-sm">
              Got technical questions or billing inquiries? Clear answers from the ZedTech workspace.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Do Qodex credits ever expire?",
                a: "Never. Unused wallet balances live inside your digital workspace indefinitely. If you buy credits today and return to use them in 2028, your balance remains exactly as you left it. There is zero recurring billing pressure."
              },
              {
                q: "Is there a free tier for testing?",
                a: "Yes! Creating an account gives you free basic static credits immediately. Generating standard static QR codes requires zero credits. Premium actions like custom vector SVG downloads, logo overlays, and detailed analytics have small credits costs."
              },
              {
                q: "What payment gateways are active?",
                a: "We support direct billing powered safely by Paystack (for NGN and GHS), Flutterwave (for KES and mobile money options), and Stripe (for international credit card checkouts). Checkout takes less than 30 seconds."
              },
              {
                q: "Do dynamic redirection links ever stop working?",
                a: "No. Your generated dynamic QR codes stay active permanently, routing customers securely to your configured destination URL. You can modify their destinations at any point inside the console without paying extra credits."
              },
              {
                q: "Can my team share a central wallet pool?",
                a: "Yes! In the dashboard under 'Team Workspace', you can invite editors and viewers to your agency pool. All invited seats consume from the central wallet balance, streamlining campaign organization."
              }
            ].map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="bg-slate-900/30 border border-slate-850 rounded-2xl overflow-hidden transition-all duration-300">
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full text-left px-6 py-5 flex items-center justify-between text-slate-200 hover:text-white transition-colors cursor-pointer"
                  >
                    <span className="font-mono text-xs sm:text-sm font-bold uppercase">{faq.q}</span>
                    <ChevronDown className={`h-4 w-4 text-emerald-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="px-6 pb-5 border-t border-slate-900 text-xs text-slate-400 leading-relaxed font-sans pt-3"
                      >
                        {faq.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 9. FINAL CALL TO ACTION */}
      <section className="py-28 text-center max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="bg-slate-900/40 border border-slate-850 rounded-[40px] p-8 sm:p-16 relative">
          <span className="text-xs font-bold text-emerald-400 tracking-widest uppercase font-mono mb-4 block">TERMINAL ENTRANCE</span>
          <h2 className="text-3xl sm:text-6xl font-black font-mono uppercase text-white tracking-tight mb-6">
            Erase Subscriptions. <br />
            Secure Your Credits.
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto mb-10 font-sans">
            Start generating beautiful, high-fidelity dynamic QR codes in less than two minutes. Setup takes seconds. Your unused balance stays safe in your workspace wallet permanently.
          </p>

          <button 
            onClick={onLaunchApp}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono px-8 py-4.5 rounded-xl text-xs transition-all duration-300 shadow-xl shadow-emerald-500/20 hover:scale-105 cursor-pointer flex items-center justify-center gap-2 mx-auto"
          >
            <Zap className="h-4 w-4 fill-slate-950" />
            ENTER THE GENERATION CONSOLE
          </button>
        </div>
      </section>

      {/* 10. FOOTER WITH VISIBLE "BUILT BY EMMANUEL OF ZEDTECH" ATTRIBUTION */}
      <footer className="border-t border-slate-900 bg-slate-950/60 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 mb-12">
            
            {/* Logo and signature */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-emerald-500 rounded flex items-center justify-center">
                  <QrCode className="h-5 w-5 text-slate-950" />
                </div>
                <span className="font-mono text-lg font-black tracking-tight text-white">QODEX</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs font-sans">
                A localized, pay-as-you-go micro-SaaS framework replacing rigid recurring fees with straightforward tokenized workspace credit wallets.
              </p>
            </div>

            {/* Links Columns */}
            <div className="lg:col-span-2">
              <h4 className="font-mono text-xs font-bold uppercase text-white mb-4">Product</h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li><a href="#how-it-works" className="hover:text-emerald-400 transition-colors">Pricing Ledger</a></li>
                <li><a href="#features" className="hover:text-emerald-400 transition-colors">Core Features</a></li>
                <li><a href="#qr-types" className="hover:text-emerald-400 transition-colors">QR Matrices</a></li>
              </ul>
            </div>

            <div className="lg:col-span-2">
              <h4 className="font-mono text-xs font-bold uppercase text-white mb-4">Integrations</h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li><span className="text-slate-500">Paystack Pay API</span></li>
                <li><span className="text-slate-500">Flutterwave Pool</span></li>
                <li><span className="text-slate-500">Stripe Webhooks</span></li>
              </ul>
            </div>

            {/* CRAFT ATTRIBUTION EMBLEM (PROMINENT METALLIC PANEL) */}
            <div className="lg:col-span-4 bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
              
              <div className="space-y-2">
                <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-500/20 inline-block">
                  Signature Craftsmanship
                </span>
                <p className="text-[11px] font-semibold text-slate-300 leading-snug">
                  Designed & built using pure high-contrast layouts, custom vector overlays, and localized payment hooks.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800 mt-4 flex items-center justify-between">
                <div>
                  <p className="text-[9px] uppercase tracking-wider font-bold text-slate-500 font-mono">Lead Engineer</p>
                  <p className="text-xs font-bold text-white font-mono flex items-center gap-1">
                    Emmanuel Eleweke of Zedtech
                    <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  </p>
                </div>
                <div className="text-[10px] text-slate-600 font-mono font-bold">LAGOS // GHANA</div>
              </div>
            </div>

          </div>

          <div className="border-t border-slate-900 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[10px] text-slate-500 font-mono">
              © {new Date().getFullYear()} Qodex Micro-SaaS Technologies. All data streams secured.
            </p>

            <div className="flex gap-4 text-[10px] text-slate-400 font-mono">
              <span className="hover:text-emerald-400 cursor-pointer">Privacy Protocol</span>
              <span>•</span>
              <span className="hover:text-emerald-400 cursor-pointer">Terms of Action</span>
              <span>•</span>
              <span className="hover:text-emerald-400 cursor-pointer">Cookie Bytes</span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
