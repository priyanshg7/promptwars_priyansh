import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import { Layers, LogOut, Loader2, Sparkles } from 'lucide-react';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('auth_token_v1') || '');
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login'); // 'login' | 'register' | 'dashboard'
  const [appLoading, setAppLoading] = useState(true);

  // Authenticate user on mount if token exists
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        setAppLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data);
          setView('dashboard');
        } else {
          // Token is invalid/expired, clear it
          localStorage.removeItem('auth_token_v1');
          setToken('');
          setUser(null);
          setView('login');
        }
      } catch (err) {
        console.error('Failed to auto-authenticate:', err);
      } finally {
        setAppLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  const handleLoginSuccess = (userToken, userData) => {
    setToken(userToken);
    setUser(userData);
    setView('dashboard');
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      localStorage.removeItem('auth_token_v1');
      setToken('');
      setUser(null);
      setView('login');
    }
  };

  if (appLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        <span className="text-xs font-semibold text-gray-500 font-space uppercase">Loading Environment...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans relative antialiased selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Top minimal navigation bar */}
      <header className="w-full bg-white border-b border-gray-200 py-3.5 px-4 md:px-8 z-30 shadow-sm sticky top-0">
        <div className="max-w-4xl mx-auto flex justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span className="font-space font-bold text-gray-900 text-sm tracking-tight">Pact Portal</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[11px] font-semibold text-gray-500 hidden sm:inline-flex items-center gap-1 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-md">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              Full-Stack Boilerplate
            </span>
            {user && (
              <button
                onClick={handleLogout}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 bg-white border border-gray-200 hover:border-rose-100 px-2.5 py-1 rounded-md transition-colors cursor-pointer focus:ring-2 focus:ring-rose-500 focus:outline-none"
              >
                <LogOut className="w-3 h-3" />
                Logout
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col justify-center py-8">
        {view === 'login' && (
          <div className="flex justify-center px-4">
            <Login 
              onLoginSuccess={handleLoginSuccess} 
              toggleView={() => setView('register')} 
            />
          </div>
        )}

        {view === 'register' && (
          <div className="flex justify-center px-4">
            <Register 
              onRegisterSuccess={handleLoginSuccess} 
              toggleView={() => setView('login')} 
            />
          </div>
        )}

        {view === 'dashboard' && user && (
          <Dashboard 
            user={user} 
            token={token} 
            onLogout={handleLogout} 
          />
        )}
      </main>

      {/* simple accessible footer */}
      <footer className="border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-400 font-space">
        <p>© 2026 Pact Inc. All cryptographic handshakes and database connections are fully secured.</p>
      </footer>

    </div>
  );
}
