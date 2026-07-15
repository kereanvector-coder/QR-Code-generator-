import React, { useState } from 'react';
import { Workspace, WorkspaceMember, WorkspaceRole, Folder, Campaign, User, TeamInvitation } from '../types';
import { 
  Users, 
  Plus, 
  FolderPlus, 
  Folder as FolderIcon,
  Crown, 
  Trash2, 
  UserPlus, 
  Briefcase, 
  Check, 
  Sparkles, 
  ShieldAlert,
  Info,
  Layers,
  ChevronRight,
  Eye,
  PenTool,
  Send,
  Mail,
  ExternalLink
} from 'lucide-react';

interface TeamWorkspacePanelProps {
  workspaces: Workspace[];
  setWorkspaces: React.Dispatch<React.SetStateAction<Workspace[]>>;
  activeWorkspaceId: string;
  setActiveWorkspaceId: (id: string) => void;
  folders: Folder[];
  setFolders: React.Dispatch<React.SetStateAction<Folder[]>>;
  campaigns: Campaign[];
  setCampaigns: React.Dispatch<React.SetStateAction<Campaign[]>>;
  showToast: (message: string, type: 'success' | 'info' | 'error') => void;
  credits: number;
  setCredits: (credits: number) => void;
  currentUser: User | null;
  invitations: TeamInvitation[];
  setInvitations: React.Dispatch<React.SetStateAction<TeamInvitation[]>>;
  onAcceptInvitation: (token: string) => void;
}

