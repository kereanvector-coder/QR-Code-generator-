import React, { useState } from 'react';
import { 
  Globe, 
  Search, 
  Share2, 
  FileCode, 
  Map, 
  Sparkles, 
  Copy, 
  Download, 
  ArrowRight, 
  Layers, 
  Wifi, 
  UtensilsCrossed, 
  Instagram, 
  Contact, 
  CreditCard,
  CheckCircle,
  Code
} from 'lucide-react';

interface SEOPanelProps {
  onLoadPreset: (preset: {
    name: string;
    type: string;
    bodyColor: string;
    eyeBorderColor: string;
    eyePupilColor: string;
    dotType: 'square' | 'dots' | 'rounded' | 'liquid';
    eyeType: 'square' | 'rounded' | 'circle' | 'leaf';
    logoSize: number;
    errorCorrection: 'L' | 'M' | 'Q' | 'H';
  }) => void;
  showToast: (message: string, type: 'success' | 'info' | 'error') => void;
}

interface SEOPage {
  slug: string;
  title: string;
  metaDesc: string;
  keywords: string;
  h1: string;
  useCase: string;
  icon: React.ReactNode;
  iconColor: string;
  preset: {
    name: string;
    type: string;
    bodyColor: string;
    eyeBorderColor: string;
    eyePupilColor: string;
    dotType: 'square' | 'dots' | 'rounded' | 'liquid';
    eyeType: 'square' | 'rounded' | 'circle' | 'leaf';
    logoSize: number;
    errorCorrection: 'L' | 'M' | 'Q' | 'H';
  };
}

