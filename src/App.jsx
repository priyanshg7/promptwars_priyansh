import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Flame, 
  Loader2, 
  LogIn, 
  UserPlus,
  Globe
} from 'lucide-react';
import { auth, db } from './firebase';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import UserProfile from './components/UserProfile';
import './i18n'; // Bootstrap translations

export default function App() {
  const { i18n } = useTranslation();
  
  // Auth state
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // User profile
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Email form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  // Navigation View: 'dashboard' | 'profile'
  const [activeView, setActiveView] = useState('dashboard');

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
        setActiveView('dashboard');
      }
    });

    return () => unsubscribe();
  }, [i18n]);

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
      setLoginError(err.message || 'Invalid email or password.');
    } finally {
      setSigningIn(false);
    }
  };

  const handleRegisterEmail = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!registerName.trim()) {
      setLoginError('Please provide your full name.');
      return;
    }
    setSigningIn(true);
    try {
      await auth.registerWithEmailAndPassword(registerName.trim(), email, password);
    } catch (err) {
      setLoginError(err.message || 'Registration failed.');
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
    if (window.confirm("Are you sure you want to reset all data and restart the setup onboarding?")) {
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
      <div className="min-h-screen bg-[#0b0f19] flex flex-col justify-center items-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-[#00A389]" />
        <span className="text-xs font-semibold text-slate-400 font-space uppercase tracking-widest">
          Calibrating StressRadar...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col selection:bg-[#00A389]/20 selection:text-white font-sans text-slate-300">
      
      {/* Top Navigation Bar */}
      <header className="w-full bg-[#0d1321]/80 border-b border-slate-800/80 py-4 px-4 md:px-8 z-30 shadow-md sticky top-0 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center gap-4">
          
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveView('dashboard')}>
            <div className="w-8 h-8 rounded-md bg-[#00A389] flex items-center justify-center text-white shadow-sm">
              <Flame className="w-5 h-5 fill-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-space font-bold text-white text-sm tracking-tight leading-none">StressRadar</span>
              <span className="text-[8px] uppercase tracking-wider font-bold text-[#00A389]">Student Wellness Tracker</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Global Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="text-[10px] font-bold text-slate-300 hover:text-white flex items-center gap-1 bg-slate-900 border border-slate-800 hover:border-slate-700 px-2.5 py-1.5 rounded-md transition-all cursor-pointer focus:outline-none"
            >
              <Globe className="w-3.5 h-3.5 text-[#00A389]" />
              {i18n.language === 'hi' ? 'English' : 'हिन्दी'}
            </button>

            {profile && (
              <button
                onClick={handleLogout}
                className="text-[10px] font-bold text-rose-400 hover:text-rose-500 bg-slate-900 border border-slate-800 hover:border-slate-700 px-2.5 py-1.5 rounded-md transition-all cursor-pointer focus:outline-none"
              >
                Reset App / Clear Data
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Body Routing Area */}
      <main className="flex-1 flex flex-col justify-center py-8 px-4 md:px-8 max-w-6xl w-full mx-auto">
        {!currentUser ? (
          
          /* LOGIN / REGISTER PORTAL */
          <div className="w-full max-w-md mx-auto glass-card rounded-lg p-6 md:p-8 shadow-2xl flex flex-col gap-6 animate-scale-up relative overflow-hidden bg-slate-900/40 border border-slate-800">
            <div className="absolute -right-12 -top-12 w-28 h-28 bg-[#00A389]/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex flex-col gap-1 text-center">
              <div className="mx-auto w-12 h-12 rounded-md bg-[#00A389]/10 border border-[#00A389]/20 flex items-center justify-center text-[#00A389] shadow-sm mb-2">
                <Flame className="w-7 h-7 fill-[#00A389]/10" />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white">
                {isRegisterMode ? 'Create Student Profile' : 'StressRadar Portal'}
              </h1>
              <p className="text-xs text-slate-400 max-w-[280px] mx-auto leading-relaxed">
                Empowering Indian competitive students with real-time mental health & performance insights.
              </p>
            </div>

            {loginError && (
              <div className="p-3 bg-rose-950/40 border border-rose-500/30 text-rose-400 rounded-md text-xs font-semibold leading-relaxed">
                {loginError}
              </div>
            )}

            <form onSubmit={isRegisterMode ? handleRegisterEmail : handleSignInEmail} className="flex flex-col gap-4">
              
              {isRegisterMode && (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="register-name" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    id="register-name"
                    type="text"
                    required
                    placeholder="Priyansh Gupta"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    className="premium-input w-full"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label htmlFor="login-email" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Student Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  placeholder="student@exam.res"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="premium-input w-full"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="login-password" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="premium-input w-full font-space"
                />
              </div>

              <button
                type="submit"
                disabled={signingIn}
                className="mt-2 w-full bg-[#00A389] hover:bg-[#008e77] text-white py-2.5 text-xs font-bold rounded-md transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {signingIn ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : isRegisterMode ? (
                  <UserPlus className="w-4 h-4" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                {isRegisterMode ? 'Register Account' : 'Sign In to Tracker'}
              </button>
            </form>

            <div className="text-center text-xs">
              {isRegisterMode ? (
                <p className="text-slate-400">
                  Already have an account?{' '}
                  <button 
                    onClick={() => {
                      setIsRegisterMode(false);
                      setLoginError('');
                    }}
                    className="text-[#00A389] hover:underline font-bold bg-transparent border-none cursor-pointer"
                  >
                    Sign In
                  </button>
                </p>
              ) : (
                <p className="text-slate-400">
                  Don't have an account?{' '}
                  <button 
                    onClick={() => {
                      setIsRegisterMode(true);
                      setLoginError('');
                    }}
                    className="text-[#00A389] hover:underline font-bold bg-transparent border-none cursor-pointer"
                  >
                    Register
                  </button>
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 text-slate-650 my-1">
              <div className="h-px flex-1 bg-slate-800" />
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500">Or Quick Demo Entry</span>
              <div className="h-px flex-1 bg-slate-800" />
            </div>

            <button
              onClick={handleSignInGoogle}
              disabled={signingIn}
              className="w-full py-2.5 bg-slate-950 border border-slate-800 hover:bg-slate-900 hover:text-white rounded-md text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 text-slate-300"
            >
              <LogIn className="w-4 h-4 text-[#00A389]" />
              Enter with Mock Google Credentials
            </button>
          </div>
        ) : !profile ? (
          
          /* ONBOARDING FLOW */
          <div className="bg-[#0b0f19] p-4 rounded-lg">
            <Onboarding user={currentUser} onComplete={handleOnboardingComplete} />
          </div>
        ) : activeView === 'profile' ? (
          
          /* USER PROFILE SETTINGS VIEW */
          <UserProfile 
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            onBack={() => setActiveView('dashboard')}
          />
        ) : (
          
          /* DASHBOARD VIEW */
          <Dashboard 
            profile={profile} 
            onUpdateProfile={handleUpdateProfile} 
            onLogout={handleLogout} 
            onProfileToggle={() => setActiveView('profile')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0d1321]/60 py-6 text-center text-xs text-slate-500 font-space z-10">
        <p>© 2026 StressRadar Inc. Powered by Google Gemini AI & Express + MongoDB.</p>
      </footer>

    </div>
  );
}
