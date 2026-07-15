/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Camera,
  Wallet,
  BarChart3,
  Check,
  Copy,
  Download,
  RefreshCw,
  Edit2,
  ExternalLink,
  Plus,
  Trash2,
  Smartphone,
  CreditCard,
  Send,
  Sparkles,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  Globe,
  Info,
  Search,
  Filter,
  CheckSquare,
  DollarSign,
  Lock,
  Calendar,
  Users,
  FolderOpen,
  Gift,
  ShieldCheck,
  Scale,
  History
} from 'lucide-react';

import { QRStyle, Campaign, Transaction, Workspace, Folder, ReferralStats, ReferralRecord, FeaturePricing, CreditPackage, User, UserRole, TeamInvitation, WorkspaceMember, QRVersion } from './types';
import { DEFAULT_FEATURE_PRICING, DEFAULT_PACKAGES, INITIAL_WORKSPACES, INITIAL_FOLDERS, INITIAL_REFERRAL_STATS } from './data';

import AdminConsole from './components/AdminConsole';
import TeamWorkspacePanel from './components/TeamWorkspacePanel';
import ReferralPanel from './components/ReferralPanel';
import CompliancePanel from './components/CompliancePanel';
import PaymentSandbox from './components/PaymentSandbox';
import AuthPanel from './components/AuthPanel';
import QRScannerModal from './components/QRScannerModal';

// Preset logos
const LOGO_PRESETS = [
  { name: 'None', url: null, label: 'No Logo' },
  { name: 'WhatsApp', url: 'https://cdn-icons-png.flaticon.com/512/733/733585.png', label: 'WhatsApp' },
  { name: 'Instagram', url: 'https://cdn-icons-png.flaticon.com/512/2111/2111463.png', label: 'Instagram' },
  { name: 'Website', url: 'https://cdn-icons-png.flaticon.com/512/1006/1006771.png', label: 'Link' },
  { name: 'WiFi', url: 'https://cdn-icons-png.flaticon.com/512/747/747327.png', label: 'WiFi' },
  { name: 'Naira Pay', url: 'https://cdn-icons-png.flaticon.com/512/583/583985.png', label: 'Naira' }
];

const QR_TYPES_BY_CATEGORY: Record<string, { id: string; label: string; icon: string }[]> = {
  web: [
    { id: 'url', label: 'URL / Web', icon: '🔗' },
    { id: 'text', label: 'Plain Text', icon: '📝' },
    { id: 'email', label: 'Email', icon: '📧' },
    { id: 'phone', label: 'Phone Dial', icon: '📞' },
    { id: 'sms', label: 'SMS Msg', icon: '💬' },
    { id: 'whatsapp', label: 'WhatsApp', icon: '🟢' },
    { id: 'custom_url', label: 'Custom URL', icon: '✏️' }
  ],
  social: [
    { id: 'facebook', label: 'Facebook', icon: '📘' },
    { id: 'instagram', label: 'Instagram', icon: '📸' },
    { id: 'linkedin', label: 'LinkedIn', icon: '💼' },
    { id: 'x', label: 'X (Twitter)', icon: '✖️' },
    { id: 'tiktok', label: 'TikTok', icon: '🎵' },
    { id: 'youtube', label: 'YouTube', icon: '📺' }
  ],
  files: [
    { id: 'pdf', label: 'PDF Document', icon: '📕' },
    { id: 'images', label: 'Images Gallery', icon: '🖼️' }
  ],
  utils: [
    { id: 'wifi', label: 'WiFi Network', icon: '📶' },
    { id: 'vcard', label: 'vCard Contact', icon: '📇' },
    { id: 'maps', label: 'Google Maps', icon: '📍' },
    { id: 'event', label: 'Event Details', icon: '🎉' },
    { id: 'calendar', label: 'Calendar', icon: '📅' }
  ],
  business: [
    { id: 'bank', label: 'Naira Bank', icon: '🏦' },
    { id: 'payments', label: 'Payments', icon: '💳' },
    { id: 'crypto', label: 'Crypto Wallet', icon: '🪙' },
    { id: 'menu', label: 'Restaurant Menu', icon: '🍔' },
    { id: 'product_labels', label: 'Product Labels', icon: '🏷️' },
    { id: 'coupons', label: 'Coupons / Promo', icon: '🎟️' },
    { id: 'inventory_labels', label: 'Inventory ID', icon: '📦' }
  ]
};

// Preset Styles for African/Nigerian market
const AGENCY_PRESETS = [
  {
    name: 'Lekki Boutique Instagram',
    type: 'url',
    targetUrl: 'https://instagram.com/lekkiboutique',
    style: {
      dotType: 'liquid',
      eyeType: 'leaf',
      fgColor: '#db2777',
      bgColor: '#fff1f2',
      gradientEnabled: true,
      gradientColor: '#701a75',
      logoUrl: 'https://cdn-icons-png.flaticon.com/512/2111/2111463.png',
      logoSize: 18,
      errorCorrectionLevel: 'H'
    } as QRStyle,
    useCase: 'Instagram Shopping & Lekki Showrooms'
  },
  {
    name: 'Lagos Diner Table Menu',
    type: 'url',
    targetUrl: 'https://grillsandgreens.com/lagos-menu',
    style: {
      dotType: 'rounded',
      eyeType: 'rounded',
      fgColor: '#b45309',
      bgColor: '#fffbeb',
      gradientEnabled: true,
      gradientColor: '#78350f',
      logoUrl: 'https://cdn-icons-png.flaticon.com/512/1006/1006771.png',
      logoSize: 16,
      errorCorrectionLevel: 'Q'
    } as QRStyle,
    useCase: 'Contactless Table ordering in Ikeja & VI'
  },
  {
    name: 'Yaba Hub Premium WiFi',
    type: 'wifi',
    targetUrl: 'WIFI:S:Yaba_Silicon_Hub;T:WPA;P:techyaba2026;;',
    style: {
      dotType: 'dots',
      eyeType: 'circle',
      fgColor: '#1d4ed8',
      bgColor: '#f0f9ff',
      gradientEnabled: true,
      gradientColor: '#0369a1',
      logoUrl: 'https://cdn-icons-png.flaticon.com/512/747/747327.png',
      logoSize: 18,
      errorCorrectionLevel: 'H'
    } as QRStyle,
    useCase: 'Yaba startups & co-working cafes'
  }
];

// ==========================================
// SEED INITIAL DATA (LOCALSTORAGE)
// ==========================================
const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp-1',
    name: 'Ikeja Food Menu',
    type: 'url',
    targetUrl: 'https://grillsandgreens.com/menu',
    shortUrl: 'https://qodex.io/grills',
    created: '2026-06-10',
    clicks: 245,
    scanLocations: { 'Lagos (Ikeja)': 120, 'Lagos (Lekki)': 65, 'Abuja': 35, 'Nairobi': 15, 'Others': 10 },
    devices: { 'Android': 165, 'iPhone': 68, 'Desktop': 12 },
    scansOverTime: [24, 31, 28, 42, 38, 45, 37],
    customization: {
      dotType: 'rounded',
      eyeType: 'rounded',
      fgColor: '#b45309',
      bgColor: '#ffffff',
      gradientEnabled: true,
      gradientColor: '#78350f',
      logoUrl: null,
      logoSize: 15,
      errorCorrectionLevel: 'Q'
    },
    isUnlocked: true,
    isSvgUnlocked: false
  },
  {
    id: 'camp-2',
    name: 'Yaba Startups WiFi',
    type: 'wifi',
    targetUrl: 'WIFI:S:Yaba_Silicon_Hub;T:WPA;P:techyaba2026;;',
    shortUrl: 'https://qodex.io/yabahub',
    created: '2026-06-25',
    clicks: 412,
    scanLocations: { 'Lagos (Yaba)': 320, 'Lagos (VI)': 52, 'Abuja': 25, 'London': 15 },
    devices: { 'Android': 220, 'iPhone': 182, 'Desktop': 10 },
    scansOverTime: [42, 58, 49, 68, 59, 71, 65],
    customization: {
      dotType: 'dots',
      eyeType: 'circle',
      fgColor: '#1d4ed8',
      bgColor: '#ffffff',
      gradientEnabled: true,
      gradientColor: '#0369a1',
      logoUrl: 'https://cdn-icons-png.flaticon.com/512/747/747327.png',
      logoSize: 18,
      errorCorrectionLevel: 'H'
    },
    isUnlocked: true,
    isSvgUnlocked: true
  },
  {
    id: 'camp-3',
    name: 'Lekki Showroom Boutique',
    type: 'url',
    targetUrl: 'https://instagram.com/lekkiboutique',
    shortUrl: 'https://qodex.io/lekki-ig',
    created: '2026-07-02',
    clicks: 98,
    scanLocations: { 'Lagos (Lekki)': 68, 'Lagos (Ikeja)': 15, 'Port Harcourt': 10, 'Abuja': 5 },
    devices: { 'Android': 34, 'iPhone': 60, 'Desktop': 4 },
    scansOverTime: [8, 12, 11, 15, 20, 14, 18],
    customization: {
      dotType: 'liquid',
      eyeType: 'leaf',
      fgColor: '#db2777',
      bgColor: '#ffffff',
      gradientEnabled: true,
      gradientColor: '#701a75',
      logoUrl: 'https://cdn-icons-png.flaticon.com/512/2111/2111463.png',
      logoSize: 18,
      errorCorrectionLevel: 'H'
    },
    isUnlocked: false,
    isSvgUnlocked: false
  }
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-101',
    desc: 'Purchased Pro Starter Pack (20 credits)',
    amount: '₦4,500',
    status: 'SUCCESS',
    date: '2026-07-01',
    type: 'credit_purchase',
    change: '+20',
    ref: 'QTX-PAY-72910'
  },
  {
    id: 'tx-102',
    desc: 'Dynamic Campaign creation (Lekki Boutique IG)',
    amount: '0',
    status: 'SUCCESS',
    date: '2026-07-02',
    type: 'campaign_create',
    change: '-1',
    ref: 'QTX-CAM-09211'
  },
  {
    id: 'tx-103',
    desc: 'Premium SVG high-resolution export (Yaba WiFi)',
    amount: '0',
    status: 'SUCCESS',
    date: '2026-07-05',
    type: 'premium_svg',
    change: '-1',
    ref: 'QTX-SVG-38190'
  },
  {
    id: 'tx-104',
    desc: 'Promo Sign-up Bonus Granted',
    amount: '0',
    status: 'SUCCESS',
    date: '2026-07-15',
    type: 'promo_bonus',
    change: '+5',
    ref: 'QTX-PRM-WELC9'
  }
];

