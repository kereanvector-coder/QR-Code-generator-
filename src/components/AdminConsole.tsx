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
  UserCheck
} from 'lucide-react';

interface AdminConsoleProps {
  featurePricing: FeaturePricing[];
  setFeaturePricing: React.Dispatch<React.SetStateAction<FeaturePricing[]>>;
  packages: CreditPackage[];
  setPackages: React.Dispatch<React.SetStateAction<CreditPackage[]>>;
  showToast: (message: string, type: 'success' | 'info' | 'error') => void;
  credits?: number;
  setCredits?: React.Dispatch<React.SetStateAction<number>>;
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
    description: 'Many-to-many relationship mapping QR codes to specific folders.',
    ddl: `CREATE TABLE qr_folders (
  qr_id UUID REFERENCES qr_codes(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  PRIMARY KEY (qr_id, folder_id)
);`,
    rls: `-- Shared team validation link logic
ALTER TABLE qr_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace team can manage QR folder links" ON qr_folders
  USING (
    EXISTS (
      SELECT 1 FROM folders
      JOIN workspace_members ON workspace_members.workspace_id = folders.workspace_id
      WHERE folders.id = qr_folders.folder_id
      AND workspace_members.user_id = auth.uid()
    )
  );`
  },
  {
    name: 'wallets',
    description: 'Atomic pay-as-you-go token ledger containing current balances.',
    ddl: `CREATE TABLE wallets (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  balance INTEGER NOT NULL DEFAULT 15 CHECK (balance >= 0),
  total_purchased INTEGER NOT NULL DEFAULT 0,
  total_used INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT clock_timestamp()
);`,
    rls: `-- Strictly user-level reads; updates managed securely via transactions
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read own wallet balance" ON wallets
  FOR SELECT USING (auth.uid() = user_id);`
  },
  {
    name: 'wallet_transactions',
    description: 'Complete audit logs of every credit debit and credit purchase.',
    ddl: `CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'usage', 'refund', 'bonus', 'expiration', 'manual')),
  amount INTEGER NOT NULL, -- Negative for depletions, positive for grants
  expires_at TIMESTAMPTZ, -- Nullable expiration for bonus credits
  created_at TIMESTAMPTZ DEFAULT clock_timestamp()
);`,
    rls: `-- Audit readability for users
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own transaction logs" ON wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);`
  },
  {
    name: 'credit_packages',
    description: 'Packages catalog table available for funding purchase.',
    ddl: `CREATE TABLE credit_packages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price_ngn INTEGER NOT NULL,
  price_kes INTEGER NOT NULL,
  price_usd NUMERIC(6,2) NOT NULL,
  badge TEXT,
  is_enabled BOOLEAN DEFAULT true
);`,
    rls: `-- Public read, admin write
ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active store packages" ON credit_packages
  FOR SELECT USING (is_enabled = true);`
  },
  {
    name: 'feature_pricing',
    description: 'Pay-as-you-go credit price rate list per premium capability.',
    ddl: `CREATE TABLE feature_pricing (
  id TEXT PRIMARY KEY,
  feature_name TEXT NOT NULL,
  credits_cost INTEGER NOT NULL,
  description TEXT
);`,
    rls: `-- Public read, admin write
ALTER TABLE feature_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read feature token cost list" ON feature_pricing
  FOR SELECT USING (true);`
  },
  {
    name: 'payments',
    description: 'Transaction invoice tracking table.',
    ddl: `CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  package_id TEXT REFERENCES credit_packages(id),
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL, -- 'pending', 'successful', 'failed'
  reference TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT clock_timestamp()
);`,
    rls: `-- User readability, secure updates
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own invoice records" ON payments
  FOR SELECT USING (auth.uid() = user_id);`
  },
  {
    name: 'payment_webhooks',
    description: 'Webhooks verification records to handle idempotent payments processing.',
    ddl: `CREATE TABLE payment_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway TEXT NOT NULL, -- 'Paystack' or 'Flutterwave'
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT clock_timestamp()
);`,
    rls: `-- Restrict access completely to admin or backend server roles
ALTER TABLE payment_webhooks ENABLE ROW LEVEL SECURITY;`
  },
  {
    name: 'api_keys',
    description: 'Developer workspace API tokens for automated programmatic QR creation.',
    ddl: `CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  label TEXT DEFAULT 'Default Key',
  created_at TIMESTAMPTZ DEFAULT clock_timestamp()
);`,
    rls: `-- Only developers can manage their key credentials
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Manage personal developer keys" ON api_keys
  USING (auth.uid() = user_id);`
  },
  {
    name: 'notifications',
    description: 'Real-time notifications sent to workspaces.',
    ddl: `CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT clock_timestamp()
);`,
    rls: `-- User self-read and delete policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read and write own notification alerts" ON notifications
  USING (auth.uid() = user_id);`
  },
  {
    name: 'activity_logs',
    description: 'Workspace-level historical records of general activities.',
    ddl: `CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT clock_timestamp()
);`,
    rls: `-- Read access for workspace members
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view activity trails" ON activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = activity_logs.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );`
  },
  {
    name: 'workspaces',
    description: 'Logical organization units supporting teams and agency hierarchies.',
    ddl: `CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  shared_wallet_balance INTEGER DEFAULT 15 CHECK (shared_wallet_balance >= 0),
  created_at TIMESTAMPTZ DEFAULT clock_timestamp()
);`,
    rls: `-- Read/write controls based on member validation
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view workspaces" ON workspaces
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
    description: 'Roles mapping users to distinct workspaces.',
    ddl: `CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('Owner', 'Admin', 'Operator', 'Viewer')),
  joined_at TIMESTAMPTZ DEFAULT clock_timestamp()
);`,
    rls: `-- General workspace security rules
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View team list if member of workspace" ON workspace_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members AS self
      WHERE self.workspace_id = workspace_members.workspace_id
      AND self.user_id = auth.uid()
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
  onAddTransaction
}: AdminConsoleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'pricing' | 'packages' | 'supabase'>('supabase');

  // Package Form state
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

  // Add package feature item
  const addFeatureItem = () => {
    if (newFeatureText.trim()) {
      setPackFeatures([...packFeatures, newFeatureText.trim()]);
      setNewFeatureText('');
    }
  };

  // Delete package feature item
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
          setTerminalLogs(prev => [...prev, text]);
          resolve();
        }, delay);
      });
    };

    if (simScenario === 'purchase') {
      await log('qodex_db=> BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;', 200);
      await log('qodex_db=> INSERT INTO payments (user_id, package_id, amount, currency, status, reference)', 400);
      await log("           VALUES ('usr-kunle', 'pack-starter', 5000.00, 'NGN', 'successful', 'REF_SIM_776');", 200);
      await log('INSERT 0 1', 100);
      await log('qodex_db=> -- Acquire exclusive lock on user wallet to prevent parallel mutations', 300);
      await log("qodex_db=> SELECT balance FROM wallets WHERE user_id = 'usr-kunle' FOR UPDATE;", 400);
      await log(`[ROW LOCK ACQUIRED] Current balance read: ${credits} Credits`, 100);
      await log("qodex_db=> INSERT INTO wallet_transactions (user_id, type, amount, created_at)", 300);
      await log("           VALUES ('usr-kunle', 'purchase', 20, NOW());", 200);
      await log('INSERT 0 1', 100);
      await log('qodex_db=> UPDATE wallets', 300);
      await log('           SET balance = balance + 20, total_purchased = total_purchased + 20, updated_at = NOW()', 200);
      await log("           WHERE user_id = 'usr-kunle';", 100);
      await log('UPDATE 1', 100);
      await log('qodex_db=> COMMIT;', 400);
      await log('[TRANSACTION SUCCESSFUL] Exclusive locks released cleanly.', 100);
      await log(`[SYNC STATE] +20 credits added to user wallet balance!`, 100);

      // Mutate App State to keep real values synced!
      if (setCredits) setCredits(prev => prev + 20);
      if (onAddTransaction) {
        onAddTransaction(
          'Simulated Pro Starter Purchase (Atomic DB Tx)',
          'TXN-SIM-' + Math.floor(1000 + Math.random() * 9000),
          '₦5,000.00',
          '+20 Credits'
        );
      }
      showToast('Database transaction committed! +20 Credits synced.', 'success');

    } else if (simScenario === 'deduction') {
      const neededCredits = 1;
      await log('qodex_db=> BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;', 200);
      await log('qodex_db=> -- Acquire exclusive FOR UPDATE lock immediately to serialize checks', 300);
      await log("qodex_db=> SELECT balance FROM wallets WHERE user_id = 'usr-kunle' FOR UPDATE;", 400);
      await log(`[ROW LOCK ACQUIRED] Current balance: ${credits} Credits`, 100);

      if (credits < neededCredits) {
        await log(`[ERROR] balance (${credits}) < required (${neededCredits}). Constraint failed.`, 300);
        await log('qodex_db=> ROLLBACK;', 200);
        await log('[TRANSACTION ABORTED] Database state unchanged.', 100);
        showToast('Simulation Aborted: Insufficient credits to perform transaction!', 'error');
      } else {
        await log("qodex_db=> INSERT INTO wallet_transactions (user_id, type, amount, created_at)", 300);
        await log(`           VALUES ('usr-kunle', 'usage', -1, NOW());`, 200);
        await log('INSERT 0 1', 100);
        await log('qodex_db=> UPDATE wallets', 300);
        await log('           SET balance = balance - 1, total_used = total_used + 1, updated_at = NOW()', 200);
        await log("           WHERE user_id = 'usr-kunle';", 100);
        await log('UPDATE 1', 100);
        await log('qodex_db=> COMMIT;', 400);
        await log('[TRANSACTION SUCCESSFUL] Credit consumed and balance decremented.', 100);

        if (setCredits) setCredits(prev => Math.max(0, prev - 1));
        if (onAddTransaction) {
          onAddTransaction(
            'Simulated Premium QR Download (Atomic DB Tx)',
            'TXN-SIM-' + Math.floor(1000 + Math.random() * 9000),
            '0.00',
            '-1 Credit'
          );
        }
        showToast('Database transaction committed! -1 Credit consumed.', 'success');
      }

    } else if (simScenario === 'race_condition') {
      await log('=== CONCURRENT RACE CONDITION PREVENTION SIMULATOR ===', 100);
      await log('[T1] Flutterwave Webhook Request A received - trying to deduct 1 Credit', 200);
      await log('[T2] Programmatic API Client B received - trying to deduct 1 Credit', 200);
      await log(`[DB] Initial state in wallets: balance = ${credits}`, 100);
      await log('', 50);

      await log('[Tx A] Starts: BEGIN;', 200);
      await log('[Tx B] Starts: BEGIN;', 200);
      await log("[Tx A] Runs: SELECT balance FROM wallets WHERE user_id = 'usr-kunle' FOR UPDATE;", 300);
      await log(`[Tx A] Row Locked! Reads balance = ${credits}.`, 100);
      await log('', 50);

      await log("[Tx B] Runs: SELECT balance FROM wallets WHERE user_id = 'usr-kunle' FOR UPDATE;", 300);
      await log('[Tx B] STATUS: [BLOCKED] Waiting on exclusive row lock of Tx A...', 400);
      await log('', 50);

      if (credits < 1) {
        await log('[Tx A] balance is 0. Aborts with insufficient credits.', 300);
        await log('[Tx A] Runs: ROLLBACK;', 200);
        await log('[Tx A] Finished. Row lock released.', 100);
        await log('', 50);

        await log('[Tx B] STATUS: [RESUMED] Acquired lock released by Tx A.', 300);
        await log(`[Tx B] Reads balance = ${credits}.`, 100);
        await log('[Tx B] balance is 0. Aborts with insufficient credits.', 300);
        await log('[Tx B] Runs: ROLLBACK;', 100);
        await log('[DB] State preserved correctly.', 100);
        showToast('Race condition prevented. Both concurrent requests failed safely.', 'info');
      } else {
        await log('[Tx A] Processes deduction: UPDATE wallets SET balance = balance - 1;', 300);
        await log('[Tx A] Runs: COMMIT;', 200);
        await log('[Tx A] Completed. Lock released.', 100);
        await log('', 100);

        await log('[Tx B] STATUS: [RESUMED] Acquired row lock! Resumes processing.', 300);
        await log(`[Tx B] Reads updated balance from MVCC: balance = ${credits - 1}`, 200);
        
        if (credits - 1 < 1) {
          await log('[Tx B] balance is now 0. Aborting safely to prevent negative balance!', 300);
          await log('[Tx B] Runs: ROLLBACK;', 100);
          await log('[DB] Final State in Database: balance = ' + (credits - 1) + '. No negative balance occurred!', 100);
          if (setCredits) setCredits(credits - 1);
          showToast('Race condition prevented! Trans B rolled back safely.', 'success');
        } else {
          await log('[Tx B] Processes deduction: UPDATE wallets SET balance = balance - 1;', 300);
          await log('[Tx B] Runs: COMMIT;', 200);
          await log('[Tx B] Completed. Lock released.', 100);
          await log('[DB] Both requests processed chronologically. New balance = ' + (credits - 2), 100);
          if (setCredits) setCredits(credits - 2);
          showToast('Both transactions serialized and completed successfully!', 'success');
        }
      }
    }

    setIsSimulating(false);
  };

  const selectedTable = SUPABASE_SCHEMA_TABLES.find(t => t.name === selectedTableName) || SUPABASE_SCHEMA_TABLES[0];

  return (
    <div id="admin-panel-container" className="bg-slate-950 border border-slate-900 rounded-3xl overflow-hidden mt-8">
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
              System Admin &amp; Database Console
              <span className="text-[9px] uppercase font-bold tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                Admin Mode
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Analyze schema structures, configure core credit policies, and simulate atomic concurrent wallet transaction logs.
            </p>
          </div>
        </div>
        <button className="text-slate-400 hover:text-slate-100 font-extrabold text-xs bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl transition-all">
          {isOpen ? 'Close Console' : 'Open Admin Panel'}
        </button>
      </div>

      {isOpen && (
        <div className="p-6 space-y-6 animate-fade-in bg-slate-950/80">
          {/* CONSOLE NAVIGATION */}
          <div className="flex flex-wrap gap-2 border-b border-slate-900 pb-3">
            <button
              onClick={() => { setActiveSubTab('supabase'); setIsEditingPack(null); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeSubTab === 'supabase' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Database className="h-3.5 w-3.5" /> Supabase Database Schema ({SUPABASE_SCHEMA_TABLES.length} Tables)
            </button>
            <button
              onClick={() => { setActiveSubTab('pricing'); setIsEditingPack(null); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeSubTab === 'pricing' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'}`}
            >
              📊 Feature Pricing Costs
            </button>
            <button
              onClick={() => setActiveSubTab('packages')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeSubTab === 'packages' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'}`}
            >
              🎁 Manage Credit Packages ({packages.length})
            </button>
          </div>

          {/* TAB: SUPABASE DATABASE */}
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

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* SIMULATOR CONTROLS */}
                  <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
                    <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 space-y-2.5">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Target Table:</span>
                        <span className="font-mono text-emerald-400 font-bold">wallets, wallet_transactions</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Current Balance:</span>
                        <span className="font-mono text-indigo-400 font-extrabold bg-indigo-500/10 px-2 py-0.5 rounded-full">{credits} Credits</span>
                      </div>
                      
                      <div className="border-t border-slate-900/80 pt-2.5 mt-1.5">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Scenario Mechanics</span>
                        <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                          {simScenario === 'deduction' && "Acquires exclusive row lock via SELECT FOR UPDATE, checks if balance >= 1, writes a ledger log, updates 'wallets' table, and commits. Prevents overdrawn balances."}
                          {simScenario === 'purchase' && "Atomic transaction that processes Flutterwave/Paystack checkout payloads, creates a successful record in payment ledger, acquires FOR UPDATE row locks, and increments credits."}
                          {simScenario === 'race_condition' && "Simulates 2 parallel requests trying to spend credits at the exact same millisecond. Proves how Postgres exclusive locks serialize checks, completely preventing balance race slips."}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={runTransactionSimulation}
                      disabled={isSimulating}
                      className="w-full bg-gradient-to-r from-emerald-500 to-indigo-600 text-slate-950 hover:text-slate-50 font-black py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md border border-emerald-400/20"
                    >
                      {isSimulating ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" /> Executing Transaction...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" /> Execute SQL Transaction
                        </>
                      )}
                    </button>
                  </div>

                  {/* TERMINAL OUTPUT */}
                  <div className="lg:col-span-7 bg-slate-950 border border-slate-900 rounded-xl p-4 font-mono text-[10px] text-indigo-300 space-y-1.5 min-h-[160px] max-h-[220px] overflow-y-auto">
                    {terminalLogs.map((logStr, i) => (
                      <div key={i} className={`leading-relaxed whitespace-pre-wrap ${logStr.startsWith('[ERROR]') ? 'text-rose-500 font-bold' : logStr.startsWith('[SUCCESS]') || logStr.includes('SUCCESSFUL') ? 'text-emerald-400 font-bold' : logStr.includes('qodex_db') ? 'text-slate-300' : 'text-slate-400'}`}>
                        {logStr}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* TABLE LIST & DEFINITIONS */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* LEFT: TABLE INDEX */}
                <div className="md:col-span-4 bg-slate-950 border border-slate-900 rounded-2xl p-4 space-y-2 max-h-[420px] overflow-y-auto">
                  <span className="block text-[10px] uppercase font-extrabold tracking-wider text-slate-500 mb-2 px-1">Supabase DB Tables index</span>
                  
                  {SUPABASE_SCHEMA_TABLES.map((tbl) => (
                    <button
                      key={tbl.name}
                      onClick={() => setSelectedTableName(tbl.name)}
                      className={`w-full text-left p-2 rounded-xl transition-all border flex items-center justify-between ${selectedTableName === tbl.name ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-400' : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'}`}
                    >
                      <div className="truncate pr-2">
                        <span className="text-xs font-mono font-bold block">{tbl.name}</span>
                        <span className="text-[9px] text-slate-500 truncate block mt-0.5">{tbl.description}</span>
                      </div>
                      <ChevronRight className="h-3 w-3 text-slate-600 shrink-0" />
                    </button>
                  ))}
                </div>

                {/* RIGHT: DDL & RLS VIEW */}
                <div className="md:col-span-8 bg-slate-900/30 border border-slate-900 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                    <div>
                      <h5 className="text-xs font-bold text-slate-200 font-mono">table {selectedTable.name}</h5>
                      <p className="text-[10px] text-slate-400 mt-0.5">{selectedTable.description}</p>
                    </div>

                    <div className="flex bg-slate-950 border border-slate-900 p-0.5 rounded-lg">
                      <button
                        onClick={() => setShowDdlType('ddl')}
                        className={`px-2.5 py-1 text-[9px] font-bold uppercase rounded-md transition-all ${showDdlType === 'ddl' ? 'bg-slate-800 text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        SQL DDL
                      </button>
                      <button
                        onClick={() => setShowDdlType('rls')}
                        className={`px-2.5 py-1 text-[9px] font-bold uppercase rounded-md transition-all ${showDdlType === 'rls' ? 'bg-slate-800 text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        RLS Policies
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <pre className="bg-slate-950 border border-slate-900 rounded-xl p-4 text-[10px] font-mono text-slate-300 overflow-x-auto whitespace-pre leading-relaxed">
                      <code>
                        {showDdlType === 'ddl' ? selectedTable.ddl : selectedTable.rls}
                      </code>
                    </pre>

                    <span className="absolute top-3 right-3 text-[8px] font-mono tracking-widest text-slate-600 bg-slate-900 px-2 py-0.5 rounded uppercase">
                      Postgres 16
                    </span>
                  </div>

                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-900/60 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-emerald-400 shrink-0 animate-pulse" />
                    <span className="text-[9.5px] text-slate-400 leading-normal">
                      Security Check: Row-Level Security (RLS) is <strong className="text-emerald-400">ENABLED</strong> on this table to reject unauthorized client requests automatically.
                    </span>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB: FEATURE PRICING */}
          {activeSubTab === 'pricing' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 bg-indigo-500/5 border border-indigo-500/10 p-3 rounded-2xl">
                <AlertCircle className="h-4 w-4 text-indigo-400 shrink-0" />
                <p className="text-[11px] text-slate-400">
                  Feature consumption pricing is stored in database schema equivalents. Updates take effect immediately for standard/dynamic campaigns, watermark removals, and format exports.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {featurePricing.map((item) => (
                  <div key={item.id} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-200 block">{item.featureName}</span>
                      <p className="text-[10px] text-slate-400 leading-normal">{item.description}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {editingFeatureId === item.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={0}
                            max={50}
                            value={editingCost}
                            onChange={(e) => setEditingCost(Math.max(0, parseInt(e.target.value, 10) || 0))}
                            className="w-16 bg-slate-950 border border-slate-700 rounded-lg text-center py-1 text-xs text-indigo-300 font-mono font-bold"
                          />
                          <button
                            onClick={() => handleSaveFeaturePricing(item.id)}
                            className="bg-emerald-500 text-slate-950 p-1.5 rounded-lg font-bold"
                            title="Save"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingFeatureId(null)}
                            className="bg-slate-800 text-slate-400 p-1.5 rounded-lg"
                            title="Cancel"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-center min-w-[70px]">
                            <span className="text-xs font-black text-emerald-400 font-mono">{item.creditsCost}</span>
                            <span className="text-[9px] text-slate-500 font-bold block">Credits</span>
                          </div>
                          <button
                            onClick={() => {
                              setEditingFeatureId(item.id);
                              setEditingCost(item.creditsCost);
                            }}
                            className="text-slate-400 hover:text-slate-100 p-1.5 bg-slate-800/50 rounded-xl border border-slate-800 transition-colors"
                            title="Edit cost"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: CREDIT PACKAGES LIST & EDIT */}
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

                  {/* PACKAGE FEATURE POINTS */}
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
        </div>
      )}
    </div>
  );
}
