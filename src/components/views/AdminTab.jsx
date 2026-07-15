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
  Cpu
} from 'lucide-react';

const AdminTab = ({ subTab }) => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserData, setSelectedUserData] = useState({ tasks: [], routines: [], finances: {}, history: [] });
  const [geminiLogs, setGeminiLogs] = useState([]);
  
  const [myIp, setMyIp] = useState('');
  const [ipAuthorized, setIpAuthorized] = useState(false);
  const [loadingIp, setLoadingIp] = useState(true);
  const [allowedIps, setAllowedIps] = useState([]);
  const [newIpInput, setNewIpInput] = useState('');
  
  const [loadingData, setLoadingData] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [logsSearch, setLogsSearch] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', username: '', email: '', phone: '' });

  // Timetable HTML Template states & handlers
  const [templateHtml, setTemplateHtml] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [templateMsg, setTemplateMsg] = useState('');

  // 1. Fetch IP and verify against Firestore Admin IP whitelist
  useEffect(() => {
    const checkIpAuthorization = async () => {
      try {
        setLoadingIp(true);
        // Get user's public IP
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        const currentIp = ipData.ip;
        setMyIp(currentIp);

        // Fetch IP whitelist from Firestore (stored in a central /admin/config doc)
        const configRef = doc(db, 'admin', 'config');
        const configSnap = await getDoc(configRef);
        
        let whitelist = [];
        if (configSnap.exists()) {
          whitelist = configSnap.data().allowedIps || [];
        } else {
          // If config document doesn't exist, create it with current IP to prevent lock-out
          await setDoc(configRef, { allowedIps: [currentIp] });
          whitelist = [currentIp];
        }
        setAllowedIps(whitelist);

        // Authorize if current IP is in the whitelist or if whitelist is empty
        if (whitelist.length === 0 || whitelist.includes(currentIp)) {
          setIpAuthorized(true);
        } else {
          setIpAuthorized(false);
        }
      } catch (err) {
        console.error("IP Verification failed:", err);
        setIpAuthorized(false);
      } finally {
        setLoadingIp(false);
      }
    };

    checkIpAuthorization();
  }, []);

  // 2. Fetch User Directory and Gemini Logs (only if IP and Firebase Auth Admin matches)
  const fetchAdminData = useCallback(async () => {
    if (!ipAuthorized) return;
    setLoadingData(true);
    try {
      // Fetch users
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersList = [];
      usersSnap.forEach(d => {
        usersList.push(d.data());
      });
      setUsers(usersList);

      // Fetch Gemini Logs
      const logsSnap = await getDocs(query(collection(db, 'gemini_logs'), orderBy('timestamp', 'desc'), limit(100)));
      const logsList = [];
      logsSnap.forEach(d => {
        logsList.push({ id: d.id, ...d.data() });
      });
      setGeminiLogs(logsList);
    } catch (err) {
      console.error("Error fetching admin directory data:", err);
      setStatusMsg("Permission Denied: Confirm you have 'isAdmin: true' in your Firestore document.");
    } finally {
      setLoadingData(false);
    }
  }, [ipAuthorized]);

  useEffect(() => {
    if (ipAuthorized) {
      fetchAdminData();
    }
  }, [ipAuthorized, fetchAdminData]);

  // Fetch HTML Template for Importer
  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const docRef = doc(db, 'config', 'demo_html');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setTemplateHtml(snap.data().htmlContent || '');
        }
      } catch (err) {
        console.error("Error fetching HTML template:", err);
      }
    };
    fetchTemplate();
  }, []);

  // 3. Fetch detailed user subcollections for backups/history
  const handleSelectUser = async (user) => {
    setSelectedUser(user);
    setIsEditingProfile(false);
    setEditForm({
      name: user.name || '',
      username: user.username || '',
      email: user.email || '',
      phone: user.phone || ''
    });
    setLoadingData(true);
    try {
      // Fetch Tasks
      const tasksSnap = await getDocs(collection(db, 'users', user.uid, 'tasks'));
      const tasks = [];
      tasksSnap.forEach(d => tasks.push(d.data()));

      // Fetch Routines
      const routinesSnap = await getDocs(collection(db, 'users', user.uid, 'routines'));
      const routines = [];
      routinesSnap.forEach(d => routines.push(d.data()));

      // Fetch Finances
      const financesSnap = await getDoc(doc(db, 'users', user.uid, 'finances', 'data'));
      const finances = financesSnap.exists() ? financesSnap.data() : {};

      // Fetch History logs
      const historySnap = await getDocs(query(collection(db, 'users', user.uid, 'history_logs'), orderBy('timestamp', 'desc'), limit(50)));
      const history = [];
      historySnap.forEach(d => history.push({ id: d.id, ...d.data() }));

      setSelectedUserData({ tasks, routines, finances, history });
    } catch (err) {
      console.error("Error loading user sub-data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  // 4. Download User Backup Folder (JSON bundle)
  const downloadUserBackup = () => {
    if (!selectedUser) return;
    const data = {
      profile: selectedUser,
      tasks: selectedUserData.tasks,
      routines: selectedUserData.routines,
      finances: selectedUserData.finances,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `duevault_backup_${selectedUser.username}_${new Date().toLocaleDateString('en-CA')}.json`;
    a.click();
    
    setStatusMsg(`Backup generated for ${selectedUser.name}!`);
    setTimeout(() => setStatusMsg(''), 4000);
  };

  // 5. Add IP to Whitelist
  const handleAddIp = async () => {
    if (!newIpInput.trim()) return;
    try {
      const updatedList = [...allowedIps, newIpInput.trim()];
      const configRef = doc(db, 'admin', 'config');
      await setDoc(configRef, { allowedIps: updatedList });
      setAllowedIps(updatedList);
      setNewIpInput('');
      setStatusMsg("IP Whitelist updated successfully!");
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to update whitelist.");
    }
  };

  // 6. Remove IP from Whitelist
  const handleRemoveIp = async (ipToRemove) => {
    if (confirm(`Remove IP ${ipToRemove} from authorization whitelist?`)) {
      try {
        const updatedList = allowedIps.filter(ip => ip !== ipToRemove);
        const configRef = doc(db, 'admin', 'config');
        await setDoc(configRef, { allowedIps: updatedList });
        setAllowedIps(updatedList);
        setStatusMsg("IP Whitelist updated successfully!");
        setTimeout(() => setStatusMsg(''), 3000);
        
        // Re-evaluate authorization if we removed our own IP
        if (ipToRemove === myIp) {
          setIpAuthorized(updatedList.length === 0 || updatedList.includes(myIp));
        }
      } catch (err) {
        console.error(err);
        alert("Failed to remove IP.");
      }
    }
  };

  // 7. Approve User status
  const handleApproveUser = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, { status: 'APPROVED' }, { merge: true });
      
      // Update local states so UI updates immediately
      setUsers(prev => prev.map(u => u.uid === userId ? { ...u, status: 'APPROVED' } : u));
      setSelectedUser(prev => prev && prev.uid === userId ? { ...prev, status: 'APPROVED' } : prev);
      
      setStatusMsg(`User has been approved! They can now log in and sync data.`);
      setTimeout(() => setStatusMsg(''), 5000);
    } catch (err) {
      console.error("Error approving user:", err);
      alert("Failed to approve user: " + err.message);
    }
  };

  const handleSaveTemplate = async () => {
    setIsSavingTemplate(true);
    setTemplateMsg('');
    try {
      const docRef = doc(db, 'config', 'demo_html');
      await setDoc(docRef, { htmlContent: templateHtml }, { merge: true });
      setTemplateMsg("Demo Timetable HTML template updated successfully!");
      setTimeout(() => setTemplateMsg(''), 4000);
    } catch (err) {
      console.error("Error saving HTML template:", err);
      alert("Failed to save template: " + err.message);
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleSaveProfileEdit = async () => {
    if (!editForm.name.trim() || !editForm.username.trim() || !editForm.email.trim()) {
      alert("Name, username, and email are required.");
      return;
    }
    try {
      const userRef = doc(db, 'users', selectedUser.uid);
      await setDoc(userRef, {
        name: editForm.name.trim(),
        username: editForm.username.trim().toLowerCase(),
        email: editForm.email.trim().toLowerCase(),
        phone: editForm.phone.trim()
      }, { merge: true });

      // Update local state
      setUsers(prev => prev.map(u => u.uid === selectedUser.uid ? { ...u, ...editForm } : u));
      setSelectedUser(prev => prev ? { ...prev, ...editForm } : null);
      setIsEditingProfile(false);

      setStatusMsg("User profile updated successfully!");
      setTimeout(() => setStatusMsg(''), 5000);
    } catch (err) {
      console.error("Error updating user profile:", err);
      alert("Failed to update profile: " + err.message);
    }
  };

  const handleDeleteUserData = async (userId, userName) => {
    if (!confirm(`Are you absolutely sure you want to PERMANENTLY delete all data for ${userName}? This will wipe their tasks, routines, finances, logs, and account profile, and cannot be undone.`)) {
      return;
    }
    
    try {
      const batch = writeBatch(db);
      
      // 1. Delete tasks subcollection docs
      const tasksSnap = await getDocs(collection(db, 'users', userId, 'tasks'));
      tasksSnap.forEach(d => batch.delete(d.ref));
      
      // 2. Delete routines subcollection docs
      const routinesSnap = await getDocs(collection(db, 'users', userId, 'routines'));
      routinesSnap.forEach(d => batch.delete(d.ref));

      // 3. Delete history logs docs
      const logsSnap = await getDocs(collection(db, 'users', userId, 'history_logs'));
      logsSnap.forEach(d => batch.delete(d.ref));
      
      // 4. Delete finances doc
      batch.delete(doc(db, 'users', userId, 'finances', 'data'));
      
      // 5. Delete config doc
      batch.delete(doc(db, 'users', userId, 'config', 'timetable'));
      
      // 6. Delete user profile doc itself
      batch.delete(doc(db, 'users', userId));
      
      await batch.commit();
      
      // Update local state to remove the deleted user
      setUsers(prev => prev.filter(u => u.uid !== userId));
      setSelectedUser(null);
      
      setStatusMsg(`All data for user ${userName} has been permanently purged.`);
      setTimeout(() => setStatusMsg(''), 5000);
    } catch (err) {
      console.error("Error purging user data:", err);
      alert("Failed to purge user data: " + err.message);
    }
  };

  // Filtered lists
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLogs = geminiLogs.filter(l => 
    l.username.toLowerCase().includes(logsSearch.toLowerCase()) ||
    l.action.toLowerCase().includes(logsSearch.toLowerCase()) ||
    l.inputSnippet?.toLowerCase().includes(logsSearch.toLowerCase())
  );

  const pendingUsers = users.filter(u => u.status === 'PENDING' && !u.isAdmin);

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
          <div className="p-3 bg-rose-500/20 text-rose-400 rounded-xl">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Access Denied (IP Blocked)</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Your current public IP <code className="text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded font-mono font-semibold">{myIp}</code> is not in the approved administrative whitelists.
            </p>
          </div>
        </div>
        
        <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 text-xs space-y-2 text-slate-400">
          <p className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-rose-400" />
            How to authorize this device:
          </p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Log in from an already whitelisted admin location.</li>
            <li>Add your new IP <code className="text-slate-300 font-mono font-semibold">{myIp}</code> to the IP Whitelist panel.</li>
            <li>If this is the first setup, please contact database services.</li>
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
          <p className="text-slate-400 text-sm">Monitor user registration statistics, audit Gemini AI endpoints, and export vault recovery folders.</p>
        </div>
        <button 
          onClick={fetchAdminData}
          disabled={loadingData}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin' : ''}`} />
          Refresh Registry
        </button>
      </div>

      {statusMsg && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-200 text-sm rounded-xl p-4 animate-fade-in flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Dynamic View Router for SubTabs */}
      
      {/* 1. ADMIN DASHBOARD */}
      {subTab === 'admin-dashboard' && (
        <div className="space-y-6 animate-fade-in">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
              <div className="p-3.5 bg-rose-500/10 text-rose-400 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-slate-500 text-2xs font-bold uppercase tracking-wider">Total Registers</p>
                <p className="text-2xl font-extrabold text-white mt-0.5">{users.length}</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
              <div className={`p-3.5 rounded-xl ${pendingUsers.length > 0 ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <p className="text-slate-500 text-2xs font-bold uppercase tracking-wider">Pending Approvals</p>
                <p className="text-2xl font-extrabold text-white mt-0.5">{pendingUsers.length}</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
              <div className="p-3.5 bg-amber-500/10 text-amber-400 rounded-xl">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <p className="text-slate-500 text-2xs font-bold uppercase tracking-wider">Access Node IPs</p>
                <p className="text-2xl font-extrabold text-white mt-0.5">{allowedIps.length}</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
              <div className="p-3.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
                <Terminal className="w-6 h-6" />
              </div>
              <div>
                <p className="text-slate-500 text-2xs font-bold uppercase tracking-wider">Gemini API Audit Logs</p>
                <p className="text-2xl font-extrabold text-white mt-0.5">{geminiLogs.length}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pending Approvals List */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-md font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Lock className="w-5 h-5 text-rose-400" />
                Profile Authorization Queue
              </h3>
              
              {pendingUsers.length === 0 ? (
                <div className="py-12 flex flex-col justify-center items-center gap-3 text-center bg-slate-950/40 rounded-xl border border-slate-850 border-dashed">
                  <ShieldCheck className="w-10 h-10 text-emerald-400" />
                  <div>
                    <h4 className="text-slate-200 text-sm font-bold">System Status Secure</h4>
                    <p className="text-slate-500 text-xs mt-1">No pending profiles require administrator clearance.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingUsers.map(user => (
                    <div key={user.uid} className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-200">{user.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">@{user.username}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{user.email}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">UID: {user.uid}</p>
                      </div>
                      <button
                        onClick={() => handleApproveUser(user.uid)}
                        className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.1)] shrink-0"
                      >
                        Approve Clearance
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* System Info Integrity */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-md font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Cpu className="w-5 h-5 text-indigo-400" />
                Security Gateway Parameters
              </h3>
              <div className="space-y-4 text-xs font-mono">
                <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 space-y-1">
                  <span className="text-slate-500 text-2xs uppercase tracking-wider font-sans">Public IP Endpoint</span>
                  <span className="block text-rose-400 font-bold">{myIp}</span>
                </div>
                
                <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 space-y-1">
                  <span className="text-slate-500 text-2xs uppercase tracking-wider font-sans">Node Authorization Status</span>
                  <span className="block text-emerald-400 font-bold">WHITELIST ACTIVE</span>
                </div>

                <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 space-y-1">
                  <span className="text-slate-500 text-2xs uppercase tracking-wider font-sans">Database rules</span>
                  <span className="block text-slate-400">ENFORCED (Private Firestore Subcollections)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. USER REGISTRY & DETAILS */}
      {subTab === 'admin-registry' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* User List Panel (Left 2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-rose-400" />
                  User Profile Directory ({filteredUsers.length})
                </h3>
                
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="text"
                    placeholder="Search name, username..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/40">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs font-mono uppercase tracking-wider text-slate-400 bg-slate-900/40">
                      <th className="p-3 pl-4">Name / Username</th>
                      <th className="p-3">Email Address</th>
                      <th className="p-3 text-right pr-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-sm text-slate-300">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="p-8 text-center text-slate-500 font-mono text-xs">No registered profiles matching terms.</td>
                      </tr>
                    ) : (
                      filteredUsers.map(user => (
                        <tr 
                          key={user.uid} 
                          className={`hover:bg-slate-800/30 transition-colors cursor-pointer ${selectedUser?.uid === user.uid ? 'bg-rose-500/5 border-l-2 border-l-rose-500' : ''}`}
                          onClick={() => handleSelectUser(user)}
                        >
                          <td className="p-3 pl-4">
                            <div className="flex items-center gap-2">
                              <div className="font-semibold text-slate-200">{user.name}</div>
                              {user.status === 'PENDING' && !user.isAdmin && (
                                <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Pending</span>
                              )}
                              {user.status === 'APPROVED' && (
                                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Approved</span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 font-mono">@{user.username}</div>
                          </td>
                          <td className="p-3 font-mono text-xs">{user.email}</td>
                          <td className="p-3 text-right pr-4">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleSelectUser(user); }}
                              className="text-xs text-rose-450 font-bold hover:underline"
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

          {/* User Details Inspector Sidebar (Right 1 Column) */}
          <div className="space-y-6">
            {selectedUser ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 animate-slide-up">
                <div className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      Inspector: {selectedUser.name}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">UID: {selectedUser.uid}</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={downloadUserBackup}
                      className="flex items-center gap-1.5 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white font-bold py-2 px-3 rounded-xl text-[10px] transition-all shadow-[0_0_15px_rgba(244,63,94,0.15)] cursor-pointer"
                    >
                      <DownloadCloud className="w-3.5 h-3.5" /> Backup JSON
                    </button>
                    {isEditingProfile ? (
                      <>
                        <button 
                          onClick={handleSaveProfileEdit}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-3 rounded-xl text-[10px] transition-colors cursor-pointer"
                        >
                          Save
                        </button>
                        <button 
                          onClick={() => setIsEditingProfile(false)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-350 font-bold py-2 px-3 rounded-xl text-[10px] transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => {
                          setEditForm({
                            name: selectedUser.name || '',
                            username: selectedUser.username || '',
                            email: selectedUser.email || '',
                            phone: selectedUser.phone || ''
                          });
                          setIsEditingProfile(true);
                        }}
                        className="bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-750 font-bold py-2 px-3 rounded-xl text-[10px] transition-colors cursor-pointer"
                      >
                        Edit Profile
                      </button>
                    )}
                  </div>
                </div>

                {isEditingProfile ? (
                  <div className="space-y-3 text-xs animate-fade-in">
                    <div className="space-y-1">
                      <label className="text-slate-400 font-sans font-semibold">Full Name</label>
                      <input 
                        type="text" 
                        value={editForm.name} 
                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500 text-xs font-sans"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 font-sans font-semibold">Username</label>
                      <input 
                        type="text" 
                        value={editForm.username} 
                        onChange={e => setEditForm({ ...editForm, username: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500 text-xs font-sans"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 font-sans font-semibold">Email Address</label>
                      <input 
                        type="email" 
                        value={editForm.email} 
                        onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500 text-xs font-sans"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 font-sans font-semibold">Phone Number</label>
                      <input 
                        type="text" 
                        value={editForm.phone} 
                        onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500 text-xs font-sans"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 text-xs font-mono animate-fade-in">
                    <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 space-y-1">
                      <div className="text-slate-500 font-sans text-2xs uppercase tracking-wider">Profile Username</div>
                      <div className="text-slate-200 font-semibold">@{selectedUser.username}</div>
                    </div>
                    <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 space-y-1">
                      <div className="text-slate-500 font-sans text-2xs uppercase tracking-wider">Registered Email</div>
                      <div className="text-slate-200 font-semibold truncate">{selectedUser.email}</div>
                    </div>
                    <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 space-y-1">
                      <div className="text-slate-500 font-sans text-2xs uppercase tracking-wider">Contact Number</div>
                      <div className="text-slate-200 font-semibold">{selectedUser.phone || 'N/A'}</div>
                    </div>
                  </div>
                )}

                {/* Subcollection counts */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-2 text-center">
                    <div className="text-lg font-bold text-rose-450">{selectedUserData.tasks.length}</div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-wider font-mono">Tasks</div>
                  </div>
                  <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-2 text-center">
                    <div className="text-lg font-bold text-amber-500">{selectedUserData.routines.length}</div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-wider font-mono">Routines</div>
                  </div>
                  <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-2 text-center">
                    <div className="text-lg font-bold text-indigo-400">
                      {selectedUserData.finances?.transactions?.length || 0}
                    </div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-wider font-mono">Trans</div>
                  </div>
                </div>

                {/* History Logs */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-slate-400" />
                    Modification Audit Logs
                  </h4>
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/40 divide-y divide-slate-850">
                    {selectedUserData.history.length === 0 ? (
                      <div className="p-4 text-center text-[10px] font-mono text-slate-500">No events logged.</div>
                    ) : (
                      selectedUserData.history.map(log => (
                        <div key={log.id} className="p-2.5 text-[10px] flex justify-between items-start gap-3">
                          <div>
                            <span className={`px-1 rounded font-mono uppercase text-[8px] font-bold ${
                              log.action === 'create' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                            }`}>{log.action}</span>
                            <p className="text-slate-300 font-sans mt-0.5 truncate max-w-[110px]">
                              {log.action === 'delete' ? log.dataBefore?.title : log.dataAfter?.title}
                            </p>
                          </div>
                          <span className="text-slate-600 shrink-0 font-mono text-[8px] mt-0.5">
                            {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleDateString() : 'Just now'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Danger zone inside Inspector */}
                <div className="border border-red-500/25 bg-red-500/5 rounded-xl p-3.5 space-y-2.5">
                  <p className="text-[10px] text-slate-500 leading-snug">Wipe all tasks, routines, budgets, logs, and profile records from Cloud Firestore.</p>
                  <button
                    onClick={() => handleDeleteUserData(selectedUser.uid, selectedUser.name)}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-extrabold text-[10px] py-2 rounded-xl transition-all cursor-pointer"
                  >
                    Purge All User Data
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-500 italic text-xs py-16">
                <UserX className="w-8 h-8 text-slate-600 mx-auto mb-2 animate-bounce" />
                Select a user profile from the directory registry to inspect configuration logs and data backups.
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
                Gemini NLP Usage Logs Directory ({filteredLogs.length})
              </h3>
              <p className="text-xs text-slate-400 mt-1">Audit natural language request scopes and structured schema parsing responses.</p>
            </div>
            
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text"
                placeholder="Search audit parameters..."
                value={logsSearch}
                onChange={(e) => setLogsSearch(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto pr-1">
            {filteredLogs.length === 0 ? (
              <div className="col-span-2 text-center py-16 text-xs font-mono text-slate-500 italic">No matching Gemini audit logs found.</div>
            ) : (
              filteredLogs.map(log => (
                <div key={log.id} className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3 text-xs leading-normal">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                      <span className="font-bold text-slate-200">@{log.username}</span>
                      <span className="text-[9px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/25 px-2 py-0.5 rounded uppercase font-bold">
                        {log.action === 'task_nlp_parse' ? 'NLP Parse' : 'HTML Scraping'}
                      </span>
                    </div>

                    {log.inputSnippet && (
                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono font-bold">Input Payload:</span>
                        <p className="bg-slate-900 border border-slate-850 rounded-lg p-2.5 font-mono text-[10px] text-slate-400 break-words leading-relaxed">
                          {log.inputSnippet}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono mt-2 pt-2 border-t border-slate-850">
                    <span>ID: {log.id.slice(0, 10)}...</span>
                    <span>{log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : 'Just now'}</span>
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
            <p className="text-slate-400 text-xs mt-1">Configure whitelists of public IP addresses authorized to fetch registered profiles database collections.</p>
          </div>

          <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-slate-500 text-2xs uppercase tracking-wider font-mono">Your Current Node Endpoint</span>
              <code className="block text-rose-400 font-mono font-bold text-lg mt-0.5">{myIp}</code>
            </div>
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">Connection Verified</span>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-400">Add New Approved Endpoint Node</label>
            <div className="flex gap-2">
              <input 
                type="text"
                placeholder="Enter IP (e.g. 192.168.1.55)"
                value={newIpInput}
                onChange={(e) => setNewIpInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
              <button 
                onClick={handleAddIp}
                className="bg-rose-500 hover:bg-rose-400 text-slate-950 font-extrabold rounded-xl px-4 text-xs transition-all shadow-[0_0_10px_rgba(244,63,94,0.15)] cursor-pointer"
              >
                Add Node
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Authorized Whitelist (Allowed Nodes)</h4>
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/30 divide-y divide-slate-800">
              {allowedIps.length === 0 ? (
                <div className="p-4 text-center text-xs italic text-slate-500">No active IPs whitelisted. Open access enabled (development mode).</div>
              ) : (
                allowedIps.map(ip => (
                  <div key={ip} className="flex justify-between items-center p-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                      <span className="font-mono text-slate-200">{ip}</span>
                      {ip === myIp && <span className="text-[10px] text-slate-500 font-sans italic">(Self)</span>}
                    </div>
                    <button 
                      onClick={() => handleRemoveIp(ip)}
                      className="text-red-400 hover:text-red-300 font-bold hover:underline"
                    >
                      Remove Node
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. REFERENCE HTML CONFIG */}
      {subTab === 'admin-html' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 animate-fade-in">
          <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-bold text-white text-md uppercase tracking-wider flex items-center gap-2">
                <FileCode2 className="w-5 h-5 text-rose-400" />
                Configure Reference Timetable HTML
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Define the markup template loaded when users request standard university calendar samples.</p>
            </div>
            <button
              onClick={handleSaveTemplate}
              disabled={isSavingTemplate}
              className="bg-rose-500 hover:bg-rose-400 text-slate-950 font-extrabold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-[0_0_15px_rgba(244,63,94,0.15)] disabled:opacity-50 shrink-0 animate-pulse"
            >
              {isSavingTemplate ? "Saving..." : "Save Template Settings"}
            </button>
          </div>
          
          {templateMsg && (
            <p className="text-xs text-emerald-400 font-bold animate-pulse">{templateMsg}</p>
          )}
          
          <textarea
            value={templateHtml}
            onChange={(e) => setTemplateHtml(e.target.value)}
            placeholder="Paste raw timetable HTML schedule template code here..."
            rows="16"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-300 focus:outline-none focus:border-rose-500 leading-relaxed"
          />
        </div>
      )}

    </div>
  );
};

export default AdminTab;
