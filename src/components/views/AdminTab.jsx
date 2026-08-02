import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../utils/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc,
  query, 
  orderBy, 
  limit,
  writeBatch
} from 'firebase/firestore';
import { 
  ShieldAlert, 
  Users, 
  Terminal, 
  History, 
  DownloadCloud, 
  Globe, 
  CheckCircle, 
  UserCheck,
  RefreshCw,
  Search,
  ShieldCheck,
  UserX,
  FileCode2,
  Lock,
  Cpu,
  Wallet,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Ban
} from 'lucide-react';

// Safe string helper — prevents toLowerCase crash on null/undefined fields
const safeStr = (val) => (val || '').toString().toLowerCase();

const AdminTab = ({ subTab }) => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserData, setSelectedUserData] = useState({ tasks: [], routines: [], finances: null, history: [] });
  const [geminiLogs, setGeminiLogs] = useState([]);
  
  const [myIp, setMyIp] = useState('');
  const [ipAuthorized, setIpAuthorized] = useState(false);
  const [loadingIp, setLoadingIp] = useState(true);
  const [allowedIps, setAllowedIps] = useState([]);
  const [newIpInput, setNewIpInput] = useState('');
  
  const [loadingData, setLoadingData] = useState(false);
  const [loadingUserData, setLoadingUserData] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [logsSearch, setLogsSearch] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [statusType, setStatusType] = useState('success'); // 'success' | 'error'
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', username: '', email: '', phone: '' });
  const [activeUserTab, setActiveUserTab] = useState('profile'); // 'profile' | 'finances' | 'tasks' | 'history'

  // Timetable HTML Template states
  const [templateHtml, setTemplateHtml] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [templateMsg, setTemplateMsg] = useState('');

  const showStatus = (msg, type = 'success') => {
    setStatusMsg(msg);
    setStatusType(type);
    setTimeout(() => setStatusMsg(''), 5000);
  };

  // 1. Fetch IP and verify against Firestore Admin IP whitelist
  useEffect(() => {
    const checkIpAuthorization = async () => {
      try {
        setLoadingIp(true);
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        const currentIp = ipData.ip;
        setMyIp(currentIp);

        const configRef = doc(db, 'admin', 'config');
        const configSnap = await getDoc(configRef);
        
        let whitelist = [];
        if (configSnap.exists()) {
          whitelist = configSnap.data().allowedIps || [];
        } else {
          await setDoc(configRef, { allowedIps: [currentIp] });
          whitelist = [currentIp];
        }
        setAllowedIps(whitelist);
        setIpAuthorized(whitelist.length === 0 || whitelist.includes(currentIp));
      } catch (err) {
        console.error('IP Verification failed:', err);
        setIpAuthorized(false);
      } finally {
        setLoadingIp(false);
      }
    };
    checkIpAuthorization();
  }, []);

  // 2. Fetch User Directory and Gemini Logs
  const fetchAdminData = useCallback(async () => {
    if (!ipAuthorized) return;
    setLoadingData(true);
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersList = [];
      usersSnap.forEach(d => usersList.push({ uid: d.id, ...d.data() }));
      setUsers(usersList);

      const logsSnap = await getDocs(query(collection(db, 'gemini_logs'), orderBy('timestamp', 'desc'), limit(100)));
      const logsList = [];
      logsSnap.forEach(d => logsList.push({ id: d.id, ...d.data() }));
      setGeminiLogs(logsList);
    } catch (err) {
      console.error('Error fetching admin directory data:', err);
      showStatus("Permission Denied: Confirm you have 'isAdmin: true' in your Firestore document.", 'error');
    } finally {
      setLoadingData(false);
    }
  }, [ipAuthorized]);

  useEffect(() => {
    if (ipAuthorized) fetchAdminData();
  }, [ipAuthorized, fetchAdminData]);

  // Fetch HTML Template
  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const docRef = doc(db, 'config', 'demo_html');
        const snap = await getDoc(docRef);
        if (snap.exists()) setTemplateHtml(snap.data().htmlContent || '');
      } catch (err) {
        console.error('Error fetching HTML template:', err);
      }
    };
    fetchTemplate();
  }, []);

  // 3. Fetch detailed user data (tasks, routines, finances, history)
  const handleSelectUser = async (user) => {
    setSelectedUser(user);
    setIsEditingProfile(false);
    setActiveUserTab('profile');
    setEditForm({
      name: user.name || '',
      username: user.username || '',
      email: user.email || '',
      phone: user.phone || ''
    });
    setSelectedUserData({ tasks: [], routines: [], finances: null, history: [] });
    setLoadingUserData(true);
    try {
      const uid = user.uid;

      // Tasks
      const tasksSnap = await getDocs(collection(db, 'users', uid, 'tasks'));
      const tasks = [];
      tasksSnap.forEach(d => tasks.push(d.data()));

      // Routines
      const routinesSnap = await getDocs(collection(db, 'users', uid, 'routines'));
      const routines = [];
      routinesSnap.forEach(d => routines.push(d.data()));

      // Finances — single document at users/{uid}/finances/data
      const financesSnap = await getDoc(doc(db, 'users', uid, 'finances', 'data'));
      const finances = financesSnap.exists() ? financesSnap.data() : null;

      // History Logs
      let history = [];
      try {
        const historySnap = await getDocs(query(collection(db, 'users', uid, 'history_logs'), orderBy('timestamp', 'desc'), limit(50)));
        historySnap.forEach(d => history.push({ id: d.id, ...d.data() }));
      } catch (e) {
        // history_logs may not exist yet — not a fatal error
        history = [];
      }

      setSelectedUserData({ tasks, routines, finances, history });
    } catch (err) {
      console.error('Error loading user sub-data:', err);
      showStatus('Failed to load user data: ' + err.message, 'error');
    } finally {
      setLoadingUserData(false);
    }
  };

  // 4. Download User Backup JSON (EXCLUDES geminiApiKey for privacy)
  const downloadUserBackup = () => {
    if (!selectedUser) return;
    // Strip sensitive API key from profile before download
    const { geminiApiKey, ...safeProfile } = selectedUser;
    const data = {
      profile: safeProfile,
      tasks: selectedUserData.tasks,
      routines: selectedUserData.routines,
      finances: selectedUserData.finances,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `duevault_backup_${selectedUser.username || selectedUser.uid}_${new Date().toLocaleDateString('en-CA')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showStatus(`Backup generated for ${selectedUser.name || selectedUser.uid}!`);
  };

  // 5. Add IP to Whitelist (with basic format validation)
  const handleAddIp = async () => {
    const ip = newIpInput.trim();
    if (!ip) return;
    // Basic IP format validation (IPv4 and IPv6)
    const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6 = /^[0-9a-fA-F:]+$/;
    if (!ipv4.test(ip) && !ipv6.test(ip)) {
      showStatus('Invalid IP address format. Please enter a valid IPv4 or IPv6 address.', 'error');
      return;
    }
    if (allowedIps.includes(ip)) {
      showStatus('This IP is already in the whitelist.', 'error');
      return;
    }
    try {
      const updatedList = [...allowedIps, ip];
      const configRef = doc(db, 'admin', 'config');
      await setDoc(configRef, { allowedIps: updatedList });
      setAllowedIps(updatedList);
      setNewIpInput('');
      showStatus('IP Whitelist updated successfully!');
    } catch (err) {
      console.error(err);
      showStatus('Failed to update whitelist: ' + err.message, 'error');
    }
  };

  // 6. Remove IP from Whitelist
  const handleRemoveIp = async (ipToRemove) => {
    if (!confirm(`Remove IP ${ipToRemove} from authorization whitelist?`)) return;
    try {
      const updatedList = allowedIps.filter(ip => ip !== ipToRemove);
      await setDoc(doc(db, 'admin', 'config'), { allowedIps: updatedList });
      setAllowedIps(updatedList);
      showStatus('IP Whitelist updated successfully!');
      if (ipToRemove === myIp) {
        setIpAuthorized(updatedList.length === 0 || updatedList.includes(myIp));
      }
    } catch (err) {
      showStatus('Failed to remove IP: ' + err.message, 'error');
    }
  };

  // 7. Approve User
  const handleApproveUser = async (userId) => {
    try {
      await setDoc(doc(db, 'users', userId), { status: 'APPROVED' }, { merge: true });
      setUsers(prev => prev.map(u => u.uid === userId ? { ...u, status: 'APPROVED' } : u));
      setSelectedUser(prev => prev?.uid === userId ? { ...prev, status: 'APPROVED' } : prev);
      showStatus('User has been approved! They can now log in and sync data.');
    } catch (err) {
      showStatus('Failed to approve user: ' + err.message, 'error');
    }
  };

  // 8. Suspend / Revoke User
  const handleSuspendUser = async (userId) => {
    if (!confirm('Suspend this user? They will be locked out until re-approved.')) return;
    try {
      await setDoc(doc(db, 'users', userId), { status: 'SUSPENDED' }, { merge: true });
      setUsers(prev => prev.map(u => u.uid === userId ? { ...u, status: 'SUSPENDED' } : u));
      setSelectedUser(prev => prev?.uid === userId ? { ...prev, status: 'SUSPENDED' } : prev);
      showStatus('User has been suspended.');
    } catch (err) {
      showStatus('Failed to suspend user: ' + err.message, 'error');
    }
  };

  // 9. Save HTML Template
  const handleSaveTemplate = async () => {
    setIsSavingTemplate(true);
    setTemplateMsg('');
    try {
      await setDoc(doc(db, 'config', 'demo_html'), { htmlContent: templateHtml }, { merge: true });
      setTemplateMsg('Demo Timetable HTML template updated successfully!');
      setTimeout(() => setTemplateMsg(''), 4000);
    } catch (err) {
      alert('Failed to save template: ' + err.message);
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // 10. Save Profile Edit
  const handleSaveProfileEdit = async () => {
    if (!editForm.name.trim() || !editForm.username.trim() || !editForm.email.trim()) {
      showStatus('Name, username, and email are required.', 'error');
      return;
    }
    try {
      const updates = {
        name: editForm.name.trim(),
        username: editForm.username.trim().toLowerCase(),
        email: editForm.email.trim().toLowerCase(),
        phone: editForm.phone.trim()
      };
      await setDoc(doc(db, 'users', selectedUser.uid), updates, { merge: true });
      setUsers(prev => prev.map(u => u.uid === selectedUser.uid ? { ...u, ...updates } : u));
      setSelectedUser(prev => prev ? { ...prev, ...updates } : null);
      setIsEditingProfile(false);
      showStatus('User profile updated successfully!');
    } catch (err) {
      showStatus('Failed to update profile: ' + err.message, 'error');
    }
  };

  // 11. Purge All User Data
  const handleDeleteUserData = async (userId, userName) => {
    if (!confirm(`Are you absolutely sure you want to PERMANENTLY delete all data for ${userName}?\n\nThis will wipe their tasks, routines, finances, logs, and account profile. This cannot be undone.`)) return;
    try {
      const batch = writeBatch(db);
      const [tasksSnap, routinesSnap, logsSnap] = await Promise.all([
        getDocs(collection(db, 'users', userId, 'tasks')),
        getDocs(collection(db, 'users', userId, 'routines')),
        getDocs(collection(db, 'users', userId, 'history_logs'))
      ]);
      tasksSnap.forEach(d => batch.delete(d.ref));
      routinesSnap.forEach(d => batch.delete(d.ref));
      logsSnap.forEach(d => batch.delete(d.ref));
      batch.delete(doc(db, 'users', userId, 'finances', 'data'));
      batch.delete(doc(db, 'users', userId, 'config', 'timetable'));
      batch.delete(doc(db, 'users', userId));
      await batch.commit();
      setUsers(prev => prev.filter(u => u.uid !== userId));
      setSelectedUser(null);
      setSelectedUserData({ tasks: [], routines: [], finances: null, history: [] });
      showStatus(`All data for ${userName} has been permanently purged.`);
    } catch (err) {
      showStatus('Failed to purge user data: ' + err.message, 'error');
    }
  };

  // --- Derived / Filtered Lists ---
  const filteredUsers = users.filter(u =>
    safeStr(u.name).includes(safeStr(searchTerm)) ||
    safeStr(u.username).includes(safeStr(searchTerm)) ||
    safeStr(u.email).includes(safeStr(searchTerm))
  );

  const filteredLogs = geminiLogs.filter(l =>
    safeStr(l.username).includes(safeStr(logsSearch)) ||
    safeStr(l.action).includes(safeStr(logsSearch)) ||
    safeStr(l.inputSnippet).includes(safeStr(logsSearch))
  );

  const pendingUsers = users.filter(u => u.status === 'PENDING' && !u.isAdmin);
  const approvedCount = users.filter(u => u.status === 'APPROVED').length;
  const suspendedCount = users.filter(u => u.status === 'SUSPENDED').length;

  // --- Status badge helper ---
  const statusBadge = (status, isAdmin) => {
    if (isAdmin) return <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Admin</span>;
    if (status === 'PENDING') return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Pending</span>;
    if (status === 'SUSPENDED') return <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Suspended</span>;
    if (status === 'APPROVED') return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Approved</span>;
    return <span className="bg-slate-700 text-slate-400 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">{status || 'Unknown'}</span>;
  };

  // --- Render Gates ---
  if (loadingIp) {
    return (
      <div className="w-full h-[60vh] flex flex-col justify-center items-center gap-3">
        <RefreshCw className="w-8 h-8 text-rose-500 animate-spin" />
        <p className="text-slate-400 font-mono text-sm">Evaluating administrative credentials and IP parameters...</p>
      </div>
    );
  }

  if (!ipAuthorized) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-12 bg-slate-900 border border-rose-500/30 rounded-2xl p-8 space-y-6 shadow-[0_0_30px_rgba(244,63,94,0.1)]">
        <div className="flex gap-4 items-start">
          <div className="p-3 bg-rose-500/20 text-rose-400 rounded-xl shrink-0">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Access Denied — IP Not Authorized</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Your current public IP <code className="text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded font-mono font-semibold">{myIp}</code> is not in the approved administrative whitelists.
            </p>
          </div>
        </div>
        <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 text-xs space-y-2 text-slate-400">
          <p className="font-semibold text-slate-300 flex items-center gap-1.5"><Globe className="w-4 h-4 text-rose-400" /> How to authorize this device:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Log in from an already whitelisted admin location.</li>
            <li>Go to <strong>IP Whitelist</strong> and add <code className="text-slate-300 font-mono">{myIp}</code>.</li>
            <li>If first setup, the current IP was auto-added to the whitelist — refresh the page.</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in pb-24 md:pb-6">

      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-rose-400" />
            Administrative Command Portal
          </h2>
          <p className="text-slate-400 text-sm">Monitor user registrations, audit AI endpoints, inspect finances, and manage data backups.</p>
        </div>
        <button
          onClick={fetchAdminData}
          disabled={loadingData}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin' : ''}`} />
          Refresh Registry
        </button>
      </div>

      {/* Status Message */}
      {statusMsg && (
        <div className={`border text-sm rounded-xl p-4 animate-fade-in flex items-center gap-2 ${
          statusType === 'error'
            ? 'bg-red-500/10 border-red-500/20 text-red-200'
            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
        }`}>
          {statusType === 'error'
            ? <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            : <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          }
          <span>{statusMsg}</span>
        </div>
      )}

      {/* 1. ADMIN DASHBOARD */}
      {subTab === 'admin-dashboard' && (
        <div className="space-y-6 animate-fade-in">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Registered', value: users.length, icon: Users, color: 'rose' },
              { label: 'Pending Approvals', value: pendingUsers.length, icon: ShieldAlert, color: pendingUsers.length > 0 ? 'red' : 'slate', pulse: pendingUsers.length > 0 },
              { label: 'Active Users', value: approvedCount, icon: ShieldCheck, color: 'emerald' },
              { label: 'Gemini Logs', value: geminiLogs.length, icon: Terminal, color: 'indigo' }
            ].map(card => (
              <div key={card.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
                <div className={`p-3.5 rounded-xl bg-${card.color}-500/10 text-${card.color}-400 ${card.pulse ? 'animate-pulse' : ''}`}>
                  <card.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{card.label}</p>
                  <p className="text-2xl font-extrabold text-white mt-0.5">{card.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pending Approvals List */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-md font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Lock className="w-5 h-5 text-rose-400" />
                Profile Authorization Queue {pendingUsers.length > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{pendingUsers.length} pending</span>}
              </h3>
              {pendingUsers.length === 0 ? (
                <div className="py-12 flex flex-col justify-center items-center gap-3 text-center bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
                  <ShieldCheck className="w-10 h-10 text-emerald-400" />
                  <div>
                    <h4 className="text-slate-200 text-sm font-bold">System Status Secure</h4>
                    <p className="text-slate-500 text-xs mt-1">No pending profiles require administrator clearance.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingUsers.map(user => (
                    <div key={user.uid} className="bg-slate-950/50 border border-amber-500/20 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-200">{user.name || 'Unknown'}</span>
                          <span className="text-[10px] text-slate-500 font-mono">@{user.username || '??'}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{user.email}</p>
                        <p className="text-[10px] text-slate-600 font-mono mt-0.5 select-all">UID: {user.uid}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSelectUser(user)}
                          className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 rounded-lg cursor-pointer transition-all"
                        >
                          Inspect
                        </button>
                        <button
                          onClick={() => handleApproveUser(user.uid)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] px-4 py-1.5 rounded-xl transition-all cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                        >
                          Approve ✓
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Security Info */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-md font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Cpu className="w-5 h-5 text-indigo-400" />
                Gateway Parameters
              </h3>
              <div className="space-y-3 text-xs font-mono">
                {[
                  { label: 'Public IP Endpoint', value: myIp, color: 'text-rose-400' },
                  { label: 'Auth Node Status', value: 'WHITELIST ACTIVE', color: 'text-emerald-400' },
                  { label: 'Approved Users', value: `${approvedCount} / ${users.length}`, color: 'text-cyan-400' },
                  { label: 'Suspended', value: suspendedCount.toString(), color: suspendedCount > 0 ? 'text-red-400' : 'text-slate-400' }
                ].map(item => (
                  <div key={item.label} className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3">
                    <span className="text-slate-500 text-[10px] uppercase tracking-wider font-sans">{item.label}</span>
                    <span className={`block font-bold mt-0.5 ${item.color}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. USER REGISTRY & DETAILS */}
      {subTab === 'admin-registry' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-in">
          {/* User List Panel */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-rose-400" />
                  User Directory ({filteredUsers.length})
                </h3>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search name, username, email..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/40">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] font-mono uppercase tracking-wider text-slate-500 bg-slate-900/40">
                      <th className="p-3 pl-4">Name / Username</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right pr-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-sm text-slate-300">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="p-8 text-center text-slate-500 font-mono text-xs">
                          {loadingData ? 'Loading user directory...' : 'No registered profiles matching search.'}
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(user => (
                        <tr
                          key={user.uid}
                          className={`hover:bg-slate-800/30 transition-colors cursor-pointer ${selectedUser?.uid === user.uid ? 'bg-rose-500/5 border-l-2 border-l-rose-500' : ''}`}
                          onClick={() => handleSelectUser(user)}
                        >
                          <td className="p-3 pl-4">
                            <div className="font-semibold text-slate-200">{user.name || <span className="text-slate-500 italic">No Name</span>}</div>
                            <div className="text-[10px] text-slate-500 font-mono">@{user.username || user.uid?.slice(0, 8)}</div>
                          </td>
                          <td className="p-3 font-mono text-xs text-slate-400 truncate max-w-[160px]">{user.email}</td>
                          <td className="p-3">{statusBadge(user.status, user.isAdmin)}</td>
                          <td className="p-3 text-right pr-4">
                            <button
                              onClick={e => { e.stopPropagation(); handleSelectUser(user); }}
                              className="text-xs text-rose-400 font-bold hover:text-rose-300 hover:underline cursor-pointer"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* User Inspector Panel */}
          <div className="lg:col-span-2 space-y-4">
            {selectedUser ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden animate-fade-in">
                {/* Inspector Header */}
                <div className="p-5 border-b border-slate-800 bg-slate-800/30">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-white text-lg leading-tight">{selectedUser.name || 'Unknown User'}</h3>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5 select-all">{selectedUser.uid}</p>
                      <div className="mt-1.5">{statusBadge(selectedUser.status, selectedUser.isAdmin)}</div>
                    </div>
                    {loadingUserData && <RefreshCw className="w-4 h-4 text-rose-400 animate-spin shrink-0 mt-1" />}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    <button onClick={downloadUserBackup} className="flex items-center gap-1.5 bg-gradient-to-r from-rose-500 to-amber-500 hover:opacity-90 text-white font-bold py-1.5 px-3 rounded-lg text-[10px] transition-all cursor-pointer">
                      <DownloadCloud className="w-3.5 h-3.5" /> Backup JSON
                    </button>
                    {selectedUser.status !== 'APPROVED' && !selectedUser.isAdmin && (
                      <button onClick={() => handleApproveUser(selectedUser.uid)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-3 rounded-lg text-[10px] transition-colors cursor-pointer">
                        Approve ✓
                      </button>
                    )}
                    {selectedUser.status === 'APPROVED' && !selectedUser.isAdmin && (
                      <button onClick={() => handleSuspendUser(selectedUser.uid)} className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white font-bold py-1.5 px-3 rounded-lg text-[10px] transition-all cursor-pointer border border-red-500/30">
                        <span className="flex items-center gap-1"><Ban className="w-3 h-3" /> Suspend</span>
                      </button>
                    )}
                    {isEditingProfile ? (
                      <>
                        <button onClick={handleSaveProfileEdit} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-3 rounded-lg text-[10px] cursor-pointer">Save</button>
                        <button onClick={() => setIsEditingProfile(false)} className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold py-1.5 px-3 rounded-lg text-[10px] cursor-pointer">Cancel</button>
                      </>
                    ) : (
                      <button onClick={() => setIsEditingProfile(true)} className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-1.5 px-3 rounded-lg text-[10px] cursor-pointer border border-slate-700">Edit Profile</button>
                    )}
                  </div>
                </div>

                {/* Sub-tabs for inspector */}
                <div className="flex border-b border-slate-800 bg-slate-950/30 overflow-x-auto">
                  {[
                    { id: 'profile', label: 'Profile' },
                    { id: 'finances', label: `Finances` },
                    { id: 'tasks', label: `Tasks (${selectedUserData.tasks.length})` },
                    { id: 'history', label: 'History' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveUserTab(tab.id)}
                      className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors cursor-pointer ${
                        activeUserTab === tab.id
                          ? 'border-b-2 border-rose-500 text-rose-400 bg-rose-500/5'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">

                  {/* PROFILE TAB */}
                  {activeUserTab === 'profile' && (
                    <>
                      {isEditingProfile ? (
                        <div className="space-y-3 text-xs animate-fade-in">
                          {[
                            { label: 'Full Name', key: 'name', type: 'text' },
                            { label: 'Username', key: 'username', type: 'text' },
                            { label: 'Email Address', key: 'email', type: 'email' },
                            { label: 'Phone Number', key: 'phone', type: 'text' }
                          ].map(field => (
                            <div key={field.key} className="space-y-1">
                              <label className="text-slate-400 font-sans font-semibold">{field.label}</label>
                              <input
                                type={field.type}
                                value={editForm[field.key]}
                                onChange={e => setEditForm({ ...editForm, [field.key]: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500 text-xs"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-2.5 text-xs font-mono animate-fade-in">
                          {[
                            { label: 'Username', value: `@${selectedUser.username || '??'}` },
                            { label: 'Email', value: selectedUser.email },
                            { label: 'Phone', value: selectedUser.phone || 'N/A' },
                            { label: 'Auth UID', value: selectedUser.uid }
                          ].map(item => (
                            <div key={item.label} className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3">
                              <div className="text-slate-500 text-[10px] uppercase tracking-wider font-sans">{item.label}</div>
                              <div className="text-slate-200 font-semibold truncate mt-0.5 select-all">{item.value}</div>
                            </div>
                          ))}
                          {/* Note: geminiApiKey is intentionally hidden from admin view */}
                          <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3">
                            <div className="text-slate-500 text-[10px] uppercase tracking-wider font-sans">Gemini API Key</div>
                            <div className="text-slate-600 font-semibold mt-0.5 italic text-[10px]">Hidden for security</div>
                          </div>
                        </div>
                      )}
                      {/* Summary Counts */}
                      <div className="grid grid-cols-3 gap-2.5">
                        {[
                          { label: 'Tasks', value: selectedUserData.tasks.length, color: 'text-rose-400' },
                          { label: 'Routines', value: selectedUserData.routines.length, color: 'text-amber-400' },
                          { label: 'Transactions', value: selectedUserData.finances?.transactions?.length || 0, color: 'text-indigo-400' }
                        ].map(item => (
                          <div key={item.label} className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-2.5 text-center">
                            <div className={`text-lg font-bold ${item.color}`}>{item.value}</div>
                            <div className="text-[9px] text-slate-500 uppercase tracking-wider font-mono">{item.label}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* FINANCES TAB */}
                  {activeUserTab === 'finances' && (
                    <div className="space-y-4 animate-fade-in">
                      {!selectedUserData.finances ? (
                        <div className="text-center py-8 text-slate-500 text-xs italic">
                          {loadingUserData ? 'Loading finances...' : 'No finances data found for this user.'}
                        </div>
                      ) : (
                        <>
                          {/* Wallets */}
                          <div>
                            <h4 className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2 flex items-center gap-1.5">
                              <Wallet className="w-3.5 h-3.5" /> Wallets / Accounts
                            </h4>
                            <div className="space-y-2">
                              {Object.values(selectedUserData.finances.wallets || {}).map(wallet => (
                                <div key={wallet.id} className="bg-slate-950/40 border border-slate-800 rounded-xl p-3 flex justify-between items-center">
                                  <div>
                                    <div className="text-xs font-bold text-slate-200">{wallet.name}</div>
                                    <div className="text-[10px] text-slate-500 font-mono">
                                      {wallet.limitEnabled ? `Limit: ₹${wallet.spendLimit}` : 'No limit'}
                                      {wallet.isHidden ? ' · Hidden' : ''}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className={`text-sm font-bold font-mono ${wallet.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                      ₹{Number(wallet.balance || 0).toFixed(2)}
                                    </div>
                                    <div className="text-[10px] text-slate-600">Starting: ₹{Number(wallet.startingBalance || 0).toFixed(2)}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Budget Summary */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3">
                              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Monthly Budget</div>
                              <div className="text-sm font-bold text-white mt-1">₹{Number(selectedUserData.finances.monthlyBudget?.limit || 0).toFixed(0)}</div>
                              <div className="text-[10px] text-slate-500">Spent: ₹{Number(selectedUserData.finances.monthlyBudget?.spent || 0).toFixed(0)}</div>
                            </div>
                            <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3">
                              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Weekly Budget</div>
                              <div className="text-sm font-bold text-white mt-1">₹{Number(selectedUserData.finances.weeklyBudget?.limit || 0).toFixed(0)}</div>
                              <div className="text-[10px] text-slate-500">Spent: ₹{Number(selectedUserData.finances.weeklyBudget?.spent || 0).toFixed(0)}</div>
                            </div>
                          </div>

                          {/* Transactions */}
                          <div>
                            <h4 className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">
                              Recent Transactions ({(selectedUserData.finances.transactions || []).length} total)
                            </h4>
                            <div className="space-y-1.5 max-h-48 overflow-y-auto">
                              {(selectedUserData.finances.transactions || []).slice().reverse().slice(0, 20).map((tx, i) => (
                                <div key={tx.id || i} className="flex items-center justify-between bg-slate-950/40 border border-slate-800/60 rounded-lg px-3 py-2 text-[10px]">
                                  <div>
                                    <span className="font-bold text-slate-300">{tx.title}</span>
                                    <span className="ml-1.5 text-slate-600 font-mono">{tx.category}</span>
                                    <div className="text-slate-600 font-mono">{tx.date}</div>
                                  </div>
                                  <span className={`font-bold font-mono ${tx.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {tx.type === 'INCOME' ? '+' : '-'}₹{Number(tx.amount).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                              {(selectedUserData.finances.transactions || []).length === 0 && (
                                <div className="text-center py-4 text-slate-600 text-[10px] italic">No transactions found.</div>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* TASKS TAB */}
                  {activeUserTab === 'tasks' && (
                    <div className="space-y-2 animate-fade-in">
                      {selectedUserData.tasks.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 text-xs italic">
                          {loadingUserData ? 'Loading tasks...' : 'No tasks found.'}
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-96 overflow-y-auto">
                          {selectedUserData.tasks.sort((a, b) => new Date(a.date) - new Date(b.date)).map((task, i) => {
                            const prioColors = { CRITICAL: 'text-red-400', HIGH: 'text-orange-400', MEDIUM: 'text-cyan-400', LOW: 'text-slate-500' };
                            return (
                              <div key={task.id || i} className="bg-slate-950/40 border border-slate-800/60 rounded-lg px-3 py-2 text-[10px]">
                                <div className="flex justify-between items-start gap-2">
                                  <div>
                                    <span className={`font-bold ${task.completed ? 'line-through text-slate-600' : 'text-slate-200'}`}>{task.title}</span>
                                    <div className="text-slate-600 font-mono mt-0.5">{task.date} · {task.category}</div>
                                  </div>
                                  <span className={`font-bold uppercase shrink-0 ${prioColors[task.priority] || 'text-slate-500'}`}>{task.priority}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* HISTORY TAB */}
                  {activeUserTab === 'history' && (
                    <div className="space-y-2 animate-fade-in">
                      <div className="max-h-96 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/40 divide-y divide-slate-800/50">
                        {selectedUserData.history.length === 0 ? (
                          <div className="p-6 text-center text-[10px] font-mono text-slate-500">No audit events logged yet.</div>
                        ) : (
                          selectedUserData.history.map(log => (
                            <div key={log.id} className="p-3 text-[10px] flex justify-between items-start gap-3">
                              <div>
                                <span className={`px-1.5 py-0.5 rounded font-mono uppercase text-[8px] font-bold ${
                                  log.action === 'create' ? 'bg-emerald-500/10 text-emerald-400' :
                                  log.action === 'delete' ? 'bg-red-500/10 text-red-400' :
                                  'bg-amber-500/10 text-amber-400'
                                }`}>{log.action}</span>
                                <span className="ml-1.5 text-slate-500 font-sans">{log.entity}</span>
                                <p className="text-slate-300 font-sans mt-0.5 truncate max-w-[140px]">
                                  {log.dataAfter?.title || log.dataBefore?.title || '—'}
                                </p>
                              </div>
                              <span className="text-slate-600 shrink-0 font-mono text-[8px] mt-0.5">
                                {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : '—'}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Danger Zone */}
                <div className="p-5 border-t border-slate-800">
                  <div className="border border-red-500/25 bg-red-500/5 rounded-xl p-3.5 space-y-2.5">
                    <p className="text-[10px] text-slate-500 leading-snug">⚠️ Permanently wipe all tasks, routines, budgets, logs, and profile records from Firestore. Irreversible.</p>
                    <button
                      onClick={() => handleDeleteUserData(selectedUser.uid, selectedUser.name || selectedUser.uid)}
                      className="w-full bg-red-700 hover:bg-red-600 text-white font-extrabold text-[10px] py-2 rounded-xl transition-all cursor-pointer"
                    >
                      Purge All User Data
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-500 italic text-xs py-20">
                <UserX className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                Select a user from the directory to inspect their data.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. GEMINI NLP LOGS AUDIT */}
      {subTab === 'admin-logs' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Terminal className="w-5 h-5 text-rose-400" />
                Gemini NLP Usage Logs ({filteredLogs.length})
              </h3>
              <p className="text-xs text-slate-400 mt-1">Audit natural language request scopes and schema parsing responses.</p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by user, action, or input..."
                value={logsSearch}
                onChange={e => setLogsSearch(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto pr-1">
            {filteredLogs.length === 0 ? (
              <div className="col-span-2 text-center py-16 text-xs font-mono text-slate-500 italic">
                {geminiLogs.length === 0 ? 'No Gemini logs found. This collection is populated when users use the AI Input Engine.' : 'No matching logs found.'}
              </div>
            ) : (
              filteredLogs.map(log => (
                <div key={log.id} className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3 text-xs leading-normal">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <span className="font-bold text-slate-200">@{safeStr(log.username) || 'unknown'}</span>
                      <span className="text-[9px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/25 px-2 py-0.5 rounded uppercase font-bold">
                        {log.action === 'task_nlp_parse' ? 'NLP Parse' : log.action === 'html_scrape' ? 'HTML Scraping' : (log.action || 'Unknown')}
                      </span>
                    </div>
                    {log.inputSnippet && (
                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono font-bold">Input Payload:</span>
                        <p className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 font-mono text-[10px] text-slate-400 break-words leading-relaxed">
                          {log.inputSnippet}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono border-t border-slate-800 pt-2">
                    <span>ID: {log.id.slice(0, 10)}...</span>
                    <span>{log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : '—'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 4. IP WHITELIST */}
      {subTab === 'admin-security' && (
        <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 animate-fade-in">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Globe className="w-5 h-5 text-rose-400" />
              IP Whitelist Access Management
            </h3>
            <p className="text-slate-400 text-xs mt-2">Only whitelisted IPs can access the admin panel. Removing all IPs allows unrestricted access (dev mode).</p>
          </div>

          <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-slate-500 text-[10px] uppercase tracking-wider font-mono">Your Current IP</span>
              <code className="block text-rose-400 font-mono font-bold text-lg mt-0.5">{myIp}</code>
            </div>
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">✓ Authorized</span>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-400">Add New Authorized IP</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. 192.168.1.55 or 2001:db8::1"
                value={newIpInput}
                onChange={e => setNewIpInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddIp()}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
              <button
                onClick={handleAddIp}
                className="bg-rose-500 hover:bg-rose-400 text-white font-extrabold rounded-xl px-4 text-xs transition-all cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Authorized Nodes ({allowedIps.length})</h4>
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/30 divide-y divide-slate-800">
              {allowedIps.length === 0 ? (
                <div className="p-4 text-center text-xs italic text-slate-500">No IPs whitelisted — Open access enabled (development mode).</div>
              ) : (
                allowedIps.map(ip => (
                  <div key={ip} className="flex justify-between items-center p-3 text-xs hover:bg-slate-800/20 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${ip === myIp ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                      <span className="font-mono text-slate-200">{ip}</span>
                      {ip === myIp && <span className="text-[10px] text-slate-500 italic">(This device)</span>}
                    </div>
                    <button
                      onClick={() => handleRemoveIp(ip)}
                      className="text-red-400 hover:text-red-300 font-bold hover:underline text-[10px] cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. HTML CONFIG */}
      {subTab === 'admin-html' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 animate-fade-in">
          <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-bold text-white text-md uppercase tracking-wider flex items-center gap-2">
                <FileCode2 className="w-5 h-5 text-rose-400" />
                Configure Reference Timetable HTML
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Define the markup template loaded when users request university calendar samples.</p>
            </div>
            <button
              onClick={handleSaveTemplate}
              disabled={isSavingTemplate}
              className="bg-rose-500 hover:bg-rose-400 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-50 shrink-0"
            >
              {isSavingTemplate ? 'Saving...' : 'Save Template'}
            </button>
          </div>
          {templateMsg && (
            <p className="text-xs text-emerald-400 font-bold">{templateMsg}</p>
          )}
          <textarea
            value={templateHtml}
            onChange={e => setTemplateHtml(e.target.value)}
            placeholder="Paste raw timetable HTML schedule template code here..."
            rows="20"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-300 focus:outline-none focus:border-rose-500 leading-relaxed resize-y"
          />
        </div>
      )}

    </div>
  );
};

export default AdminTab;
