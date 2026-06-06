import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Sparkles, 
  LogOut, 
  Database, 
  KeyRound, 
  User, 
  Mail, 
  Bot, 
  Trash2, 
  Loader2,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function Dashboard({ user, token, onLogout }) {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', text: `Hi ${user.name}! I am Gemini, your AI partner. How can I help you build today?` }
  ]);
  const [loading, setLoading] = useState(false);
  
  // Status check state
  const [dbState, setDbState] = useState('checking'); // 'connected' | 'disconnected' | 'checking'
  const [geminiState, setGeminiState] = useState('checking'); // 'configured' | 'missing' | 'checking'
  
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Ping health & status endpoints
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const healthRes = await fetch('/api/health');
        if (healthRes.ok) {
          const healthData = await healthRes.json();
          setDbState(healthData.dbState === 'connected' ? 'connected' : 'disconnected');
        } else {
          setDbState('disconnected');
        }
      } catch (err) {
        setDbState('disconnected');
      }

      try {
        const geminiRes = await fetch('/api/gemini/status', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          setGeminiState(geminiData.configured ? 'configured' : 'missing');
        } else {
          setGeminiState('missing');
        }
      } catch (err) {
        setGeminiState('missing');
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10000); // Check status every 10 seconds
    return () => clearInterval(interval);
  }, [token]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    const userMessage = prompt.trim();
    setPrompt('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt: userMessage })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error communicating with Gemini.');
      }

      setMessages(prev => [...prev, { role: 'assistant', text: data.text }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: `System Error: ${err.message}`, isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      { role: 'assistant', text: `Chat cleared. How can I help you now, ${user.name}?` }
    ]);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 flex flex-col gap-6 md:gap-8 animate-fade-in">
      
      {/* Upper Welcome and Health Status Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* User Card */}
        <div className="bg-white border border-gray-200 rounded-md p-5 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div className="flex flex-col gap-0.5 overflow-hidden">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Logged In User</span>
            <span className="text-sm font-bold text-gray-900 truncate">{user.name}</span>
            <span className="text-xs text-gray-500 truncate">{user.email}</span>
          </div>
        </div>

        {/* Database connection Card */}
        <div className="bg-white border border-gray-200 rounded-md p-5 shadow-sm flex items-start gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            dbState === 'connected' 
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
              : dbState === 'disconnected'
              ? 'bg-rose-50 text-rose-600 border border-rose-100'
              : 'bg-amber-50 text-amber-600 border border-amber-100'
          }`}>
            <Database className="w-5 h-5" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Database Status</span>
            <span className="text-sm font-bold text-gray-900 font-space flex items-center gap-1.5">
              MongoDB Atlas
              <span className={`w-2 h-2 rounded-full ${
                dbState === 'connected' ? 'bg-emerald-500 animate-pulse' : dbState === 'disconnected' ? 'bg-rose-500' : 'bg-amber-500'
              }`} />
            </span>
            <span className="text-xs text-gray-500 font-space font-medium uppercase">
              {dbState === 'connected' ? 'Connected' : dbState === 'disconnected' ? 'Disconnected' : 'Checking...'}
            </span>
          </div>
        </div>

        {/* Gemini API status Card */}
        <div className="bg-white border border-gray-200 rounded-md p-5 shadow-sm flex items-start gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            geminiState === 'configured' 
              ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
              : geminiState === 'missing'
              ? 'bg-rose-50 text-rose-600 border border-rose-100'
              : 'bg-amber-50 text-amber-600 border border-amber-100'
          }`}>
            <KeyRound className="w-5 h-5" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">AI Service Status</span>
            <span className="text-sm font-bold text-gray-900 font-space flex items-center gap-1.5">
              Gemini API
              <span className={`w-2 h-2 rounded-full ${
                geminiState === 'configured' ? 'bg-emerald-500 animate-pulse' : geminiState === 'missing' ? 'bg-rose-500' : 'bg-amber-500'
              }`} />
            </span>
            <span className="text-xs text-gray-500 font-space font-medium uppercase">
              {geminiState === 'configured' ? 'Configured' : geminiState === 'missing' ? 'Key Missing' : 'Checking...'}
            </span>
          </div>
        </div>

      </section>

      {/* Main Chat Area */}
      <section className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden flex flex-col h-[520px]">
        {/* Chat header */}
        <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-600">
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-900">Gemini 1.5 Flash Chat</span>
              <span className="text-[10px] text-gray-500">Fast, text-generation assistant sandbox</span>
            </div>
          </div>
          
          <button
            onClick={clearChat}
            className="text-xs text-gray-500 hover:text-rose-600 flex items-center gap-1 hover:bg-rose-50 border border-transparent hover:border-rose-100 px-2.5 py-1.5 rounded-md transition-all cursor-pointer focus:outline-none"
            title="Clear Chat Logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 bg-gray-50/20">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white font-space' 
                  : msg.isError
                  ? 'bg-rose-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}>
                {msg.role === 'user' ? user.name.slice(0, 1).toUpperCase() : 'G'}
              </div>
              <div className={`p-3 rounded-md text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : msg.isError
                  ? 'bg-rose-50 border border-rose-100 text-rose-700'
                  : 'bg-white border border-gray-200 text-gray-900 shadow-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 max-w-[85%] self-start animate-pulse">
              <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-xs font-bold shrink-0">
                G
              </div>
              <div className="p-3 bg-white border border-gray-200 text-gray-500 rounded-md text-xs shadow-sm flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                Gemini is thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white flex gap-3">
          <input
            type="text"
            required
            disabled={loading || geminiState !== 'configured'}
            placeholder={
              geminiState === 'configured' 
                ? "Ask Gemini anything (e.g. Write a javascript function to merge two arrays...)" 
                : "Configure Gemini API Key in .env to chat"
            }
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="flex-1 px-3.5 py-2 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed font-semibold text-gray-900 h-[38px]"
          />
          <button
            type="submit"
            disabled={loading || !prompt.trim() || geminiState !== 'configured'}
            className="h-[38px] px-4.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md transition-all shadow-sm flex items-center justify-center gap-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-xs"
          >
            Send
            <Send className="w-3 h-3" />
          </button>
        </form>
      </section>

    </div>
  );
}
