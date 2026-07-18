import React, { useState, useEffect } from 'react';
import { FeaturePricing, CreditPackage } from '../types';
import { 
  Settings, 
  Tag, 
  Trash2, 
  Plus, 
  Edit2, 
  Check, 
  AlertCircle, 
  X,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  DollarSign,
  Database,
  Shield,
  Activity,
  Terminal,
  Lock,
  RefreshCw,
  Play,
  CheckCircle,
  ChevronRight,
  UserCheck,
  Users,
  Search,
  Filter,
  Download,
  Bell,
  Sliders,
  Volume2,
  FileText,
  Briefcase,
  TrendingUp,
  CreditCard,
  Percent,
  CheckSquare,
  Globe
} from 'lucide-react';

interface AdminConsoleProps {
  featurePricing: FeaturePricing[];
  setFeaturePricing: React.Dispatch<React.SetStateAction<FeaturePricing[]>>;
  packages: CreditPackage[];
  setPackages: React.Dispatch<React.SetStateAction<CreditPackage[]>>;
  showToast: (message: string, type: 'success' | 'info' | 'error') => void;
  credits?: number;
  setCredits?: React.Dispatch<React.SetStateAction<number>>;
  workspaces?: any[];
  setWorkspaces?: React.Dispatch<React.SetStateAction<any[]>>;
  currentUser?: any;
  setCurrentUser?: React.Dispatch<React.SetStateAction<any>>;
  announcement?: string | null;
  setAnnouncement?: (ann: string | null) => void;
  campaigns?: any[];
  setCampaigns?: React.Dispatch<React.SetStateAction<any[]>>;
  onAddTransaction?: (desc: string, ref: string, amount: string, change: string) => void;
}

const SUPABASE_SCHEMA_TABLES = [
  {
    name: 'profiles',
    description: 'User accounts synchronized with Supabase Auth schema.',
    ddl: `CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'Client' CHECK (role IN ('Client', 'Admin', 'Agent_Staff')),
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT clock_timestamp()
);`,
    rls: `-- Enable RLS on user profile data
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select on profiles for owner" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow update on profiles for owner" ON profiles
  FOR UPDATE USING (auth.uid() = id);`
  },
  {
    name: 'qr_codes',
    description: 'Dynamic and Static QR campaign configurations.',
    ddl: `CREATE TABLE qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- e.g. 'url', 'wifi', 'whatsapp'
  target_url TEXT NOT NULL,
  short_url TEXT UNIQUE NOT NULL,
  style JSONB DEFAULT '{}'::jsonb,
  is_paused BOOLEAN DEFAULT false,
  is_password_protected BOOLEAN DEFAULT false,
  password_hash TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT clock_timestamp()
);`,
    rls: `-- Allow users to fully manage their own QR codes, read-only for public short redirections
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can fully manage their own QR codes" ON qr_codes
  USING (auth.uid() = user_id);

CREATE POLICY "Anonymous users can read QR metadata for short redirects" ON qr_codes
  FOR SELECT USING (true);`
  },
  {
    name: 'qr_versions',
    description: 'Version history trail tracking every destination edit with old/new values.',
    ddl: `CREATE TABLE qr_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES qr_codes(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT clock_timestamp(),
  old_value TEXT NOT NULL,
  new_value TEXT NOT NULL,
  edited_by TEXT NOT NULL
);`,
    rls: `-- Owners can view the edit audit trail for trust and audit integrity
ALTER TABLE qr_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow owners to view version history" ON qr_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM qr_codes 
      WHERE qr_codes.id = qr_versions.campaign_id 
      AND qr_codes.user_id = auth.uid()
    )
  );`
  },
  {
    name: 'qr_scans',
    description: 'Granular analytical scan event records for timeline reporting.',
    ddl: `CREATE TABLE qr_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES qr_codes(id) ON DELETE CASCADE,
  country TEXT DEFAULT 'Unknown',
  city TEXT DEFAULT 'Unknown',
  browser TEXT DEFAULT 'Unknown',
  device TEXT DEFAULT 'Unknown',
  os TEXT DEFAULT 'Unknown',
  is_returning BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT clock_timestamp()
);`,
    rls: `-- Public can insert scans, but only owners can query analytical aggregates
ALTER TABLE qr_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anonymous public can register scan records" ON qr_scans
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Only owners can query scan analytical records" ON qr_scans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM qr_codes 
      WHERE qr_codes.id = qr_scans.campaign_id 
      AND qr_codes.user_id = auth.uid()
    )
  );`
  },
  {
    name: 'folders',
    description: 'Logical directories for organizing workspace QR codes.',
    ddl: `CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT clock_timestamp()
);`,
    rls: `-- Shared access for team members within the same workspace
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can read/write folders" ON folders
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = folders.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );`
  },
  {
    name: 'qr_folders',
    description: 'Many-to-many relationship mapping QR codes to specific Folders.',
    ddl: `CREATE TABLE qr_folders (
  qr_id UUID REFERENCES qr_codes(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  PRIMARY KEY (qr_id, folder_id)
);`,
    rls: `-- Cascaded policy checks workspace membership via the folders mapping
ALTER TABLE qr_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can associate QR codes with folders" ON qr_folders
  USING (
    EXISTS (
      SELECT 1 FROM folders
      WHERE folders.id = qr_folders.folder_id
      AND EXISTS (
        SELECT 1 FROM workspace_members
        WHERE workspace_members.workspace_id = folders.workspace_id
        AND workspace_members.user_id = auth.uid()
      )
    )
  );`
  },
  {
    name: 'workspaces',
    description: 'Multi-tenant workspaces supporting team collaborations and shared billing.',
    ddl: `CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES profiles(id) ON DELETE RESTRICT,
  shared_wallet_balance INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'Free' CHECK (tier IN ('Free', 'Premium_Growth', 'Enterprise')),
  created_at TIMESTAMPTZ DEFAULT clock_timestamp()
);`,
    rls: `-- Only members can query workspace metadata; only owner can delete or upgrade
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view workspace detail" ON workspaces
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspaces.id
      AND workspace_members.user_id = auth.uid()
    )
  );`
  },
  {
    name: 'workspace_members',
    description: 'Workspace membership map assigning precise seat roles (Owner, Admin, Member, Viewer).',
    ddl: `CREATE TABLE workspace_members (
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('Owner', 'Admin', 'Member', 'Viewer')),
  joined_at TIMESTAMPTZ DEFAULT clock_timestamp(),
  PRIMARY KEY (workspace_id, user_id)
);`,
    rls: `-- Row level check allowing workspace admins to invite/kick and regular members to read roster
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read co-workers roster" ON workspace_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members AS self
      WHERE self.workspace_id = workspace_members.workspace_id
      AND self.user_id = auth.uid()
    )
  );`
  },
  {
    name: 'wallets',
    description: 'Central customer credit balance accounts linked with locking structures.',
    ddl: `CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  last_updated TIMESTAMPTZ DEFAULT clock_timestamp()
);`,
    rls: `-- Row locked ledger triggers ensure safety. Users only select their own balance
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can query their own wallet balance" ON wallets
  FOR SELECT USING (auth.uid() = owner_id);`
  },
  {
    name: 'ledger_transactions',
    description: 'Atomic transactions ledger capturing audit record of credit ingestion/debits.',
    ddl: `CREATE TABLE ledger_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
  change INTEGER NOT NULL, -- positive for credits purchased, negative for usage
  type TEXT NOT NULL, -- e.g. 'purchase', 'usage', 'refund'
  reference_code TEXT UNIQUE NOT NULL, -- Flutterwave/Paystack reference, or system UUID
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT clock_timestamp()
);`,
    rls: `-- Read-only to owners, append-only to payment verification webhook microservices
ALTER TABLE ledger_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can audit their own transactions" ON ledger_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM wallets 
      WHERE wallets.id = ledger_transactions.wallet_id 
      AND wallets.owner_id = auth.uid()
    )
  );`
  },
  {
    name: 'referrals',
    description: 'Referral stats mapping new users to their referral sponsors.',
    ddl: `CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  referred_email TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'signed_up', 'funded')),
  earned_credits INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT clock_timestamp()
);`,
    rls: `-- Referrers can query their referred logs
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Referrers can view their rewards records" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id);`
  }
];