export default function TeamWorkspacePanel({
  workspaces,
  setWorkspaces,
  activeWorkspaceId,
  setActiveWorkspaceId,
  folders,
  setFolders,
  campaigns,
  setCampaigns,
  showToast,
  credits,
  setCredits,
  currentUser,
  invitations,
  setInvitations,
  onAcceptInvitation
}: TeamWorkspacePanelProps) {
  // Workspace UI states
  const [newWsName, setNewWsName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>('Editor');
  
  // Folder UI states
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');

  // Get active workspace details
  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0];
  
  // Check user role in active workspace
  const currentUserMember = currentUser 
    ? activeWorkspace.members.find(m => m.email.toLowerCase() === currentUser.email.toLowerCase() || m.id === currentUser.id)
    : undefined;
  
  const userRole: WorkspaceRole | 'Guest' = currentUserMember 
    ? currentUserMember.role 
    : (activeWorkspace.ownerId === currentUser?.id ? 'Owner' : 'Viewer');

  // Get folders for active workspace
  const activeFolders = folders.filter(f => f.workspaceId === activeWorkspaceId);

  // 1. Create Workspace
  const handleCreateWorkspace = () => {
    if (!newWsName.trim()) {
      showToast('Please specify a workspace name.', 'error');
      return;
    }
    const newWs: Workspace = {
      id: `ws-${Date.now()}`,
      name: newWsName,
      ownerId: 'user-kunle',
      isPersonal: false,
      sharedWalletBalance: 50, // Starts with 50 credits loaded as promo
      members: [
        { id: 'user-kunle', name: 'Kunle Adeleke', email: 'kunle@yabaspace.ng', role: 'Owner', joinedAt: new Date().toISOString().split('T')[0] }
      ],
      whiteLabelEnabled: false,
      maxSeats: 5
    };

    setWorkspaces([...workspaces, newWs]);
    setActiveWorkspaceId(newWs.id);
    setNewWsName('');
    showToast(`Workspace "${newWs.name}" created! Loaded 50 promo credits.`, 'success');
  };

  // 2. Invite Team Member (Seat management)
  const handleInviteMember = () => {
    if (userRole !== 'Owner') {
      showToast('Only the Owner can invite or manage seats.', 'error');
      return;
    }
    if (!inviteName.trim() || !inviteEmail.trim()) {
      showToast('Please provide both name and email.', 'error');
      return;
    }
    if (activeWorkspace.members.length >= activeWorkspace.maxSeats) {
      showToast(`Seat limit reached (${activeWorkspace.maxSeats} max seats). Upgrade workspace or remove other members first.`, 'error');
      return;
    }

    const invitationToken = `invite-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newInvitation: TeamInvitation = {
      id: `inv-${Date.now()}`,
      email: inviteEmail.trim(),
      name: inviteName.trim(),
      workspaceId: activeWorkspaceId,
      workspaceName: activeWorkspace.name,
      role: inviteRole,
      token: invitationToken,
      status: 'PENDING',
      invitedAt: new Date().toISOString().split('T')[0]
    };

    setInvitations(prev => [...prev, newInvitation]);

    setInviteName('');
    setInviteEmail('');
    showToast(`Successfully dispatched pending invitation to ${inviteName}! Link sent to local Interactive Inbox simulator.`, 'success');
  };

  // 3. Remove Member
  const handleRemoveMember = (memberId: string, name: string) => {
    if (userRole !== 'Owner') {
      showToast('Only the Owner can remove team members.', 'error');
      return;
    }
    if (memberId === currentUser?.id || memberId === 'user-kunle') {
      showToast('You cannot remove yourself (the Owner) from the workspace.', 'error');
      return;
    }

    setWorkspaces(prev => prev.map(w => {
      if (w.id === activeWorkspaceId) {
        return {
          ...w,
          members: w.members.filter(m => m.id !== memberId)
        };
      }
      return w;
    }));

    showToast(`Removed member ${name} from workspace.`, 'info');
  };

  // 4. Create Folder (Authorized: Owner and Editor)
  const handleCreateFolder = () => {
    if (userRole === 'Viewer') {
      showToast('Viewers are read-only and cannot create folders.', 'error');
      return;
    }
    if (!newFolderName.trim()) {
      showToast('Please enter a folder name.', 'error');
      return;
    }

    const newFolder: Folder = {
      id: `folder-${Date.now()}`,
      workspaceId: activeWorkspaceId,
      name: newFolderName,
      created: new Date().toISOString().split('T')[0],
      description: newFolderDesc || undefined
    };

    setFolders([...folders, newFolder]);
    setNewFolderName('');
    setNewFolderDesc('');
    showToast(`Folder "${newFolder.name}" created!`, 'success');
  };

  // 5. Delete Folder
  const handleDeleteFolder = (folderId: string, folderName: string) => {
    if (userRole === 'Viewer') {
      showToast('Viewers cannot delete folders.', 'error');
      return;
    }

    setFolders(prev => prev.filter(f => f.id !== folderId));
    // Remove categorization from campaigns in this folder
    setCampaigns(prev => prev.map(c => {
      if (c.folderId === folderId) {
        return { ...c, folderId: undefined };
      }
      return c;
    }));

    showToast(`Folder "${folderName}" deleted. Associated campaigns moved to root.`, 'info');
  };

  // 6. Toggle White-Label Branding
  const handleToggleWhiteLabel = () => {
    if (userRole !== 'Owner') {
      showToast('Only the Owner can configure White-Label branding settings.', 'error');
      return;
    }

    setWorkspaces(prev => prev.map(w => {
      if (w.id === activeWorkspaceId) {
        const nextState = !w.whiteLabelEnabled;
        showToast(nextState ? 'White-Label Branding activated! Qodex trademark removed from downloads.' : 'White-Label Branding disabled.', 'success');
        return {
          ...w,
          whiteLabelEnabled: nextState
        };
      }
      return w;
    }));
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* SECTION: SWITCHER & OVERVIEW */}
      <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Multi-Seat Team Workspaces</span>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            Active Workspace: <span className="text-indigo-400 font-extrabold">{activeWorkspace.name}</span>
          </h2>
          <p className="text-slate-400 text-xs max-w-2xl">
            Create independent agency workspaces to manage separate customer folders, invite designers/marketers, share a unified credit balance wallet, and enable brand white-labeling.
          </p>
        </div>

        {/* WORKSPACE DROPDOWN SWITCHER */}
        <div className="flex flex-col sm:flex-row gap-3 self-stretch lg:self-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2">
            <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">Switch Workspace</span>
            <select
              value={activeWorkspaceId}
              onChange={(e) => {
                const selected = e.target.value;
                setActiveWorkspaceId(selected);
                const selectedWs = workspaces.find(w => w.id === selected);
                if (selectedWs) {
                  // Sync root credits with active workspace's wallet balance
                  setCredits(selectedWs.sharedWalletBalance);
                  showToast(`Switched workspace to: ${selectedWs.name}`, 'info');
                }
              }}
              className="bg-transparent text-slate-200 text-xs font-bold outline-none cursor-pointer mt-0.5"
            >
              {workspaces.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name} {w.isPersonal ? '(Personal)' : '(Shared Wallet)'}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5 flex items-center gap-3">
            <Briefcase className="h-5 w-5 text-indigo-400 shrink-0" />
            <div className="text-xs">
              <span className="text-slate-500 font-bold block text-[9px] uppercase">My Workspace Role</span>
              <span className={`font-black uppercase tracking-wider text-[10px] ${userRole === 'Owner' ? 'text-amber-400' : (userRole === 'Editor' ? 'text-emerald-400' : 'text-slate-400')}`}>
                👑 {userRole}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* THREE COLUMNS: MEMBERS, FOLDERS, CONFIGS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COL 1: SEATS & TEAM MEMBERS (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-950 border border-slate-900 rounded-3xl p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-900 pb-3">
            <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-400" />
              Workspace Seats ({activeWorkspace.members.length} / {activeWorkspace.maxSeats})
            </h3>
            <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-400 font-mono">
              Shared Wallet
            </span>
          </div>

          {/* MEMBER LIST */}
          <div className="space-y-3.5">
            {activeWorkspace.members.map((member) => (
              <div key={member.id} className="flex justify-between items-center bg-slate-900/40 border border-slate-900 rounded-2xl p-3.5 hover:border-slate-800 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${member.role === 'Owner' ? 'bg-amber-500/15 text-amber-400' : (member.role === 'Editor' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-500/15 text-slate-400')}`}>
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-200">{member.name}</span>
                      {member.role === 'Owner' && <Crown className="h-3 w-3 text-amber-400" />}
                    </div>
                    <span className="text-[10px] text-slate-500 block">{member.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${member.role === 'Owner' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : (member.role === 'Editor' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-800')}`}>
                    {member.role}
                  </span>
                  
                  {userRole === 'Owner' && member.id !== 'user-kunle' && (
                    <button
                      onClick={() => handleRemoveMember(member.id, member.name)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-all"
                      title="Revoke Seat Access"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* PENDING INVITATIONS LIST */}
          {invitations.filter(inv => inv.workspaceId === activeWorkspaceId && inv.status === 'PENDING').length > 0 && (
            <div className="pt-4 border-t border-slate-900 space-y-2">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-amber-500 flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" /> Sent Invitations (Pending Link Accept)
              </span>
              <div className="space-y-2 text-left">
                {invitations.filter(inv => inv.workspaceId === activeWorkspaceId && inv.status === 'PENDING').map((invite) => (
                  <div key={invite.id} className="bg-slate-900/60 border border-slate-900 rounded-2xl p-3 flex justify-between items-center hover:border-slate-850 transition-all">
                    <div>
                      <div className="text-xs font-bold text-slate-200">{invite.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{invite.email}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8px] uppercase font-black px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {invite.role}
                      </span>
                      <button
                        onClick={() => onAcceptInvitation(invite.token)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold p-1.5 rounded-lg text-[9px] uppercase tracking-wider flex items-center gap-0.5 transition-all"
                        title="Simulate recipient clicking 'Accept Invitation' URL"
                      >
                        <Check className="h-3 w-3" /> Join
                      </button>
                      <button
                        onClick={() => {
                          setInvitations(prev => prev.filter(inv => inv.id !== invite.id));
                          showToast(`Revoked invitation for ${invite.name}.`, 'info');
                        }}
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-all"
                        title="Cancel Invitation"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* INVITE SEAT FORM */}
          {userRole === 'Owner' && !activeWorkspace.isPersonal && (
            <div className="bg-slate-900/60 border border-slate-850/80 p-4 rounded-2xl space-y-3.5">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 flex items-center gap-1">
                <UserPlus className="h-3 w-3 text-indigo-400" /> Allocate Shared Seat
              </span>
              
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Seat Member Full Name"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
                />
                <input
                  type="email"
                  placeholder="Workspace Email Address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
                />

                <div className="flex gap-2">
                  <span className="text-[10px] text-slate-500 flex items-center font-bold">Select Role:</span>
                  {(['Editor', 'Viewer'] as WorkspaceRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setInviteRole(r)}
                      className={`px-3 py-1 rounded text-[10px] font-bold transition-all border ${inviteRole === r ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/40' : 'bg-transparent border-slate-800 text-slate-400'}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleInviteMember}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-1"
              >
                Allocate Workspace Seat
              </button>
            </div>
          )}
        </div>

        {/* COL 2: SHARED CAMPAIGN FOLDERS (4 Cols) */}
        <div className="lg:col-span-4 bg-slate-950 border border-slate-900 rounded-3xl p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-900 pb-3">
            <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider flex items-center gap-2">
              <FolderIcon className="h-4 w-4 text-indigo-400" />
              Shared Folder Structure
            </h3>
            <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-400 font-mono">
              Organizers
            </span>
          </div>

          {/* FOLDERS LIST */}
          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {activeFolders.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                <FolderIcon className="h-8 w-8 text-slate-700 mx-auto mb-2" />
                No folders in this workspace.
              </div>
            ) : (
              activeFolders.map((fold) => {
                const count = campaigns.filter(c => c.folderId === fold.id).length;
                return (
                  <div key={fold.id} className="flex justify-between items-center bg-slate-900/30 hover:bg-slate-900/60 p-3 rounded-xl border border-slate-900 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <FolderIcon className="h-4 w-4 text-amber-500" />
                      <div>
                        <span className="text-xs font-bold text-slate-300 block">{fold.name}</span>
                        <span className="text-[9px] text-slate-500 block">{count} active QR campaigns</span>
                      </div>
                    </div>
                    
                    {userRole !== 'Viewer' && (
                      <button
                        onClick={() => handleDeleteFolder(fold.id, fold.name)}
                        className="text-slate-600 hover:text-rose-400 p-1 rounded hover:bg-slate-950 transition-colors"
                        title="Delete folder"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* CREATE FOLDER FORM */}
          {userRole !== 'Viewer' && (
            <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-2xl space-y-3">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 flex items-center gap-1">
                <FolderPlus className="h-3 w-3 text-emerald-400" /> Create Shared Folder
              </span>

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Folder Name (e.g., Q3 Promos)"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Optional brief description"
                  value={newFolderDesc}
                  onChange={(e) => setNewFolderDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                />
              </div>

              <button
                onClick={handleCreateFolder}
                className="w-full bg-emerald-500 text-slate-950 font-bold py-2 rounded-xl text-xs hover:bg-emerald-400 transition-all"
              >
                Create Shared Folder
              </button>
            </div>
          )}
        </div>

        {/* COL 3: WHITE LABEL & NEW WORKSPACE CREATOR (3 Cols) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* WHITE LABEL CARD */}
          <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 space-y-4">
            <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider border-b border-slate-900 pb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              White-Label Export Option
            </h3>
            
            <p className="text-[11px] text-slate-400 leading-normal">
              Completely strip Qodex branding, trademarks, or references from all exported high-resolution PNGs, vector SVGs, and dynamic short URLs redirection pages.
            </p>

            <div className="bg-slate-900/60 border border-slate-850 p-3 rounded-2xl flex justify-between items-center gap-3">
              <div>
                <span className="text-[11px] font-bold text-slate-200 block">White Label Brand</span>
                <span className="text-[9px] text-slate-500 font-mono">Agency Add-on Toggle</span>
              </div>
              <button
                onClick={handleToggleWhiteLabel}
                disabled={userRole !== 'Owner'}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold transition-all border ${activeWorkspace.whiteLabelEnabled ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-slate-950 text-slate-400 border-slate-800'}`}
              >
                {activeWorkspace.whiteLabelEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            {userRole !== 'Owner' && (
              <div className="flex gap-1.5 text-[9px] text-slate-500">
                <ShieldAlert className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                <span>Only the Owner can configure brand white-labeling.</span>
              </div>
            )}
          </div>

          {/* CREATE NEW WORKSPACE */}
          <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 space-y-4">
            <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider border-b border-slate-900 pb-3 flex items-center gap-1.5">
              <Plus className="h-4 w-4 text-emerald-400" />
              Provision New Workspace
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1">Workspace Name</label>
                <input
                  type="text"
                  placeholder="e.g. Lekki Marketing Group"
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
                />
              </div>

              <button
                onClick={handleCreateWorkspace}
                className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
              >
                Create Workspace
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
