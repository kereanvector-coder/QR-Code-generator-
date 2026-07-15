import { FeaturePricing, CreditPackage, Workspace, Folder, ReferralStats, Campaign } from './types';

// Default Feature Pricings
export const DEFAULT_FEATURE_PRICING: FeaturePricing[] = [
  { id: 'standard_qr', featureName: 'Generate Standard QR', creditsCost: 0, description: 'Basic static QR code without dynamic tracking.' },
  { id: 'dynamic_qr', featureName: 'Generate Dynamic QR', creditsCost: 2, description: 'Dynamic URL redirection with active scan metrics.' },
  { id: 'download_svg', featureName: 'Download SVG Vector', creditsCost: 1, description: 'Export code in infinite-resolution vector SVG format.' },
  { id: 'download_pdf', featureName: 'Download PDF Print-Ready', creditsCost: 2, description: 'Generate high-quality PDF print layout with custom margins.' },
  { id: 'transparent_png', featureName: 'Transparent PNG Export', creditsCost: 1, description: 'Download QR with background opacity enabled.' },
  { id: 'high_res_export', featureName: 'High Resolution Export', creditsCost: 2, description: 'Download PNGs at 2000px density for billboards.' },
  { id: 'logo_upload', featureName: 'Logo Upload Overlay', creditsCost: 1, description: 'Overlay business logos inside the QR pattern safely.' },
  { id: 'custom_frame', featureName: 'Custom Frame & Action', creditsCost: 1, description: 'Apply CTA borders, frames, and scan instructions.' },
  { id: 'analytics_enabled', featureName: 'Detailed Scan Analytics', creditsCost: 3, description: 'Unlocks full African geocharts, devices, and timelines.' },
  { id: 'password_protected', featureName: 'Password Protected QR', creditsCost: 2, description: 'Restricts redirection behind a user-facing pin gate.' },
  { id: 'scheduled_qr', featureName: 'Scheduled Redirect QR', creditsCost: 2, description: 'Configure active redirect start dates.' },
  { id: 'bulk_generate', featureName: 'Bulk Generate (per QR)', creditsCost: 1, description: 'Batch generate several styled QRs at once.' },
  { id: 'api_request', featureName: 'API Request', creditsCost: 1, description: 'Create QR codes programmatically via Qodex Developers API.' },
  { id: 'remove_watermark', featureName: 'Remove Qodex Watermark', creditsCost: 1, description: 'Permanently remove the credit badge from standard QRs.' }
];

// Initial Credit Packages
export const DEFAULT_PACKAGES: CreditPackage[] = [
  {
    id: 'pack-freelancer',
    name: 'Freelancer Pack',
    credits: 20,
    priceNGN: 4500,
    priceKES: 750,
    priceUSD: 5,
    badge: 'Pay-As-You-Go',
    isEnabled: true,
    features: ['20 Premium/Dynamic Credits', 'Unused credits never expire', 'Custom vector SVG exports', 'Full scan analytics & geography']
  },
  {
    id: 'pack-sme',
    name: 'SME Growth Pack',
    credits: 100,
    priceNGN: 18000,
    priceKES: 3000,
    priceUSD: 20,
    badge: 'Most Popular',
    isEnabled: true,
    features: ['100 Premium/Dynamic Credits', 'No subscription requirements', 'Dedicated Lagos support team', 'Advanced bulk exports', 'Watermark-free assets']
  },
  {
    id: 'pack-agency',
    name: 'Agency Power Pack',
    credits: 500,
    priceNGN: 75000,
    priceKES: 12500,
    priceUSD: 80,
    badge: 'Best Value',
    isEnabled: true,
    features: ['500 Premium/Dynamic Credits', 'Unlimited seats workspace', 'White-labeled customer scans', 'Instant dynamic redirects update', 'Premium 24/7 SLA']
  }
];

// Seed Workspaces
export const INITIAL_WORKSPACES: Workspace[] = [
  {
    id: 'ws-personal',
    name: 'My Personal Workspace',
    ownerId: 'user-kunle',
    isPersonal: true,
    sharedWalletBalance: 24,
    members: [
      { id: 'user-kunle', name: 'Kunle Adeleke', email: 'kunle@yabaspace.ng', role: 'Owner', joinedAt: '2026-06-01' }
    ],
    whiteLabelEnabled: false,
    maxSeats: 1
  },
  {
    id: 'ws-agency',
    name: 'Yaba Creative Agency',
    ownerId: 'user-kunle',
    isPersonal: false,
    sharedWalletBalance: 128, // Shared workspace wallet balance
    members: [
      { id: 'user-kunle', name: 'Kunle Adeleke', email: 'kunle@yabaspace.ng', role: 'Owner', joinedAt: '2026-06-01' },
      { id: 'user-tunde', name: 'Tunde Bakare', email: 'tunde@yabacreative.com', role: 'Editor', joinedAt: '2026-06-05' },
      { id: 'user-chioma', name: 'Chioma Obi', email: 'chioma@yabacreative.com', role: 'Viewer', joinedAt: '2026-06-10' }
    ],
    whiteLabelEnabled: true, // White label active for Yaba Agency
    maxSeats: 5
  }
];

// Seed Folders
export const INITIAL_FOLDERS: Folder[] = [
  { id: 'folder-1', workspaceId: 'ws-agency', name: 'E-Commerce Retailers', created: '2026-06-10', description: 'Store promos for Lekki & Ikeja' },
  { id: 'folder-2', workspaceId: 'ws-agency', name: 'WiFi Portals', created: '2026-06-12', description: 'Silicon Hub co-working spaces' },
  { id: 'folder-3', workspaceId: 'ws-personal', name: 'Quick Scans', created: '2026-06-20', description: 'Personal draft codes' }
];

// Seed Referral Dashboard Data
export const INITIAL_REFERRAL_STATS: ReferralStats = {
  referralCode: 'QDX-KUNLE-77',
  referralLink: 'https://qodex.io/ref/QDX-KUNLE-77',
  totalReferrals: 4,
  successfulPurchases: 2,
  pendingBonus: 10,
  earnedCredits: 30, // 2 successful purchases * 15 credits
  records: [
    {
      id: 'ref-1',
      refereeName: 'Amadi Nwachukwu',
      refereeEmail: 'amadi@ikejafoods.ng',
      signupDate: '2026-07-01',
      status: 'First Purchase',
      creditsEarned: 15,
      ipAddress: '102.89.44.11',
      deviceFingerprint: 'df-chrome-android-77921'
    },
    {
      id: 'ref-2',
      refereeName: 'Fatoumata Diallo',
      refereeEmail: 'diallo@accragrills.com',
      signupDate: '2026-07-03',
      status: 'First Purchase',
      creditsEarned: 15,
      ipAddress: '154.160.2.89',
      deviceFingerprint: 'df-safari-ios-81923'
    },
    {
      id: 'ref-3',
      refereeName: 'Tobi Alao',
      refereeEmail: 'tobi@yabastarters.com',
      signupDate: '2026-07-10',
      status: 'Signed Up',
      creditsEarned: 0,
      ipAddress: '102.91.56.2',
      deviceFingerprint: 'df-chrome-windows-9011'
    },
    {
      id: 'ref-4',
      refereeName: 'Simulated Fraudster',
      refereeEmail: 'shady@throwaway.com',
      signupDate: '2026-07-12',
      status: 'Fraud Flagged',
      creditsEarned: 0,
      ipAddress: '102.89.44.11', // Match amadi's IP (Self-referral check)
      deviceFingerprint: 'df-chrome-android-77921' // Match amadi's device fingerprint
    }
  ]
};