export default function AdminConsole({
  featurePricing,
  setFeaturePricing,
  packages,
  setPackages,
  showToast,
  credits = 15,
  setCredits,
  workspaces = [],
  setWorkspaces,
  currentUser,
  setCurrentUser,
  announcement,
  setAnnouncement,
  campaigns = [],
  setCampaigns,
  onAddTransaction
}: AdminConsoleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'workspaces' | 'pricing' | 'packages' | 'revenue' | 'consumption' | 'announcements' | 'settings' | 'supabase'>('users');

  // ==========================================
  // STATE DEFINITIONS & LOCAL PERSISTENCE
  // ==========================================

  // Users Simulated Database
  const [simUsers, setSimUsers] = useState<any[]>(() => {
    const saved = localStorage.getItem('qodex_admin_sim_users');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'user-kunle', name: 'Kunle Adeleke', email: 'kunle@yabaspace.ng', role: 'Admin', isVerified: true, credits: 1200, createdAt: '2026-06-01', workspaceCount: 3 },
      { id: 'user-tosin', name: 'Tosin Alabi', email: 'tosin@flutterwave.com', role: 'Client', isVerified: true, credits: 25, createdAt: '2026-06-15', workspaceCount: 1 },
      { id: 'user-amara', name: 'Amara Okafor', email: 'amara@igbofit.com', role: 'Client', isVerified: false, credits: 5, createdAt: '2026-07-01', workspaceCount: 1 },
      { id: 'user-fatima', name: 'Fatima Musa', email: 'fatima@kanotech.ng', role: 'Operator', isVerified: true, credits: 85, createdAt: '2026-05-10', workspaceCount: 2 },
      { id: 'user-kofi', name: 'Kofi Mensah', email: 'kofi@accralabs.io', role: 'Client', isVerified: true, credits: 210, createdAt: '2026-06-20', workspaceCount: 1 }
    ];
  });

  useEffect(() => {
    localStorage.setItem('qodex_admin_sim_users', JSON.stringify(simUsers));
  }, [simUsers]);

  // Payments / Revenue Ledger
  const [simPayments, setSimPayments] = useState<any[]>(() => {
    const saved = localStorage.getItem('qodex_admin_sim_payments');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'pay-1', userName: 'Kunle Adeleke', email: 'kunle@yabaspace.ng', amount: '₦25,000', currency: 'NGN', gateway: 'Flutterwave Webhook', status: 'Approved', creditsAdded: 500, ref: 'FLW-TX-892182', date: '2026-07-15 14:32' },
      { id: 'pay-2', userName: 'Kofi Mensah', email: 'kofi@accralabs.io', amount: '$20', currency: 'USD', gateway: 'Stripe API', status: 'Approved', creditsAdded: 200, ref: 'STR-TX-551029', date: '2026-07-14 09:11' },
      { id: 'pay-3', userName: 'Tosin Alabi', email: 'tosin@flutterwave.com', amount: '₦5,000', currency: 'NGN', gateway: 'Paystack checkout', status: 'Pending Approval', creditsAdded: 100, ref: 'PST-TX-990182', date: '2026-07-16 08:45' },
      { id: 'pay-4', userName: 'Amara Okafor', email: 'amara@igbofit.com', amount: 'KSh 1,200', currency: 'KES', gateway: 'Flutterwave Mobile Money', status: 'Declined', creditsAdded: 0, ref: 'FLW-TX-221144', date: '2026-07-12 18:22' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('qodex_admin_sim_payments', JSON.stringify(simPayments));
  }, [simPayments]);

  // Credit Consumption Log
  const [consumptionLogs, setConsumptionLogs] = useState<any[]>(() => {
    const saved = localStorage.getItem('qodex_admin_sim_consumption');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'c-1', userEmail: 'kunle@yabaspace.ng', feature: 'Dynamic Short-Link Redirection', creditsSpent: 1, reference: 'CAM-FL-8219', date: '2026-07-16 09:15' },
      { id: 'c-2', userEmail: 'tosin@flutterwave.com', feature: 'Custom QR Design Styling Update', creditsSpent: 3, reference: 'CAM-FL-3312', date: '2026-07-16 07:11' },
      { id: 'c-3', userEmail: 'fatima@kanotech.ng', feature: 'vCard QR Premium Generation', creditsSpent: 5, reference: 'CAM-FL-9023', date: '2026-07-15 16:40' },
      { id: 'c-4', userEmail: 'kofi@accralabs.io', feature: 'Bulk Campaign CSV Import', creditsSpent: 15, reference: 'CAM-BLK-2281', date: '2026-07-15 11:15' },
      { id: 'c-5', userEmail: 'amara@igbofit.com', feature: 'WiFi Hotspot Access QR config', creditsSpent: 2, reference: 'CAM-FL-4402', date: '2026-07-14 13:02' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('qodex_admin_sim_consumption', JSON.stringify(consumptionLogs));
  }, [consumptionLogs]);

  // App-Wide System Config
  const [sysConfig, setSysConfig] = useState(() => {
    const saved = localStorage.getItem('qodex_admin_sim_settings');
    if (saved) return JSON.parse(saved);
    return {
      maintenanceMode: false,
      disableRegistration: false,
      apiRateLimit: 120,
      standardQRCost: 1,
      advancedQRCost: 3,
      bulkUploadLimit: 100,
      dbBackupSchedule: 'Daily'
    };
  });

  useEffect(() => {
    localStorage.setItem('qodex_admin_sim_settings', JSON.stringify(sysConfig));
  }, [sysConfig]);

  // Interactive search state inside Admin
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserForWallet, setSelectedUserForWallet] = useState<string | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(10);

  // Announcement state
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementUrgency, setAnnouncementUrgency] = useState<'info' | 'warning' | 'urgent'>('info');

  // Supabase Table state
  const [selectedTableName, setSelectedTableName] = useState<string>('wallets');
  const [showDdlType, setShowDdlType] = useState<'ddl' | 'rls'>('ddl');

  // Postgres atomic simulation terminal state
  const [simScenario, setSimScenario] = useState<'purchase' | 'deduction' | 'race_condition'>('deduction');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'PostgreSQL 16.2 database initialized...',
    'Type \\? for help. Ready for atomic transaction simulations.'
  ]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Credit Package state
  const [isEditingPack, setIsEditingPack] = useState<string | null>(null);
  const [packName, setPackName] = useState('');
  const [packCredits, setPackCredits] = useState(10);
  const [packPriceNGN, setPackPriceNGN] = useState(1000);
  const [packPriceKES, setPackPriceKES] = useState(200);
  const [packPriceUSD, setPackPriceUSD] = useState(2);
  const [packBadge, setPackBadge] = useState('');
  const [packFeatures, setPackFeatures] = useState<string[]>(['No expiry date']);
  const [newFeatureText, setNewFeatureText] = useState('');

  // Feature edit state
  const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null);
  const [editingCost, setEditingCost] = useState(0);

  // ==========================================
  // LOGIC & ACTIONS
  // ==========================================

  // Save modified feature pricing cost
  const handleSaveFeaturePricing = (id: string) => {
    setFeaturePricing(prev => prev.map(f => {
      if (f.id === id) {
        return { ...f, creditsCost: editingCost };
      }
      return f;
    }));
    setEditingFeatureId(null);
    showToast('Admin: Feature credit cost updated successfully!', 'success');
  };

  // Add package benefit item
  const addFeatureItem = () => {
    if (newFeatureText.trim()) {
      setPackFeatures([...packFeatures, newFeatureText.trim()]);
      setNewFeatureText('');
    }
  };

  // Delete package benefit item
  const removeFeatureItem = (idx: number) => {
    setPackFeatures(packFeatures.filter((_, i) => i !== idx));
  };

  // Initialize editing/creation of packages
  const handleOpenPackForm = (pack?: CreditPackage) => {
    if (pack) {
      setIsEditingPack(pack.id);
      setPackName(pack.name);
      setPackCredits(pack.credits);
      setPackPriceNGN(pack.priceNGN);
      setPackPriceKES(pack.priceKES);
      setPackPriceUSD(pack.priceUSD);
      setPackBadge(pack.badge || '');
      setPackFeatures(pack.features);
    } else {
      setIsEditingPack('new');
      setPackName('');
      setPackCredits(50);
      setPackPriceNGN(9000);
      setPackPriceKES(1500);
      setPackPriceUSD(10);
      setPackBadge('Limited Pack');
      setPackFeatures(['No monthly locks', 'Full dashboard analytics']);
    }
  };

  // Save Package (Create or Update)
  const handleSavePackage = () => {
    if (!packName.trim()) {
      showToast('Please enter a package name.', 'error');
      return;
    }

    if (isEditingPack === 'new') {
      const newPack: CreditPackage = {
        id: `pack-${Date.now()}`,
        name: packName,
        credits: packCredits,
        priceNGN: packPriceNGN,
        priceKES: packPriceKES,
        priceUSD: packPriceUSD,
        badge: packBadge || undefined,
        isEnabled: true,
        features: packFeatures
      };
      setPackages([...packages, newPack]);
      showToast(`Admin: Created package "${packName}"`, 'success');
    } else {
      setPackages(prev => prev.map(p => {
        if (p.id === isEditingPack) {
          return {
            ...p,
            name: packName,
            credits: packCredits,
            priceNGN: packPriceNGN,
            priceKES: packPriceKES,
            priceUSD: packPriceUSD,
            badge: packBadge || undefined,
            features: packFeatures
          };
        }
        return p;
      }));
      showToast(`Admin: Updated package "${packName}"`, 'success');
    }
    setIsEditingPack(null);
  };

  // Toggle package enabled/disabled status
  const togglePackage = (id: string) => {
    setPackages(prev => prev.map(p => {
      if (p.id === id) {
        const nextStatus = !p.isEnabled;
        showToast(`Admin: Package "${p.name}" ${nextStatus ? 'enabled' : 'disabled'}.`, 'info');
        return { ...p, isEnabled: nextStatus };
      }
      return p;
    }));
  };

  // Delete credit package
  const handleDeletePackage = (id: string, name: string) => {
    setPackages(prev => prev.filter(p => p.id !== id));
    showToast(`Admin: Package "${name}" deleted.`, 'info');
  };

  // Run Postgres transaction simulation in terminal
  const runTransactionSimulation = async () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setTerminalLogs([]);

    const log = (text: string, delay: number) => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          setTerminalLogs(prev => [...prev, `[${new Date().toISOString().substring(11, 19)}] ${text}`]);
          resolve();
        }, delay);
      });
    };

    if (simScenario === 'deduction') {
      await log('BEGIN TRANSACTION;', 200);
      await log('SELECT balance FROM wallets WHERE owner_id = \'user-kunle\' FOR UPDATE;', 400);
      await log('↳ ROW LOCK (exclusive) acquired successfully on profiles(id: user-kunle).', 200);
      await log(`-- Evaluating sufficient credits. Current balance: ${credits}. Cost: 3 credits.`, 300);
      await log('UPDATE wallets SET balance = balance - 3, last_updated = clock_timestamp() WHERE owner_id = \'user-kunle\';', 400);
      await log('INSERT INTO ledger_transactions (id, wallet_id, change, type, reference_code, description) VALUES (...);', 300);
      await log('COMMIT;', 200);
      await log(`SUCCESS: Transaction committed. Wallet balance adjusted from ${credits} to ${credits - 3}.`, 200);
      
      // Update real context state
      if (setCredits) setCredits(Math.max(0, credits - 3));
      if (onAddTransaction) {
        onAddTransaction(
          'Postgres transaction demo: Campaign Deduction',
          'QTX-POSTGRES-DEMO',
          '0.00',
          '-3'
        );
      }
    } else if (simScenario === 'purchase') {
      await log('BEGIN TRANSACTION;', 200);
      await log('SELECT balance FROM wallets WHERE owner_id = \'user-kunle\' FOR UPDATE;', 400);
      await log('↳ ROW LOCK acquired.', 100);
      await log('UPDATE wallets SET balance = balance + 150 WHERE owner_id = \'user-kunle\';', 400);
      await log('INSERT INTO ledger_transactions (change, type, reference_code) VALUES (150, \'purchase\', \'FLW-CONCURRENT-991\');', 350);
      await log('COMMIT;', 200);
      await log(`SUCCESS: Webhook balance ingested. Credits adjusted from ${credits} to ${credits + 150}.`, 200);
      
      if (setCredits) setCredits(credits + 150);
      if (onAddTransaction) {
        onAddTransaction(
          'Postgres transaction demo: Credit Purchase Boost',
          'QTX-POSTGRES-DEMO',
          '₦5,000.00',
          '+150'
        );
      }
    } else if (simScenario === 'race_condition') {
      await log('⚡ START CONCURRENT RIVALRY SIMULATION', 100);
      await log('Connection A: BEGIN; SELECT balance FOR UPDATE; -- locks row', 300);
      await log('Connection B: BEGIN; SELECT balance FOR UPDATE; -- waiting on lock...', 400);
      await log('Connection A: UPDATE balance = balance - 5; COMMIT; -- releases lock', 500);
      await log('Connection B: ↳ Lock acquired! Balance evaluated on updated state.', 300);
      await log('Connection B: UPDATE balance = balance - 5; COMMIT;', 400);
      await log('SUCCESS: Race condition fully averted. Concurrent tasks serialized safely via FOR UPDATE row locking.', 300);
    }

    setIsSimulating(false);
  };

  // ==========================================
  // MANAGEMENT FUNCTIONS (THE 12 DIRECTIVES)
  // ==========================================

  // 1. User role & verification updates
  const updateUserRole = (userId: string, newRole: string) => {
    setSimUsers(prev => prev.map(u => {
      if (u.id === userId) {
        showToast(`User ${u.name} role updated to ${newRole}`, 'success');
        // If it is the currently logged in user, synchronize state!
        if (currentUser && currentUser.id === userId && setCurrentUser) {
          setCurrentUser({ ...currentUser, role: newRole });
        }
        return { ...u, role: newRole };
      }
      return u;
    }));
  };

  const toggleUserVerification = (userId: string) => {
    setSimUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const nextState = !u.isVerified;
        showToast(`User ${u.name} verification status is now ${nextState ? 'VERIFIED' : 'UNVERIFIED'}`, 'info');
        return { ...u, isVerified: nextState };
      }
      return u;
    }));
  };

  // 2. Wallet & Credits Adjustment
  const adjustUserCredits = (userId: string, amount: number) => {
    setSimUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const updatedCredits = Math.max(0, u.credits + amount);
        showToast(`Adjusted wallet of ${u.name} by ${amount > 0 ? '+' : ''}${amount} credits`, 'success');
        
        // Log transaction inside general ledger
        const referenceCode = `QTX-ADJ-${Math.floor(100000 + Math.random() * 900000)}`;
        setConsumptionLogs(prevLogs => [
          {
            id: `c-adj-${Date.now()}`,
            userEmail: u.email,
            feature: 'Admin Credit Manual adjustment override',
            creditsSpent: -amount,
            reference: referenceCode,
            date: new Date().toISOString().replace('T', ' ').substring(0, 16)
          },
          ...prevLogs
        ]);

        // If adjusting our own currently active workspace owner wallet, update App state
        if (userId === 'user-kunle' && setCredits) {
          setCredits(updatedCredits);
        }

        return { ...u, credits: updatedCredits };
      }
      return u;
    }));
    setSelectedUserForWallet(null);
  };

  // 5. Payment Approval simulation
  const approveSimulatedPayment = (payId: string) => {
    setSimPayments(prev => prev.map(p => {
      if (p.id === payId) {
        if (p.status === 'Approved') {
          showToast('Payment already approved.', 'info');
          return p;
        }

        // Add credits to user
        setSimUsers(uPrev => uPrev.map(u => {
          if (u.email === p.email) {
            const added = p.creditsAdded || 100;
            showToast(`Approved payment! Credited ${added} credits to ${u.name}`, 'success');
            
            if (u.id === 'user-kunle' && setCredits) {
              setCredits(prev => prev + added);
            }
            
            // Log in main transaction ledger
            if (onAddTransaction) {
              onAddTransaction(
                `Payment Approved: ${p.gateway}`,
                p.ref,
                p.amount,
                `+${added}`
              );
            }

            return { ...u, credits: u.credits + added };
          }
          return u;
        }));

        return { ...p, status: 'Approved' };
      }
      return p;
    }));
  };

  // Decline/Refund simulated payment
  const declineSimulatedPayment = (payId: string) => {
    setSimPayments(prev => prev.map(p => {
      if (p.id === payId) {
        showToast(`Payment ${p.ref} marked as Refunded / Declined`, 'info');
        return { ...p, status: 'Declined' };
      }
      return p;
    }));
  };

  // 10. Generate Compliance & Audit Report (HTML/Markdown Mockup)
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  const generateExecutiveReport = () => {
    const totalRev = simPayments
      .filter(p => p.status === 'Approved')
      .reduce((acc, curr) => {
        const val = parseInt(curr.amount.replace(/[^0-9]/g, ''), 10) || 0;
        return acc + val;
      }, 0);

    const totalCreditsGranted = simPayments
      .filter(p => p.status === 'Approved')
      .reduce((acc, curr) => acc + (curr.creditsAdded || 0), 0);

    const totalCreditsSpent = consumptionLogs.reduce((acc, curr) => acc + curr.creditsSpent, 0);

    const markdown = `# QODEX EXECUTIVE FINANCIAL & AUDIT REPORT
**Generated:** ${new Date().toLocaleString()}
**Classification:** STRICTLY CONFIDENTIAL - SYSTEM ADMIN OVERVIEW

---

### 📈 KEY PERFORMANCE INDICATORS
- **Total Ledger Inflow:** ₦${totalRev.toLocaleString()} (Verified Paystack & Flutterwave checkouts)
- **Total Granted Credits:** ${totalCreditsGranted} credits
- **Active Credit Circulation:** ${simUsers.reduce((acc, curr) => acc + curr.credits, 0)} credits in user wallets
- **Core Consumption Volume:** ${totalCreditsSpent} credits consumed via feature invocation
- **Registered User Accounts:** ${simUsers.length} total profiles
- **Configured Workspaces:** ${workspaces.length > 0 ? workspaces.length : 3} team domains

### 🛠️ FEATURE CONSUMPTION INTENSITY
- Dynamic Short-Link updates represent 45% of daily traffic.
- vCard QR Premium customization ranks highest in credit-to-cost conversion efficiency.

---
### ⚖️ REGULATORY COMPLIANCE STANCE
*This report conforms to CBN Payment Gateway mandates and local African anti-fraud frameworks. All API transactions are authenticated server-side via row lock guarantees.*`;

    setGeneratedReport(markdown);
    showToast('Executive system compliance report generated successfully!', 'success');
  };

  // 11. Broadcast announcement publishing
  const handlePublishAnnouncement = () => {
    if (!announcementText.trim()) {
      showToast('Please type announcement text first.', 'error');
      return;
    }
    
    let prefix = '📢 ';
    if (announcementUrgency === 'warning') prefix = '⚠️ SYSTEM ALERT: ';
    if (announcementUrgency === 'urgent') prefix = '🚨 EMERGENCY BROADCAST: ';

    const fullMessage = `${prefix}${announcementText.trim()}`;
    if (setAnnouncement) {
      setAnnouncement(fullMessage);
      localStorage.setItem('qodex_broadcast_announcement', fullMessage);
      showToast('Announcement broadcasted to all active user viewports!', 'success');
    }
  };

  const handleClearAnnouncement = () => {
    if (setAnnouncement) {
      setAnnouncement(null);
      localStorage.removeItem('qodex_broadcast_announcement');
      setAnnouncementText('');
      showToast('Broadcast banner removed from system viewports.', 'info');
    }
  };

  // 12. Workspace Seat & Custom Quotas
  const adjustWorkspaceSeatLimit = (wsId: string, inc: number) => {
    if (setWorkspaces) {
      setWorkspaces(prev => prev.map(w => {
        if (w.id === wsId) {
          const currentLimit = w.seatsLimit || 5;
          const nextLimit = Math.max(1, currentLimit + inc);
          showToast(`Workspace "${w.name}" seat capacity updated to ${nextLimit}`, 'success');
          return { ...w, seatsLimit: nextLimit };
        }
        return w;
      }));
    }
  };

  const adjustWorkspaceWalletBalance = (wsId: string, inc: number) => {
    if (setWorkspaces) {
      setWorkspaces(prev => prev.map(w => {
        if (w.id === wsId) {
          const currentBal = w.sharedWalletBalance || 0;
          const nextBal = Math.max(0, currentBal + inc);
          showToast(`Workspace "${w.name}" shared balance adjusted by ${inc > 0 ? '+' : ''}${inc}`, 'success');
          return { ...w, sharedWalletBalance: nextBal };
        }
        return w;
      }));
    }
  };

  const transferWorkspaceOwnership = (wsId: string, newEmail: string) => {
    if (setWorkspaces) {
      setWorkspaces(prev => prev.map(w => {
        if (w.id === wsId) {
          showToast(`Workspace ownership transferred to ${newEmail}`, 'success');
          return { ...w, ownerEmail: newEmail };
        }
        return w;
      }));
    }
  };

  // Filtered Users List
  const filteredUsers = simUsers.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const selectedTable = SUPABASE_SCHEMA_TABLES.find(t => t.name === selectedTableName) || SUPABASE_SCHEMA_TABLES[0];

  return (
    <div className="bg-[#0b1329] border border-slate-900 rounded-2xl overflow-hidden shadow-2xl">
      {/* HEADER BAR */}
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        className="px-6 py-4 bg-slate-900/40 hover:bg-slate-900/60 transition-colors flex justify-between items-center cursor-pointer border-b border-slate-900/40"
      >
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500/10 p-2 rounded-xl text-indigo-400">
            <Settings className="h-5 w-5 animate-spin-slow" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Enterprise Admin Command Center
              <span className="text-[9px] uppercase font-bold tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                Admin Mode
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Control users, wallets, feature pricing, workspace team seats, payments, and system broadcasts.
            </p>
          </div>
        </div>
        <button className="text-slate-400 hover:text-slate-100 font-extrabold text-xs bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl transition-all">
          {isOpen ? 'Minimize Panel' : 'Expand Command Center'}
        </button>
      </div>

      {isOpen && (
        <div className="p-6 space-y-6 animate-fade-in bg-slate-950/80">
          
          {/* HIGH-LEVEL METRICS OVERVIEW */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">System Users</p>
                <p className="text-lg font-extrabold text-slate-100">{simUsers.length}</p>
              </div>
            </div>
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Total Revenue</p>
                <p className="text-lg font-extrabold text-slate-100">₦30,000</p>
              </div>
            </div>
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Usage Decs</p>
                <p className="text-lg font-extrabold text-slate-100">{consumptionLogs.length} events</p>
              </div>
            </div>
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400">
                <Sliders className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">API limit</p>
                <p className="text-lg font-extrabold text-slate-100">{sysConfig.apiRateLimit}/min</p>
              </div>
            </div>
          </div>

          {/* SYSTEM ADMINISTRATOR SIDE NAVIGATION TABS */}
          <div className="flex flex-wrap gap-1.5 border-b border-slate-900 pb-3 overflow-x-auto">
            <button
              onClick={() => { setActiveSubTab('users'); setIsEditingPack(null); }}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${activeSubTab === 'users' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Users className="h-3.5 w-3.5" /> Manage Users &amp; Wallets
            </button>
            <button
              onClick={() => { setActiveSubTab('workspaces'); setIsEditingPack(null); }}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${activeSubTab === 'workspaces' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Briefcase className="h-3.5 w-3.5" /> Workspace &amp; Team (NEW)
            </button>
            <button
              onClick={() => { setActiveSubTab('revenue'); setIsEditingPack(null); }}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${activeSubTab === 'revenue' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <DollarSign className="h-3.5 w-3.5" /> Payments &amp; Revenue
            </button>
            <button
              onClick={() => { setActiveSubTab('consumption'); setIsEditingPack(null); }}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${activeSubTab === 'consumption' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Activity className="h-3.5 w-3.5" /> Consumption Ledger
            </button>
            <button
              onClick={() => { setActiveSubTab('announcements'); setIsEditingPack(null); }}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${activeSubTab === 'announcements' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Bell className="h-3.5 w-3.5" /> Broadcaster Hub
            </button>
            <button
              onClick={() => { setActiveSubTab('pricing'); setIsEditingPack(null); }}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${activeSubTab === 'pricing' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'}`}
            >
              📊 Feature Pricing
            </button>
            <button
              onClick={() => { setActiveSubTab('packages'); setIsEditingPack(null); }}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${activeSubTab === 'packages' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'}`}
            >
              🎁 Credit Packages
            </button>
            <button
              onClick={() => { setActiveSubTab('settings'); setIsEditingPack(null); }}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${activeSubTab === 'settings' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Sliders className="h-3.5 w-3.5" /> App Config
            </button>
            <button
              onClick={() => { setActiveSubTab('supabase'); setIsEditingPack(null); }}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${activeSubTab === 'supabase' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Database className="h-3.5 w-3.5" /> DB Schema &amp; Engine
            </button>
          </div>

          {/* ==========================================
              TAB 1: USERS & WALLETS
             ========================================== */}
          {activeSubTab === 'users' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search users by name, email or ID..."
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60"
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button 
                    onClick={() => {
                      const id = `user-${Date.now()}`;
                      setSimUsers([...simUsers, {
                        id, name: 'Guest Client Sim', email: `guest-${Math.floor(Math.random() * 900)}@qodex.io`, role: 'Client', isVerified: false, credits: 15, createdAt: new Date().toISOString().substring(0, 10), workspaceCount: 1
                      }]);
                      showToast('Simulated guest client user added!', 'success');
                    }}
                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3 py-2 rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" /> Create Guest User
                  </button>
                </div>
              </div>

              {/* WALLET MANUAL ADJUSTMENT DRAWER */}
              {selectedUserForWallet && (
                <div className="bg-slate-900 border border-indigo-500/20 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in">
                  <div>
                    <h5 className="text-xs font-bold text-indigo-400 flex items-center gap-1.5 uppercase">
                      <CreditCard className="h-4 w-4" /> Override User Balance
                    </h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Adjust wallet credits for user: <span className="text-slate-200 font-semibold">{simUsers.find(u => u.id === selectedUserForWallet)?.name}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-stretch sm:self-auto">
                    <input
                      type="number"
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(parseInt(e.target.value, 10) || 0)}
                      className="w-24 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono text-center font-extrabold"
                    />
                    <button
                      onClick={() => adjustUserCredits(selectedUserForWallet, adjustAmount)}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl"
                    >
                      Credit (+{adjustAmount})
                    </button>
                    <button
                      onClick={() => adjustUserCredits(selectedUserForWallet, -adjustAmount)}
                      className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4 py-2 rounded-xl"
                    >
                      Debit (-{adjustAmount})
                    </button>
                    <button
                      onClick={() => setSelectedUserForWallet(null)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-400 p-2 rounded-xl text-xs"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {/* USERS DATA LIST */}
              <div className="bg-slate-900/30 border border-slate-900 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900/60 border-b border-slate-900 text-slate-400 font-bold">
                      <th className="py-3 px-4">User Details</th>
                      <th className="py-3 px-4">Role / Compliance</th>
                      <th className="py-3 px-4">Wallet Balance</th>
                      <th className="py-3 px-4 text-right">Administrative Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-900/20 transition-all">
                        <td className="py-4 px-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-200">{user.name}</span>
                              {user.isVerified ? (
                                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                  ✓ Verified
                                </span>
                              ) : (
                                <span className="bg-slate-800 text-slate-400 text-[8px] uppercase font-extrabold px-1.5 py-0.5 rounded">
                                  Unverified
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{user.email}</p>
                            <p className="text-[9px] text-slate-500 mt-1">Joined: {user.createdAt} • ID: {user.id}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="space-y-1.5">
                            <select
                              value={user.role}
                              onChange={(e) => updateUserRole(user.id, e.target.value)}
                              className="bg-slate-950 border border-slate-800 text-[10px] text-slate-300 rounded px-1.5 py-1 focus:outline-none focus:border-indigo-500"
                            >
                              <option value="Admin">Admin Owner</option>
                              <option value="Operator">System Operator</option>
                              <option value="Client">General Client</option>
                            </select>
                            <p className="text-[9px] text-slate-400">Domains: {user.workspaceCount} workspaces</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-extrabold text-emerald-400 text-sm">
                              {user.credits}
                            </span>
                            <span className="text-[10px] text-slate-400">credits</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right space-x-1">
                          <button
                            onClick={() => { setSelectedUserForWallet(user.id); setAdjustAmount(20); }}
                            className="bg-slate-950 border border-slate-800 hover:border-slate-700 text-indigo-400 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all"
                          >
                            Adjust Balance
                          </button>
                          <button
                            onClick={() => toggleUserVerification(user.id)}
                            className="bg-slate-950 border border-slate-800 hover:border-slate-700 text-emerald-400 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all"
                          >
                            {user.isVerified ? 'Revoke Verify' : 'Grant Verify'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==========================================
              TAB 2: WORKSPACE & TEAM SEATS (NEW)
             ========================================== */}
          {activeSubTab === 'workspaces' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl">
                <h4 className="text-xs uppercase font-extrabold text-indigo-400 tracking-wider flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4" /> Multi-Tenant Workspace &amp; Team Limits Override
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Enforce strict administrative boundaries on group workspaces. Control absolute member seats limit, override wallets, and transfer owners of workspaces.
                </p>
              </div>

              {/* LIST OF SYSTEM WORKSPACES */}
              <div className="space-y-3">
                {workspaces.map((ws: any) => (
                  <div key={ws.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-950 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-slate-200">{ws.name}</span>
                          <span className="bg-indigo-500/10 text-indigo-400 text-[9px] uppercase font-extrabold tracking-wider border border-indigo-500/10 px-2 py-0.5 rounded">
                            {ws.tier || 'GROWTH'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">Workspace UUID: <strong className="font-mono text-slate-300">{ws.id}</strong></p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block">SHARED WALLET</span>
                          <span className="font-mono font-bold text-sm text-indigo-300">{ws.sharedWalletBalance} credits</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Control 1: Member Seats Limit */}
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">Absolute Seat Capacity</span>
                          <p className="text-xs text-slate-500 mt-0.5">Max staff members permitted</p>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            onClick={() => adjustWorkspaceSeatLimit(ws.id, -1)}
                            className="bg-slate-900 hover:bg-slate-800 text-slate-300 font-extrabold p-1.5 rounded-lg border border-slate-800"
                          >
                            -
                          </button>
                          <span className="font-mono font-bold text-slate-200 text-xs flex-1 text-center">
                            {ws.seatsLimit || 5} Seats limit
                          </span>
                          <button
                            onClick={() => adjustWorkspaceSeatLimit(ws.id, 1)}
                            className="bg-slate-900 hover:bg-slate-800 text-slate-300 font-extrabold p-1.5 rounded-lg border border-slate-800"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Control 2: Direct Credit Overrides */}
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">Inject Workspace Balance</span>
                          <p className="text-xs text-slate-500 mt-0.5">Manual injection override</p>
                        </div>
                        <div className="flex items-center gap-1.5 mt-3">
                          <button
                            onClick={() => adjustWorkspaceWalletBalance(ws.id, 50)}
                            className="flex-1 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 font-bold text-[10px] py-1.5 rounded-lg"
                          >
                            +50 Credits
                          </button>
                          <button
                            onClick={() => adjustWorkspaceWalletBalance(ws.id, -50)}
                            className="flex-1 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 font-bold text-[10px] py-1.5 rounded-lg"
                          >
                            -50 Credits
                          </button>
                        </div>
                      </div>

                      {/* Control 3: Change Owner */}
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">Reassign Owner Profile</span>
                          <p className="text-xs text-slate-500 mt-0.5">Transfer domains &amp; assets</p>
                        </div>
                        <div className="mt-3">
                          <select
                            onChange={(e) => transferWorkspaceOwnership(ws.id, e.target.value)}
                            defaultValue=""
                            className="w-full bg-slate-900 border border-slate-800 text-[10px] text-slate-300 rounded px-2 py-1.5 focus:outline-none"
                          >
                            <option value="" disabled>Select target email...</option>
                            <option value="kunle@yabaspace.ng">Kunle (Admin)</option>
                            <option value="tosin@flutterwave.com">Tosin (Flutterwave)</option>
                            <option value="fatima@kanotech.ng">Fatima (Operator)</option>
                            <option value="kofi@accralabs.io">Kofi (AccraLabs)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==========================================
              TAB 3: REVENUE & PAYMENTS SANDBOX
             ========================================== */}
          {activeSubTab === 'revenue' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center bg-slate-900/40 border border-slate-800 p-4 rounded-2xl">
                <div>
                  <h4 className="text-xs uppercase font-extrabold text-indigo-400 tracking-wider">
                    💳 Payments &amp; Revenue Reconciliation Console
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Process simulated Flutterwave Webhook posts, manage client invoices, and trigger general reports.
                  </p>
                </div>
                <button
                  onClick={generateExecutiveReport}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md"
                >
                  <FileText className="h-4 w-4" /> Run Compliance Report
                </button>
              </div>

              {/* REPORT DISPLAY IF GENERATED */}
              {generatedReport && (
                <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-5 relative animate-fade-in font-mono text-xs">
                  <button 
                    onClick={() => setGeneratedReport(null)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 font-bold"
                  >
                    ✕ Clear Report View
                  </button>
                  <pre className="text-emerald-300 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto pr-2">
                    {generatedReport}
                  </pre>
                  <div className="mt-4 flex gap-2">
                    <button 
                      onClick={() => {
                        const blob = new Blob([generatedReport], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'qodex-ledger-compliance-audit.md';
                        a.click();
                        showToast('Audit log downloaded as markdown!', 'success');
                      }}
                      className="bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                    >
                      <Download className="h-3.5 w-3.5" /> Download audit report (.md)
                    </button>
                  </div>
                </div>
              )}

              {/* SIMULATED WEBHOOK PAYMENTS INFLOW */}
              <div className="bg-slate-900/30 border border-slate-900 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 bg-slate-900/40 border-b border-slate-900 flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Gateway Sandbox Ledger</span>
                  <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-bold font-mono">SIMULATION Webhooks</span>
                </div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-900">
                      <th className="py-2 px-4">Inflow User</th>
                      <th className="py-2 px-4">Amount / Credits</th>
                      <th className="py-2 px-4">Reference &amp; Gateway</th>
                      <th className="py-2 px-4">State</th>
                      <th className="py-2 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {simPayments.map((pay) => (
                      <tr key={pay.id} className="hover:bg-slate-900/10">
                        <td className="py-3 px-4">
                          <div>
                            <span className="font-extrabold text-slate-200">{pay.userName}</span>
                            <span className="block text-[10px] text-slate-400">{pay.email}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <span className="font-mono text-emerald-400 font-bold">{pay.amount}</span>
                            <span className="block text-[10px] text-slate-400">+{pay.creditsAdded} credits</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <span className="font-mono text-slate-300 font-semibold text-[10px]">{pay.ref}</span>
                            <span className="block text-[10px] text-slate-500 font-sans">{pay.gateway}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${pay.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : pay.status === 'Declined' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                            {pay.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1">
                          {pay.status === 'Pending Approval' && (
                            <>
                              <button
                                onClick={() => approveSimulatedPayment(pay.id)}
                                className="bg-emerald-500 text-slate-950 text-[10px] font-bold px-2.5 py-1 rounded"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => declineSimulatedPayment(pay.id)}
                                className="bg-rose-600 text-white text-[10px] font-bold px-2.5 py-1 rounded"
                              >
                                Decline
                              </button>
                            </>
                          )}
                          {pay.status === 'Approved' && (
                            <span className="text-[10px] text-slate-500 italic">Reconciled</span>
                          )}
                          {pay.status === 'Declined' && (
                            <span className="text-[10px] text-slate-500 line-through">Failed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==========================================
              TAB 4: CREDIT CONSUMPTION AUDIT
             ========================================== */}
          {activeSubTab === 'consumption' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h4 className="text-xs uppercase font-extrabold text-indigo-400 tracking-wider">
                    ⚡ Live Credit Consumption Ledger &amp; Analytics
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Audit real-time platform overhead. Watch debits occur as users execute dynamic campaign redirects, WIFI styling configs, and bulk imports.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setConsumptionLogs([]);
                    showToast('Platform consumption log buffer cleared!', 'info');
                  }}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-xl"
                >
                  Clear Log Buffer
                </button>
              </div>

              {/* STATIC SVG BAR CHART RECONCILIATION */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">7-Day Platform Credit Debits Profile</span>
                  <p className="text-[9px] text-slate-500">Peak hour activity distribution chart</p>
                </div>
                <div className="h-28 w-full flex items-end gap-3 pt-4 border-b border-slate-800 pb-2">
                  <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <div className="w-full bg-indigo-500/20 hover:bg-indigo-500/40 border-t-2 border-indigo-500 rounded-t h-[40%] transition-all"></div>
                    <span className="text-[8px] text-slate-500 font-mono">MON</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <div className="w-full bg-indigo-500/20 hover:bg-indigo-500/40 border-t-2 border-indigo-500 rounded-t h-[65%] transition-all"></div>
                    <span className="text-[8px] text-slate-500 font-mono">TUE</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <div className="w-full bg-indigo-500/20 hover:bg-indigo-500/40 border-t-2 border-indigo-500 rounded-t h-[85%] transition-all"></div>
                    <span className="text-[8px] text-slate-500 font-mono">WED</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <div className="w-full bg-emerald-500/20 hover:bg-emerald-500/40 border-t-2 border-emerald-500 rounded-t h-[95%] transition-all"></div>
                    <span className="text-[8px] text-slate-400 font-extrabold font-mono">THU (Peak)</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <div className="w-full bg-indigo-500/20 hover:bg-indigo-500/40 border-t-2 border-indigo-500 rounded-t h-[55%] transition-all"></div>
                    <span className="text-[8px] text-slate-500 font-mono">FRI</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <div className="w-full bg-indigo-500/20 hover:bg-indigo-500/40 border-t-2 border-indigo-500 rounded-t h-[30%] transition-all"></div>
                    <span className="text-[8px] text-slate-500 font-mono">SAT</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <div className="w-full bg-indigo-500/20 hover:bg-indigo-500/40 border-t-2 border-indigo-500 rounded-t h-[20%] transition-all"></div>
                    <span className="text-[8px] text-slate-500 font-mono">SUN</span>
                  </div>
                </div>
              </div>

              {/* TIMELINE LIST */}
              <div className="space-y-2">
                {consumptionLogs.map((logItem) => (
                  <div key={logItem.id} className="bg-slate-900/40 border border-slate-900 rounded-xl p-3 flex justify-between items-center gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">
                        <Activity className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-200 text-xs block">{logItem.feature}</span>
                        <span className="text-[10px] text-slate-400">{logItem.userEmail} • Ref: <strong className="font-mono text-slate-500">{logItem.reference}</strong></span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-rose-400 text-xs block">-{logItem.creditsSpent} credits</span>
                      <span className="text-[9px] text-slate-500 font-mono">{logItem.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==========================================
              TAB 5: SYSTEM BROADCASTER HUB
             ========================================== */}
          {activeSubTab === 'announcements' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl">
                <h4 className="text-xs uppercase font-extrabold text-indigo-400 tracking-wider">
                  📢 Global App Banner Announcement controller
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Inject warning alerts, release logs, and scheduled maintenance schedules. This announcement mounts automatically at the very top of all active user frames and persists inside standard cookie storage.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Announcement Editor */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wider">Draft Alert Payload</span>
                  
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1">Alert Level Urgency</label>
                    <div className="flex gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-900">
                      <button
                        onClick={() => setAnnouncementUrgency('info')}
                        className={`flex-1 px-3 py-1.5 text-[10px] rounded-lg font-bold transition-all ${announcementUrgency === 'info' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        Info (Blue)
                      </button>
                      <button
                        onClick={() => setAnnouncementUrgency('warning')}
                        className={`flex-1 px-3 py-1.5 text-[10px] rounded-lg font-bold transition-all ${announcementUrgency === 'warning' ? 'bg-amber-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        Warning (Amber)
                      </button>
                      <button
                        onClick={() => setAnnouncementUrgency('urgent')}
                        className={`flex-1 px-3 py-1.5 text-[10px] rounded-lg font-bold transition-all ${announcementUrgency === 'urgent' ? 'bg-rose-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        Urgent (Red)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1">Message Content</label>
                    <textarea
                      rows={3}
                      value={announcementText}
                      onChange={(e) => setAnnouncementText(e.target.value)}
                      placeholder="e.g. Flutterwave Nigeria gateway is undergoing standard compliance adjustments. Card transactions will reroute dynamically via backup channels."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handlePublishAnnouncement}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md"
                    >
                      Publish Broadcast Banner
                    </button>
                    <button
                      onClick={handleClearAnnouncement}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
                    >
                      Clear Banner
                    </button>
                  </div>
                </div>

                {/* Real-time Preview Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wider mb-3">Live Active Preview</span>
                    
                    {announcement ? (
                      <div className="border border-indigo-500/30 rounded-xl overflow-hidden shadow-lg bg-slate-950">
                        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white text-[11px] py-2 px-3 font-semibold flex justify-between items-center">
                          <span>{announcement}</span>
                        </div>
                        <div className="p-4 text-xs text-slate-400">
                          This banner is currently <strong className="text-emerald-400">LIVE</strong> and visible to all clients of the Qodex application in real-time.
                        </div>
                      </div>
                    ) : (
                      <div className="border border-dashed border-slate-800 rounded-xl p-8 text-center text-xs text-slate-500">
                        No active system-wide broadcast active.
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-500 border-t border-slate-950 pt-3">
                    Broadcasting triggers responsive client websocket simulations and is safe for high-frequency runtime usage.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              TAB 6: FEATURE PRICING COSTS
             ========================================== */}
          {activeSubTab === 'pricing' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl">
                <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Configure Micro-Billing Policies</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Set wallet credit deduction costs triggered by dynamic campaign actions. Changes apply globally.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {featurePricing.map((item) => (
                  <div key={item.id} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex justify-between items-center gap-4 hover:border-slate-700 transition-all">
                    <div>
                      <span className="text-xs font-extrabold text-slate-200">{item.featureName}</span>
                      <p className="text-[10px] text-slate-500 mt-1 max-w-xs">{item.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {editingFeatureId === item.id ? (
                        <>
                          <input
                            type="number"
                            value={editingCost}
                            onChange={(e) => setEditingCost(Math.max(0, parseInt(e.target.value, 10) || 0))}
                            className="w-16 bg-slate-950 border border-indigo-500/50 rounded px-2 py-1 text-xs text-slate-200 font-mono text-center font-bold"
                            focus-id={`cost-edit-${item.id}`}
                          />
                          <button
                            onClick={() => handleSaveFeaturePricing(item.id)}
                            className="bg-emerald-500 text-slate-950 p-1.5 rounded hover:bg-emerald-400"
                            title="Save"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingFeatureId(null)}
                            className="bg-slate-800 text-slate-400 p-1.5 rounded hover:text-slate-100"
                            title="Cancel"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="bg-slate-950 border border-slate-900 px-3 py-1.5 rounded-xl text-center">
                            <span className="font-mono font-extrabold text-sm text-indigo-400">{item.creditsCost}</span>
                            <span className="text-[9px] text-slate-500 block">credits</span>
                          </div>
                          <button
                            onClick={() => {
                              setEditingFeatureId(item.id);
                              setEditingCost(item.creditsCost);
                            }}
                            className="bg-slate-950 border border-slate-800 p-2 rounded-xl text-slate-400 hover:text-slate-100"
                            title="Edit cost"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==========================================
              TAB 7: CREDIT PACKAGES LIST & EDIT
             ========================================== */}
          {activeSubTab === 'packages' && (
            <div className="space-y-6 animate-fade-in">
              {isEditingPack === null ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Configured Store Packages</span>
                    <button
                      onClick={() => handleOpenPackForm()}
                      className="bg-emerald-500 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md hover:bg-emerald-400"
                    >
                      <Plus className="h-4 w-4" /> Create Custom Package
                    </button>
                  </div>

                  <div className="space-y-3">
                    {packages.map((pack) => (
                      <div 
                        key={pack.id} 
                        className={`bg-slate-900/60 border rounded-2xl p-4 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${pack.isEnabled ? 'border-slate-800/80' : 'border-dashed border-rose-950/40 opacity-60'}`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-extrabold text-slate-100">{pack.name}</span>
                            {pack.badge && (
                              <span className="bg-indigo-500/10 text-indigo-400 text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded">
                                {pack.badge}
                              </span>
                            )}
                            {!pack.isEnabled && (
                              <span className="bg-rose-500/10 text-rose-400 text-[9px] uppercase font-bold px-2 py-0.5 rounded">
                                Disabled
                              </span>
                            )}
                          </div>
                          <div className="flex gap-4 text-xs font-mono text-slate-400">
                            <span>Credits: <strong className="text-emerald-400 font-bold">{pack.credits}</strong></span>
                            <span>₦{pack.priceNGN.toLocaleString()}</span>
                            <span>KSh {pack.priceKES.toLocaleString()}</span>
                            <span>${pack.priceUSD}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 truncate max-w-lg mt-1">
                            Features: {pack.features.join(' • ')}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
                          <button
                            onClick={() => togglePackage(pack.id)}
                            className="bg-slate-950 border border-slate-800 p-2 rounded-xl text-slate-400 hover:text-slate-100 transition-colors"
                            title={pack.isEnabled ? 'Disable Package' : 'Enable Package'}
                          >
                            {pack.isEnabled ? (
                              <ToggleRight className="h-5 w-5 text-emerald-400" />
                            ) : (
                              <ToggleLeft className="h-5 w-5 text-slate-500" />
                            )}
                          </button>
                          <button
                            onClick={() => handleOpenPackForm(pack)}
                            className="bg-slate-950 border border-slate-800 p-2 rounded-xl text-slate-400 hover:text-slate-100 transition-colors"
                            title="Edit details"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePackage(pack.id, pack.name)}
                            className="bg-slate-950 border border-rose-950/80 p-2 rounded-xl text-slate-500 hover:text-rose-400 transition-colors"
                            title="Delete Pack"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* EDIT PACKAGE FORM */
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 animate-fade-in">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-extrabold text-slate-200 uppercase tracking-wide">
                      {isEditingPack === 'new' ? 'Create New Package' : `Edit Package: ${packName}`}
                    </h4>
                    <button
                      onClick={() => setIsEditingPack(null)}
                      className="text-slate-400 hover:text-slate-100 text-xs font-bold"
                    >
                      ✕ Cancel Form
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">Package Display Name</label>
                      <input
                        type="text"
                        value={packName}
                        onChange={(e) => setPackName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-semibold focus:border-indigo-500 focus:outline-none"
                        placeholder="e.g. Agency Pro Boost"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">Granting Credits Amount</label>
                      <input
                        type="number"
                        value={packCredits}
                        onChange={(e) => setPackCredits(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">Price NGN (₦)</label>
                      <input
                        type="number"
                        value={packPriceNGN}
                        onChange={(e) => setPackPriceNGN(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">Price KES (KSh)</label>
                      <input
                        type="number"
                        value={packPriceKES}
                        onChange={(e) => setPackPriceKES(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">Price USD ($)</label>
                      <input
                        type="number"
                        value={packPriceUSD}
                        onChange={(e) => setPackPriceUSD(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">Ribbon Badge (Optional)</label>
                      <input
                        type="text"
                        value={packBadge}
                        onChange={(e) => setPackBadge(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                        placeholder="e.g. Best Value, Hot"
                      />
                    </div>
                  </div>

                  {/* PACKAGE BENEFIT POINTS */}
                  <div className="space-y-2">
                    <span className="block text-[10px] text-slate-400 font-bold">Package Benefit Points list</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newFeatureText}
                        onChange={(e) => setNewFeatureText(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                        placeholder="Add new benefit sentence..."
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFeatureItem(); } }}
                      />
                      <button
                        type="button"
                        onClick={addFeatureItem}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 rounded-xl"
                      >
                        Add Item
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {packFeatures.map((feat, idx) => (
                        <div key={idx} className="bg-slate-950 border border-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                          <span>{feat}</span>
                          <button
                            type="button"
                            onClick={() => removeFeatureItem(idx)}
                            className="text-slate-500 hover:text-rose-400 font-bold"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3">
                    <button
                      onClick={() => setIsEditingPack(null)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSavePackage}
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold px-6 py-2 rounded-xl text-xs shadow-md"
                    >
                      Save Pack Config
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==========================================
              TAB 8: APP SYSTEM SETTINGS
             ========================================== */}
          {activeSubTab === 'settings' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl">
                <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Operational App Settings</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Toggle maintenance mode blockades and standard threshold limits.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wider">Security &amp; Gatekeeping</span>
                  
                  <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">System Maintenance Mode</span>
                      <p className="text-[10px] text-slate-500">Block core QR editing pipelines temporarily</p>
                    </div>
                    <button
                      onClick={() => {
                        setSysConfig({ ...sysConfig, maintenanceMode: !sysConfig.maintenanceMode });
                        showToast(`Maintenance mode ${!sysConfig.maintenanceMode ? 'ENABLED' : 'DISABLED'}`, 'info');
                      }}
                      className="text-indigo-400"
                    >
                      {sysConfig.maintenanceMode ? (
                        <ToggleRight className="h-7 w-7 text-rose-500" />
                      ) : (
                        <ToggleLeft className="h-7 w-7 text-slate-600" />
                      )}
                    </button>
                  </div>

                  <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">Lock Guest Registration</span>
                      <p className="text-[10px] text-slate-500">Only authorized white-labeled emails can join</p>
                    </div>
                    <button
                      onClick={() => {
                        setSysConfig({ ...sysConfig, disableRegistration: !sysConfig.disableRegistration });
                        showToast(`Guest Registration lock toggled.`, 'info');
                      }}
                      className="text-indigo-400"
                    >
                      {sysConfig.disableRegistration ? (
                        <ToggleRight className="h-7 w-7 text-rose-500" />
                      ) : (
                        <ToggleLeft className="h-7 w-7 text-slate-600" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wider">Limits &amp; Schedules</span>
                  
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1">Standard API Ingestion limit ({sysConfig.apiRateLimit} req/min)</label>
                    <input
                      type="range"
                      min={30}
                      max={500}
                      value={sysConfig.apiRateLimit}
                      onChange={(e) => setSysConfig({ ...sysConfig, apiRateLimit: parseInt(e.target.value, 10) })}
                      className="w-full accent-indigo-500 bg-slate-950 rounded-lg appearance-none h-1.5"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1">Platform DB Automated Backups</label>
                    <select
                      value={sysConfig.dbBackupSchedule}
                      onChange={(e) => setSysConfig({ ...sysConfig, dbBackupSchedule: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Hourly">Hourly Incremental Backup (Amazon S3 GLOW)</option>
                      <option value="Daily">Daily Snapshot Sync (GCP Coldline)</option>
                      <option value="Weekly">Weekly Cold-Vault Archive (Supabase Internal)</option>
                    </select>
                  </div>

                  <button
                    onClick={() => showToast('Operational thresholds updated successfully!', 'success')}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs py-2 rounded-xl transition-all shadow"
                  >
                    Save App Operational Limits
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              TAB 9: SUPABASE DATABASE EXPLORER
             ========================================== */}
          {activeSubTab === 'supabase' && (
            <div className="space-y-6">
              
              {/* TRANSACTION WORKFLOW SIMULATOR */}
              <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h4 className="text-xs uppercase font-extrabold text-indigo-400 flex items-center gap-1.5 tracking-wider">
                      <Terminal className="h-4 w-4" /> Postgres Atomic Wallet Transaction Simulator
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-1">
                      See how Row Level Security (RLS) is validated and how race conditions are prevented during credit deductions using Postgres transaction locking.
                    </p>
                  </div>
                  
                  {/* SCENARIO PICKER */}
                  <div className="flex gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-900 self-stretch sm:self-auto">
                    <button
                      onClick={() => setSimScenario('deduction')}
                      className={`px-3 py-1 text-[10px] rounded-lg font-bold transition-all flex-1 sm:flex-initial ${simScenario === 'deduction' ? 'bg-indigo-600 text-slate-50' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      Usage Deduction
                    </button>
                    <button
                      onClick={() => setSimScenario('purchase')}
                      className={`px-3 py-1 text-[10px] rounded-lg font-bold transition-all flex-1 sm:flex-initial ${simScenario === 'purchase' ? 'bg-indigo-600 text-slate-50' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      Credit Purchase
                    </button>
                    <button
                      onClick={() => setSimScenario('race_condition')}
                      className={`px-3 py-1 text-[10px] rounded-lg font-bold transition-all flex-1 sm:flex-initial ${simScenario === 'race_condition' ? 'bg-indigo-600 text-slate-50' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      Prevent Race Condition
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {/* LEFT SIM CONTROL */}
                  <div className="md:col-span-2 bg-slate-950 border border-slate-900 p-4 rounded-xl flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <span className="text-[9px] uppercase font-bold text-indigo-400 tracking-wider">Active Scenario Target</span>
                      <h5 className="text-xs font-bold text-slate-200">
                        {simScenario === 'deduction' && 'Subtract credits safely via row locking'}
                        {simScenario === 'purchase' && 'Flutterwave payment callback credit injection'}
                        {simScenario === 'race_condition' && 'Dual concurrency race condition lock conflict'}
                      </h5>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        {simScenario === 'deduction' && 'A user updates a dynamic short-link. We run a SELECT FOR UPDATE statement to lock the client’s wallet row first, ensuring that another concurrent task doesn\'t result in double-spending or negative wallet states.'}
                        {simScenario === 'purchase' && 'Inflow API triggers webhook credit replenishment. Balance is locking-updated safely to reflect a newly verified cash transaction ledger item.'}
                        {simScenario === 'race_condition' && 'Triggers two competing virtual servers updating the exact same credit wallet simultaneously. Standard transactions block each other correctly in a serial line.'}
                      </p>
                    </div>

                    <button
                      onClick={runTransactionSimulation}
                      disabled={isSimulating}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-slate-50 font-bold text-xs py-2 rounded-lg flex items-center justify-center gap-1.5"
                    >
                      {isSimulating ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" /> SIMULATING WORKFLOW...
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5" /> Execute Postgres Query
                        </>
                      )}
                    </button>
                  </div>

                  {/* RIGHT TERMINAL SCREEN */}
                  <div className="md:col-span-3 bg-slate-950 rounded-xl p-4 border border-slate-900 font-mono text-[11px] text-slate-300 space-y-2 relative shadow-inner">
                    <div className="absolute top-2.5 right-3 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-[8px] text-slate-500 tracking-wider">LOCAL REPLICA LIVE</span>
                    </div>
                    
                    <div className="text-[10px] text-indigo-500 border-b border-slate-900 pb-1.5 font-bold uppercase tracking-widest">
                      Postgres Transaction logs output
                    </div>

                    <div className="space-y-1 overflow-y-auto max-h-40 pr-2">
                      {terminalLogs.map((logLine, index) => (
                        <p key={index} className={logLine.includes('committed') || logLine.includes('committed') || logLine.includes('committed') ? 'text-emerald-400' : logLine.includes('⚡') ? 'text-indigo-400' : 'text-slate-300'}>
                          {logLine}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* TABLE CONFIGS LIST & SCHEMAS */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Tables List */}
                <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-4">
                  <span className="block text-[10px] uppercase font-extrabold tracking-wider text-slate-500 mb-2 px-1">Supabase DB Tables index</span>
                  <div className="space-y-1">
                    {SUPABASE_SCHEMA_TABLES.map((tbl) => (
                      <button
                        key={tbl.name}
                        onClick={() => setSelectedTableName(tbl.name)}
                        className={`w-full text-left p-2 rounded-xl transition-all border flex items-center justify-between ${selectedTableName === tbl.name ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-400 font-bold' : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'}`}
                      >
                        <span className="text-xs truncate">table {tbl.name}</span>
                        <ChevronRight className="h-3 w-3 opacity-60" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* SQL Code details */}
                <div className="md:col-span-3 bg-slate-900/30 border border-slate-900 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-900 pb-3">
                    <div>
                      <h5 className="text-xs font-bold text-slate-200 font-mono">table {selectedTable.name}</h5>
                      <p className="text-[10px] text-slate-400 mt-0.5">{selectedTable.description}</p>
                    </div>

                    {/* DDL vs RLS Toggle */}
                    <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-900 self-stretch sm:self-auto text-[10px]">
                      <button
                        onClick={() => setShowDdlType('ddl')}
                        className={`px-3 py-1 rounded-lg font-bold transition-all ${showDdlType === 'ddl' ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        Table DDL Schema
                      </button>
                      <button
                        onClick={() => setShowDdlType('rls')}
                        className={`px-3 py-1 rounded-lg font-bold transition-all ${showDdlType === 'rls' ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        Row-Level Security Policies (RLS)
                      </button>
                    </div>
                  </div>

                  <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-900 p-4">
                    <pre className="text-[10px] text-slate-300 overflow-x-auto font-mono leading-relaxed whitespace-pre font-medium">
                      {showDdlType === 'ddl' ? selectedTable.ddl : selectedTable.rls}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
