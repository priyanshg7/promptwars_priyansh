import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  User, 
  Lock, 
  Mail, 
  BookOpen, 
  ShieldCheck, 
  Loader2, 
  Check, 
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { db } from '../firebase';

const EXAMS = [
  { id: 'jee_mains', name: 'JEE Mains', category: 'Engineering', date: '2027-01-24T09:00:00' },
  { id: 'jee_advanced', name: 'JEE Advanced', category: 'Engineering', date: '2027-05-28T09:00:00' },
  { id: 'neet_ug', name: 'NEET UG', category: 'Medical', date: '2027-05-07T09:00:00' },
  { id: 'neet_pg', name: 'NEET PG', category: 'Medical', date: '2027-06-23T09:00:00' },
  { id: 'upsc_cse', name: 'UPSC CSE', category: 'Civil Services', date: '2026-06-07T09:00:00' },
  { id: 'cat', name: 'CAT', category: 'Management', date: '2026-11-29T09:00:00' },
  { id: 'gate', name: 'GATE', category: 'Engineering / PG', date: '2027-02-06T09:00:00' },
  { id: 'cuet', name: 'CUET', category: 'UG University', date: '2027-05-15T09:00:00' },
  { id: 'boards_10', name: 'Board Exam Class 10', category: 'School Boards', date: '2027-03-01T09:00:00' },
  { id: 'boards_12', name: 'Board Exam Class 12', category: 'School Boards', date: '2027-02-15T09:00:00' }
];

export default function UserProfile({ profile, onUpdateProfile, onBack }) {
  const { t } = useTranslation();
  
  // Profile state
  const [name, setName] = useState(profile.name || '');
  const [email, setEmail] = useState(profile.email || '');
  const [grade, setGrade] = useState(profile.grade || '');
  const [selectedExams, setSelectedExams] = useState(
    EXAMS.filter(e => profile.targetExams?.includes(e.name))
  );
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('stressradar_gemini_api_key') || '');
  
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleToggleExam = (exam) => {
    if (selectedExams.find(e => e.id === exam.id)) {
      setSelectedExams(prev => prev.filter(e => e.id !== exam.id));
    } else {
      setSelectedExams(prev => [...prev, exam]);
    }
  };

  const handleUpdateProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    
    if (!name.trim() || !email.trim()) {
      setProfileError('Name and email are required.');
      return;
    }

    setProfileLoading(true);

    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        grade,
        targetExams: selectedExams.map(e => e.name),
        examDates: selectedExams.reduce((acc, e) => {
          acc[e.name] = e.date;
          return acc;
        }, {})
      };

      // Calls setDoc users mapping -> PUT /api/auth/update-profile
      await db.setDoc("users", profile.uid, payload);
      localStorage.setItem('stressradar_gemini_api_key', geminiKey.trim());
      
      onUpdateProfile({
        ...profile,
        ...payload
      });
      setProfileSuccess('Profile details updated successfully!');
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Password update failed.');
      }

      setPasswordSuccess('Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12 text-slate-200">
      
      {/* Back Button Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer flex items-center justify-center border border-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">Student Profile Settings</h1>
          <p className="text-xs text-slate-400">Manage your credentials, academic details, and password.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* COLUMN 1: Profile Information */}
        <div className="glass-card rounded-lg p-6 flex flex-col gap-5 bg-slate-900/40 relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-32 h-32 bg-[#00A389]/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <User className="w-5 h-5 text-[#00A389]" />
            <h2 className="text-sm font-bold text-white font-space uppercase tracking-wider">Academic Profile Details</h2>
          </div>

          {profileSuccess && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 rounded-md text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/30 text-rose-400 rounded-md text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfileSubmit} className="flex flex-col gap-4">
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="premium-input w-full"
                placeholder="Student Name"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email ID</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="premium-input w-full"
                placeholder="student@example.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Academic Grade</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="premium-input w-full cursor-pointer bg-slate-950"
              >
                <option value="Class 10 Student">Class 10</option>
                <option value="Class 11 Student">Class 11</option>
                <option value="Class 12 / JEE Aspirant">Class 12 / JEE Aspirant</option>
                <option value="Class 12 / NEET Aspirant">Class 12 / NEET Aspirant</option>
                <option value="College Student / Graduate">College Graduate</option>
                <option value="UPSC CSE Repeater / Dedicated Aspirant">UPSC Dedicated Aspirant</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gemini API Key (Optional)</label>
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="premium-input w-full font-space text-xs"
                placeholder="AIzaSy... (leave blank for simulated responses)"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Exams (Exam Type)</label>
              <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
                {EXAMS.map(exam => {
                  const selected = selectedExams.find(e => e.id === exam.id);
                  return (
                    <button
                      key={exam.id}
                      type="button"
                      onClick={() => handleToggleExam(exam)}
                      className={`p-2 rounded border text-left flex flex-col gap-0.5 transition-all cursor-pointer ${
                        selected 
                          ? 'border-[#00A389] bg-[#00A389]/10 text-white font-bold' 
                          : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <span className="text-[8px] font-bold font-space text-[#00A389] uppercase tracking-wider">
                        {exam.category}
                      </span>
                      <span className="text-[11px] leading-tight">
                        {exam.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="mt-2 w-full bg-[#00A389] hover:bg-[#008e77] text-white py-2.5 text-xs font-bold rounded-md transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {profileLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-4 h-4" />}
              Save Profile Details
            </button>
          </form>
        </div>

        {/* COLUMN 2: Password Management */}
        <div className="glass-card rounded-lg p-6 flex flex-col gap-5 bg-slate-900/40 relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Lock className="w-5 h-5 text-indigo-500" />
            <h2 className="text-sm font-bold text-white font-space uppercase tracking-wider">Change Account Password</h2>
          </div>

          {passwordSuccess && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 rounded-md text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/30 text-rose-400 rounded-md text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePasswordSubmit} className="flex flex-col gap-4">
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Password</label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="premium-input w-full font-space"
                placeholder="••••••••"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="premium-input w-full font-space"
                placeholder="•••••••• (Min 6 chars)"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="premium-input w-full font-space"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 text-xs font-bold rounded-md transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {passwordLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              Update Account Password
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