export default function SEOPanel({ onLoadPreset, showToast }: SEOPanelProps) {
  const pages: SEOPage[] = [
    {
      slug: 'wifi-qr-code-generator',
      title: 'Free WiFi QR Code Generator | Qodex Premium Dynamic QR',
      metaDesc: 'Generate customizable WiFi QR codes for cafes, hotels, and retail spots. Customers scan to join with no password typing. Built-in compliance with cyber safety acts.',
      keywords: 'wifi qr code, scan wifi, cafe internet qr, qodex wifi generator, custom wifi qr',
      h1: 'Instant WiFi Network QR Code Generator',
      useCase: 'Hotels, Coffee Shops, Restaurants, Airports',
      icon: <Wifi className="h-5 w-5" />,
      iconColor: 'text-emerald-400 bg-emerald-500/10',
      preset: {
        name: 'WiFi Access Hotspot',
        type: 'wifi',
        bodyColor: '#047857', // emerald-700
        eyeBorderColor: '#059669', // emerald-600
        eyePupilColor: '#34d399', // emerald-400
        dotType: 'rounded',
        eyeType: 'rounded',
        logoSize: 45,
        errorCorrection: 'Q'
      }
    },
    {
      slug: 'menu-qr-code-generator',
      title: 'Contactless Restaurant Menu QR Code Generator | Qodex',
      metaDesc: 'Design dynamic menu QR codes with custom logos, designer frames, and offline-first scanning logs. Real-time menu target URL switching saves printing costs.',
      keywords: 'menu qr code, digital menu, cafe qr code menu, restaurant dynamic menu generator',
      h1: 'Dynamic Contactless Menu QR Code Builder',
      useCase: 'Fine Dining, Food Trucks, Bars, Bistros',
      icon: <UtensilsCrossed className="h-5 w-5" />,
      iconColor: 'text-amber-400 bg-amber-500/10',
      preset: {
        name: 'Gourmet Bistro Menu',
        type: 'url',
        bodyColor: '#b45309', // amber-700
        eyeBorderColor: '#d97706', // amber-600
        eyePupilColor: '#fbbf24', // amber-400
        dotType: 'dots',
        eyeType: 'leaf',
        logoSize: 50,
        errorCorrection: 'H'
      }
    },
    {
      slug: 'instagram-qr-code-generator',
      title: 'Instagram & Social Media QR Code Creator | Qodex African SaaS',
      metaDesc: 'Boost social followers with direct link redirection. Tracks scan demographics in real-time. Native support for African consumer metrics.',
      keywords: 'instagram qr code, social profile qr, boost followers, linktree qr code generator',
      h1: 'Social Profile Dynamic Growth QR Engine',
      useCase: 'Agencies, Influencers, Retail Brands, Event Hosts',
      icon: <Instagram className="h-5 w-5" />,
      iconColor: 'text-pink-400 bg-pink-500/10',
      preset: {
        name: 'Social Media Growth Link',
        type: 'social',
        bodyColor: '#be185d', // pink-700
        eyeBorderColor: '#db2777', // pink-600
        eyePupilColor: '#f472b6', // pink-400
        dotType: 'liquid',
        eyeType: 'circle',
        logoSize: 45,
        errorCorrection: 'M'
      }
    },
    {
      slug: 'vcard-qr-code-generator',
      title: 'Professional vCard Dynamic Business Card QR | Qodex',
      metaDesc: 'Replace paper business cards with dynamic vCard contact codes. Update your phone number or email instantly in the database without re-printing codes.',
      keywords: 'vcard qr code, smart business card, digital contacts, qr portfolio, qodex contact cards',
      h1: 'Smart Contact Dynamic Business Card QR',
      useCase: 'Sales Representatives, Executive Teams, Real Estate Agents',
      icon: <Contact className="h-5 w-5" />,
      iconColor: 'text-indigo-400 bg-indigo-500/10',
      preset: {
        name: 'Executive Smart Card',
        type: 'vcard',
        bodyColor: '#4338ca', // indigo-700
        eyeBorderColor: '#4f46e5', // indigo-600
        eyePupilColor: '#818cf8', // indigo-400
        dotType: 'square',
        eyeType: 'square',
        logoSize: 40,
        errorCorrection: 'L'
      }
    },
    {
      slug: 'payment-qr-code-generator',
      title: 'Paystack Payment QR Code Generator | Qodex African Retail',
      metaDesc: 'Accept instant bank transfers and digital payments via secure Paystack merchant dynamic codes. Fully optimized for instant scan-to-pay experiences.',
      keywords: 'payment qr code, scan to pay, paystack bank transfer qr, merchant payment terminal qr',
      h1: 'Paystack Secure Merchant Payment QR Code',
      useCase: 'Supermarkets, Petrol Stations, Tech Hubs, Local Grocers',
      icon: <CreditCard className="h-5 w-5" />,
      iconColor: 'text-teal-400 bg-teal-500/10',
      preset: {
        name: 'Merchant Pay Counter',
        type: 'payment',
        bodyColor: '#0f766e', // teal-700
        eyeBorderColor: '#0d9488', // teal-600
        eyePupilColor: '#2dd4bf', // teal-400
        dotType: 'rounded',
        eyeType: 'circle',
        logoSize: 45,
        errorCorrection: 'H'
      }
    }
  ];

  const [activePageIndex, setActivePageIndex] = useState(0);
  const currentPage = pages[activePageIndex];
  const [activeSubTab, setActiveSubTab] = useState<'preview' | 'schema' | 'sitemap'>('preview');

  // Programmatic JSON-LD Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Qodex QR Code Suite",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "All",
    "url": `https://qodex.io/${currentPage.slug}`,
    "description": currentPage.metaDesc,
    "offers": {
      "@type": "Offer",
      "price": "0.00",
      "priceCurrency": "USD",
      "category": "Usage-Based Pay-as-you-go"
    },
    "featureList": [
      "Dynamic redirections updateable in real-time",
      "Custom vector patterns, eyes and brand overlays",
      "Localized wallet billing in NGN, KES, and USD",
      "Full offline-first analytic auditing and privacy compliant logging"
    ],
    "author": {
      "@type": "Organization",
      "name": "Qodex Micro SaaS Team",
      "url": "https://qodex.io"
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!', 'success');
  };

  const generateSitemapXml = () => {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    pages.forEach((p) => {
      xml += `  <url>\n`;
      xml += `    <loc>https://qodex.io/${p.slug}</loc>\n`;
      xml += `    <lastmod>${new Date().toISOString().substring(0, 10)}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.80</priority>\n`;
      xml += `  </url>\n`;
    });
    xml += `  <url>\n`;
    xml += `    <loc>https://qodex.io/</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString().substring(0, 10)}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>1.00</priority>\n`;
    xml += `  </url>\n`;
    xml += `</urlset>`;
    return xml;
  };

  const downloadSitemap = () => {
    const element = document.createElement("a");
    const file = new Blob([generateSitemapXml()], {type: 'text/xml'});
    element.href = URL.createObjectURL(file);
    element.download = "sitemap.xml";
    document.body.appendChild(element);
    element.click();
    showToast('XML sitemap downloaded successfully!', 'success');
  };

  return (
    <div id="panel-seo" className="space-y-6">
      
      {/* Overview Block */}
      <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/10">
              PROGRAMMATIC SEO MACHINE
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded-full border border-indigo-500/10">
              CRAWLER FRIENDLY
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-100 tracking-tight">
            Programmatic Use-Case Landing Engine
          </h2>
          <p className="text-slate-400 text-xs leading-relaxed">
            Qodex automatically builds high-performance, search-optimized landing pages for specific target search verticals. Boost organic traffic for localized terms with dynamic schemas, OpenGraph card previews, and dynamic sitemaps.
          </p>
        </div>
        <button
          onClick={downloadSitemap}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-4 py-3 rounded-2xl transition-all flex items-center gap-1.5 shrink-0"
        >
          <Download className="h-4 w-4" /> Download sitemap.xml
        </button>
      </div>

      {/* Selector and Main Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Page Selector */}
        <div className="lg:col-span-4 space-y-3">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block px-1">
            Programmatic Routes &amp; Landing Pages
          </span>
          <div className="space-y-2 bg-slate-950 border border-slate-900 rounded-2xl p-2">
            {pages.map((p, idx) => (
              <button
                key={p.slug}
                onClick={() => setActivePageIndex(idx)}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 border ${activePageIndex === idx ? 'bg-slate-900 border-indigo-500/30 text-slate-200' : 'bg-transparent border-transparent hover:bg-slate-900/40 text-slate-400'}`}
              >
                <div className={`p-2 rounded-lg shrink-0 ${p.iconColor}`}>
                  {p.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="font-extrabold text-xs block truncate">{p.title.split('|')[0]}</span>
                  <span className="text-[10px] font-mono text-slate-500 block truncate">/{p.slug}</span>
                  <span className="text-[9px] text-indigo-400 font-semibold block mt-1">{p.useCase.split(',')[0]} Preset ready</span>
                </div>
              </button>
            ))}
          </div>

          {/* Quick Launch Call-To-Action */}
          <div className="bg-gradient-to-br from-indigo-950/20 to-slate-950 border border-slate-900 rounded-2xl p-5 space-y-3.5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span className="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider">Instant Setup Link</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Instantly bootstrap the Design Studio with designer-selected configurations optimized specifically for <strong>{currentPage.useCase.split(',')[0]}</strong>.
            </p>
            <button
              onClick={() => {
                onLoadPreset(currentPage.preset);
              }}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-extrabold text-xs py-2.5 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-1"
            >
              Load Preset &amp; Open Studio <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Right Side: Tabbed Preview Area */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Sub-tabs header */}
          <div className="flex justify-between items-center border-b border-slate-900 pb-2">
            <div className="flex gap-2">
              {[
                { id: 'preview', label: 'Meta & SERP Preview', icon: <Search className="h-3.5 w-3.5" /> },
                { id: 'schema', label: 'Structured Data (Schema.org)', icon: <FileCode className="h-3.5 w-3.5" /> },
                { id: 'sitemap', label: 'Interactive XML Sitemap', icon: <Map className="h-3.5 w-3.5" /> }
              ].map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setActiveSubTab(sub.id as any)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${activeSubTab === sub.id ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' : 'text-slate-400 hover:text-slate-200 border border-transparent'}`}
                >
                  {sub.icon} {sub.label}
                </button>
              ))}
            </div>
            <div className="text-[10px] font-mono text-slate-500">
              Slug: /{currentPage.slug}
            </div>
          </div>

          {/* Sub-tab 1: SERP Preview */}
          {activeSubTab === 'preview' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Google Search Result Preview */}
              <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 space-y-3">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Google Search Result Snippet Preview</span>
                
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 font-sans max-w-xl">
                  {/* URL */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                    <span className="bg-slate-800 p-0.5 rounded text-[10px] text-indigo-400 font-mono">Q</span>
                    <span className="truncate text-slate-300">https://qodex.io &gt; {currentPage.slug}</span>
                  </div>
                  {/* Title */}
                  <h4 className="text-lg font-medium text-[#8ab4f8] hover:underline cursor-pointer tracking-tight leading-tight mb-1">
                    {currentPage.title}
                  </h4>
                  {/* Meta Description */}
                  <p className="text-xs text-slate-400 leading-relaxed">
                    <span className="text-slate-500 font-mono text-[10px] mr-1">Jul 16, 2026 —</span>
                    {currentPage.metaDesc}
                  </p>
                </div>
              </div>

              {/* Social Media OpenGraph Card Preview */}
              <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 space-y-4">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Facebook &amp; LinkedIn Social Card Preview (OpenGraph)</span>
                
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden max-w-xl flex flex-col">
                  {/* Image mock */}
                  <div className="relative bg-gradient-to-br from-[#0c1322] to-indigo-950 h-52 flex items-center justify-center p-6 border-b border-slate-800">
                    {/* Watermark/Logo */}
                    <div className="absolute top-4 left-4 flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-xs">Q</div>
                      <span className="text-[10px] font-extrabold tracking-widest text-slate-400">QODEX.IO</span>
                    </div>
                    <div className="absolute top-4 right-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black text-[8px] uppercase tracking-wider px-2 py-0.5 rounded">
                      Dynamic QR Code Generator
                    </div>

                    {/* Central Display Visual */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/20 shadow-lg shadow-indigo-500/5 relative">
                        {/* Interactive mini QR pattern */}
                        <svg viewBox="0 0 100 100" className="w-16 h-16">
                          <g fill={currentPage.preset.bodyColor}>
                            <rect x="5" y="5" width="22" height="22" rx="4" fill="none" stroke={currentPage.preset.eyeBorderColor} strokeWidth="4" />
                            <rect x="11" y="11" width="10" height="10" rx="2" fill={currentPage.preset.eyePupilColor} />
                            <rect x="73" y="5" width="22" height="22" rx="4" fill="none" stroke={currentPage.preset.eyeBorderColor} strokeWidth="4" />
                            <rect x="79" y="11" width="10" height="10" rx="2" fill={currentPage.preset.eyePupilColor} />
                            <rect x="5" y="73" width="22" height="22" rx="4" fill="none" stroke={currentPage.preset.eyeBorderColor} strokeWidth="4" />
                            <rect x="11" y="79" width="10" height="10" rx="2" fill={currentPage.preset.eyePupilColor} />
                            {/* QR Body Mock */}
                            <circle cx="45" cy="15" r="4" />
                            <circle cx="55" cy="25" r="4" />
                            <circle cx="35" cy="45" r="4" />
                            <circle cx="45" cy="55" r="4" />
                            <circle cx="65" cy="45" r="4" />
                            <circle cx="55" cy="75" r="4" />
                          </g>
                        </svg>
                      </div>
                      <span className="text-xs font-black text-slate-100 uppercase tracking-widest">{currentPage.h1}</span>
                      <span className="text-[9px] text-slate-500">{currentPage.keywords}</span>
                    </div>
                    
                    {/* Footnote */}
                    <div className="absolute bottom-2 inset-x-0 text-center text-[8px] text-slate-600 font-mono">
                      OG IMAGE CANONICAL TARGET: https://qodex.io/assets/og-{currentPage.slug}.png
                    </div>
                  </div>

                  {/* Metadata Text */}
                  <div className="p-4 bg-slate-950/80 space-y-1">
                    <span className="text-[10px] font-mono text-indigo-400">QODEX.IO</span>
                    <h5 className="font-bold text-xs text-slate-200 truncate">{currentPage.title}</h5>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{currentPage.metaDesc}</p>
                  </div>
                </div>
              </div>

              {/* Raw Meta Tags Inspector */}
              <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Raw HTML Head Meta Tags</span>
                  <button 
                    onClick={() => {
                      const tags = `<title>${currentPage.title}</title>\n<meta name="description" content="${currentPage.metaDesc}">\n<meta name="keywords" content="${currentPage.keywords}">\n<link rel="canonical" href="https://qodex.io/${currentPage.slug}">`;
                      copyToClipboard(tags);
                    }}
                    className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 font-bold bg-indigo-500/5 px-2.5 py-1 rounded-lg border border-indigo-500/10 transition-all"
                  >
                    <Copy className="h-3 w-3" /> Copy tags
                  </button>
                </div>
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 font-mono text-[11px] text-emerald-400/90 overflow-x-auto space-y-1">
                  <div>&lt;title&gt;{currentPage.title}&lt;/title&gt;</div>
                  <div>&lt;meta name="description" content="{currentPage.metaDesc}" /&gt;</div>
                  <div>&lt;meta name="keywords" content="{currentPage.keywords}" /&gt;</div>
                  <div>&lt;link rel="canonical" href="https://qodex.io/{currentPage.slug}" /&gt;</div>
                  <div>&lt;meta property="og:type" content="website" /&gt;</div>
                  <div>&lt;meta property="og:title" content="{currentPage.title}" /&gt;</div>
                  <div>&lt;meta property="og:description" content="{currentPage.metaDesc}" /&gt;</div>
                </div>
              </div>

            </div>
          )}

          {/* Sub-tab 2: Schema JSON-LD */}
          {activeSubTab === 'schema' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-200">Schema.org Structured Data</h4>
                    <p className="text-[10px] text-slate-500">Inject SoftwareApplication rich snippet markers into head crawler engines.</p>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(JSON.stringify(jsonLd, null, 2))}
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-bold bg-indigo-500/5 px-3 py-1.5 rounded-xl border border-indigo-500/10 transition-all"
                  >
                    <Copy className="h-3.5 w-3.5" /> Copy JSON-LD
                  </button>
                </div>

                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 font-mono text-[11px] text-indigo-300/90 overflow-x-auto max-h-96">
                  <pre>{JSON.stringify(jsonLd, null, 2)}</pre>
                </div>

                <div className="flex gap-2 items-center text-[10px] text-slate-400 bg-slate-900/30 p-3 rounded-xl border border-slate-900">
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Valid Google Structured Data: Passes Rich Snippet tests for SoftwareApplication card appearance.</span>
                </div>
              </div>
            </div>
          )}

          {/* Sub-tab 3: Sitemap */}
          {activeSubTab === 'sitemap' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-200">Live Dynamic XML Sitemap</h4>
                    <p className="text-[10px] text-slate-500">Directly mapping SEO generator pathways and priorities.</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => copyToClipboard(generateSitemapXml())}
                      className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-bold bg-indigo-500/5 px-3 py-1.5 rounded-xl border border-indigo-500/10 transition-all"
                    >
                      <Copy className="h-3.5 w-3.5" /> Copy XML
                    </button>
                    <button 
                      onClick={downloadSitemap}
                      className="flex items-center gap-1 text-xs text-slate-950 font-extrabold bg-emerald-500 hover:bg-emerald-400 px-3 py-1.5 rounded-xl transition-all"
                    >
                      <Download className="h-3.5 w-3.5" /> Download
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-96">
                  <pre>{generateSitemapXml()}</pre>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
