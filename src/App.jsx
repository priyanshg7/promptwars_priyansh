import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Flame, 
  Loader2, 
  Sparkles, 
  LogIn, 
  ShieldCheck, 
  ArrowRight,
  Globe
} from 'lucide-react';
import { auth, db } from './firebase';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import './i18n'; // Bootstrap translations

export default function App() {
  const { t, i18n } = useTranslation();
  
  // Auth state
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // User profile
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Email form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      
      if (user) {
        setProfileLoading(true);
        try {
          const doc = await db.getDoc("users", user.uid);
          if (doc.exists()) {
            const data = doc.data();
            setProfile(data);
            if (data.language) {
              i18n.changeLanguage(data.language);
            }
          } else {
            setProfile(null);
          }
        } catch (err) {
          console.error("Error loading user profile:", err);
        } finally {
          setProfileLoading(false);
        }
      } else {
        setProfile(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignInGoogle = async () => {
    setLoginError('');
    setSigningIn(true);
    try {
      await auth.signInWithGoogle();
    } catch (err) {
      setLoginError(err.message || 'Failed to authenticate.');
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignInEmail = async (e) => {
    e.preventDefault();
    setLoginError('');
    setSigningIn(true);
    try {
      await auth.signInWithEmailAndPassword(email, password);
    } catch (err) {
      setLoginError(err.message || 'Invalid credentials.');
    } finally {
      setSigningIn(false);
    }
  };

  const handleOnboardingComplete = (newProfile) => {
    setProfile(newProfile);
  };

  const handleUpdateProfile = (updatedProfile) => {
    setProfile(updatedProfile);
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out of StressRadar?")) {
      await auth.signOut();
    }
  };

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'hi' ? 'en' : 'hi';
    i18n.changeLanguage(nextLang);
    if (profile) {
      const updated = { ...profile, language: nextLang };
      setProfile(updated);
      db.updateDoc("users", profile.uid, { language: nextLang });
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-[#060B18] flex flex-col justify-center items-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-[#00C9B0]" />
        <span className="text-xs font-semibold text-gray-500 font-space uppercase tracking-widest">
          Calibrating StressRadar...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060B18] flex flex-col selection:bg-[#00C9B0]/20 selection:text-white font-sans text-gray-200">
      
      {/* Dynamic Top Navigation Bar */}
      <header className="w-full bg-slate-950/20 border-b border-slate-900 py-4 px-4 md:px-8 z-30 shadow-sm sticky top-0 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center gap-4">
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-[#00C9B0] flex items-center justify-center text-slate-950 shadow-sm">
              <Flame className="w-5 h-5 fill-slate-950" />
            </div>
            <div className="flex flex-col">
              <span className="font-space font-bold text-white text-sm tracking-tight leading-none">StressRadar</span>
              <span className="text-[8px] uppercase tracking-wider font-bold text-[#00C9B0]">PromptWars Demo</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Global Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="text-[10px] font-bold text-gray-400 hover:text-white flex items-center gap-1 bg-slate-900/60 border border-slate-800 hover:border-slate-750 px-2.5 py-1.5 rounded-md transition-all cursor-pointer focus:outline-none"
            >
              <Globe className="w-3.5 h-3.5 text-[#00C9B0]" />
              {i18n.language === 'hi' ? 'English' : 'हिन्दी'}
            </button>

            {currentUser && (
              <button
                onClick={handleLogout}
                className="text-[10px] font-bold text-rose-500 hover:text-rose-600 bg-slate-900/60 border border-slate-800 hover:border-slate-750 px-2.5 py-1.5 rounded-md transition-all cursor-pointer focus:outline-none"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Body Routing Area */}
      <main className="flex-1 flex flex-col justify-center py-8 px-4 md:px-8 max-w-6xl w-full mx-auto">
        {!currentUser ? (
          
          /* LOGIN SCREEN */
          <div className="w-full max-w-md mx-auto glass-card border border-slate-800/80 rounded-md p-6 md:p-8 shadow-xl flex flex-col gap-6 animate-scale-up relative overflow-hidden">
            <div className="absolute -right-12 -top-12 w-28 h-28 bg-[#00C9B0]/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex flex-col gap-1 text-center">
              <div className="mx-auto w-12 h-12 rounded-md bg-[#00C9B0]/10 border border-[#00C9B0]/20 flex items-center justify-center text-[#00C9B0] shadow-sm mb-2">
                <Flame className="w-7 h-7 fill-[#00C9B0]/20" />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white">StressRadar Portal</h1>
              <p className="text-xs text-gray-500 max-w-[280px] mx-auto leading-relaxed">
                Empowering Indian competitive students with real-time mental health & performance insights.
              </p>
            </div>

            {loginError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-md text-xs font-semibold leading-relaxed">
                {loginError}
              </div>
            )}

            <form onSubmit={handleSignInEmail} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="login-email" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Student Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  placeholder="student@exam.res"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-800 bg-slate-950/40 rounded-md text-white focus:ring-2 focus:ring-[#00C9B0] focus:outline-none placeholder-gray-600 font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="login-password" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-800 bg-slate-950/40 rounded-md text-white focus:ring-2 focus:ring-[#00C9B0] focus:outline-none placeholder-gray-600 font-semibold font-space"
                />
              </div>

              <button
                type="submit"
                disabled={signingIn}
                className="mt-2 w-full bg-[#00C9B0] hover:bg-[#00b29c] text-[#060B18] py-2 text-xs font-bold rounded-md transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {signingIn ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-4 h-4" />}
                Sign In to Tracker
              </button>
            </form>

            <div className="flex items-center gap-2 text-gray-600 my-1">
              <div className="h-px flex-1 bg-slate-850" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Or Quick Demo Entry</span>
              <div className="h-px flex-1 bg-slate-850" />
            </div>

            <button
              onClick={handleSignInGoogle}
              disabled={signingIn}
              className="w-full py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-white rounded-md text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 focus:ring-2 focus:ring-[#00C9B0] focus:outline-none"
            >
              <LogIn className="w-4 h-4 text-[#00C9B0]" />
              Enter with Mock Google Credentials
            </button>
          </div>
        ) : !profile ? (
          
          /* ONBOARDING FLOW */
          <Onboarding user={currentUser} onComplete={handleOnboardingComplete} />
        ) : (
          
          /* DASHBOARD VIEW */
          <Dashboard 
            profile={profile} 
            onUpdateProfile={handleUpdateProfile} 
            onLogout={handleLogout} 
          />
        )}
      </main>

      {/* simple accessible footer */}
      <footer className="border-t border-slate-900/60 bg-slate-950/10 py-6 text-center text-xs text-gray-500 font-space z-10">
        <p>© 2026 StressRadar Inc. Powered by Google Gemini AI & Firebase Firestore.</p>
      </footer>

    </div>
  );
}
