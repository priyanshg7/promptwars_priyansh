import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function Register({ onRegisterSuccess, toggleView }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed. Please try again.');
      }

      // Save token & user to state/localStorage
      localStorage.setItem('auth_token_v1', data.token);
      onRegisterSuccess(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white border border-gray-200 rounded-md p-6 md:p-8 shadow-sm flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col gap-1.5 text-center">
        <div className="mx-auto w-10 h-10 rounded-md bg-indigo-600 flex items-center justify-center text-white font-space font-bold text-xl shadow-sm mb-2">
          P
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Create an Account</h1>
        <p className="text-xs text-gray-500">
          Sign up to gain access to your Pact full-stack environment
        </p>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-md text-xs font-semibold leading-relaxed">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Name Input */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Full Name
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <User className="w-4 h-4" />
            </span>
            <input
              id="name"
              type="text"
              required
              disabled={loading}
              placeholder="Priyansh Gupta"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed font-semibold text-gray-900"
            />
          </div>
        </div>

        {/* Email Input */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Email Address
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <Mail className="w-4 h-4" />
            </span>
            <input
              id="email"
              type="email"
              required
              disabled={loading}
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed font-semibold text-gray-900"
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <Lock className="w-4 h-4" />
            </span>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              disabled={loading}
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-9 pr-10 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed font-semibold text-gray-900"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 text-sm font-semibold rounded-md transition-all shadow-sm flex items-center justify-center gap-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating account...
            </>
          ) : (
            'Sign Up'
          )}
        </button>
      </form>

      <div className="text-center text-xs text-gray-500">
        Already have an account?{' '}
        <button
          type="button"
          onClick={toggleView}
          disabled={loading}
          className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline focus:outline-none cursor-pointer"
        >
          Log in here
        </button>
      </div>
    </div>
  );
}
