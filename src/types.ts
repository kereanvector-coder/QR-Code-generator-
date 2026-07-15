/**
 * Qodex - Core Type Definitions
 */

export interface QRStyle {
  dotType: 'square' | 'dots' | 'rounded' | 'liquid';
  eyeType: 'square' | 'rounded' | 'circle' | 'leaf';
  fgColor: string;
  bgColor: string;
  gradientEnabled: boolean;
  gradientColor: string;
  logoUrl: string | null;
  logoSize: number; // percentage (10 to 25)
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  customColorsEnabled?: boolean;
  eyeBorderColor?: string;
  eyePupilColor?: string;
  bodyColor?: string;
}

export interface Campaign {
  id: string;
  name: string;
  type: string;
  targetUrl: string;
  shortUrl: string;
  created: string;
  clicks: number;
  scanLocations: Record<string, number>;
  devices: Record<string, number>;
  scansOverTime: number[];
  customization: QRStyle;
  isUnlocked: boolean; // Watermark removed
  isSvgUnlocked: boolean; // SVG export unlocked
  folderId?: string; // Optional parent folder for workspace categorization
  isPasswordProtected?: boolean;
  password?: string;
  isScheduled?: boolean;
  scheduleDate?: string;
}

export interface Transaction {
  id: string;
  desc: string;
  amount: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  date: string;
  type: string;
  change: string;
  ref: string;
}

// TEAM / WORKSPACE SYSTEM
export type WorkspaceRole = 'Owner' | 'Editor' | 'Viewer';

export interface WorkspaceMember {
  id: string;
  name: string;
  email: string;
  role: WorkspaceRole;
  joinedAt: string;
  avatarUrl?: string;
}

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  isPersonal: boolean;
  sharedWalletBalance: number; // Workspaces share a single wallet
  members: WorkspaceMember[];
  whiteLabelEnabled: boolean; // White-label export option (flat add-on / separate credit cost)
  maxSeats: number;
}

export interface Folder {
  id: string;
  workspaceId: string;
  name: string;
  created: string;
  description?: string;
}

// REFERRAL PROGRAM SYSTEM
export interface ReferralRecord {
  id: string;
  refereeName: string;
  refereeEmail: string;
  signupDate: string;
  status: 'Signed Up' | 'First Purchase' | 'Fraud Flagged';
  creditsEarned: number;
  ipAddress: string;
  deviceFingerprint: string;
}

export interface ReferralStats {
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  successfulPurchases: number;
  pendingBonus: number;
  earnedCredits: number;
  records: ReferralRecord[];
}

// BILLING SYSTEM
export interface FeaturePricing {
  id: string;
  featureName: string;
  creditsCost: number;
  description: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  priceNGN: number;
  priceKES: number;
  priceUSD: number;
  badge?: string;
  isEnabled: boolean;
  features: string[];
}

export type UserRole = 'Admin' | 'Operator' | 'Collaborator' | 'Guest';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  avatarUrl?: string;
  createdAt: string;
}

export interface TeamInvitation {
  id: string;
  email: string;
  name: string;
  workspaceId: string;
  workspaceName: string;
  role: WorkspaceRole;
  token: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  invitedAt: string;
}

export interface QRVersion {
  id: string;
  campaignId: string;
  timestamp: string;
  oldValue: string;
  newValue: string;
  editedBy: string;
}

