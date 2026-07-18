import React, { useState, useEffect } from 'react';
import { User, UserRole, TeamInvitation, WorkspaceRole } from '../types';
import { 
  Mail, 
  Lock, 
  User as UserIcon, 
  Shield, 
  ArrowRight, 
  Key, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  Smartphone, 
  UserPlus, 
  ChevronRight, 
  RefreshCw, 
  Check, 
  ExternalLink,
  ShieldAlert,
  Info,
  HelpCircle,
  Clock
} from 'lucide-react';

interface AuthPanelProps {
  user: User | null;
  onLogin: (user: User) => void;
  onSignup: (name: string, email: string, role: UserRole) => User;
  onLogout: () => void;
  onVerify: () => void;
  onResetPassword: (email: string, newPass: string) => void;
  invitations: TeamInvitation[];
  onAcceptInvitation: (token: string) => void;
  showToast: (message: string, type: 'success' | 'info' | 'error') => void;
}

export default function AuthPanel({
  user,
  onLogin,
  onSignup,
  onLogout,
  onVerify,
  onResetPassword,
  invitations,
  onAcceptInvitation,
  showToast
}: AuthPanelProps) {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot' | 'reset' | 'verify'>('login');
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('Admin');
  const [verificationCode, setVerificationCode] = useState('');
  
  // Reset Password State
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  // Simulation Inbox State (tactile & interactive)
  const [inboxEmails, setInboxEmails] = useState<{
    id: string;
    subject: string;
    body: string;
    type: 'verification' | 'reset' | 'invitation';
    payload: any;
    date: string;
  }[]>([]);

  // Password strength checker for register
  const [passwordStrength, setPasswordStrength] = useState(0);
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }
    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    setPasswordStrength(strength);
  }, [password]);

  // If user is logged in but not verified, force verify tab
  useEffect(() => {
    if (user && !user.isVerified) {
      setAuthMode('verify');
    } else if (user && user.isVerified) {
      setAuthMode('login'); // Safe fallback or UI will hide AuthPanel
    }
  }, [user]);

  // Trigger Google Login simulation
  const handleGoogleLogin = () => {
    showToast('Redirecting to Google Account Choice...', 'info');
    setTimeout(() => {
      // Simulate Google Account choice
      const googleUser: User = {
        id: `usr-g-${Math.floor(Math.random() * 900000)}`,
        name: 'Olumide Johnson',
        email: 'olumide@google-tester.com',
        role: 'Admin',
        isVerified: true,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
        createdAt: new Date().toISOString()
      };
      onLogin(googleUser);
      showToast(`Logged in successfully via Google as ${googleUser.name}!`, 'success');
    }, 1200);
  };

  // Submit standard login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showToast('Please provide both email and password.', 'error');
      return;
    }

    if (password.length < 5) {
      showToast('Password must be at least 5 characters.', 'error');
      return;
    }

    // Standard credential checking simulation
    const mockUser: User = {
      id: `usr-${Math.floor(Math.random() * 100000)}`,
      name: email.split('@')[0].toUpperCase(),
      email: email,
      role: email.toLowerCase().includes('admin') ? 'Admin' : 'Operator',
      isVerified: true,
      createdAt: new Date().toISOString()
    };
    onLogin(mockUser);
    showToast(`Logged in as ${mockUser.name}!`, 'success');
  };

  // Submit standard registration (starts unverified)
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      showToast('All fields are required.', 'error');
      return;
    }

    const newUser = onSignup(name, email, selectedRole);
    
    // Simulate sending email verification
    const simEmail = {
      id: `mail-${Date.now()}`,
      subject: 'Verify your Qodex Account Email Address',
      body: `Hi ${name},\n\nThank you for signing up for Qodex. To verify your email address, please use the code below or click the verification link.\n\nCode: QDX-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'verification' as const,
      payload: { email },
      date: new Date().toLocaleTimeString()
    };
    
    setInboxEmails(prev => [simEmail, ...prev]);
    showToast(`Account registered! Verification email sent to ${email}.`, 'info');
    setAuthMode('verify');
  };

  // Forgot password flow
  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      showToast('Please enter your email.', 'error');
      return;
    }

    const simEmail = {
      id: `mail-${Date.now()}`,
      subject: 'Reset your Qodex Account Password',
      body: `Hi,\n\nWe received a request to reset your password. Click the link below to set a new password on your account.`,
      type: 'reset' as const,
      payload: { email: resetEmail },
      date: new Date().toLocaleTimeString()
    };

    setInboxEmails(prev => [simEmail, ...prev]);
    showToast(`Password reset link simulated and sent to ${resetEmail}!`, 'success');
  };

  // Confirm password reset
  const handleConfirmReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    if (newPassword.length < 5) {
      showToast('Password must be at least 5 characters.', 'error');
      return;
    }

    onResetPassword(resetEmail, newPassword);
    setAuthMode('login');
    showToast('Password successfully reset! Please log in.', 'success');
  };

  // Verify code submit
  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) {
      showToast('Please enter verification code.', 'error');
      return;
    }
    onVerify();
    showToast('Your email is now verified! Welcome to Qodex.', 'success');
    setAuthMode('login');
  };

  // Instant simulate verification via inbox
  const triggerInstantVerify = () => {
    onVerify();
    showToast('Email verified successfully via interactive simulator link!', 'success');
    setAuthMode('login');
  };

  // Trigger instant password reset set-tab via inbox
  const triggerPasswordResetForm = (emailAddress: string) => {
    setResetEmail(emailAddress);
    setAuthMode('reset');
    showToast('Simulating secure reset URL endpoint. Enter new password below.', 'info');
  };

  // Pull active workspace invitations to show them on register/login screen
  useEffect(() => {
    if (invitations.length > 0) {
      const lastInvite = invitations[0];
      const hasMail = inboxEmails.some(m => m.payload?.token === lastInvite.token);
      if (!hasMail) {
        setInboxEmails(prev => [{
          id: `mail-${lastInvite.id}`,
          subject: `Invitation to join team workspace "${lastInvite.workspaceName}"`,
          body: `Hi ${lastInvite.name},\n\nYou have been invited to join the "${lastInvite.workspaceName}" workspace as a ${lastInvite.role}.\n\nClick below to accept this invitation instantly.`,
          type: 'invitation',
          payload: { token: lastInvite.token, workspaceName: lastInvite.workspaceName, role: lastInvite.role },
          date: new Date().toLocaleTimeString()
        }, ...prev]);
      }
    }
  }, [invitations]);

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      
      {/* AUTH CARD */}
      <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-500/5 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 h-32 w-32 bg-emerald-500/5 rounded-full blur-2xl"></div>
        
        {/* LOGO & TITLE */}
        <div className="text-center mb-6">
          <div className="inline-flex h-10 w-10 bg-indigo-600/10 text-indigo-400 items-center justify-center rounded-xl mb-3">
            <Shield className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">Qodex Gatekeeper Auth</h2>
          <p className="text-slate-500 text-xs mt-1">
            Access secure dashboard, workspaces, analytics and payments
          </p>
        </div>

        {/* MODE: LOGIN */}
        {authMode === 'login' && !user && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="kunle@yabaspace.ng (type admin in email for admin role)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] uppercase font-bold text-slate-500">Password</label>
                  <button 
                    type="button" 
                    onClick={() => setAuthMode('forgot')} 
                    className="text-[10px] text-indigo-400 hover:underline font-bold"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-3 rounded-2xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20"
            >
              Log In to My Qodex Account <ArrowRight className="h-4 w-4" />
            </button>

            <div className="relative my-6 flex items-center justify-center text-xs">
              <div className="absolute w-full border-t border-slate-900"></div>
              <span className="relative bg-slate-950 px-3 text-slate-500 font-bold uppercase text-[9px] tracking-wider">Or continue with</span>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2"
            >
              <span className="text-rose-500 font-black">G</span> Log In with Google Account
            </button>

            <p className="text-center text-[11px] text-slate-500 mt-4">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className="text-indigo-400 hover:underline font-bold"
              >
                Create Account
              </button>
            </p>
          </form>
        )}

        {/* MODE: REGISTER */}
        {authMode === 'register' && !user && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Kunle Adeleke"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="kunle@yabaspace.ng"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Password strength meter */}
                {password && (
                  <div className="mt-2 space-y-1">
                    <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${passwordStrength <= 25 ? 'bg-rose-500' : passwordStrength <= 50 ? 'bg-amber-500' : passwordStrength <= 75 ? 'bg-yellow-400' : 'bg-emerald-500'}`}
                        style={{ width: `${passwordStrength}%` }}
                      ></div>
                    </div>
                    <span className="text-[9px] text-slate-500 block">
                      Strength:{' '}
                      <span className={`font-bold ${passwordStrength <= 25 ? 'text-rose-500' : passwordStrength <= 50 ? 'text-amber-500' : passwordStrength <= 75 ? 'text-yellow-400' : 'text-emerald-500'}`}>
                        {passwordStrength <= 25 ? 'Weak' : passwordStrength <= 50 ? 'Fair' : passwordStrength <= 75 ? 'Good' : 'Strong & Compliant'}
                      </span>
                    </span>
                  </div>
                )}
              </div>

              {/* CHOOSE SIMULATED ADMIN/USER ROLE */}
              <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-850 space-y-2">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5 text-emerald-400" /> Register Starter Admin Role
                </span>
                <p className="text-[10px] text-slate-500">
                  Choose your account clearance clearance level to test access control rules and secure panels instantly.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                  {(['Admin', 'Operator', 'Collaborator', 'Guest'] as UserRole[]).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSelectedRole(role)}
                      className={`py-1.5 rounded-lg text-[9px] font-extrabold uppercase transition-all border ${selectedRole === role ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/40' : 'bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-400'}`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-3 rounded-2xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/10"
            >
              Create Account (Unverified) <ArrowRight className="h-4 w-4" />
            </button>

            <p className="text-center text-[11px] text-slate-500 mt-4">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="text-indigo-400 hover:underline font-bold"
              >
                Log In
              </button>
            </p>
          </form>
        )}

        {/* MODE: FORGOT PASSWORD */}
        {authMode === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed mb-4 text-center">
              Enter your registered email address below. We will simulate a secure reset token delivered straight to your local interactive inbox.
            </p>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="kunle@yabaspace.ng"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-3 rounded-2xl text-xs transition-all"
            >
              Send Interactive Password Reset Link
            </button>

            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 font-bold py-2.5 rounded-xl text-xs transition-all"
            >
              Return to Login Screen
            </button>
          </form>
        )}

        {/* MODE: RESET NEW PASSWORD */}
        {authMode === 'reset' && (
          <form onSubmit={handleConfirmReset} className="space-y-4">
            <div className="text-center mb-4">
              <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Token Verified</span>
              <p className="text-xs text-slate-400 mt-2">Setting new password for account: <b>{resetEmail}</b></p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="Enter new secure password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="Confirm new password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3 rounded-2xl text-xs transition-all"
            >
              Overwrite Password &amp; Update Account
            </button>
          </form>
        )}

        {/* MODE: EMAIL VERIFICATION (Locked) */}
        {authMode === 'verify' && user && (
          <div className="space-y-5">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-slate-200">Email Verification Pending</h4>
                <p className="text-[10px] text-slate-400 leading-normal mt-1">
                  Thank you, <b>{user.name}</b>. Your account is registered under <b>{user.email}</b>, but you must verify your email address to unlock standard QR generation workspace permissions.
                </p>
              </div>
            </div>

            <form onSubmit={handleVerifySubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Verification OTP Code</label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="QDX-1234 or verify in mock inbox below"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500 text-center font-mono tracking-widest text-indigo-300 font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-2.5 rounded-xl text-xs transition-all"
              >
                Verify Code &amp; Launch Workspace
              </button>
            </form>

            <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1">
              <span>Didn't receive email?</span>
              <button 
                type="button" 
                onClick={() => {
                  showToast('Simulated verification code re-sent!', 'info');
                  setInboxEmails(prev => [{
                    id: `mail-${Date.now()}`,
                    subject: 'Verify your Qodex Account (Resent)',
                    body: `Hi ${user.name},\n\nWe resent your verification link. Use code: QDX-${Math.floor(1000 + Math.random() * 9000)} to unlock account.`,
                    type: 'verification',
                    payload: { email: user.email },
                    date: new Date().toLocaleTimeString()
                  }, ...prev]);
                }} 
                className="text-indigo-400 hover:underline font-bold"
              >
                Resend Code
              </button>
            </div>

            <div className="border-t border-slate-900 pt-3">
              <button
                type="button"
                onClick={onLogout}
                className="w-full bg-slate-900 hover:bg-slate-850 text-slate-400 font-bold py-2 rounded-xl text-[10px] transition-all"
              >
                Logout of Unverified Account
              </button>
            </div>
          </div>
        )}

      </div>

      {/* TACTILE INTERACTIVE INBOX SIMULATOR (Great for sandbox validation!) */}
      <div className="bg-slate-950 border border-slate-900 rounded-3xl p-5 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-900 pb-2">
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <Mail className="h-4 w-4 text-indigo-400 animate-pulse" />
              {inboxEmails.length > 0 && (
                <span className="absolute -top-1 -right-1 h-1.5 w-1.5 bg-rose-500 rounded-full"></span>
              )}
            </div>
            <h3 className="text-[11px] uppercase font-extrabold tracking-wider text-slate-300">
              Interactive Email Simulator
            </h3>
          </div>
          <span className="text-[9px] bg-slate-900 px-2 py-0.5 rounded text-indigo-300 font-mono">
            SMTP Sandbox
          </span>
        </div>

        <p className="text-[10px] text-slate-400 leading-relaxed">
          This simulated local inbox captures outgoing verification links, password resets, and teammate invites. Click directly on the action buttons inside these logs to simulate a real user's email client clicks!
        </p>

        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
          {inboxEmails.length === 0 ? (
            <div className="py-6 text-center text-slate-600 text-xs">
              <Clock className="h-5 w-5 text-slate-700 mx-auto mb-1" />
              Inbox empty. Register, request reset, or invite teammate to test outgoing mail.
            </div>
          ) : (
            inboxEmails.map((mail) => (
              <div 
                key={mail.id} 
                className="bg-slate-900/40 border border-slate-900/80 rounded-2xl p-3.5 space-y-3 hover:border-slate-800 transition-all text-xs"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-500 block">{mail.date} • System Dispatcher</span>
                    <h5 className="font-bold text-slate-200">{mail.subject}</h5>
                  </div>
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase ${mail.type === 'verification' ? 'bg-indigo-500/10 text-indigo-300' : mail.type === 'reset' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'}`}>
                    {mail.type}
                  </span>
                </div>

                <p className="text-[10px] text-slate-400 font-mono bg-slate-950/60 p-2.5 rounded-lg border border-slate-900 leading-normal whitespace-pre-wrap">
                  {mail.body}
                </p>

                {/* TACTILE EMAIL CLICKS */}
                <div className="flex justify-end pt-1">
                  {mail.type === 'verification' && (
                    <button
                      type="button"
                      onClick={triggerInstantVerify}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-wider flex items-center gap-1 transition-all"
                    >
                      <Check className="h-3 w-3" /> Simulate Click: Confirm Verification URL
                    </button>
                  )}
                  {mail.type === 'reset' && (
                    <button
                      type="button"
                      onClick={() => triggerPasswordResetForm(mail.payload.email)}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-wider flex items-center gap-1 transition-all"
                    >
                      <ExternalLink className="h-3 w-3" /> Simulate Click: Reset Password URL
                    </button>
                  )}
                  {mail.type === 'invitation' && (
                    <button
                      type="button"
                      onClick={() => {
                        onAcceptInvitation(mail.payload.token);
                        // Clear invite mail to avoid double clicks
                        setInboxEmails(prev => prev.filter(m => m.id !== mail.id));
                      }}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-wider flex items-center gap-1 transition-all"
                    >
                      <UserPlus className="h-3 w-3" /> Simulate Click: Join Workspace Team
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