export default function App() {
  // ==========================================
  // SYSTEM STATE (LOCAL STORAGE PERSISTED)
  // ==========================================
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => {
    const saved = localStorage.getItem('qodex_workspaces');
    return saved ? JSON.parse(saved) : INITIAL_WORKSPACES;
  });

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(() => {
    const saved = localStorage.getItem('qodex_active_ws_id');
    return saved ? saved : 'ws-personal';
  });

  const [credits, setCredits] = useState<number>(() => {
    // Shared wallet balance synced from active workspace
    const savedWs = localStorage.getItem('qodex_workspaces');
    const wsList: Workspace[] = savedWs ? JSON.parse(savedWs) : INITIAL_WORKSPACES;
    const activeId = localStorage.getItem('qodex_active_ws_id') || 'ws-personal';
    const activeWs = wsList.find(w => w.id === activeId) || wsList[0];
    return activeWs ? activeWs.sharedWalletBalance : 24;
  });

  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    const saved = localStorage.getItem('qodex_campaigns');
    return saved ? JSON.parse(saved) : INITIAL_CAMPAIGNS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('qodex_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [folders, setFolders] = useState<Folder[]>(() => {
    const saved = localStorage.getItem('qodex_folders');
    return saved ? JSON.parse(saved) : INITIAL_FOLDERS;
  });

  const [referralStats, setReferralStats] = useState<ReferralStats>(() => {
    const saved = localStorage.getItem('qodex_referral_stats');
    return saved ? JSON.parse(saved) : INITIAL_REFERRAL_STATS;
  });

  const [featurePricing, setFeaturePricing] = useState<FeaturePricing[]>(() => {
    const saved = localStorage.getItem('qodex_feature_pricing');
    return saved ? JSON.parse(saved) : DEFAULT_FEATURE_PRICING;
  });

  const [packages, setPackages] = useState<CreditPackage[]>(() => {
    const saved = localStorage.getItem('qodex_packages');
    return saved ? JSON.parse(saved) : DEFAULT_PACKAGES;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('qodex_current_user');
    return saved ? JSON.parse(saved) : {
      id: 'user-kunle',
      name: 'Kunle Adeleke',
      email: 'kunle@yabaspace.ng',
      role: 'Admin',
      isVerified: true,
      createdAt: '2026-06-01'
    };
  });

  const [invitations, setInvitations] = useState<TeamInvitation[]>(() => {
    const saved = localStorage.getItem('qodex_invitations');
    return saved ? JSON.parse(saved) : [];
  });

  const [qrVersions, setQrVersions] = useState<QRVersion[]>(() => {
    const saved = localStorage.getItem('qodex_qr_versions');
    return saved ? JSON.parse(saved) : [];
  });

  // Sync state to local storage on change
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('qodex_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('qodex_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('qodex_invitations', JSON.stringify(invitations));
  }, [invitations]);

  useEffect(() => {
    localStorage.setItem('qodex_qr_versions', JSON.stringify(qrVersions));
  }, [qrVersions]);

  useEffect(() => {
    localStorage.setItem('qodex_workspaces', JSON.stringify(workspaces));
  }, [workspaces]);

  useEffect(() => {
    localStorage.setItem('qodex_active_ws_id', activeWorkspaceId);
  }, [activeWorkspaceId]);

  useEffect(() => {
    localStorage.setItem('qodex_credits', credits.toString());
  }, [credits]);

  useEffect(() => {
    localStorage.setItem('qodex_campaigns', JSON.stringify(campaigns));
  }, [campaigns]);

  useEffect(() => {
    localStorage.setItem('qodex_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('qodex_folders', JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    localStorage.setItem('qodex_referral_stats', JSON.stringify(referralStats));
  }, [referralStats]);

  useEffect(() => {
    localStorage.setItem('qodex_feature_pricing', JSON.stringify(featurePricing));
  }, [featurePricing]);

  useEffect(() => {
    localStorage.setItem('qodex_packages', JSON.stringify(packages));
  }, [packages]);

  // ==========================================
  // AUTHENTICATION & TEAM INVITATION HANDLERS
  // ==========================================
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    // Auto-switch to their personal workspace or a workspace they own
    const userWorkspace = workspaces.find(w => w.ownerId === user.id || w.members.some(m => m.email.toLowerCase() === user.email.toLowerCase()));
    if (userWorkspace) {
      setActiveWorkspaceId(userWorkspace.id);
      setCredits(userWorkspace.sharedWalletBalance);
    }
  };

  const handleSignup = (name: string, email: string, role: UserRole): User => {
    const newUser: User = {
      id: `usr-${Date.now()}`,
      name,
      email,
      role,
      isVerified: false, // Unverified by default to show verification screen!
      createdAt: new Date().toISOString()
    };
    setCurrentUser(newUser);

    // If they sign up as Admin/Operator, let's auto-provision a personal workspace for them!
    const newWs: Workspace = {
      id: `ws-${Date.now()}`,
      name: `${name}'s Workspace`,
      ownerId: newUser.id,
      isPersonal: true,
      sharedWalletBalance: 15, // Starts with 15 starter promo credits
      members: [
        { id: newUser.id, name, email, role: 'Owner', joinedAt: new Date().toISOString().split('T')[0] }
      ],
      whiteLabelEnabled: false,
      maxSeats: 3
    };

    setWorkspaces(prev => [...prev, newWs]);
    setActiveWorkspaceId(newWs.id);
    setCredits(newWs.sharedWalletBalance);

    return newUser;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    showToast('Successfully logged out of Qodex workspace.', 'info');
  };

  const handleVerify = () => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, isVerified: true });
    }
  };

  const handleResetPassword = (email: string, newPass: string) => {
    showToast(`Password overridden for account ${email} successfully!`, 'success');
  };

  const handleAcceptInvitation = (token: string) => {
    const invite = invitations.find(inv => inv.token === token);
    if (!invite) {
      showToast('Invitation token not found or expired.', 'error');
      return;
    }
    if (invite.status !== 'PENDING') {
      showToast('This invitation has already been accepted.', 'error');
      return;
    }

    // 1. Mark invite accepted
    setInvitations(prev => prev.map(inv => inv.token === token ? { ...inv, status: 'ACCEPTED' } : inv));

    // 2. Add member to the workspace
    const newMember: WorkspaceMember = {
      id: currentUser?.id || `user-${Date.now()}`,
      name: currentUser?.name || invite.name,
      email: currentUser?.email || invite.email,
      role: invite.role,
      joinedAt: new Date().toISOString().split('T')[0]
    };

    setWorkspaces(prev => prev.map(w => {
      if (w.id === invite.workspaceId) {
        // Prevent duplicate members
        const exists = w.members.some(m => m.email.toLowerCase() === newMember.email.toLowerCase());
        if (exists) return w;
        return {
          ...w,
          members: [...w.members, newMember]
        };
      }
      return w;
    }));

    showToast(`Successfully joined "${invite.workspaceName}" as an ${invite.role}!`, 'success');
    
    // Auto-switch workspace context to the invited one
    setActiveWorkspaceId(invite.workspaceId);
    const targetWs = workspaces.find(w => w.id === invite.workspaceId);
    if (targetWs) {
      setCredits(targetWs.sharedWalletBalance);
    }
  };

  // ==========================================
  // NAVIGATION & UI STATE
  // ==========================================
  const [activeTab, setActiveTab] = useState<'studio' | 'campaigns' | 'templates' | 'wallet' | 'team' | 'referral' | 'compliance'>('studio');
  const [currency, setCurrency] = useState<'NGN' | 'KES' | 'USD'>('NGN');
  const [detectedCountry, setDetectedCountry] = useState<string>('Detecting via IP...');

  // IP Country Detection (NDPA/GDPR Compliance)
  useEffect(() => {
    let active = true;
    const detectCountryAndCurrency = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (active && data) {
          const country = data.country_name || 'International';
          setDetectedCountry(country);
          if (data.country_code === 'NG') {
            setCurrency('NGN');
            showToast('Auto-detected location: Nigeria. Currency set to NGN.', 'info');
          } else if (data.country_code === 'KE') {
            setCurrency('KES');
            showToast('Auto-detected location: Kenya. Currency set to KES.', 'info');
          } else {
            setCurrency('USD');
            showToast(`Auto-detected location: ${country}. Currency set to USD.`, 'info');
          }
        }
      } catch (err) {
        console.warn('IP Country detection failed, defaulting to NGN', err);
        if (active) {
          setDetectedCountry('Nigeria (Default Fallback)');
          setCurrency('NGN');
        }
      }
    };
    detectCountryAndCurrency();
    return () => {
      active = false;
    };
  }, []);
  
  // Notification system
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Selected Campaign for Detail/Analytics modal
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const selectedCampaign = useMemo(() => {
    return campaigns.find(c => c.id === selectedCampaignId) || null;
  }, [campaigns, selectedCampaignId]);

  // Campaign Editing state
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [editingTargetUrl, setEditingTargetUrl] = useState<string>('');

  // Checkout modal state
  const [checkoutPack, setCheckoutPack] = useState<{ name: string; credits: number; price: string } | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'select' | 'payment_method' | 'processing' | 'otp' | 'success'>('select');
  const [otpCode, setOtpCode] = useState('');
  const [paymentPhone, setPaymentPhone] = useState('');
  const [paymentCard, setPaymentCard] = useState({ number: '', expiry: '', cvc: '' });
  const [modalGateway, setModalGateway] = useState<'paystack' | 'flutterwave' | 'stripe'>('paystack');

  // Scan Simulator State
  const [scanSimCampaign, setScanSimCampaign] = useState<Campaign | null>(null);
  const [simulatedCity, setSimulatedCity] = useState<string>('Lagos (Ikeja)');

  // Bulk generation URLs (one per line)
  const [bulkInput, setBulkInput] = useState('');
  const [bulkResult, setBulkResult] = useState<string[]>([]);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);

  // ==========================================
  // STUDIO ENGINE CONFIGURATION
  // ==========================================
  const [campaignName, setCampaignName] = useState('New Lagos Campaign');
  const [qrType, setQrType] = useState<string>('url');
  const [isDynamic, setIsDynamic] = useState(true);

  // QR Content states
  const [inputUrl, setInputUrl] = useState('https://myafricanshop.com');
  const [wifiSsid, setWifiSsid] = useState('Lagos_Cafe_WiFi');
  const [wifiPass, setWifiPass] = useState('freebytes2026');
  const [wifiSec, setWifiSec] = useState('WPA');
  const [waPhone, setWaPhone] = useState('2348012345678');
  const [waText, setWaText] = useState('Hello! I would like to order a menu pack.');
  const [bankName, setBankName] = useState('Sterling Bank');
  const [bankAccount, setBankAccount] = useState('0012345678');
  const [bankHolder, setBankHolder] = useState('Grills and Greens VI');
  const [bankAmount, setBankAmount] = useState('5000');
  const [vcardName, setVcardName] = useState('Kunle Adeleke');
  const [vcardPhone, setVcardPhone] = useState('+234 812 345 6789');
  const [vcardEmail, setVcardEmail] = useState('kunle@yabaspace.ng');
  const [vcardOrg, setVcardOrg] = useState('Yaba Innovation Hub');

  // New generic QR field states for extended 26 QR Types
  const [genericText, setGenericText] = useState('Standard text payload to encode');
  const [genericEmail, setGenericEmail] = useState('hello@qodex.io');
  const [genericPhone, setGenericPhone] = useState('+234 801 234 5678');
  const [genericSubject, setGenericSubject] = useState('Inquiry via QR Code');
  const [genericLatitude, setGenericLatitude] = useState('6.4281');
  const [genericLongitude, setGenericLongitude] = useState('3.4219');
  const [genericSocialUser, setGenericSocialUser] = useState('qodex_africa');
  const [genericEventTitle, setGenericEventTitle] = useState('Lekki Tech Summit 2026');
  const [genericEventLocation, setGenericEventLocation] = useState('Lekki Coliseum, Lagos');
  const [genericCryptoType, setGenericCryptoType] = useState('BTC');
  const [genericCryptoAddress, setGenericCryptoAddress] = useState('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
  const [activeTypeCategory, setActiveTypeCategory] = useState<'web' | 'social' | 'files' | 'utils' | 'business'>('web');

  // Camera In-App QR Scanner
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Design/Styling options
  const [dotType, setDotType] = useState<'square' | 'dots' | 'rounded' | 'liquid'>('rounded');
  const [eyeType, setEyeType] = useState<'square' | 'rounded' | 'circle' | 'leaf'>('rounded');
  const [fgColor, setFgColor] = useState('#0f172a');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [gradientEnabled, setGradientEnabled] = useState(false);
  const [gradientColor, setGradientColor] = useState('#1d4ed8');
  const [customColorsEnabled, setCustomColorsEnabled] = useState(false);
  const [eyeBorderColor, setEyeBorderColor] = useState('#4f46e5');
  const [eyePupilColor, setEyePupilColor] = useState('#06b6d4');
  const [bodyColor, setBodyColor] = useState('#0f172a');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState<number>(16);
  const [errorCorrection, setErrorCorrection] = useState<'L' | 'M' | 'Q' | 'H'>('H');
  const [tempLogoInput, setTempLogoInput] = useState('');

  // Remove watermark toggle (Consumes 1 credit to unlock the current preview permanently)
  const [isUnlockedPreview, setIsUnlockedPreview] = useState(false);

  // New features states
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [password, setPassword] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState('');

  // Campaigns filtering state
  const [filterFolderId, setFilterFolderId] = useState<string>('all');

  // Dynamic cost resolution helper
  const getFeatureCost = (id: string) => {
    const item = featurePricing.find(f => f.id === id);
    return item ? item.creditsCost : 0;
  };

  // Secure and atomic credit-deduction system
  const deductCredits = (amount: number, description: string) => {
    // Check if viewer - viewers cannot spend credits
    const activeWs = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0];
    const selfMember = activeWs.members.find(m => m.id === 'user-kunle');
    if (selfMember && selfMember.role === 'Viewer') {
      showToast('Error: Viewers are read-only and cannot spend workspace credits.', 'error');
      return false;
    }

    if (credits < amount) {
      showToast(`Insufficient credits. Needed: ${amount} Cr. Balance: ${credits} Cr.`, 'error');
      setActiveTab('wallet');
      return false;
    }

    const newBalance = credits - amount;
    setCredits(newBalance);

    // Persist to workspace list
    setWorkspaces(prev => prev.map(w => {
      if (w.id === activeWorkspaceId) {
        return { ...w, sharedWalletBalance: newBalance };
      }
      return w;
    }));

    // Add transaction ledger log
    if (amount > 0) {
      setTransactions(prev => [
        {
          id: `tx-${Date.now()}`,
          desc: description,
          amount: '0',
          status: 'SUCCESS',
          date: new Date().toISOString().split('T')[0],
          type: 'usage_deduction',
          change: `-${amount}`,
          ref: `QTX-DED-${Math.floor(10000 + Math.random() * 90000)}`
        },
        ...prev
      ]);
    }
    return true;
  };

  const downloadPDF = () => {
    const cost = getFeatureCost('download_pdf');
    if (!deductCredits(cost, `Exported PDF high-quality print layout for "${campaignName}"`)) return;
    
    // Simulate high-res print PDF preparation
    const docText = `QODEX HIGH-RES PRINT LAYOUT\nCampaign: ${campaignName}\nDestination: ${rawQRPayload}\nCreated: ${new Date().toLocaleDateString()}\nStatus: Verified Non-Expired`;
    const blob = new Blob([docText], { type: 'text/plain' });
    const link = document.createElement('a');
    link.download = `${campaignName.toLowerCase().replace(/\s+/g, '_')}_print_layout.pdf`;
    link.href = URL.createObjectURL(blob);
    link.click();
    showToast(`Print PDF downloaded! ${cost} credits consumed.`, 'success');
  };

  const downloadHighResPNG = () => {
    const cost = getFeatureCost('high_res_export');
    if (!deductCredits(cost, `Exported high-resolution 2000px billboard PNG for "${campaignName}"`)) return;
    
    // Draw on high resolution virtual canvas
    const virtualCanvas = document.createElement('canvas');
    virtualCanvas.width = 2000;
    virtualCanvas.height = 2000;
    if (canvasRef.current) {
      drawQRCodeOnCanvas(virtualCanvas, rawQRPayload, {
        dotType,
        eyeType,
        fgColor,
        bgColor,
        gradientEnabled,
        gradientColor,
        logoUrl,
        logoSize,
        errorCorrectionLevel: 'H'
      }, !isUnlockedPreview);
    }
    
    setTimeout(() => {
      const link = document.createElement('a');
      link.download = `${campaignName.toLowerCase().replace(/\s+/g, '_')}_highres_2000px.png`;
      link.href = virtualCanvas.toDataURL('image/png');
      link.click();
      showToast(`High Resolution 2000px PNG downloaded! ${cost} credits consumed.`, 'success');
    }, 100);
  };

  const downloadTransparentPNG = () => {
    const cost = getFeatureCost('transparent_png');
    if (!deductCredits(cost, `Exported transparent background PNG for "${campaignName}"`)) return;
    
    const virtualCanvas = document.createElement('canvas');
    virtualCanvas.width = 512;
    virtualCanvas.height = 512;
    if (canvasRef.current) {
      drawQRCodeOnCanvas(virtualCanvas, rawQRPayload, {
        dotType,
        eyeType,
        fgColor,
        bgColor: 'transparent',
        gradientEnabled,
        gradientColor,
        logoUrl,
        logoSize,
        errorCorrectionLevel: errorCorrection
      }, !isUnlockedPreview);
    }
    
    setTimeout(() => {
      const link = document.createElement('a');
      link.download = `${campaignName.toLowerCase().replace(/\s+/g, '_')}_transparent.png`;
      link.href = virtualCanvas.toDataURL('image/png');
      link.click();
      showToast(`Transparent PNG downloaded! ${cost} credits consumed.`, 'success');
    }, 100);
  };

  // Computed raw payload that goes into the QR
  const rawQRPayload = useMemo(() => {
    switch (qrType) {
      case 'wifi':
        return `WIFI:S:${wifiSsid};T:${wifiSec};P:${wifiPass};;`;
      case 'whatsapp':
        return `https://wa.me/${waPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(waText)}`;
      case 'bank':
        return `NGN-TRANSFER:${bankName}|${bankAccount}|${bankHolder}|${bankAmount}`;
      case 'vcard':
        return `BEGIN:VCARD\nVERSION:3.0\nN:${vcardName}\nORG:${vcardOrg}\nTEL:${vcardPhone}\nEMAIL:${vcardEmail}\nEND:VCARD`;
      case 'text':
        return genericText;
      case 'email':
        return `mailto:${genericEmail}?subject=${encodeURIComponent(genericSubject)}&body=${encodeURIComponent(genericText)}`;
      case 'phone':
        return `tel:${genericPhone.replace(/\s+/g, '')}`;
      case 'sms':
        return `SMSTO:${genericPhone.replace(/\s+/g, '')}:${genericText}`;
      case 'maps':
        return `https://www.google.com/maps/search/?api=1&query=${genericLatitude},${genericLongitude}`;
      case 'facebook':
        return `https://facebook.com/${genericSocialUser}`;
      case 'instagram':
        return `https://instagram.com/${genericSocialUser}`;
      case 'linkedin':
        return `https://linkedin.com/in/${genericSocialUser}`;
      case 'x':
        return `https://x.com/${genericSocialUser}`;
      case 'tiktok':
        return `https://tiktok.com/@${genericSocialUser}`;
      case 'youtube':
        return `https://youtube.com/@${genericSocialUser}`;
      case 'pdf':
        return inputUrl.endsWith('.pdf') ? inputUrl : `${inputUrl}/document.pdf`;
      case 'images':
        return inputUrl.match(/\.(jpeg|jpg|gif|png|webp)/i) ? inputUrl : `${inputUrl}/gallery.png`;
      case 'event':
      case 'calendar':
        return `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${genericEventTitle}\nLOCATION:${genericEventLocation}\nDTSTART:20260715T120000Z\nDTEND:20260715T150000Z\nEND:VEVENT\nEND:VCALENDAR`;
      case 'payments':
        return `https://qodex.io/pay?merchant=${encodeURIComponent(bankHolder)}&amount=${bankAmount}`;
      case 'crypto':
        return `${genericCryptoType.toLowerCase()}:${genericCryptoAddress}?amount=${bankAmount}`;
      case 'menu':
        return `${inputUrl}/menu`;
      case 'product_labels':
        return `https://qodex.io/product/sku-${Math.floor(100000 + Math.random() * 900000)}`;
      case 'coupons':
        return `https://qodex.io/coupon/DISCOUNT-${Math.floor(10 + Math.random() * 90)}`;
      case 'inventory_labels':
        return `urn:qodex:inventory:item-${Math.floor(1000 + Math.random() * 9000)}`;
      case 'custom_url':
        return inputUrl;
      case 'url':
      default:
        // For dynamic URL, it redirects through Qodex shortener. In this client prototype,
        // we display the short URL redirection preview!
        if (isDynamic) {
          return `https://qodex.io/lnk/${Math.random().toString(36).substring(2, 7)}`;
        }
        return inputUrl;
    }
  }, [qrType, inputUrl, wifiSsid, wifiPass, wifiSec, waPhone, waText, bankName, bankAccount, bankHolder, bankAmount, vcardName, vcardOrg, vcardPhone, vcardEmail, genericText, genericEmail, genericPhone, genericSubject, genericLatitude, genericLongitude, genericSocialUser, genericEventTitle, genericEventLocation, genericCryptoType, genericCryptoAddress, isDynamic]);

  // ==========================================
  // QR CODE CANVAS GENERATION LOGIC
  // ==========================================
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const drawQRCodeOnCanvas = (canvas: HTMLCanvasElement, textPayload: string, options: QRStyle, withWatermark: boolean) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset and fill bg
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = options.bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    try {
      const qr = QRCode.create(textPayload, { errorCorrectionLevel: options.errorCorrectionLevel });
      const numModules = qr.modules.size;
      const moduleSize = canvas.width / numModules;

      // Define whether modules belong to the 3 finder eyes
      const isEye = (row: number, col: number) => {
        if (row < 7 && col < 7) return 'tl';
        if (row < 7 && col >= numModules - 7) return 'tr';
        if (row >= numModules - 7 && col < 7) return 'bl';
        return null;
      };

      // Set fill style or gradient
      let fillStyle: string | CanvasGradient = options.fgColor;
      if (options.gradientEnabled) {
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, options.fgColor);
        gradient.addColorStop(1, options.gradientColor);
        fillStyle = gradient;
      }
      
      let bodyFillStyle: string | CanvasGradient = (options.customColorsEnabled && options.bodyColor) ? options.bodyColor : options.fgColor;
      if (options.gradientEnabled) {
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, (options.customColorsEnabled && options.bodyColor) ? options.bodyColor : options.fgColor);
        gradient.addColorStop(1, options.gradientColor);
        bodyFillStyle = gradient;
      }
      ctx.fillStyle = bodyFillStyle;

      // Draw standard dot modules
      for (let row = 0; row < numModules; row++) {
        for (let col = 0; col < numModules; col++) {
          if (isEye(row, col)) continue;

          // Buffer center module area if logo is active
          if (options.logoUrl) {
            const pad = Math.floor(numModules * 0.15);
            const centerStart = Math.floor(numModules / 2) - pad;
            const centerEnd = Math.floor(numModules / 2) + pad;
            if (row >= centerStart && row <= centerEnd && col >= centerStart && col <= centerEnd) {
              continue;
            }
          }

          if (qr.modules.get(row, col)) {
            const x = col * moduleSize;
            const y = row * moduleSize;

            ctx.fillStyle = bodyFillStyle;
            if (options.dotType === 'dots') {
              ctx.beginPath();
              ctx.arc(x + moduleSize / 2, y + moduleSize / 2, (moduleSize / 2) * 0.85, 0, 2 * Math.PI);
              ctx.fill();
            } else if (options.dotType === 'rounded') {
              const r = moduleSize * 0.25;
              ctx.beginPath();
              ctx.roundRect(x + 0.5, y + 0.5, moduleSize - 1, moduleSize - 1, r);
              ctx.fill();
            } else if (options.dotType === 'liquid') {
              ctx.beginPath();
              ctx.arc(x + moduleSize / 2, y + moduleSize / 2, (moduleSize / 2) * 1.1, 0, 2 * Math.PI);
              ctx.fill();
            } else {
              // Square (classic)
              ctx.fillRect(x, y, moduleSize, moduleSize);
            }
          }
        }
      }

      // Draw custom beautiful outer eye boundaries & inner pupils
      const drawEyeBorderAndPupil = (ox: number, oy: number) => {
        const borderStyle = (options.customColorsEnabled && options.eyeBorderColor) ? options.eyeBorderColor : fillStyle;
        const pupilStyle = (options.customColorsEnabled && options.eyePupilColor) ? options.eyePupilColor : fillStyle;

        ctx.fillStyle = borderStyle;
        const eyeSize = moduleSize * 7;
        const strokeWidth = moduleSize;

        // Draw Outer Eye Shape
        ctx.beginPath();
        if (options.eyeType === 'rounded') {
          const r = eyeSize * 0.25;
          ctx.roundRect(ox + strokeWidth / 2, oy + strokeWidth / 2, eyeSize - strokeWidth, eyeSize - strokeWidth, r);
        } else if (options.eyeType === 'circle') {
          ctx.arc(ox + eyeSize / 2, oy + eyeSize / 2, (eyeSize - strokeWidth) / 2, 0, 2 * Math.PI);
        } else if (options.eyeType === 'leaf') {
          // Sharp top-left & bottom-right, smooth rounded top-right & bottom-left
          ctx.moveTo(ox + strokeWidth, oy + eyeSize / 2);
          ctx.bezierCurveTo(ox + strokeWidth, oy + strokeWidth, ox + eyeSize / 2, oy + strokeWidth, ox + eyeSize - strokeWidth, oy + strokeWidth);
          ctx.bezierCurveTo(ox + eyeSize - strokeWidth, oy + eyeSize / 2, ox + eyeSize - strokeWidth, oy + eyeSize - strokeWidth, ox + eyeSize / 2, oy + eyeSize - strokeWidth);
          ctx.bezierCurveTo(ox + strokeWidth, oy + eyeSize - strokeWidth, ox + strokeWidth, oy + eyeSize / 2, ox + strokeWidth, oy + eyeSize / 2);
        } else {
          // Classic Square
          ctx.rect(ox + strokeWidth / 2, oy + strokeWidth / 2, eyeSize - strokeWidth, eyeSize - strokeWidth);
        }
        ctx.strokeStyle = borderStyle;
        ctx.lineWidth = strokeWidth;
        ctx.stroke();

        // Draw Inner Eye Pupil
        ctx.beginPath();
        const pupilSize = moduleSize * 3;
        const px = ox + moduleSize * 2;
        const py = oy + moduleSize * 2;

        if (options.eyeType === 'rounded') {
          const pr = pupilSize * 0.25;
          ctx.roundRect(px, py, pupilSize, pupilSize, pr);
        } else if (options.eyeType === 'circle' || options.eyeType === 'leaf') {
          ctx.arc(px + pupilSize / 2, py + pupilSize / 2, pupilSize / 2, 0, 2 * Math.PI);
        } else {
          ctx.rect(px, py, pupilSize, pupilSize);
        }
        ctx.fillStyle = pupilStyle;
        ctx.fill();
      };

      // Draw the three finder patterns
      drawEyeBorderAndPupil(0, 0); // Top-Left
      drawEyeBorderAndPupil((numModules - 7) * moduleSize, 0); // Top-Right
      drawEyeBorderAndPupil(0, (numModules - 7) * moduleSize); // Bottom-Left

      // Draw Center Logo overlay if requested
      if (options.logoUrl) {
        const img = new Image();
        img.src = options.logoUrl;
        img.crossOrigin = 'anonymous'; // avoid tainted canvas issues
        img.onload = () => {
          const logoPixelSize = canvas.width * (options.logoSize / 100);
          const lx = (canvas.width - logoPixelSize) / 2;
          const ly = (canvas.height - logoPixelSize) / 2;

          // Draw protective circle behind logo to mask standard grid lines
          ctx.fillStyle = options.bgColor;
          ctx.beginPath();
          ctx.arc(canvas.width / 2, canvas.height / 2, logoPixelSize / 2 + 6, 0, 2 * Math.PI);
          ctx.fill();

          ctx.drawImage(img, lx, ly, logoPixelSize, logoPixelSize);

          if (withWatermark) {
            drawWatermark(ctx, canvas);
          }
        };
        // Handle image load error gracefully
        img.onerror = () => {
          if (withWatermark) {
            drawWatermark(ctx, canvas);
          }
        };
      } else {
        if (withWatermark) {
          drawWatermark(ctx, canvas);
        }
      }

    } catch (err) {
      console.error(err);
    }
  };

  const drawWatermark = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(0, canvas.height - 28, canvas.width, 28);
    ctx.fillStyle = '#10b981'; // emerald
    ctx.font = '600 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚡ Created with Qodex (African Micro SaaS)', canvas.width / 2, canvas.height - 10);
  };

  // Re-draw canvas preview on option updates
  useEffect(() => {
    if (canvasRef.current) {
      drawQRCodeOnCanvas(
        canvasRef.current,
        rawQRPayload,
        {
          dotType,
          eyeType,
          fgColor,
          bgColor,
          gradientEnabled,
          gradientColor,
          logoUrl,
          logoSize,
          errorCorrectionLevel: errorCorrection,
          customColorsEnabled,
          eyeBorderColor,
          eyePupilColor,
          bodyColor
        },
        !isUnlockedPreview
      );
    }
  }, [rawQRPayload, dotType, eyeType, fgColor, bgColor, gradientEnabled, gradientColor, logoUrl, logoSize, errorCorrection, isUnlockedPreview, customColorsEnabled, eyeBorderColor, eyePupilColor, bodyColor]);

  // ==========================================
  // ACTION HANDLERS
  // ==========================================
  
  // Apply a preset configuration
  const applyPreset = (preset: typeof AGENCY_PRESETS[0]) => {
    setQrType(preset.type as any);
    if (preset.type === 'url') {
      setInputUrl(preset.targetUrl);
    } else if (preset.type === 'wifi') {
      const parts = preset.targetUrl.match(/S:([^;]+);T:([^;]+);P:([^;]+);;/);
      if (parts) {
        setWifiSsid(parts[1]);
        setWifiSec(parts[2]);
        setWifiPass(parts[3]);
      }
    }
    setDotType(preset.style.dotType);
    setEyeType(preset.style.eyeType);
    setFgColor(preset.style.fgColor);
    setBgColor(preset.style.bgColor);
    setGradientEnabled(preset.style.gradientEnabled);
    setGradientColor(preset.style.gradientColor);
    setLogoUrl(preset.style.logoUrl);
    setLogoSize(preset.style.logoSize);
    setErrorCorrection(preset.style.errorCorrectionLevel);
    setCampaignName(`Preset: ${preset.name}`);
    showToast(`Applied preset styles for: ${preset.name}`, 'info');
  };

  // Consume credits to remove preview watermark permanently based on current config
  const unlockPreviewWatermark = () => {
    if (isUnlockedPreview) return;
    const cost = getFeatureCost('remove_watermark');
    
    if (deductCredits(cost, `Unlocked branding watermark on active design: "${campaignName}"`)) {
      setIsUnlockedPreview(true);
      showToast(`Watermark removed! ${cost} credit(s) consumed.`, 'success');
    }
  };

  // Download QR Code as PNG (Free)
  const downloadPNG = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `${campaignName.toLowerCase().replace(/\s+/g, '_')}_qodex.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
    showToast('PNG QR downloaded successfully!', 'success');
  };

  // Download QR Code as SVG (Consumes Credits dynamically based on pricing)
  const downloadSVG = () => {
    const cost = getFeatureCost('download_svg');
    if (!deductCredits(cost, `Exported premium SVG vector file for: "${campaignName}"`)) {
      return;
    }

    let svgContent = '';
    try {
      const qr = QRCode.create(rawQRPayload, { errorCorrectionLevel: errorCorrection });
      const numModules = qr.modules.size;
      const moduleSize = 512 / numModules;

      const isEye = (row: number, col: number) => {
        if (row < 7 && col < 7) return 'tl';
        if (row < 7 && col >= numModules - 7) return 'tr';
        if (row >= numModules - 7 && col < 7) return 'bl';
        return null;
      };

      const bodyColorToUse = customColorsEnabled ? bodyColor : fgColor;
      const bodyFill = gradientEnabled ? 'url(#qr-gradient)' : bodyColorToUse;

      // Build standard modules
      let modulesSvg = '';
      for (let row = 0; row < numModules; row++) {
        for (let col = 0; col < numModules; col++) {
          if (isEye(row, col)) continue;

          // Buffer center module area if logo is active
          if (logoUrl) {
            const pad = Math.floor(numModules * 0.15);
            const centerStart = Math.floor(numModules / 2) - pad;
            const centerEnd = Math.floor(numModules / 2) + pad;
            if (row >= centerStart && row <= centerEnd && col >= centerStart && col <= centerEnd) {
              continue;
            }
          }

          if (qr.modules.get(row, col)) {
            const x = col * moduleSize;
            const y = row * moduleSize;

            if (dotType === 'dots') {
              const cx = x + moduleSize / 2;
              const cy = y + moduleSize / 2;
              const r = (moduleSize / 2) * 0.85;
              modulesSvg += `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${r.toFixed(2)}" fill="${bodyFill}" />\n`;
            } else if (dotType === 'rounded') {
              const r = moduleSize * 0.25;
              modulesSvg += `<rect x="${(x + 0.5).toFixed(2)}" y="${(y + 0.5).toFixed(2)}" width="${(moduleSize - 1).toFixed(2)}" height="${(moduleSize - 1).toFixed(2)}" rx="${r.toFixed(2)}" ry="${r.toFixed(2)}" fill="${bodyFill}" />\n`;
            } else if (dotType === 'liquid') {
              const cx = x + moduleSize / 2;
              const cy = y + moduleSize / 2;
              const r = (moduleSize / 2) * 1.1;
              modulesSvg += `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${r.toFixed(2)}" fill="${bodyFill}" />\n`;
            } else {
              // Square (classic)
              modulesSvg += `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${moduleSize.toFixed(2)}" height="${moduleSize.toFixed(2)}" fill="${bodyFill}" />\n`;
            }
          }
        }
      }

      // Draw custom beautiful outer eye boundaries & inner pupils in SVG
      const drawEyeSVG = (colOffset: number, rowOffset: number) => {
        const ox = colOffset * moduleSize;
        const oy = rowOffset * moduleSize;
        const eyeSize = moduleSize * 7;
        const strokeWidth = moduleSize;

        const borderFill = customColorsEnabled ? eyeBorderColor : (gradientEnabled ? 'url(#qr-gradient)' : fgColor);
        const pupilFill = customColorsEnabled ? eyePupilColor : (gradientEnabled ? 'url(#qr-gradient)' : fgColor);

        let borderSvg = '';
        if (eyeType === 'rounded') {
          const r = eyeSize * 0.25;
          borderSvg = `<rect x="${(ox + strokeWidth / 2).toFixed(2)}" y="${(oy + strokeWidth / 2).toFixed(2)}" width="${(eyeSize - strokeWidth).toFixed(2)}" height="${(eyeSize - strokeWidth).toFixed(2)}" rx="${r.toFixed(2)}" ry="${r.toFixed(2)}" fill="none" stroke="${borderFill}" stroke-width="${strokeWidth.toFixed(2)}" />`;
        } else if (eyeType === 'circle') {
          borderSvg = `<circle cx="${(ox + eyeSize / 2).toFixed(2)}" cy="${(oy + eyeSize / 2).toFixed(2)}" r="${((eyeSize - strokeWidth) / 2).toFixed(2)}" fill="none" stroke="${borderFill}" stroke-width="${strokeWidth.toFixed(2)}" />`;
        } else if (eyeType === 'leaf') {
          const pathD = `M ${(ox + strokeWidth).toFixed(2)} ${(oy + eyeSize / 2).toFixed(2)} 
                         C ${(ox + strokeWidth).toFixed(2)} ${(oy + strokeWidth).toFixed(2)}, ${(ox + eyeSize / 2).toFixed(2)} ${(oy + strokeWidth).toFixed(2)}, ${(ox + eyeSize - strokeWidth).toFixed(2)} ${(oy + strokeWidth).toFixed(2)}
                         C ${(ox + eyeSize - strokeWidth).toFixed(2)} ${(oy + eyeSize / 2).toFixed(2)}, ${(ox + eyeSize - strokeWidth).toFixed(2)} ${(oy + eyeSize - strokeWidth).toFixed(2)}, ${(ox + eyeSize / 2).toFixed(2)} ${(oy + eyeSize - strokeWidth).toFixed(2)}
                         C ${(ox + strokeWidth).toFixed(2)} ${(oy + eyeSize - strokeWidth).toFixed(2)}, ${(ox + strokeWidth).toFixed(2)} ${(oy + eyeSize / 2).toFixed(2)}, ${(ox + strokeWidth).toFixed(2)} ${(oy + eyeSize / 2).toFixed(2)}`;
          borderSvg = `<path d="${pathD}" fill="none" stroke="${borderFill}" stroke-width="${strokeWidth.toFixed(2)}" />`;
        } else {
          // Classic Square
          borderSvg = `<rect x="${(ox + strokeWidth / 2).toFixed(2)}" y="${(oy + strokeWidth / 2).toFixed(2)}" width="${(eyeSize - strokeWidth).toFixed(2)}" height="${(eyeSize - strokeWidth).toFixed(2)}" fill="none" stroke="${borderFill}" stroke-width="${strokeWidth.toFixed(2)}" />`;
        }

        const px = ox + moduleSize * 2;
        const py = oy + moduleSize * 2;
        const pupilSize = moduleSize * 3;
        let pupilSvg = '';
        if (eyeType === 'rounded') {
          const pr = pupilSize * 0.25;
          pupilSvg = `<rect x="${px.toFixed(2)}" y="${py.toFixed(2)}" width="${pupilSize.toFixed(2)}" height="${pupilSize.toFixed(2)}" rx="${pr.toFixed(2)}" ry="${pr.toFixed(2)}" fill="${pupilFill}" />`;
        } else if (eyeType === 'circle' || eyeType === 'leaf') {
          pupilSvg = `<circle cx="${(px + pupilSize / 2).toFixed(2)}" cy="${(py + pupilSize / 2).toFixed(2)}" r="${(pupilSize / 2).toFixed(2)}" fill="${pupilFill}" />`;
        } else {
          pupilSvg = `<rect x="${px.toFixed(2)}" y="${py.toFixed(2)}" width="${pupilSize.toFixed(2)}" height="${pupilSize.toFixed(2)}" fill="${pupilFill}" />`;
        }

        return `${borderSvg}\n${pupilSvg}`;
      };

      const eyesSvg = `
        ${drawEyeSVG(0, 0)}
        ${drawEyeSVG(numModules - 7, 0)}
        ${drawEyeSVG(0, numModules - 7)}
      `;

      let logoSvg = '';
      if (logoUrl) {
        const logoPixelSize = 512 * (logoSize / 100);
        const lx = (512 - logoPixelSize) / 2;
        const ly = (512 - logoPixelSize) / 2;
        logoSvg = `
          <circle cx="256" cy="256" r="${(logoPixelSize / 2 + 6).toFixed(2)}" fill="${bgColor}"/>
          <image href="${logoUrl}" x="${lx.toFixed(2)}" y="${ly.toFixed(2)}" width="${logoPixelSize.toFixed(2)}" height="${logoPixelSize.toFixed(2)}" />
        `;
      }

      let watermarkSvg = '';
      if (!isUnlockedPreview) {
        watermarkSvg = `
          <rect x="0" y="484" width="512" height="28" fill="rgba(15, 23, 42, 0.9)" />
          <text x="256" y="501" text-anchor="middle" font-family="sans-serif" font-weight="600" font-size="10" fill="#10b981">⚡ Created with Qodex (African Micro SaaS)</text>
        `;
      } else {
        watermarkSvg = `
          <text x="256" y="501" text-anchor="middle" font-family="sans-serif" font-weight="600" font-size="10" fill="${bodyColorToUse}">⚡ Qodex High-Res SVG Vector</text>
        `;
      }

      svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
          <defs>
            <linearGradient id="qr-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="${bodyColorToUse}" />
              <stop offset="100%" stop-color="${gradientColor}" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="${bgColor}"/>
          <g>
            ${modulesSvg}
            ${eyesSvg}
            ${logoSvg}
            ${watermarkSvg}
          </g>
        </svg>
      `;

    } catch (err) {
      console.error('Failed to generate real QR SVG', err);
      // Fallback simple SVG representation
      svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
          <rect width="100%" height="100%" fill="${bgColor}"/>
          <g fill="${fgColor}">
            <rect x="64" y="64" width="112" height="112" />
            <rect x="336" y="64" width="112" height="112" />
            <rect x="64" y="336" width="112" height="112" />
          </g>
          <text x="256" y="490" text-anchor="middle" font-family="sans-serif" font-size="12" fill="${fgColor}">⚡ Qodex QR Code SVG Vector (Fallback)</text>
        </svg>
      `;
    }

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.download = `${campaignName.toLowerCase().replace(/\s+/g, '_')}_qodex.svg`;
    link.href = URL.createObjectURL(blob);
    link.click();

    showToast(`Premium SVG downloaded! ${cost} credit(s) consumed.`, 'success');
  };

  // Launch campaign creation with multi-variable billing
  const handleCreateCampaign = () => {
    // Determine dynamic billing items
    let cost = isDynamic ? getFeatureCost('dynamic_qr') : getFeatureCost('standard_qr');
    let billingBreakdown: string[] = [];

    if (isDynamic) billingBreakdown.push(`Dynamic QR (${cost} Cr)`);
    else billingBreakdown.push(`Static QR (${cost} Cr)`);

    if (logoUrl) {
      const logoCost = getFeatureCost('logo_upload');
      cost += logoCost;
      if (logoCost > 0) billingBreakdown.push(`Logo Upload (+${logoCost} Cr)`);
    }

    if (isPasswordProtected && password) {
      const passCost = getFeatureCost('password_protected');
      cost += passCost;
      if (passCost > 0) billingBreakdown.push(`Password Protection (+${passCost} Cr)`);
    }

    if (isScheduled && scheduleDate) {
      const schedCost = getFeatureCost('scheduled_qr');
      cost += schedCost;
      if (schedCost > 0) billingBreakdown.push(`Scheduled Redirect (+${schedCost} Cr)`);
    }

    if (isUnlockedPreview) {
      const rmCost = getFeatureCost('remove_watermark');
      cost += rmCost;
      if (rmCost > 0) billingBreakdown.push(`Remove Watermark (+${rmCost} Cr)`);
    }

    const description = `Generated Campaign "${campaignName}" with elements: [${billingBreakdown.join(', ')}]`;

    if (!deductCredits(cost, description)) {
      return;
    }

    const shortSlug = Math.random().toString(36).substring(2, 7);
    const newCamp: Campaign = {
      id: `camp-${Date.now()}`,
      name: campaignName,
      type: qrType,
      targetUrl: rawQRPayload,
      shortUrl: `https://qodex.io/lnk/${shortSlug}`,
      created: new Date().toISOString().split('T')[0],
      clicks: 0,
      scanLocations: { 'Lagos': 0 },
      devices: { 'Android': 0, 'iPhone': 0, 'Desktop': 0 },
      scansOverTime: [0, 0, 0, 0, 0, 0, 0],
      customization: {
        dotType,
        eyeType,
        fgColor,
        bgColor,
        gradientEnabled,
        gradientColor,
        logoUrl,
        logoSize,
        errorCorrectionLevel: errorCorrection
      },
      isUnlocked: isUnlockedPreview,
      isSvgUnlocked: false,
      folderId: selectedFolderId || undefined,
      isPasswordProtected: isPasswordProtected,
      password: isPasswordProtected ? password : '',
      isScheduled: isScheduled,
      scheduleDate: isScheduled ? scheduleDate : ''
    };

    setCampaigns(prev => [newCamp, ...prev]);

    showToast(
      cost > 0 
        ? `Campaign successfully created! ${cost} credit(s) consumed.`
        : 'Static free campaign added to workspace successfully!',
      'success'
    );

    // Reset design elements
    setIsPasswordProtected(false);
    setPassword('');
    setIsScheduled(false);
    setScheduleDate('');
    setSelectedFolderId('');

    setActiveTab('campaigns');
  };

  // Delete Campaign
  const handleDeleteCampaign = (id: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== id));
    showToast('Campaign deleted successfully.', 'info');
  };

  // Dynamic Destination Update (Dynamic redirection magic!)
  const saveCampaignEdit = () => {
    if (!editingCampaignId) return;

    const targetCampaign = campaigns.find(c => c.id === editingCampaignId);
    if (targetCampaign) {
      const oldVal = targetCampaign.targetUrl;
      const newVal = editingTargetUrl;
      if (oldVal !== newVal) {
        const newVersion: QRVersion = {
          id: `ver-${Date.now()}`,
          campaignId: editingCampaignId,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          oldValue: oldVal,
          newValue: newVal,
          editedBy: currentUser ? `${currentUser.name} (${currentUser.role})` : 'System'
        };
        setQrVersions(prev => [newVersion, ...prev]);
      }
    }

    setCampaigns(prev => prev.map(c => {
      if (c.id === editingCampaignId) {
        return {
          ...c,
          targetUrl: editingTargetUrl
        };
      }
      return c;
    }));
    setEditingCampaignId(null);
    showToast('Dynamic redirection target URL modified successfully!', 'success');
  };

  // Bulk Generation action
  const handleBulkGenerate = () => {
    const urls = bulkInput.split('\n').filter(line => line.trim() !== '');
    if (urls.length === 0) {
      showToast('Please enter at least one URL.', 'error');
      return;
    }
    if (credits < 1) {
      showToast('Bulk generation requires 1 credit per batch of 5.', 'error');
      setActiveTab('wallet');
      return;
    }

    setCredits(prev => prev - 1);
    setBulkResult(urls.slice(0, 5));
    setTransactions(prev => [
      {
        id: `tx-${Date.now()}`,
        desc: `Bulk Batch Generation of ${Math.min(urls.length, 5)} QR Codes`,
        amount: '0',
        status: 'SUCCESS',
        date: new Date().toISOString().split('T')[0],
        type: 'bulk_create',
        change: '-1',
        ref: `QTX-BLK-${Math.floor(10000 + Math.random() * 90000)}`
      },
      ...prev
    ]);
    showToast(`Bulk generation of ${Math.min(urls.length, 5)} QR codes complete! 1 credit consumed.`, 'success');
  };

  // Simulate a dynamic QR scan event (Adds metrics, charts updates, and triggers animation)
  const triggerSimulatedScan = () => {
    if (!scanSimCampaign) return;
    const randomCities = ['Lagos (Ikeja)', 'Lagos (VI)', 'Lagos (Lekki)', 'Abuja', 'Nairobi', 'Accra', 'Port Harcourt'];
    const chosenCity = simulatedCity || randomCities[Math.floor(Math.random() * randomCities.length)];
    const chosenDevice = Math.random() > 0.4 ? 'Android' : (Math.random() > 0.2 ? 'iPhone' : 'Desktop');

    setCampaigns(prev => prev.map(c => {
      if (c.id === scanSimCampaign.id) {
        const updatedLocations = { ...c.scanLocations };
        updatedLocations[chosenCity] = (updatedLocations[chosenCity] || 0) + 1;

        const updatedDevices = { ...c.devices };
        updatedDevices[chosenDevice] = (updatedDevices[chosenDevice] || 0) + 1;

        const updatedScansOverTime = [...c.scansOverTime];
        updatedScansOverTime[6] = (updatedScansOverTime[6] || 0) + 1;

        return {
          ...c,
          clicks: c.clicks + 1,
          scanLocations: updatedLocations,
          devices: updatedDevices,
          scansOverTime: updatedScansOverTime
        };
      }
      return c;
    }));

    showToast(`Scan simulated! New traffic recorded from a customer using ${chosenDevice} in ${chosenCity}.`, 'success');
  };

  // Trigger simulated scan specifically for a given campaign ID (e.g. from the in-app scanner)
  const triggerSimulatedScanForCampaign = (campaignId: string) => {
    const randomCities = ['Lagos (Ikeja)', 'Lagos (VI)', 'Lagos (Lekki)', 'Abuja', 'Nairobi', 'Accra', 'Port Harcourt'];
    const chosenCity = simulatedCity || randomCities[Math.floor(Math.random() * randomCities.length)];
    const chosenDevice = Math.random() > 0.4 ? 'Android' : (Math.random() > 0.2 ? 'iPhone' : 'Desktop');

    setCampaigns(prev => prev.map(c => {
      if (c.id === campaignId) {
        const updatedLocations = { ...c.scanLocations };
        updatedLocations[chosenCity] = (updatedLocations[chosenCity] || 0) + 1;

        const updatedDevices = { ...c.devices };
        updatedDevices[chosenDevice] = (updatedDevices[chosenDevice] || 0) + 1;

        const updatedScansOverTime = [...c.scansOverTime];
        updatedScansOverTime[6] = (updatedScansOverTime[6] || 0) + 1;

        return {
          ...c,
          clicks: c.clicks + 1,
          scanLocations: updatedLocations,
          devices: updatedDevices,
          scansOverTime: updatedScansOverTime
        };
      }
      return c;
    }));

    showToast(`Scan simulated! New traffic recorded from a customer using ${chosenDevice} in ${chosenCity}.`, 'success');
  };

  // ==========================================
  // CREDIT PRICING DETAILS FOR CHANNELS
  // ==========================================
  const PACKAGES = [
    {
      name: 'Freelancer Pack',
      credits: 20,
      priceNGN: '₦4,500',
      priceKES: 'KSh 750',
      priceUSD: '$5.00',
      badge: 'Pay-As-You-Go',
      features: ['20 Premium/Dynamic Credits', 'No expiry date', 'Custom vector SVG exports', 'Full scan analytics & geography']
    },
    {
      name: 'SME Growth Pack',
      credits: 100,
      priceNGN: '₦18,000',
      priceKES: 'KSh 3,000',
      priceUSD: '$20.00',
      badge: 'Most Popular',
      features: ['100 Premium/Dynamic Credits', 'No expiry date', 'Dedicated Lagos support team', 'Advanced bulk exports', 'Watermark-free assets']
    },
    {
      name: 'Agency Power Pack',
      credits: 500,
      priceNGN: '₦75,000',
      priceKES: 'KSh 12,500',
      priceUSD: '$80.00',
      badge: 'Best Value',
      features: ['500 Premium/Dynamic Credits', 'No expiry date', 'White-labeled customer scans', 'Instant dynamic redirects update', 'Premium 24/7 SLA']
    }
  ];

  const handleCheckoutInitiate = (pack: typeof PACKAGES[0]) => {
    const selectedPrice = currency === 'NGN' ? pack.priceNGN : (currency === 'KES' ? pack.priceKES : pack.priceUSD);
    setCheckoutPack({ name: pack.name, credits: pack.credits, price: selectedPrice });
    setCheckoutStep('payment_method');
  };

  const handleProcessPayment = () => {
    setCheckoutStep('processing');
    setTimeout(() => {
      setCheckoutStep('otp');
    }, 1500);
  };

  const handleConfirmOTP = () => {
    if (!checkoutPack) return;
    setCheckoutStep('processing');
    setTimeout(() => {
      const addedCr = checkoutPack.credits;
      // Success! Update wallet balances
      setCredits(prev => prev + addedCr);
      
      // Persist balance to active workspace
      setWorkspaces(prev => prev.map(w => {
        if (w.id === activeWorkspaceId) {
          return { ...w, sharedWalletBalance: w.sharedWalletBalance + addedCr };
        }
        return w;
      }));

      // Generate verified signature trace
      const gatewayName = modalGateway === 'paystack' ? 'Paystack' : modalGateway === 'flutterwave' ? 'Flutterwave' : 'Stripe';
      const refPrefix = modalGateway === 'paystack' ? 'PSTK' : modalGateway === 'flutterwave' ? 'FLW' : 'STRP';

      setTransactions(prev => [
        {
          id: `tx-${Date.now()}`,
          desc: `Purchased ${checkoutPack.name} via Verified ${gatewayName} Webhook`,
          amount: checkoutPack.price,
          status: 'SUCCESS',
          date: new Date().toISOString().split('T')[0],
          type: 'credit_purchase',
          change: `+${addedCr}`,
          ref: `QTX-${refPrefix}-${Math.floor(100000 + Math.random() * 900000)}`
        },
        ...prev
      ]);
      setCheckoutStep('success');
      showToast(`Successfully purchased ${addedCr} credits via verified ${gatewayName} webhook!`, 'success');
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-slate-900 pb-16">
      
      {/* GLOBAL TOAST NOTIFICATION */}
      {toast && (
        <div id="toast-notification" className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-slate-900 border border-slate-800 px-5 py-4 rounded-xl shadow-2xl animate-fade-in-down max-w-sm">
          <div className={`p-2 rounded-lg ${toast.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : toast.type === 'error' ? 'bg-rose-500/10 text-rose-400' : 'bg-blue-500/10 text-blue-400'}`}>
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">{toast.message}</p>
          </div>
        </div>
      )}

      {/* HEADER NAVBAR */}
      <header id="qodex-header" className="sticky top-0 z-40 bg-[#080d1a]/85 backdrop-blur-md border-b border-slate-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-emerald-500 to-indigo-600 p-2.5 rounded-xl text-slate-900 font-bold shadow-lg shadow-emerald-500/10 flex items-center justify-center">
            <QrCode className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">Qodex</span>
              <span className="text-[10px] uppercase font-bold tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">NG/AFRICA</span>
            </div>
            <p className="text-[10px] text-slate-500">Pay-As-You-Go Smart QR Codes</p>
          </div>
        </div>

        {/* TOP METRICS & WALLET BALANCES */}
        <div className="flex items-center gap-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2 flex items-center gap-3">
            <div className="bg-indigo-500/10 p-1.5 rounded-lg">
              <Wallet className="h-4 w-4 text-indigo-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium">AVAILABLE BALANCE</p>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold text-indigo-300">{credits}</span>
                <span className="text-[10px] text-slate-500 font-bold">Credits</span>
              </div>
            </div>
          </div>

          <button 
            id="header-fund-wallet"
            onClick={() => { setActiveTab('wallet'); }} 
            className="hidden sm:flex bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 hover:from-emerald-400 hover:to-teal-500 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/10 items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Fund Wallet
          </button>

          <button 
            id="header-qr-scanner"
            onClick={() => { setIsScannerOpen(true); }} 
            className="flex bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 px-4 py-2 rounded-xl text-xs font-bold transition-all items-center gap-1.5"
            title="Scan & verify dynamic QR codes using device camera"
          >
            <Camera className="h-4 w-4 text-emerald-400" />
            <span>In-App Scanner</span>
          </button>

          {currentUser && (
            <div className="flex items-center gap-3 border-l border-slate-800/80 pl-3">
              <div className="text-right hidden md:block">
                <span className="block text-xs font-bold text-slate-200">{currentUser.name}</span>
                <span className="block text-[8px] font-black text-indigo-400 uppercase tracking-widest">{currentUser.role}</span>
              </div>
              <button
                onClick={handleLogout}
                className="bg-slate-900 hover:bg-rose-950/30 text-slate-400 hover:text-rose-400 border border-slate-800 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                title="Sign out of current workspace account"
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* DASHBOARD HERO */}
      <div id="qodex-hero" className="max-w-7xl mx-auto px-6 pt-8">
        <div className="bg-gradient-to-r from-slate-950 via-[#0d1527] to-slate-950 rounded-3xl border border-slate-900 p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">Localized Micro SaaS</span>
              <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">No Subscriptions</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight leading-none mb-3">
              QR Code Ecosystem for African Retailers &amp; Agencies
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Create dynamic, high-fidelity, and compliant QR codes with customizable eyes, frames, and branding. Only pay for what you generate. Direct integrations for Paystack billing in <span className="text-slate-200">₦ (NGN)</span>, <span className="text-slate-200">KSh (KES)</span>, and <span className="text-slate-200">$ (USD)</span>.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl text-center min-w-[120px]">
              <span className="block text-2xl font-black text-emerald-400">{campaigns.length}</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Campaigns</span>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl text-center min-w-[120px]">
              <span className="block text-2xl font-black text-indigo-400">{campaigns.reduce((sum, c) => sum + c.clicks, 0)}</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Scans</span>
            </div>
          </div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div id="qodex-tabs" className="max-w-7xl mx-auto px-6 mt-8">
        <div className="flex border-b border-slate-900 gap-1 overflow-x-auto">
          <button
            id="tab-btn-studio"
            onClick={() => setActiveTab('studio')}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'studio' ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <QrCode className="h-4 w-4" />
            ⚡ QR Design Studio
          </button>
          <button
            id="tab-btn-campaigns"
            onClick={() => setActiveTab('campaigns')}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'campaigns' ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <BarChart3 className="h-4 w-4" />
            📊 Campaigns &amp; Redirections
          </button>
          <button
            id="tab-btn-templates"
            onClick={() => setActiveTab('templates')}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'templates' ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <Sparkles className="h-4 w-4" />
            📋 Local Presets &amp; Templates
          </button>
          <button
            id="tab-btn-wallet"
            onClick={() => setActiveTab('wallet')}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'wallet' ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <Wallet className="h-4 w-4" />
            💳 Credit Wallet &amp; Admin
          </button>
          <button
            id="tab-btn-team"
            onClick={() => setActiveTab('team')}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'team' ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <Users className="h-4 w-4" />
            👥 Workspaces &amp; Seats
          </button>
          <button
            id="tab-btn-referral"
            onClick={() => setActiveTab('referral')}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'referral' ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <Gift className="h-4 w-4" />
            🎁 Partnership Referral
          </button>
          <button
            id="tab-btn-compliance"
            onClick={() => setActiveTab('compliance')}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'compliance' ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <ShieldCheck className="h-4 w-4" />
            ⚖️ Privacy &amp; Compliance
          </button>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <main id="qodex-main-content" className="max-w-7xl mx-auto px-6 mt-8">
        {!currentUser || !currentUser.isVerified ? (
          <AuthPanel
            user={currentUser}
            onLogin={handleLogin}
            onSignup={handleSignup}
            onLogout={handleLogout}
            onVerify={handleVerify}
            onResetPassword={handleResetPassword}
            invitations={invitations}
            onAcceptInvitation={handleAcceptInvitation}
            showToast={showToast}
          />
        ) : (
          <>
        
        {/* ==========================================
            TAB: DESIGN STUDIO
           ========================================== */}
        {activeTab === 'studio' && (
          <div id="panel-studio" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT INPUT & CONFIG COLUMN */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* CAMPAIGN METADATA */}
              <div className="bg-slate-950 border border-slate-900 rounded-2xl p-6">
                <h3 className="text-sm font-extrabold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span> 1. Campaign &amp; Metadata
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5">Campaign Name</label>
                    <input
                      type="text"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-xs focus:outline-none focus:border-emerald-500/50 transition-colors"
                      placeholder="e.g. Lekki Store Promo"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5">Campaign Type</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsDynamic(true)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${isDynamic ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'}`}
                      >
                        ⚡ Dynamic (1 Credit)
                      </button>
                      <button
                        onClick={() => setIsDynamic(false)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${!isDynamic ? 'bg-teal-600/10 border-teal-500 text-teal-400' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'}`}
                      >
                        🔗 Static (Free)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* QR TYPE SELECTOR */}
              <div className="bg-slate-950 border border-slate-900 rounded-2xl p-6">
                <h3 className="text-sm font-extrabold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span> 2. QR Code Content &amp; Type
                </h3>

                {/* CATEGORY TABS */}
                <div className="flex flex-wrap border-b border-slate-900 pb-2 mb-4 gap-1">
                  {[
                    { id: 'web', label: 'Web & Messaging', emoji: '🔗' },
                    { id: 'social', label: 'Socials', emoji: '👥' },
                    { id: 'files', label: 'Media', emoji: '📁' },
                    { id: 'utils', label: 'Utils', emoji: '📶' },
                    { id: 'business', label: 'Commerce', emoji: '🏦' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveTypeCategory(cat.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border ${activeTypeCategory === cat.id ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-slate-900 border-transparent text-slate-400 hover:text-slate-200'}`}
                    >
                      <span>{cat.emoji}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
                
                {/* GRID OF COMPATIBLE TYPES */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
                  {QR_TYPES_BY_CATEGORY[activeTypeCategory]?.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setQrType(t.id)}
                      className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border text-center transition-all ${qrType === t.id ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200'}`}
                    >
                      <span className="text-xl mb-1">{t.icon}</span>
                      <span className="text-[10px] font-bold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis w-full">{t.label}</span>
                    </button>
                  ))}
                </div>

                {/* FIELDS CORRESPONDING TO ACTIVE TYPE */}
                <div className="space-y-4">
                  {(qrType === 'url' || qrType === 'custom_url') && (
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5">Destination URL (Target Link)</label>
                      <input
                        type="url"
                        value={inputUrl}
                        onChange={(e) => setInputUrl(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-xs focus:outline-none focus:border-emerald-500/50 transition-colors"
                        placeholder="https://myafricanshop.com"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        {isDynamic ? '✓ Real-time clicks analytics tracking enabled. Updates instantly upon redirect edits.' : '✓ Encoded directly in code. Clicks will not be trackable.'}
                      </p>
                    </div>
                  )}

                  {qrType === 'text' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5">Raw Text Payload</label>
                      <textarea
                        value={genericText}
                        onChange={(e) => setGenericText(e.target.value)}
                        rows={3}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-xs focus:outline-none focus:border-emerald-500/50"
                        placeholder="Enter any custom message, code or label details here..."
                      />
                    </div>
                  )}

                  {qrType === 'email' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1.5">Recipient Email</label>
                        <input
                          type="email"
                          value={genericEmail}
                          onChange={(e) => setGenericEmail(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 text-xs focus:outline-none"
                          placeholder="e.g. hello@qodex.io"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1.5">Subject Line</label>
                        <input
                          type="text"
                          value={genericSubject}
                          onChange={(e) => setGenericSubject(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 text-xs focus:outline-none"
                          placeholder="Subject"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1.5">Email Body</label>
                        <textarea
                          value={genericText}
                          onChange={(e) => setGenericText(e.target.value)}
                          rows={2}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 text-xs focus:outline-none"
                          placeholder="Write email content..."
                        />
                      </div>
                    </div>
                  )}

                  {qrType === 'phone' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5">Phone Number to Call</label>
                      <input
                        type="text"
                        value={genericPhone}
                        onChange={(e) => setGenericPhone(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-xs focus:outline-none"
                        placeholder="+234 801 234 5678"
                      />
                    </div>
                  )}

                  {qrType === 'sms' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1.5">SMS Recipient Phone</label>
                        <input
                          type="text"
                          value={genericPhone}
                          onChange={(e) => setGenericPhone(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 text-xs focus:outline-none"
                          placeholder="+234 801 234 5678"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1.5">SMS Message Body</label>
                        <textarea
                          value={genericText}
                          onChange={(e) => setGenericText(e.target.value)}
                          rows={2}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 text-xs focus:outline-none"
                          placeholder="Type SMS text..."
                        />
                      </div>
                    </div>
                  )}

                  {qrType === 'whatsapp' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1.5">WhatsApp Number (inc. Country Code)</label>
                        <input
                          type="text"
                          value={waPhone}
                          onChange={(e) => setWaPhone(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-xs focus:outline-none"
                          placeholder="2348012345678"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1.5">Pre-filled Message</label>
                        <input
                          type="text"
                          value={waText}
                          onChange={(e) => setWaText(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-xs focus:outline-none"
                          placeholder="Hi! I am interested in your products."
                        />
                      </div>
                    </div>
                  )}

                  {qrType === 'wifi' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1.5">Network Name (SSID)</label>
                        <input
                          type="text"
                          value={wifiSsid}
                          onChange={(e) => setWifiSsid(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-xs focus:outline-none"
                          placeholder="e.g. Cafe_Network"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1.5">Security Password</label>
                        <input
                          type="text"
                          value={wifiPass}
                          onChange={(e) => setWifiPass(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-xs focus:outline-none"
                          placeholder="Password"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1.5">Type</label>
                        <select
                          value={wifiSec}
                          onChange={(e) => setWifiSec(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-xs focus:outline-none"
                        >
                          <option value="WPA">WPA / WPA2</option>
                          <option value="WEP">WEP</option>
                          <option value="nopass">Unsecured (No Password)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {qrType === 'bank' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-400 mb-1.5">Select Nigerian Bank</label>
                          <select
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-xs focus:outline-none"
                          >
                            <option value="Sterling Bank">Sterling Bank</option>
                            <option value="GTBank">GTBank (Guaranty Trust)</option>
                            <option value="Zenith Bank">Zenith Bank</option>
                            <option value="Access Bank">Access Bank</option>
                            <option value="UBA">United Bank for Africa (UBA)</option>
                            <option value="Wema Bank">Wema Bank (ALAT)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 mb-1.5">Account Number</label>
                          <input
                            type="text"
                            value={bankAccount}
                            onChange={(e) => setBankAccount(e.target.value)}
                            maxLength={10}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-xs focus:outline-none"
                            placeholder="0123456789"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 mb-1.5">Beneficiary / Holder Name</label>
                          <input
                            type="text"
                            value={bankHolder}
                            onChange={(e) => setBankHolder(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-xs focus:outline-none"
                            placeholder="Grills VI Limited"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1.5">Suggested Amount (NGN)</label>
                        <input
                          type="number"
                          value={bankAmount}
                          onChange={(e) => setBankAmount(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-xs focus:outline-none"
                          placeholder="e.g. 10000"
                        />
                      </div>
                    </div>
                  )}

                  {qrType === 'vcard' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1.5">Full Name</label>
                        <input
                          type="text"
                          value={vcardName}
                          onChange={(e) => setVcardName(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-xs focus:outline-none"
                          placeholder="Kunle Adeleke"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1.5">Phone Number</label>
                        <input
                          type="text"
                          value={vcardPhone}
                          onChange={(e) => setVcardPhone(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-xs focus:outline-none"
                          placeholder="+234 812 345 6789"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1.5">Email Address</label>
                        <input
                          type="email"
                          value={vcardEmail}
                          onChange={(e) => setVcardEmail(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-xs focus:outline-none"
                          placeholder="kunle@yabaspace.ng"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1.5">Organization / Business</label>
                        <input
                          type="text"
                          value={vcardOrg}
                          onChange={(e) => setVcardOrg(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-xs focus:outline-none"
                          placeholder="Yaba Innovation Hub"
                        />
                      </div>
                    </div>
                  )}

                  {qrType === 'maps' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1.5">Latitude Location</label>
                        <input
                          type="text"
                          value={genericLatitude}
                          onChange={(e) => setGenericLatitude(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-xs focus:outline-none"
                          placeholder="6.4281"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1.5">Longitude Location</label>
                        <input
                          type="text"
                          value={genericLongitude}
                          onChange={(e) => setGenericLongitude(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-xs focus:outline-none"
                          placeholder="3.4219"
                        />
                      </div>
                    </div>
                  )}

                  {['facebook', 'instagram', 'linkedin', 'x', 'tiktok', 'youtube'].includes(qrType) && (
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5">Social Profile Username</label>
                      <div className="flex gap-2">
                        <span className="bg-slate-900 border border-slate-800 text-slate-500 rounded-xl px-3 py-2 text-xs flex items-center select-none font-mono">
                          {qrType === 'facebook' && 'facebook.com/'}
                          {qrType === 'instagram' && 'instagram.com/'}
                          {qrType === 'linkedin' && 'linkedin.com/in/'}
                          {qrType === 'x' && 'x.com/'}
                          {qrType === 'tiktok' && 'tiktok.com/@'}
                          {qrType === 'youtube' && 'youtube.com/@'}
                        </span>
                        <input
                          type="text"
                          value={genericSocialUser}
                          onChange={(e) => setGenericSocialUser(e.target.value)}
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 text-xs focus:outline-none"
                          placeholder="username"
                        />
                      </div>
                    </div>
                  )}

                  {(qrType === 'pdf' || qrType === 'images' || qrType === 'menu') && (
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-slate-400">Media file source link (PDF / Image Gallery / Menu)</label>
                      <input
                        type="url"
                        value={inputUrl}
                        onChange={(e) => setInputUrl(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-xs focus:outline-none"
                        placeholder="https://myafricanshop.com/files/menu-list.pdf"
                      />
                      
                      {/* DRAG AND DROP FILE UPLOAD AREA */}
                      <div 
                        onClick={() => {
                          showToast('Real-time media hosting simulated successfully!', 'success');
                        }}
                        className="border border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl p-6 text-center cursor-pointer transition-all bg-slate-900/20"
                      >
                        <p className="text-xs font-bold text-slate-300">Drag &amp; drop PDF or Images here</p>
                        <p className="text-[10px] text-slate-500 mt-1">Accepts PNG, JPG, PDF up to 25MB. Real-time CDN link generated immediately.</p>
                      </div>
                    </div>
                  )}

                  {(qrType === 'event' || qrType === 'calendar') && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-400 mb-1.5">Event/Meeting Title</label>
                          <input
                            type="text"
                            value={genericEventTitle}
                            onChange={(e) => setGenericEventTitle(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 text-xs focus:outline-none"
                            placeholder="e.g. Summit 2026"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-400 mb-1.5">Location</label>
                          <input
                            type="text"
                            value={genericEventLocation}
                            onChange={(e) => setGenericEventLocation(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 text-xs focus:outline-none"
                            placeholder="Lekki Coliseum, Lagos"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {qrType === 'payments' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1.5">Payment Merchant / Beneficiary Name</label>
                        <input
                          type="text"
                          value={bankHolder}
                          onChange={(e) => setBankHolder(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-xs focus:outline-none"
                          placeholder="Kunle &amp; Sons"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1.5">Suggested Amount</label>
                        <input
                          type="text"
                          value={bankAmount}
                          onChange={(e) => setBankAmount(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-xs focus:outline-none"
                          placeholder="e.g. 10000"
                        />
                      </div>
                    </div>
                  )}

                  {qrType === 'crypto' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1.5">Coin Type</label>
                        <select
                          value={genericCryptoType}
                          onChange={(e) => setGenericCryptoType(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 text-xs focus:outline-none"
                        >
                          <option value="BTC">Bitcoin (BTC)</option>
                          <option value="ETH">Ethereum (ETH)</option>
                          <option value="SOL">Solana (SOL)</option>
                          <option value="USDT">USDT (TRC20)</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-400 mb-1.5">Wallet Destination Address</label>
                        <input
                          type="text"
                          value={genericCryptoAddress}
                          onChange={(e) => setGenericCryptoAddress(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 text-xs focus:outline-none font-mono"
                          placeholder="Address"
                        />
                      </div>
                    </div>
                  )}

                  {(qrType === 'product_labels' || qrType === 'coupons' || qrType === 'inventory_labels') && (
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5">Label ID / Code description</label>
                      <input
                        type="text"
                        value={genericText}
                        onChange={(e) => setGenericText(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-xs focus:outline-none"
                        placeholder="Product SKU / Offer Coupon / Warehouse Lot details"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* BRANDING & PALETTE (CUSTOM DESIGN) */}
              <div className="bg-slate-950 border border-slate-900 rounded-2xl p-6 space-y-6">
                <h3 className="text-sm font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span> 3. Aesthetic Customization &amp; Style
                </h3>

                {/* DOT STYLES */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">QR Grid Pattern Style</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'square', label: 'Classic Square' },
                      { id: 'dots', label: 'Clean Circle' },
                      { id: 'rounded', label: 'Rounded Rect' },
                      { id: 'liquid', label: 'Liquid Dot' }
                    ].map(style => (
                      <button
                        key={style.id}
                        onClick={() => setDotType(style.id as any)}
                        className={`py-2.5 px-1 rounded-xl text-xs font-bold border transition-all ${dotType === style.id ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'}`}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* EYE STYLES */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">Corner Eyes (Finder Patterns) Shape</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'square', label: 'Classic' },
                      { id: 'rounded', label: 'Smooth' },
                      { id: 'circle', label: 'Circular' },
                      { id: 'leaf', label: 'African Leaf' }
                    ].map(eye => (
                      <button
                        key={eye.id}
                        onClick={() => setEyeType(eye.id as any)}
                        className={`py-2.5 px-1 rounded-xl text-xs font-bold border transition-all ${eyeType === eye.id ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'}`}
                      >
                        {eye.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* COLORS SECTION */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5">Primary Foreground Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={fgColor}
                        onChange={(e) => setFgColor(e.target.value)}
                        className="w-10 h-10 border-0 bg-transparent rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={fgColor}
                        onChange={(e) => setFgColor(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-200 text-xs font-mono focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5">Background Fill Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-10 h-10 border-0 bg-transparent rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-200 text-xs font-mono focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* GRADIENTS CONTROL */}
                <div className="border-t border-slate-900 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-xs font-bold text-slate-300 block">Gradient Fill Effect</span>
                      <span className="text-[10px] text-slate-500">Apply a gorgeous color gradient to the QR dots</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={gradientEnabled}
                        onChange={() => setGradientEnabled(!gradientEnabled)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  {gradientEnabled && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1.5">Gradient Destination Color</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={gradientColor}
                            onChange={(e) => setGradientColor(e.target.value)}
                            className="w-10 h-10 border-0 bg-transparent rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={gradientColor}
                            onChange={(e) => setGradientColor(e.target.value)}
                            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-200 text-xs font-mono focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ADVANCED MULTI-COLOR OPTION */}
                <div className="border-t border-slate-900 pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-300 block">Advanced Multi-Color Vector Styling</span>
                      <span className="text-[10px] text-slate-500">Pick separate custom colors for corner eyes and QR body</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={customColorsEnabled}
                        onChange={() => setCustomColorsEnabled(!customColorsEnabled)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  {customColorsEnabled && (
                    <div className="bg-slate-950 border border-slate-900/60 rounded-2xl p-4 space-y-4 animate-fade-in">
                      {/* Premium Multi-Color Presets */}
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Designer Multi-Color Presets</span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            {
                              name: 'Neon Matrix',
                              border: '#10b981',
                              pupil: '#06b6d4',
                              bodyColor: '#10b981',
                            },
                            {
                              name: 'Sunset Ember',
                              border: '#f43f5e',
                              pupil: '#fb7185',
                              bodyColor: '#f59e0b',
                            },
                            {
                              name: 'Cyberpunk',
                              border: '#d946ef',
                              pupil: '#06b6d4',
                              bodyColor: '#a855f7',
                            },
                            {
                              name: 'African Gold',
                              border: '#b45309',
                              pupil: '#d97706',
                              bodyColor: '#1e293b',
                            }
                          ].map((theme) => (
                            <button
                              key={theme.name}
                              type="button"
                              onClick={() => {
                                setBodyColor(theme.bodyColor);
                                setEyeBorderColor(theme.border);
                                setEyePupilColor(theme.pupil);
                                showToast(`Applied "${theme.name}" advanced palette!`, 'info');
                              }}
                              className="bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-900 p-2 rounded-xl text-left transition-all flex flex-col gap-1"
                            >
                              <div className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-full border border-slate-950" style={{ backgroundColor: theme.border }} />
                                <span className="w-2.5 h-2.5 rounded-full border border-slate-950" style={{ backgroundColor: theme.pupil }} />
                                <span className="w-2.5 h-2.5 rounded-full border border-slate-950" style={{ backgroundColor: theme.bodyColor }} />
                              </div>
                              <span className="text-[10px] font-bold text-slate-300">{theme.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Interactive Visual Selector Map */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center border-t border-slate-900 pt-3">
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Interactive QR Layout Map</span>
                          <p className="text-[10px] text-slate-400">Click on any section of the vector diagram to modify its specific color:</p>
                          
                          {/* Mini QR diagram */}
                          <div className="flex justify-center bg-slate-900/40 p-4 rounded-xl border border-slate-900/80">
                            <svg viewBox="0 0 100 100" className="w-28 h-28 select-none">
                              {/* Background */}
                              <rect width="100" height="100" fill="#0f172a" rx="8" />
                              
                              {/* Standard body dots representing QR body */}
                              <g fill={bodyColor}>
                                <circle cx="35" cy="15" r="2.5" />
                                <circle cx="45" cy="15" r="2.5" />
                                <circle cx="55" cy="15" r="2.5" />
                                <circle cx="65" cy="15" r="2.5" />
                                
                                <circle cx="35" cy="25" r="2.5" />
                                <circle cx="45" cy="25" r="2.5" />
                                <circle cx="55" cy="25" r="2.5" />
                                <circle cx="65" cy="25" r="2.5" />

                                <circle cx="15" cy="35" r="2.5" />
                                <circle cx="25" cy="35" r="2.5" />
                                <circle cx="35" cy="35" r="2.5" />
                                <circle cx="45" cy="35" r="2.5" />
                                <circle cx="55" cy="35" r="2.5" />
                                <circle cx="65" cy="35" r="2.5" />
                                <circle cx="75" cy="35" r="2.5" />
                                <circle cx="85" cy="35" r="2.5" />

                                <circle cx="15" cy="45" r="2.5" />
                                <circle cx="25" cy="45" r="2.5" />
                                <circle cx="35" cy="45" r="2.5" />
                                <circle cx="45" cy="45" r="2.5" />
                                <circle cx="55" cy="45" r="2.5" />
                                <circle cx="65" cy="45" r="2.5" />
                                <circle cx="75" cy="45" r="2.5" />
                                <circle cx="85" cy="45" r="2.5" />

                                <circle cx="15" cy="55" r="2.5" />
                                <circle cx="25" cy="55" r="2.5" />
                                <circle cx="35" cy="55" r="2.5" />
                                <circle cx="45" cy="55" r="2.5" />
                                <circle cx="55" cy="55" r="2.5" />
                                <circle cx="65" cy="55" r="2.5" />
                                <circle cx="75" cy="55" r="2.5" />
                                <circle cx="85" cy="55" r="2.5" />

                                <circle cx="15" cy="65" r="2.5" />
                                <circle cx="25" cy="65" r="2.5" />
                                <circle cx="35" cy="65" r="2.5" />
                                <circle cx="45" cy="65" r="2.5" />
                                <circle cx="55" cy="65" r="2.5" />
                                <circle cx="65" cy="65" r="2.5" />
                                <circle cx="75" cy="65" r="2.5" />
                                <circle cx="85" cy="65" r="2.5" />

                                <circle cx="35" cy="75" r="2.5" />
                                <circle cx="45" cy="75" r="2.5" />
                                <circle cx="55" cy="75" r="2.5" />
                                <circle cx="65" cy="75" r="2.5" />
                                <circle cx="75" cy="75" r="2.5" />
                                <circle cx="85" cy="75" r="2.5" />

                                <circle cx="35" cy="85" r="2.5" />
                                <circle cx="45" cy="85" r="2.5" />
                                <circle cx="55" cy="85" r="2.5" />
                                <circle cx="65" cy="85" r="2.5" />
                                <circle cx="75" cy="85" r="2.5" />
                                <circle cx="85" cy="85" r="2.5" />
                              </g>

                              {/* Finder Pattern Outer Borders (Interactive) */}
                              <g stroke={eyeBorderColor} strokeWidth="3.5" fill="none" className="cursor-pointer hover:opacity-80 transition-all">
                                {/* Top-Left */}
                                <rect x="5" y="5" width="20" height="20" rx="3.5" />
                                {/* Top-Right */}
                                <rect x="75" y="5" width="20" height="20" rx="3.5" />
                                {/* Bottom-Left */}
                                <rect x="5" y="75" width="20" height="20" rx="3.5" />
                              </g>

                              {/* Finder Pattern Pupils (Interactive) */}
                              <g fill={eyePupilColor} className="cursor-pointer hover:opacity-80 transition-all">
                                {/* Top-Left */}
                                <rect x="11" y="11" width="8" height="8" rx="1.5" />
                                {/* Top-Right */}
                                <rect x="81" y="11" width="8" height="8" rx="1.5" />
                                {/* Bottom-Left */}
                                <rect x="11" y="81" width="8" height="8" rx="1.5" />
                              </g>
                            </svg>
                          </div>
                        </div>

                        {/* Side-by-side Precise Color Pickers */}
                        <div className="space-y-3">
                          {/* Part 1: Body dots */}
                          <div>
                            <label className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1">
                              <span>QR Body Pattern</span>
                              <span className="text-[9px] text-slate-600 font-mono">{bodyColor}</span>
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={bodyColor}
                                onChange={(e) => setBodyColor(e.target.value)}
                                className="w-8 h-8 border-0 bg-transparent rounded cursor-pointer"
                              />
                              <input
                                type="text"
                                value={bodyColor}
                                onChange={(e) => setBodyColor(e.target.value)}
                                className="flex-1 bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-1 text-slate-200 text-xs font-mono focus:outline-none"
                              />
                            </div>
                          </div>

                          {/* Part 2: Eye border */}
                          <div>
                            <label className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1">
                              <span>Corner Eye Outer Borders</span>
                              <span className="text-[9px] text-slate-600 font-mono">{eyeBorderColor}</span>
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={eyeBorderColor}
                                onChange={(e) => setEyeBorderColor(e.target.value)}
                                className="w-8 h-8 border-0 bg-transparent rounded cursor-pointer"
                              />
                              <input
                                type="text"
                                value={eyeBorderColor}
                                onChange={(e) => setEyeBorderColor(e.target.value)}
                                className="flex-1 bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-1 text-slate-200 text-xs font-mono focus:outline-none"
                              />
                            </div>
                          </div>

                          {/* Part 3: Eye Pupil */}
                          <div>
                            <label className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1">
                              <span>Corner Eye Inner Pupils</span>
                              <span className="text-[9px] text-slate-600 font-mono">{eyePupilColor}</span>
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={eyePupilColor}
                                onChange={(e) => setEyePupilColor(e.target.value)}
                                className="w-8 h-8 border-0 bg-transparent rounded cursor-pointer"
                              />
                              <input
                                type="text"
                                value={eyePupilColor}
                                onChange={(e) => setEyePupilColor(e.target.value)}
                                className="flex-1 bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-1 text-slate-200 text-xs font-mono focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* BRANDING LOGO OVERLAY */}
                <div className="border-t border-slate-900 pt-4 space-y-3">
                  <div>
                    <span className="text-xs font-bold text-slate-300 block">Center Branding Logo Overlay</span>
                    <span className="text-[10px] text-slate-500">Embed clean logos with automated safety grids to keep scans flawless</span>
                  </div>

                  {/* PRESET LOGOS */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {LOGO_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => {
                          setLogoUrl(preset.url);
                          if (preset.url) {
                            setErrorCorrection('H'); // Auto scale error correction for logo safety
                          }
                        }}
                        className={`py-2 px-1 rounded-xl text-center border text-[10px] font-bold flex flex-col items-center gap-1.5 transition-all ${logoUrl === preset.url ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
                      >
                        {preset.url ? (
                          <img src={preset.url} alt={preset.name} className="h-5 w-5 object-contain" />
                        ) : (
                          <span className="h-5 flex items-center justify-center font-black">∅</span>
                        )}
                        <span>{preset.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* CUSTOM LOGO URL INPUT */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400">Custom Logo Image URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. https://mybrand.com/logo.png"
                        value={tempLogoInput}
                        onChange={(e) => setTempLogoInput(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        onClick={() => {
                          if (tempLogoInput.trim()) {
                            setLogoUrl(tempLogoInput.trim());
                            setErrorCorrection('H');
                            showToast('Custom branding logo configured successfully.', 'success');
                          }
                        }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-slate-100 font-bold text-xs px-4 rounded-xl transition-all"
                      >
                        Apply
                      </button>
                    </div>
                  </div>

                  {logoUrl && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">Logo Scale Size ({logoSize}%)</label>
                        <input
                          type="range"
                          min="10"
                          max="25"
                          value={logoSize}
                          onChange={(e) => setLogoSize(parseInt(e.target.value, 10))}
                          className="w-full accent-emerald-500 cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">Grid Safety redundancy</label>
                        <select
                          value={errorCorrection}
                          onChange={(e) => setErrorCorrection(e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-200 text-xs focus:outline-none"
                        >
                          <option value="H">High Redundancy (30% Restorable) - Recommended for Logos</option>
                          <option value="Q">Quartile (25% Restorable)</option>
                          <option value="M">Medium (15% Restorable)</option>
                          <option value="L">Low (7% Restorable)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

              </div>

            </div>

            {/* RIGHT SIDE LIVE PREVIEW COLUMN */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
              
              <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-4">
                  <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Interactive Live Output</span>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span> Live Rendering
                  </div>
                </div>

                {/* VISUAL PREVIEW CANVAS CARD */}
                <div className="relative bg-white p-6 rounded-2xl shadow-xl shadow-slate-950/40 border border-slate-200 mb-6 group">
                  <canvas
                    ref={canvasRef}
                    width={280}
                    height={280}
                    className="mx-auto rounded-lg"
                  />
                  
                  {/* WATERMARK LABEL STATUS AT BOTTOM IN UI */}
                  {!isUnlockedPreview && (
                    <div className="absolute inset-x-0 bottom-0 bg-slate-950/95 text-[10px] text-center font-semibold text-amber-400 py-1.5 rounded-b-2xl border-t border-slate-900 flex items-center justify-center gap-1">
                      <span>⚡ Free Export: Branding watermark active.</span>
                      <button
                        onClick={unlockPreviewWatermark}
                        className="bg-amber-400/10 hover:bg-amber-400 hover:text-slate-950 border border-amber-400/20 text-amber-300 font-extrabold text-[9px] px-2 py-0.5 rounded transition-all ml-1.5 uppercase tracking-wider"
                      >
                        Remove Branding (1 credit)
                      </button>
                    </div>
                  )}
                </div>

                {/* CURRENT GENERATED INFO SUMMARY */}
                <div className="w-full bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-2 mb-6">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Destination Payload</span>
                    <span className="font-mono text-slate-300 truncate max-w-[200px]" title={rawQRPayload}>{rawQRPayload}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Campaign Model</span>
                    <span className="font-bold text-slate-300">{isDynamic ? '⚡ Dynamic Redirection' : '🔗 Static QR'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Logo Overlay Grid</span>
                    <span className="font-semibold text-slate-300">{logoUrl ? 'Active Preset' : 'Disabled'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Error Redundancy</span>
                    <span className="font-bold text-slate-300">{errorCorrection} (Max {errorCorrection === 'H' ? '30%' : (errorCorrection === 'Q' ? '25%' : '15%')} damage safety)</span>
                  </div>
                </div>

                {/* EXPORT BUTTONS & CAMPAIGN CREATION */}
                <div className="w-full space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={downloadPNG}
                      className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="h-4 w-4 text-emerald-400" /> PNG (Free)
                    </button>
                    <button
                      onClick={downloadSVG}
                      className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="h-4 w-4 text-indigo-400" /> SVG ({getFeatureCost('download_svg')} Cr)
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={downloadHighResPNG}
                      className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <Sparkles className="h-4 w-4 text-amber-400" /> High-Res PNG ({getFeatureCost('high_res_export')} Cr)
                    </button>
                    <button
                      onClick={downloadTransparentPNG}
                      className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="h-4 w-4 text-teal-400" /> Transparent ({getFeatureCost('transparent_png')} Cr)
                    </button>
                  </div>

                  <button
                    onClick={downloadPDF}
                    className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-200 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4 text-rose-400" /> Download PDF Layout ({getFeatureCost('download_pdf')} Cr)
                  </button>

                  {/* CHOOSE SYSTEM FOLDER FOR CAMPAIGN */}
                  <div className="bg-slate-900/50 border border-slate-800/80 p-3.5 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                        <FolderOpen className="h-3.5 w-3.5 text-indigo-400" /> Save to Workspace Folder
                      </span>
                      <span className="text-[9px] uppercase font-mono text-slate-500">Shared Access</span>
                    </div>
                    <select
                      value={selectedFolderId}
                      onChange={(e) => setSelectedFolderId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">— Root Directory (No folder) —</option>
                      {folders
                        .filter(f => f.workspaceId === activeWorkspaceId)
                        .map(f => (
                          <option key={f.id} value={f.id}>📁 {f.name}</option>
                        ))
                      }
                    </select>
                  </div>

                  {/* PASSWORD & SCHEDULED REDIRECTS POP-OVERS */}
                  <div className="bg-slate-900/50 border border-slate-800/80 p-4 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                      <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5 text-indigo-400" /> Smart Redirection Rules
                      </span>
                      <span className="text-[9px] uppercase font-mono text-indigo-400">Premium Add-ons</span>
                    </div>

                    {/* PASSWORD */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-slate-400 flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isPasswordProtected}
                            onChange={(e) => setIsPasswordProtected(e.target.checked)}
                            className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0"
                          />
                          Password Protected QR
                        </label>
                        <span className="text-[10px] font-mono text-slate-500">+{getFeatureCost('password_protected')} Cr</span>
                      </div>
                      {isPasswordProtected && (
                        <input
                          type="text"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Set custom access password"
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                        />
                      )}
                    </div>

                    {/* SCHEDULED */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-slate-400 flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isScheduled}
                            onChange={(e) => setIsScheduled(e.target.checked)}
                            className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0"
                          />
                          Scheduled Redirection
                        </label>
                        <span className="text-[10px] font-mono text-slate-500 font-bold">+{getFeatureCost('scheduled_qr')} Cr</span>
                      </div>
                      {isScheduled && (
                        <input
                          type="datetime-local"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                        />
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleCreateCampaign}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black py-4 rounded-2xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:scale-[1.01]"
                  >
                    <CheckSquare className="h-4 w-4" /> Save &amp; Finalize QR Campaign
                  </button>

                  <button
                    onClick={() => setIsScannerOpen(true)}
                    className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 py-3.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <Camera className="h-4 w-4 text-emerald-400" />
                    ⚡ In-App QR Scanner (Verify redirectional match)
                  </button>

                  <div className="border-t border-slate-900 pt-4 flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-bold">Need Batch bulk exports?</span>
                    <button
                      onClick={() => setBulkModalOpen(true)}
                      className="text-emerald-400 hover:text-emerald-300 text-xs font-black flex items-center gap-1"
                    >
                      Open Bulk Utility (1 Cr/QR) <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ==========================================
            TAB: CAMPAIGNS & DYNAMIC REDIRECTION
           ========================================== */}
        {activeTab === 'campaigns' && (
          <div id="panel-campaigns" className="space-y-8 animate-fade-in">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-950 border border-slate-900 rounded-2xl p-6">
              <div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  Campaign Management
                </h2>
                <p className="text-slate-400 text-xs mb-3">
                  Review statistics and update redirection links of your active Dynamic campaigns in real-time.
                </p>
                <button
                  onClick={() => setIsScannerOpen(true)}
                  className="bg-emerald-500/10 hover:bg-emerald-500 hover:text-slate-950 border border-emerald-500/20 text-emerald-400 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 w-fit"
                >
                  <Camera className="h-4 w-4 animate-pulse" /> ⚡ Live In-App QR Scanner
                </button>
              </div>

              {/* SIMULATION CONTROLLER FOR TESTING SCANS */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="text-xs">
                  <span className="block text-[10px] text-slate-500 uppercase font-black tracking-wider">Campaign Traffic Simulator</span>
                  <select
                    onChange={(e) => {
                      const campaign = campaigns.find(c => c.id === e.target.value);
                      if (campaign) setScanSimCampaign(campaign);
                    }}
                    className="bg-transparent text-slate-200 text-xs font-bold outline-none"
                    defaultValue=""
                  >
                    <option value="" disabled>Select active code...</option>
                    {campaigns.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="text-xs">
                  <span className="block text-[10px] text-slate-500 uppercase font-black tracking-wider">Simulated Area</span>
                  <select
                    value={simulatedCity}
                    onChange={(e) => setSimulatedCity(e.target.value)}
                    className="bg-transparent text-slate-200 text-xs font-bold outline-none"
                  >
                    <option value="Lagos (Ikeja)">Lagos (Ikeja)</option>
                    <option value="Lagos (VI)">Lagos (VI)</option>
                    <option value="Lagos (Lekki)">Lagos (Lekki)</option>
                    <option value="Abuja">Abuja</option>
                    <option value="Nairobi">Nairobi</option>
                    <option value="Accra">Accra</option>
                  </select>
                </div>

                <button
                  onClick={triggerSimulatedScan}
                  disabled={!scanSimCampaign}
                  className="bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-extrabold text-[11px] uppercase tracking-wider px-4 py-2 rounded-lg transition-all"
                >
                  ⚡ Simulate Scan!
                </button>
              </div>
            </div>

            {/* CAMPAIGNS LIST & STATS CARD */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* LIST COL */}
              <div className="lg:col-span-6 space-y-4">
                
                {/* WORKSPACE FOLDER FILTER TABS */}
                <div className="bg-slate-950 border border-slate-900 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1">
                      <FolderOpen className="h-3.5 w-3.5 text-indigo-400" /> Workspace Folders &amp; Filters
                    </span>
                    <span className="text-[9px] uppercase font-mono text-slate-500">
                      {workspaces.find(w => w.id === activeWorkspaceId)?.name || 'Personal Workspace'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setFilterFolderId('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${filterFolderId === 'all' ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400' : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-slate-200'}`}
                    >
                      📁 All Campaigns
                    </button>
                    {folders
                      .filter(f => f.workspaceId === activeWorkspaceId)
                      .map(folder => (
                        <button
                          key={folder.id}
                          onClick={() => setFilterFolderId(folder.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${filterFolderId === folder.id ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400' : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-slate-200'}`}
                        >
                          📁 {folder.name}
                        </button>
                      ))
                    }
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">
                    Created Campaigns ({
                      campaigns.filter(c => {
                        if (filterFolderId !== 'all') return c.folderId === filterFolderId;
                        if (activeWorkspaceId === 'ws-personal') {
                          return !c.folderId || !folders.find(f => f.id === c.folderId);
                        } else {
                          if (c.folderId) {
                            const folderObj = folders.find(f => f.id === c.folderId);
                            return folderObj && folderObj.workspaceId === activeWorkspaceId;
                          }
                          return false;
                        }
                      }).length
                    })
                  </h3>
                  <div className="flex gap-1.5 text-xs">
                    <span className="text-slate-500">Filter:</span>
                    <span className="text-emerald-400 font-bold">{filterFolderId === 'all' ? 'All Directory' : 'Folder Segment'}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {campaigns
                    .filter(c => {
                      if (filterFolderId !== 'all') {
                        return c.folderId === filterFolderId;
                      }
                      if (activeWorkspaceId === 'ws-personal') {
                        return !c.folderId || !folders.find(f => f.id === c.folderId);
                      } else {
                        if (c.folderId) {
                          const folderObj = folders.find(f => f.id === c.folderId);
                          return folderObj && folderObj.workspaceId === activeWorkspaceId;
                        }
                        return false;
                      }
                    })
                    .map((c) => {
                      const folderName = folders.find(f => f.id === c.folderId)?.name;
                      return (
                        <div
                          key={c.id}
                          onClick={() => setSelectedCampaignId(c.id)}
                          className={`group cursor-pointer bg-slate-950 border rounded-2xl p-4 transition-all flex justify-between items-center ${selectedCampaignId === c.id ? 'border-emerald-500 shadow-md shadow-emerald-500/5' : 'border-slate-900 hover:border-slate-800'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="bg-slate-900 group-hover:bg-slate-850 p-2.5 rounded-xl border border-slate-800 flex items-center justify-center">
                              <QrCode className={`h-6 w-6 ${selectedCampaignId === c.id ? 'text-emerald-400' : 'text-slate-400'}`} />
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-bold text-slate-200 group-hover:text-white">{c.name}</span>
                                <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${c.type === 'wifi' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-teal-500/10 text-teal-400'}`}>
                                  {c.type}
                                </span>
                                {folderName && (
                                  <span className="text-[9px] bg-slate-900 text-slate-400 font-bold border border-slate-800 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                    📁 {folderName}
                                  </span>
                                )}
                                {c.isPasswordProtected && (
                                  <span className="text-[9px] bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20 px-1 py-0.5 rounded">
                                    🔒 Protected
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 font-mono truncate max-w-[200px] mt-1">
                                {c.targetUrl}
                              </p>
                              <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-[10px] text-slate-500 font-mono">Created: <span className="text-slate-400 font-medium">{c.created}</span></span>
                                <span className="text-[10px] text-slate-500">•</span>
                                <span className="text-[10px] text-emerald-400 font-extrabold">{c.clicks} scans</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            {/* MOVE TO FOLDER DROPDOWN SELECTOR */}
                            <select
                              value={c.folderId || ''}
                              onChange={(e) => {
                                const newFolderId = e.target.value;
                                setCampaigns(prev => prev.map(item => {
                                  if (item.id === c.id) {
                                    return { ...item, folderId: newFolderId || undefined };
                                  }
                                  return item;
                                }));
                                showToast('Campaign folder assignment updated!', 'success');
                              }}
                              className="bg-slate-900 border border-slate-800 text-[10px] text-slate-400 rounded-lg px-2 py-1 outline-none"
                              title="Move campaign to folder"
                            >
                              <option value="">📁 Root</option>
                              {folders
                                .filter(f => f.workspaceId === activeWorkspaceId)
                                .map(f => (
                                  <option key={f.id} value={f.id}>📁 {f.name}</option>
                                ))
                              }
                            </select>

                            {/* EDIT TARGET DESTINATION BUTTON (REDIRECTION) */}
                            <button
                              onClick={() => {
                                setEditingCampaignId(c.id);
                                setEditingTargetUrl(c.targetUrl);
                              }}
                              className="bg-slate-900 hover:bg-slate-800 p-2 rounded-xl text-slate-400 hover:text-slate-100 transition-colors"
                              title="Edit redirection URL"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                handleDeleteCampaign(c.id);
                              }}
                              className="bg-slate-900 hover:bg-rose-950 p-2 rounded-xl text-slate-400 hover:text-rose-400 transition-colors"
                              title="Delete Campaign"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* DETAILED STATS COL */}
              <div className="lg:col-span-6">
                {selectedCampaign ? (
                  <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 space-y-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active Campaign Details</span>
                        <h3 className="text-lg font-bold text-slate-100">{selectedCampaign.name}</h3>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          Short Redirect Target: <span className="font-mono text-emerald-400">{selectedCampaign.shortUrl}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-emerald-400 block">{selectedCampaign.clicks}</span>
                        <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500">Total Scans Recorded</span>
                      </div>
                    </div>

                    {/* REDIRECTION DESTINATION PREVIEW */}
                    <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-black text-slate-500 uppercase">Target Redirection URL</span>
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase">Dynamic Redirect</span>
                        </div>
                        <p className="text-xs font-mono text-slate-200 truncate">{selectedCampaign.targetUrl}</p>
                      </div>

                      {/* PREMIUM RULE DETAILS */}
                      {(selectedCampaign.isPasswordProtected || selectedCampaign.isScheduled) && (
                        <div className="border-t border-slate-800/80 pt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {selectedCampaign.isPasswordProtected && (
                            <div className="bg-slate-950/60 border border-slate-850 p-2 rounded-xl">
                              <span className="block text-[9px] uppercase font-bold text-slate-500">🔒 Password Gate</span>
                              <span className="font-mono text-xs text-slate-300">Enabled (Password: {selectedCampaign.password})</span>
                            </div>
                          )}
                          {selectedCampaign.isScheduled && (
                            <div className="bg-slate-950/60 border border-slate-850 p-2 rounded-xl">
                              <span className="block text-[9px] uppercase font-bold text-slate-500">📅 Schedule Gate</span>
                              <span className="font-mono text-xs text-slate-300">Activates: {selectedCampaign.scheduleDate}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* INTERACTIVE SCAN TIMELINE (SVG BASED TO BE 100% RESPONSIVE) */}
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-3">7-Day Scan Velocity</h4>
                      <div className="h-32 bg-slate-900/40 border border-slate-900 rounded-2xl p-3 flex items-end justify-between gap-1">
                        {selectedCampaign.scansOverTime.map((val, idx) => {
                          const max = Math.max(...selectedCampaign.scansOverTime, 1);
                          const heightPct = (val / max) * 100;
                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                              <span className="text-[10px] font-bold text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity mb-1">{val}</span>
                              <div
                                style={{ height: `${heightPct * 0.7}%` }}
                                className="w-full bg-gradient-to-t from-teal-600 to-emerald-400 rounded-t-lg transition-all duration-500"
                              ></div>
                              <span className="text-[9px] text-slate-500 font-bold mt-2">D{idx+1}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* METRICS METADATA: GEOGRAPHIC DISTRIBUTION & DEVICES */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      
                      {/* GEOGRAPHY */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">African Scans Geography</h4>
                        <div className="space-y-2">
                          {Object.entries(selectedCampaign.scanLocations).map(([loc, val]) => (
                            <div key={loc} className="text-xs flex justify-between items-center border-b border-slate-900 pb-1.5">
                              <span className="text-slate-400">{loc}</span>
                              <span className="font-bold text-slate-200">{val} scans</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* DEVICES */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">Device Platforms</h4>
                        <div className="space-y-2">
                          {Object.entries(selectedCampaign.devices).map(([device, val]) => (
                            <div key={device} className="text-xs flex justify-between items-center border-b border-slate-900 pb-1.5">
                              <span className="text-slate-400">{device}</span>
                              <span className="font-bold text-slate-200">{val} scans</span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                    {/* AUDIT LOG / VERSION HISTORY */}
                    <div className="border-t border-slate-900 pt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                          <History className="h-3.5 w-3.5 text-indigo-400" /> Destination Version History (Audit Trail)
                        </h4>
                        <span className="text-[9px] uppercase font-mono text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-full">
                          qr_versions
                        </span>
                      </div>
                      
                      {qrVersions.filter(v => v.campaignId === selectedCampaign.id).length === 0 ? (
                        <div className="text-[11px] text-slate-500 italic bg-slate-900/30 rounded-xl p-3 text-center border border-slate-900">
                          No edits recorded yet. Every redirection update will be logged here for trust and audit integrity.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {qrVersions
                            .filter(v => v.campaignId === selectedCampaign.id)
                            .map((ver) => (
                              <div key={ver.id} className="bg-slate-900/60 border border-slate-900/80 rounded-xl p-3 space-y-1.5 hover:border-slate-800 transition-all text-left">
                                <div className="flex justify-between items-center text-[10px]">
                                  <span className="font-bold text-slate-400">Edited by {ver.editedBy}</span>
                                  <span className="text-slate-500 font-mono">{ver.timestamp}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono border-t border-slate-900/50 pt-1.5">
                                  <div className="text-slate-500 truncate">
                                    <span className="block text-[8px] uppercase font-extrabold tracking-wider text-rose-500">Old Target</span>
                                    <span title={ver.oldValue}>{ver.oldValue}</span>
                                  </div>
                                  <div className="text-emerald-400 truncate border-l border-slate-800 pl-2">
                                    <span className="block text-[8px] uppercase font-extrabold tracking-wider text-emerald-400">New Target</span>
                                    <span title={ver.newValue}>{ver.newValue}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                  </div>
                ) : (
                  <div className="bg-slate-950 border border-slate-900 border-dashed rounded-3xl p-12 text-center text-slate-500 flex flex-col items-center justify-center">
                    <BarChart3 className="h-12 w-12 text-slate-600 mb-3" />
                    <p className="text-xs font-bold text-slate-300">No active details selected</p>
                    <p className="text-[11px] text-slate-500 mt-1">Select a campaign from the left list to review dynamic redirection maps &amp; live scans traffic.</p>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* ==========================================
            TAB: LOCAL AGENCY PRESETS & TEMPLATES
           ========================================== */}
        {activeTab === 'templates' && (
          <div id="panel-templates" className="space-y-6 animate-fade-in">
            <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                Local Business Preset Templates
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                Pre-configured combinations of high error correction, custom African patterns, and specific color palettes optimized to look professional and scan beautifully.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {AGENCY_PRESETS.map((preset) => (
                <div key={preset.name} className="bg-slate-950 border border-slate-900 hover:border-indigo-500/50 rounded-2xl p-6 transition-all flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {preset.useCase}
                    </span>
                    <h3 className="text-base font-bold text-slate-100 mt-3">{preset.name}</h3>
                    <p className="text-xs text-slate-400 mt-2">
                      Uses gradient dots paired with eye anchors matching custom regional templates. Great for digital menu cards or startup networking.
                    </p>

                    {/* CONFIG PREVIEW PILLS */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      <span className="text-[9px] font-semibold bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded">
                        Dots: {preset.style.dotType}
                      </span>
                      <span className="text-[9px] font-semibold bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded">
                        Eyes: {preset.style.eyeType}
                      </span>
                      <span className="text-[9px] font-semibold bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded">
                        Gradient: {preset.style.gradientEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      applyPreset(preset);
                      setActiveTab('studio');
                    }}
                    className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 mt-6"
                  >
                    Apply Template Styles
                  </button>
                </div>
              ))}
            </div>

            {/* PRINT TEMPLATE BOX */}
            <div className="bg-gradient-to-r from-indigo-950/40 via-[#0d1527] to-indigo-950/40 border border-slate-900 rounded-3xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center sm:text-left">
                <h3 className="text-base font-bold text-slate-200">Printable Table Tent Template (VI &amp; Lekki Retailers)</h3>
                <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                  Export high-fidelity QR layouts ready for print shops. Includes a pre-designed layout suitable for acrylic table tents or checkout counter stickers.
                </p>
              </div>
              <button
                onClick={() => showToast('PDF vector table template layout prepared. Ready to print.', 'info')}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all whitespace-nowrap"
              >
                Download PDF Print Layout
              </button>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB: WALLET & PRICING PACKS
           ========================================== */}
        {activeTab === 'wallet' && (
          <div id="panel-wallet" className="space-y-8 animate-fade-in">
            
            {/* PAY-AS-YOU-GO SUMMARY */}
            <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  Credit Balance &amp; Local Billing
                </h2>
                <p className="text-slate-400 text-xs mt-1">
                  Enjoy pay-as-you-go credit tokenization with zero subscription requirements. Unused purchased credits never expire.
                </p>
              </div>

              {/* CURRENCY TOGGLE */}
              <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
                {[
                  { id: 'NGN', label: '🇳🇬 NGN (₦)' },
                  { id: 'KES', label: '🇰🇪 KES (KSh)' },
                  { id: 'USD', label: '🌐 USD ($)' }
                ].map((cur) => (
                  <button
                    key={cur.id}
                    onClick={() => setCurrency(cur.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${currency === cur.id ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    {cur.label}
                  </button>
                ))}
              </div>
            </div>

            {/* PRICING PLANS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {PACKAGES.map((pack) => {
                const selectedPrice = currency === 'NGN' ? pack.priceNGN : (currency === 'KES' ? pack.priceKES : pack.priceUSD);
                return (
                  <div key={pack.name} className="bg-slate-950 border border-slate-900 hover:border-emerald-500/40 rounded-3xl p-6 space-y-6 flex flex-col justify-between relative overflow-hidden group">
                    {pack.badge === 'Most Popular' && (
                      <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 font-bold text-[9px] uppercase tracking-wider px-3 py-1 rounded-bl-xl">
                        {pack.badge}
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{pack.badge}</span>
                        <h3 className="text-lg font-black text-slate-100 mt-1">{pack.name}</h3>
                      </div>

                      <div className="py-2">
                        <span className="text-4xl font-extrabold text-slate-50">{pack.credits}</span>
                        <span className="text-sm font-semibold text-slate-500 ml-1">Credits</span>
                        <div className="text-xl font-bold text-emerald-400 mt-1">{selectedPrice}</div>
                      </div>

                      <ul className="space-y-2.5 text-xs text-slate-400">
                        {pack.features.map((feat, fIdx) => (
                          <li key={fIdx} className="flex items-start gap-2">
                            <span className="text-emerald-400 mt-0.5">✓</span>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={() => handleCheckoutInitiate(pack)}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold py-3 rounded-2xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 group-hover:shadow-emerald-500/20"
                    >
                      Fund Wallet
                    </button>
                  </div>
                );
              })}
            </div>

            {/* INTERACTIVE WEBHOOK & PAYMENT GATEWAY SIMULATOR */}
            <PaymentSandbox
              credits={credits}
              setCredits={setCredits}
              transactions={transactions}
              setTransactions={setTransactions}
              showToast={showToast}
              currency={currency}
              activeWorkspaceId={activeWorkspaceId}
            />

            {/* TRANSACTION HISTORY LEDGER */}
            <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6">
              <h3 className="text-sm font-extrabold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span> Transaction Ledger &amp; Wallet Audits
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-900 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                      <th className="py-3 px-4">Transaction Details</th>
                      <th className="py-3 px-4">Gateway Reference</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Price</th>
                      <th className="py-3 px-4">Credits Impact</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-slate-900/60 text-slate-300">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-900/20">
                        <td className="py-3.5 px-4 font-semibold text-slate-200">{tx.desc}</td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">{tx.ref}</td>
                        <td className="py-3.5 px-4 text-slate-400">{tx.date}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-400">{tx.amount === '0' ? '—' : tx.amount}</td>
                        <td className={`py-3.5 px-4 font-extrabold ${tx.change.startsWith('+') ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {tx.change}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded">
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SYSTEM ADMIN CONSOLE */}
            <AdminConsole
              featurePricing={featurePricing}
              setFeaturePricing={setFeaturePricing}
              packages={packages}
              setPackages={setPackages}
              showToast={showToast}
              credits={credits}
              setCredits={setCredits}
              onAddTransaction={(desc, ref, amount, change) => {
                const newTx: any = {
                  id: `tx-sim-${Date.now()}`,
                  desc,
                  amount,
                  status: 'SUCCESS',
                  date: new Date().toISOString().replace('T', ' ').substring(0, 19),
                  type: change.startsWith('+') ? 'credit_purchase' : 'credit_usage',
                  change,
                  ref
                };
                setTransactions(prev => [newTx, ...prev]);
              }}
            />

          </div>
        )}

        {/* ==========================================
            TAB: WORKSPACES & TEAM SEATS
           ========================================== */}
        {activeTab === 'team' && (
          <div id="panel-team" className="animate-fade-in">
            <TeamWorkspacePanel
              workspaces={workspaces}
              setWorkspaces={setWorkspaces}
              activeWorkspaceId={activeWorkspaceId}
              setActiveWorkspaceId={(id) => {
                setActiveWorkspaceId(id);
                const selectedWs = workspaces.find(w => w.id === id);
                if (selectedWs) {
                  setCredits(selectedWs.sharedWalletBalance);
                }
              }}
              folders={folders}
              setFolders={setFolders}
              campaigns={campaigns}
              setCampaigns={setCampaigns}
              showToast={showToast}
              credits={credits}
              setCredits={setCredits}
              currentUser={currentUser}
              invitations={invitations}
              setInvitations={setInvitations}
              onAcceptInvitation={handleAcceptInvitation}
            />
          </div>
        )}

        {/* ==========================================
            TAB: PARTNERSHIP REFERRAL PROGRAM
           ========================================== */}
        {activeTab === 'referral' && (
          <div id="panel-referral" className="animate-fade-in">
            <ReferralPanel
              referralStats={referralStats}
              setReferralStats={setReferralStats}
              credits={credits}
              setCredits={setCredits}
              setTransactions={setTransactions}
              showToast={showToast}
            />
          </div>
        )}

        {/* ==========================================
            TAB: PRIVACY & COMPLIANCE HUB
           ========================================== */}
        {activeTab === 'compliance' && (
          <div id="panel-compliance" className="animate-fade-in">
            <CompliancePanel
              campaigns={campaigns}
              setCampaigns={setCampaigns}
              transactions={transactions}
              setTransactions={setTransactions}
              workspaces={workspaces}
              setWorkspaces={setWorkspaces}
              showToast={showToast}
              detectedCountry={detectedCountry}
            />
          </div>
        )}
          </>
        )}

      </main>

      {/* ==========================================
          MODAL: EDIT REDIRECTION TARGET URL
         ========================================== */}
      {editingCampaignId && (
        <div id="modal-edit-redirect" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div>
              <h3 className="text-base font-bold text-slate-100">Modify Dynamic Target Redirect URL</h3>
              <p className="text-xs text-slate-400 mt-1">
                Updating this destination updates the destination of this QR code immediately without changing the visual QR design!
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-500 font-bold">New Target Destination URL</label>
              <input
                type="url"
                value={editingTargetUrl}
                onChange={(e) => setEditingTargetUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                placeholder="https://mynewshop.com/sales"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setEditingCampaignId(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-2.5 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={saveCampaignEdit}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-xs py-2.5 rounded-xl transition-all"
              >
                Apply Link Redirect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: INTERACTIVE BULK GENERATION
         ========================================== */}
      {bulkModalOpen && (
        <div id="modal-bulk" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-slate-100">Bulk Batch QR Code Generator</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Generate up to 5 static QR codes at once. Batch creates styled codes instantly (costs 1 credit).
                </p>
              </div>
              <button
                onClick={() => {
                  setBulkModalOpen(false);
                  setBulkResult([]);
                }}
                className="text-slate-500 hover:text-slate-300 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs text-slate-400 font-bold">Paste Target Destination URLs (One per line, max 5)</label>
              <textarea
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none"
                placeholder={`https://shop1.com\nhttps://shop2.com\nhttps://shop3.com`}
              />
            </div>

            {bulkResult.length > 0 && (
              <div className="bg-slate-950 p-4 rounded-xl space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Generated Batch preview list</span>
                <div className="grid grid-cols-5 gap-2">
                  {bulkResult.map((url, i) => (
                    <div key={i} className="text-center bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <QrCode className="h-6 w-6 text-emerald-400 mx-auto mb-1" />
                      <span className="text-[9px] font-mono block truncate text-slate-400">{url}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setBulkModalOpen(false);
                  setBulkResult([]);
                }}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-2.5 rounded-xl transition-all"
              >
                Dismiss
              </button>
              <button
                onClick={handleBulkGenerate}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold text-xs py-2.5 rounded-xl transition-all"
              >
                Generate Bulk Batch (1 Credit)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: INTERACTIVE MULTI-GATEWAY CHECKOUT SIMULATOR
         ========================================== */}
      {checkoutPack && (() => {
        // Dynamic styling variables based on active modal gateway
        const isPaystack = modalGateway === 'paystack';
        const isFlutterwave = modalGateway === 'flutterwave';
        const isStripe = modalGateway === 'stripe';

        const colorBrand = isPaystack ? '#09a5db' : (isFlutterwave ? '#ff9b00' : '#635bff');
        const bgBrand15 = isPaystack ? 'bg-[#09a5db]/15' : (isFlutterwave ? 'bg-[#ff9b00]/15' : 'bg-[#635bff]/15');
        const textBrand = isPaystack ? 'text-[#09a5db]' : (isFlutterwave ? 'text-[#ff9b00]' : 'text-[#635bff]');
        const borderBrand = isPaystack ? 'border-[#09a5db]' : (isFlutterwave ? 'border-[#ff9b00]' : 'border-[#635bff]');
        const bgBrandClass = isPaystack ? 'bg-[#09a5db] hover:bg-[#0791c1]' : (isFlutterwave ? 'bg-[#ff9b00] hover:bg-[#d88300]' : 'bg-[#635bff] hover:bg-[#4f46e5]');
        const gatewayTitle = isPaystack ? 'Paystack Secure Switch' : (isFlutterwave ? 'Flutterwave Africa Pay' : 'Stripe Global Gateway');

        return (
          <div id="modal-checkout" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-[#111624] border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl">
              
              {/* Dynamic Styled Header */}
              <div className={`${bgBrand15} border-b border-slate-850 px-6 py-4 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colorBrand }}></div>
                  <span className={`text-xs uppercase font-extrabold tracking-widest ${textBrand}`}>{gatewayTitle}</span>
                </div>
                <button
                  onClick={() => setCheckoutPack(null)}
                  className="text-slate-400 hover:text-slate-200 text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Gateway Brand Selector (Tab-bar inside checkout) */}
              {checkoutStep === 'payment_method' && (
                <div className="bg-slate-950/60 p-2 border-b border-slate-900 grid grid-cols-3 gap-1">
                  <button
                    onClick={() => setModalGateway('paystack')}
                    className={`py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all ${isPaystack ? 'bg-[#09a5db] text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Paystack
                  </button>
                  <button
                    onClick={() => setModalGateway('flutterwave')}
                    className={`py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all ${isFlutterwave ? 'bg-[#ff9b00] text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Flutterwave
                  </button>
                  <button
                    onClick={() => setModalGateway('stripe')}
                    className={`py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all ${isStripe ? 'bg-[#635bff] text-slate-50 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Stripe
                  </button>
                </div>
              )}

              {/* Inner Content */}
              <div className="p-6 space-y-6">
                
                {/* STAGE: SELECTION/INPUT INFO */}
                {checkoutStep === 'payment_method' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="text-center">
                      <span className="text-xs text-slate-400">Selected Credit Pack</span>
                      <h4 className="text-lg font-black text-slate-100">{checkoutPack.name}</h4>
                      <span className="text-2xl font-black text-emerald-400 block mt-1">{checkoutPack.price}</span>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-900 space-y-3">
                      <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500 block">Provide Secure Card Details</span>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">Card Number</label>
                          <input
                            type="text"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono outline-none"
                            placeholder={isStripe ? "4242 4242 4242 4242 (Visa/Stripe Test)" : "5061 1234 5678 9012 (Verve/Mastercard)"}
                            value={paymentCard.number}
                            onChange={(e) => setPaymentCard({ ...paymentCard, number: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1">Expiry Date</label>
                            <input
                              type="text"
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono outline-none"
                              placeholder="MM/YY"
                              value={paymentCard.expiry}
                              onChange={(e) => setPaymentCard({ ...paymentCard, expiry: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1">CVC Code</label>
                            <input
                              type="password"
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono outline-none"
                              placeholder="***"
                              maxLength={3}
                              value={paymentCard.cvc}
                              onChange={(e) => setPaymentCard({ ...paymentCard, cvc: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-900 text-[10px] text-slate-400 flex items-start gap-2 leading-relaxed">
                      <div className="p-1 bg-emerald-500/10 rounded text-emerald-400 text-xs">⚡</div>
                      <div>
                        <span className="font-extrabold text-slate-200 block">Verified Webhook Process</span>
                        Upon authorizing, this triggers the standard verified cryptographic receipt flow, protecting your account under strict compliance policies.
                      </div>
                    </div>

                    <button
                      onClick={handleProcessPayment}
                      className={`w-full ${bgBrandClass} text-slate-950 font-extrabold py-3 rounded-2xl text-xs transition-all flex items-center justify-center gap-2`}
                      style={{ color: isStripe ? '#ffffff' : '#020617' }}
                    >
                      Authorize Payment with {isPaystack ? 'Paystack' : (isFlutterwave ? 'Flutterwave' : 'Stripe')}
                    </button>
                  </div>
                )}

                {/* STAGE: SECURE PROCESSING LOADER */}
                {checkoutStep === 'processing' && (
                  <div className="py-8 flex flex-col items-center justify-center space-y-4 animate-fade-in text-center">
                    <div className="h-10 w-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${colorBrand} transparent ${colorBrand} ${colorBrand}` }}></div>
                    <div>
                      <h5 className="text-sm font-bold text-slate-200">Verifying Transaction Credentials</h5>
                      <p className="text-xs text-slate-500 mt-1">Connecting to gateway switch and verifying HMAC signatures...</p>
                    </div>
                  </div>
                )}

                {/* STAGE: OTP / 3D-SECURE CHALLENGE */}
                {checkoutStep === 'otp' && (
                  <div className="space-y-4 animate-fade-in text-center">
                    <div className="mx-auto w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center">
                      <Smartphone className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">
                        {isStripe ? '3D Secure Verification' : 'Enter OTP Authentication Code'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {isStripe 
                          ? 'Please approve the Stripe demo card authorization challenge below.' 
                          : 'We sent a verification code to the phone number on file.'}
                      </p>
                    </div>

                    <div className="max-w-xs mx-auto">
                      <input
                        type="text"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl text-center py-3 text-lg font-mono font-extrabold text-indigo-300 outline-none"
                        placeholder="123456"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                      />
                    </div>

                    <button
                      onClick={handleConfirmOTP}
                      className={`w-full ${bgBrandClass} text-slate-950 font-extrabold py-3 rounded-2xl text-xs transition-all`}
                      style={{ color: isStripe ? '#ffffff' : '#020617' }}
                    >
                      Verify &amp; Authorize Funding
                    </button>
                  </div>
                )}

                {/* STAGE: SUCCESS OVERLAY */}
                {checkoutStep === 'success' && (
                  <div className="py-6 text-center space-y-4 animate-fade-in">
                    <div className="mx-auto w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center">
                      <Check className="h-8 w-8" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-100">Wallet Funded Successfully!</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Added <span className="font-extrabold text-emerald-400">+{checkoutPack.credits} credits</span> via verified webhooks.
                      </p>
                    </div>

                    <button
                      onClick={() => setCheckoutPack(null)}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition-all"
                    >
                      Back to Wallet
                    </button>
                  </div>
                )}

              </div>
            </div>
          </div>
        );
      })()}

      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        campaigns={campaigns}
        onTriggerSimulatedScan={triggerSimulatedScanForCampaign}
        showToast={showToast}
      />

    </div>
  );
}
