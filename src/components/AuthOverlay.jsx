import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { auth, db } from '../utils/firebase';
import { Orbit, Mail, Lock, User, Phone, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

const AuthOverlay = ({ onAuthSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration specific fields
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateUsername = async (uName) => {
    const cleanUName = uName.trim().toLowerCase();
    if (cleanUName.length < 3) return "Username must be at least 3 characters.";
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUName)) return "Username can only contain letters, numbers, and underscores.";
    return null;
  };

  const handleMigration = async (userUid) => {
    try {
      const batch = writeBatch(db);
      
      // Migrate Tasks
      const localTasks = localStorage.getItem('duevault_tasks');
      if (localTasks) {
        const tasks = JSON.parse(localTasks);
        tasks.forEach(task => {
          const docRef = doc(db, 'users', userUid, 'tasks', task.id);
          batch.set(docRef, task);
        });
      }

      // Migrate Routines
      const localRoutines = localStorage.getItem('duevault_routines');
      if (localRoutines) {
        const routines = JSON.parse(localRoutines);
        routines.forEach(rt => {
          const docRef = doc(db, 'users', userUid, 'routines', rt.id);
          batch.set(docRef, rt);
        });
      }

      // Migrate Finances
      const localFinances = localStorage.getItem('duevault_finances');
      if (localFinances) {
        const finances = JSON.parse(localFinances);
        const docRef = doc(db, 'users', userUid, 'finances', 'data');
        batch.set(docRef, finances);
      }

      // Migrate Timetable Config
      const localConfig = localStorage.getItem('duevault_timetable_config');
      if (localConfig) {
        const config = JSON.parse(localConfig);
        const docRef = doc(db, 'users', userUid, 'config', 'timetable');
        batch.set(docRef, config);
      }

      await batch.commit();

      // Clear local storage entries so we don't re-migrate next time
      localStorage.removeItem('duevault_tasks');
      localStorage.removeItem('duevault_routines');
      localStorage.removeItem('duevault_finances');
      localStorage.removeItem('duevault_timetable_config');
      
      console.log("Local storage data migrated to Firestore successfully!");
    } catch (err) {
      console.error("Migration error:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        // Validation checks
        if (!fullName.trim() || !username.trim() || !phone.trim() || !email.trim() || !password.trim()) {
          throw new Error("All registration fields are required.");
        }
        
        // Username validation
        const usernameError = await validateUsername(username);
        if (usernameError) {
          throw new Error(usernameError);
        }

        // Create user in firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update user display name in Auth
        await updateProfile(user, { displayName: fullName.trim() });

        // Save profile metadata in firestore
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, {
          uid: user.uid,
          name: fullName.trim(),
          username: username.trim().toLowerCase(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          createdAt: serverTimestamp(),
          isAdmin: false, // Managed manually or initialized by first user
          status: 'PENDING' // New registrations start as pending admin approval
        });

        // Clear local storage for registration so new accounts start completely fresh
        localStorage.removeItem('duevault_tasks');
        localStorage.removeItem('duevault_routines');
        localStorage.removeItem('duevault_finances');
        localStorage.removeItem('duevault_timetable_config');

        if (onAuthSuccess) onAuthSuccess(user);

      } else {
        // Sign In
        if (!email.trim() || !password.trim()) {
          throw new Error("Email and password are required.");
        }

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Perform migration if user profile exists but data was created offline
        await handleMigration(user.uid);
        if (onAuthSuccess) onAuthSuccess(user);
      }
    } catch (err) {
      let msg = err.message;
      if (msg.includes("auth/user-not-found") || msg.includes("auth/wrong-password") || msg.includes("auth/invalid-credential")) {
        msg = "Invalid email or password.";
      } else if (msg.includes("auth/email-already-in-use")) {
        msg = "An account with this email already exists.";
      } else if (msg.includes("auth/weak-password")) {
        msg = "Password should be at least 6 characters.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-4 z-[999] overflow-y-auto">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="bg-cyan-500/20 p-3 rounded-2xl mb-3 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Orbit className="w-8 h-8 text-cyan-400 animate-spin-slow" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
            DueVault AI
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isRegistering ? "Register your vault security profile" : "Initialize encrypted synchronization portal"}
          </p>
        </div>

        {/* Security / Compliance Note */}
        <div className="mb-6 bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex gap-2.5 items-start text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-200">Compliance & Security Policy:</span>
            <p className="mt-0.5 text-[11px] leading-relaxed">
              All tasks and budgets are protected using database rules. Modification logs are recorded for data recovery services. Gemini Keys remain stored locally on your device.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex gap-2 text-rose-200 text-xs items-center animate-shake">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <>
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              {/* Unique Username */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Username</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="johndoe12"
                    className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555-0199"
                    className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email Address */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Security Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white font-bold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isRegistering ? (
              "Initialize Profile"
            ) : (
              "Secure Authorization"
            )}
          </button>
        </form>

        {/* Toggle between Register/Login */}
        <div className="mt-6 text-center text-xs text-slate-400 border-t border-slate-800/80 pt-4">
          {isRegistering ? (
            <p>
              Already registered?{' '}
              <button
                onClick={() => { setIsRegistering(false); setError(''); }}
                className="text-cyan-400 hover:text-cyan-300 font-semibold underline cursor-pointer"
              >
                Sign In
              </button>
            </p>
          ) : (
            <p>
              First time deploying?{' '}
              <button
                onClick={() => { setIsRegistering(true); setError(''); }}
                className="text-cyan-400 hover:text-cyan-300 font-semibold underline cursor-pointer"
              >
                Create Security Profile
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
};

export default AuthOverlay;
