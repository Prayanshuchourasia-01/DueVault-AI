import React, { useState, useEffect } from 'react';
import { db } from '../../utils/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc,
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { 
  ShieldAlert, 
  Users, 
  Terminal, 
  History, 
  DownloadCloud, 
  Globe, 
  CheckCircle, 
  AlertTriangle,
  UserCheck,
  RefreshCw,
  Search
} from 'lucide-react';

const AdminTab = () => {
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
        // Fallback to true if Firestore read fails due to offline context, but keep warning
        setIpAuthorized(false);
      } finally {
        setLoadingIp(false);
      }
    };

    checkIpAuthorization();
  }, []);

  // 2. Fetch User Directory and Gemini Logs (only if IP and Firebase Auth Admin matches)
  const fetchAdminData = async () => {
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
  };

  useEffect(() => {
    if (ipAuthorized) {
      fetchAdminData();
    }
  }, [ipAuthorized]);

  // 3. Fetch detailed user subcollections for backups/history
  const handleSelectUser = async (user) => {
    setSelectedUser(user);
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

  // Timetable HTML Template states & handlers
  const [templateHtml, setTemplateHtml] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [templateMsg, setTemplateMsg] = useState('');

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

  // Filtered Users
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filtered Gemini Logs
  const filteredLogs = geminiLogs.filter(l => 
    l.username.toLowerCase().includes(logsSearch.toLowerCase()) ||
    l.action.toLowerCase().includes(logsSearch.toLowerCase()) ||
    l.inputSnippet.toLowerCase().includes(logsSearch.toLowerCase())
  );

  if (loadingIp) {
    return (
      <div className="w-full h-[60vh] flex flex-col justify-center items-center gap-3">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
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
            <Globe className="w-4 h-4 text-cyan-400" />
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
            <UserCheck className="w-6 h-6 text-cyan-400" />
            Administrative Command Portal
          </h2>
          <p className="text-slate-400 text-sm">Monitor user registration statistics, audit Gemini AI endpoints, and export vault recovery folders.</p>
        </div>
        <button 
          onClick={fetchAdminData}
          disabled={loadingData}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin' : ''}`} />
          Refresh Registry
        </button>
      </div>

      {statusMsg && (
        <div className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-200 text-sm rounded-xl p-4 animate-fade-in flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-cyan-400 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Main Grid: User Directory and Audits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: User list & detail */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* User List Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                User Directory ({filteredUsers.length})
              </h3>
              
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text"
                  placeholder="Search name, username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/40">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-mono uppercase tracking-wider text-slate-400 bg-slate-900/40">
                    <th className="p-3 pl-4">Name / Username</th>
                    <th className="p-3">Email Address</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3 text-right pr-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-sm text-slate-300">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-slate-500 font-mono text-xs">No registered profiles detected.</td>
                    </tr>
                  ) : (
                    filteredUsers.map(user => (
                      <tr 
                        key={user.uid} 
                        className={`hover:bg-slate-800/30 transition-colors cursor-pointer ${selectedUser?.uid === user.uid ? 'bg-indigo-500/5 border-l-2 border-l-indigo-500' : ''}`}
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
                        <td className="p-3 text-slate-400">{user.phone}</td>
                        <td className="p-3 text-right pr-4">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleSelectUser(user); }}
                            className="text-xs text-cyan-400 font-bold hover:underline"
                          >
                            Inspect Profile
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* User Details Inspector (conditional) */}
          {selectedUser && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 animate-slide-up">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Inspector: {selectedUser.name}
                    {selectedUser.status === 'PENDING' && !selectedUser.isAdmin && (
                      <span className="bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Pending Approval</span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">UID: {selectedUser.uid}</p>
                </div>
                <button 
                  onClick={downloadUserBackup}
                  className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                >
                  <DownloadCloud className="w-4 h-4" /> Download Backup folder
                </button>
              </div>

              {/* Approval Action Card */}
              {selectedUser.status === 'PENDING' && !selectedUser.isAdmin && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in">
                  <div>
                    <h4 className="text-sm font-bold text-rose-300">Account Authorization Required</h4>
                    <p className="text-xs text-slate-400 mt-1">This user is currently blocked from accessing DueVault AI. Approve them below to grant entry.</p>
                  </div>
                  <button
                    onClick={() => handleApproveUser(selectedUser.uid)}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] cursor-pointer shrink-0"
                  >
                    Approve Access
                  </button>
                </div>
              )}

              {/* Data Summary counts */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-cyan-400">{selectedUserData.tasks.length}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Tasks stored</div>
                </div>
                <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-indigo-400">{selectedUserData.routines.length}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Routines stored</div>
                </div>
                <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-emerald-400">
                    {selectedUserData.finances?.transactions?.length || 0}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Transactions</div>
                </div>
              </div>

              {/* Modification History Logs */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-slate-400" />
                  Historical Modification History (Last 50 entries)
                </h4>
                
                <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-800/80 bg-slate-950/40 divide-y divide-slate-800/40">
                  {selectedUserData.history.length === 0 ? (
                    <div className="p-6 text-center text-xs font-mono text-slate-500">No modifications logged yet (pure sync state).</div>
                  ) : (
                    selectedUserData.history.map(log => (
                      <div key={log.id} className="p-3 text-xs flex justify-between items-start gap-4 hover:bg-slate-900/30 transition-colors">
                        <div>
                          <div className="font-semibold flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded font-mono uppercase tracking-wider text-[9px] font-bold ${
                              log.action === 'create' ? 'bg-emerald-500/10 text-emerald-400' :
                              log.action === 'update' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'
                            }`}>
                              {log.action}
                            </span>
                            <span className="text-slate-300 font-mono capitalize">{log.entity} item</span>
                          </div>
                          <div className="text-slate-400 mt-1">
                            {log.action === 'delete' ? (
                              <span className="font-semibold text-slate-300">"{log.dataBefore?.title}"</span>
                            ) : (
                              <span className="font-semibold text-slate-300">"{log.dataAfter?.title}"</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-slate-500 font-mono text-[10px] shrink-0 mt-0.5">
                          {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : 'Just now'}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {!selectedUser && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 animate-slide-up">
              <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                    Configure Demo Timetable HTML
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Define the reference template downloaded by users in the Settings tab.</p>
                </div>
                <button
                  onClick={handleSaveTemplate}
                  disabled={isSavingTemplate}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-[0_0_15px_rgba(79,70,229,0.2)] disabled:opacity-50 shrink-0"
                >
                  {isSavingTemplate ? "Saving..." : "Save Template"}
                </button>
              </div>
              {templateMsg && (
                <p className="text-xs text-emerald-400 font-bold animate-pulse">{templateMsg}</p>
              )}
              <textarea
                value={templateHtml}
                onChange={(e) => setTemplateHtml(e.target.value)}
                placeholder="Paste weekly HTML schedule markup template here..."
                rows="12"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500 leading-relaxed"
              />
            </div>
          )}

        </div>

        {/* Right 1 Column: Gemini logs and IP settings */}
        <div className="space-y-6">
          
          {/* IP Whitelist Manager */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-md font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Globe className="w-5 h-5 text-cyan-400" />
              IP Whitelist Authorization
            </h3>
            
            <div className="text-xs text-slate-400 space-y-2">
              <p>Your Current Public IP:</p>
              <code className="block bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800 text-cyan-400 font-mono font-bold text-sm text-center">{myIp}</code>
            </div>

            {/* Whitelisted IP list */}
            <div className="space-y-2 pt-2">
              <p className="text-xs font-semibold text-slate-400">Whitelisted IPs:</p>
              <div className="max-h-36 overflow-y-auto space-y-1.5">
                {allowedIps.map(ip => (
                  <div key={ip} className="flex justify-between items-center bg-slate-950/50 rounded-lg p-2 border border-slate-800 text-xs">
                    <span className="font-mono text-slate-300">{ip}</span>
                    <button 
                      onClick={() => handleRemoveIp(ip)}
                      className="text-rose-400 hover:text-rose-300 font-bold hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Add IP */}
            <div className="flex gap-2 pt-2">
              <input 
                type="text"
                placeholder="Add IP (e.g. 192.168.1.1)"
                value={newIpInput}
                onChange={(e) => setNewIpInput(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
              <button 
                onClick={handleAddIp}
                className="bg-cyan-500/20 hover:bg-cyan-500 text-cyan-400 hover:text-white border border-cyan-500/30 rounded-xl px-3 text-xs font-bold transition-all"
              >
                Add
              </button>
            </div>
          </div>

          {/* Gemini Usage Logs */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col gap-2 border-b border-slate-800 pb-3">
              <h3 className="text-md font-bold text-white flex items-center gap-2">
                <Terminal className="w-5 h-5 text-indigo-400" />
                Gemini NLP Usage Logs
              </h3>
              <input 
                type="text"
                placeholder="Filter logs..."
                value={logsSearch}
                onChange={(e) => setLogsSearch(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-[11px] text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2 pr-1.5 divide-y divide-slate-800/50">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-xs font-mono text-slate-500">No Gemini audit events logged.</div>
              ) : (
                filteredLogs.map(log => (
                  <div key={log.id} className="pt-2.5 text-xs space-y-1.5">
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-slate-200">@{log.username}</span>
                      <span className="text-[9px] font-mono bg-slate-800 text-indigo-400 px-1.5 py-0.5 rounded uppercase font-bold shrink-0">{log.action === 'task_nlp_parse' ? 'NLP Parse' : 'HTML Parse'}</span>
                    </div>
                    
                    {log.inputSnippet && (
                      <p className="bg-slate-950/60 border border-slate-800 rounded-lg p-2 font-mono text-[10px] text-slate-400 break-words leading-relaxed">
                        {log.inputSnippet}
                      </p>
                    )}

                    <div className="text-[10px] text-slate-500 font-mono text-right">
                      {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : 'Just now'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default AdminTab;
