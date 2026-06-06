import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  User, 
  BookOpen, 
  Languages, 
  Activity, 
  ArrowRight, 
  CheckCircle2, 
  HelpCircle,
  GraduationCap
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

export default function Onboarding({ user, onComplete }) {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState(1);
  
  // State
  const [name, setName] = useState(user?.displayName || '');
  const [age, setAge] = useState('18');
  const [grade, setGrade] = useState('Class 12 / JEE Aspirant');
  
  const [selectedExams, setSelectedExams] = useState([]);
  const [lang, setLang] = useState('en');
  
  const [sleep, setSleep] = useState(5);
  const [confidence, setConfidence] = useState(5);
  const [studyHours, setStudyHours] = useState(6);

  const handleToggleExam = (exam) => {
    if (selectedExams.find(e => e.id === exam.id)) {
      setSelectedExams(prev => prev.filter(e => e.id !== exam.id));
    } else {
      setSelectedExams(prev => [...prev, exam]);
    }
  };

  const handleLanguageChange = (chosenLang) => {
    setLang(chosenLang);
    i18n.changeLanguage(chosenLang);
  };

  const handleNext = () => {
    setStep(prev => prev + 1);
  };

  const handlePrev = () => {
    setStep(prev => prev - 1);
  };

  const handleFinish = async () => {
    const profileData = {
      uid: user.uid,
      name,
      age: parseInt(age, 10),
      grade,
      targetExams: selectedExams.map(e => e.name),
      examDates: selectedExams.reduce((acc, e) => {
        acc[e.name] = e.date;
        return acc;
      }, {}),
      language: lang,
      onboarded: true,
      day0Baseline: {
        sleep: parseInt(sleep, 10),
        confidence: parseInt(confidence, 10),
        studyHours: parseInt(studyHours, 10),
        createdAt: new Date().toISOString()
      },
      burnoutScore: 40 // Default baseline burnout risk
    };

    // Save to Firestore mock
    await db.setDoc("users", user.uid, profileData);
    
    // Day 0 baseline initial check-in document
    await db.addDoc(`users/${user.uid}/checkins`, {
      primaryEmotion: "Calm",
      subEmotion: "Ready to hustle",
      sleep: parseInt(sleep, 10),
      energy: 5,
      motivation: parseInt(confidence, 10),
      reactionTime: 250, // default ms
      burnoutScoreCalculated: 40,
      createdAt: new Date().toISOString()
    });

    onComplete(profileData);
  };

  return (
    <div className="w-full max-w-2xl mx-auto glass-card border border-slate-800/80 bg-slate-900/40 rounded-md p-6 md:p-8 flex flex-col gap-6 md:gap-8 shadow-xl relative overflow-hidden animate-scale-up">
      
      {/* Dynamic background element for premium aesthetic */}
      <div className="absolute -right-16 -top-16 w-36 h-36 bg-[#00C9B0] rounded-full blur-3xl opacity-10 pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-36 h-36 bg-indigo-500 rounded-full blur-3xl opacity-10 pointer-events-none" />

      {/* Progress indicators */}
      <div className="flex items-center gap-1.5 z-10">
        {[1, 2, 3, 4].map(num => (
          <div 
            key={num} 
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              step >= num ? 'bg-[#00C9B0]' : 'bg-slate-800'
            }`} 
          />
        ))}
      </div>

      {/* STEP 1: IDENTITY */}
      {step === 1 && (
        <div className="flex flex-col gap-6 animate-fade-in z-10">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-[#00C9B0] uppercase tracking-widest flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Step 1 of 4
            </span>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Tell us about yourself</h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              We personalize our AI tone based on your age and target goals.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name-input" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Full Name
              </label>
              <input
                id="name-input"
                type="text"
                required
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950/40 border border-slate-800 rounded-md focus:ring-2 focus:ring-[#00C9B0] focus:outline-none placeholder-gray-500 font-semibold text-white text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="age-input" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Age (for AI Tone Calibration)
                </label>
                <input
                  id="age-input"
                  type="number"
                  min="12"
                  max="40"
                  required
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950/40 border border-slate-800 rounded-md focus:ring-2 focus:ring-[#00C9B0] focus:outline-none placeholder-gray-500 font-semibold text-white text-sm font-space"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="grade-select" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Current Academic Grade
                </label>
                <select
                  id="grade-select"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950/40 border border-slate-800 rounded-md focus:ring-2 focus:ring-[#00C9B0] focus:outline-none text-white text-sm font-semibold cursor-pointer"
                >
                  <option className="bg-slate-900" value="Class 10 Student">Class 10</option>
                  <option className="bg-slate-900" value="Class 11 Student">Class 11</option>
                  <option className="bg-slate-900" value="Class 12 / JEE Aspirant">Class 12 / JEE Aspirant</option>
                  <option className="bg-slate-900" value="Class 12 / NEET Aspirant">Class 12 / NEET Aspirant</option>
                  <option className="bg-slate-900" value="College Student / Graduate">College Graduate</option>
                  <option className="bg-slate-900" value="UPSC CSE Repeater / Dedicated Aspirant">UPSC Dedicated Aspirant</option>
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={handleNext}
            disabled={!name.trim()}
            className="mt-4 w-full bg-[#00C9B0] hover:bg-[#00b29c] text-[#060B18] py-2.5 text-sm font-bold rounded-md transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('next')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 2: TARGET EXAMS */}
      {step === 2 && (
        <div className="flex flex-col gap-6 animate-fade-in z-10">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-[#00C9B0] uppercase tracking-widest flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              Step 2 of 4
            </span>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">{t('select_exams')}</h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              StressRadar calibrates its warnings and count downs for specific exam syllabus patterns.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 max-h-[280px] overflow-y-auto pr-1">
            {EXAMS.map(exam => {
              const selected = selectedExams.find(e => e.id === exam.id);
              return (
                <button
                  key={exam.id}
                  onClick={() => handleToggleExam(exam)}
                  className={`p-3.5 rounded-md border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    selected 
                      ? 'border-[#00C9B0] bg-[#00C9B0]/10 text-white shadow-sm' 
                      : 'border-slate-800 bg-slate-950/20 text-gray-400 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <span className="text-xs font-bold font-space text-[#00C9B0] uppercase tracking-wider">
                    {exam.category}
                  </span>
                  <span className="text-sm font-extrabold leading-snug">
                    {exam.name}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex gap-4 mt-2">
            <button
              onClick={handlePrev}
              className="flex-1 bg-transparent hover:bg-slate-800 border border-slate-800 hover:border-slate-750 text-white py-2.5 text-sm font-bold rounded-md transition-all cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={selectedExams.length === 0}
              className="flex-1 bg-[#00C9B0] hover:bg-[#00b29c] text-[#060B18] py-2.5 text-sm font-bold rounded-md transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('next')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: LANGUAGE PREFERENCE */}
      {step === 3 && (
        <div className="flex flex-col gap-6 animate-fade-in z-10">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-[#00C9B0] uppercase tracking-widest flex items-center gap-1.5">
              <Languages className="w-3.5 h-3.5" />
              Step 3 of 4
            </span>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">{t('language_preference')}</h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              Choose your language. Gemini generates advice in your native tongue.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleLanguageChange('en')}
              className={`p-6 rounded-md border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                lang === 'en' 
                  ? 'border-[#00C9B0] bg-[#00C9B0]/10 text-white' 
                  : 'border-slate-800 bg-slate-950/20 text-gray-400 hover:border-slate-700 hover:text-white'
              }`}
            >
              <span className="text-2xl font-bold font-space">A</span>
              <span className="text-sm font-bold">English (Standard)</span>
            </button>

            <button
              onClick={() => handleLanguageChange('hi')}
              className={`p-6 rounded-md border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                lang === 'hi' 
                  ? 'border-[#00C9B0] bg-[#00C9B0]/10 text-white' 
                  : 'border-slate-800 bg-slate-950/20 text-gray-400 hover:border-slate-700 hover:text-white'
              }`}
            >
              <span className="text-2xl font-bold font-space">अ</span>
              <span className="text-sm font-bold">हिन्दी (Conversational)</span>
            </button>
          </div>

          <div className="flex gap-4 mt-2">
            <button
              onClick={handlePrev}
              className="flex-1 bg-transparent hover:bg-slate-800 border border-slate-800 hover:border-slate-750 text-white py-2.5 text-sm font-bold rounded-md transition-all cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              className="flex-1 bg-[#00C9B0] hover:bg-[#00b29c] text-[#060B18] py-2.5 text-sm font-bold rounded-md transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {t('next')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: DAY 0 BASELINE WELLNESS */}
      {step === 4 && (
        <div className="flex flex-col gap-6 animate-fade-in z-10">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-[#00C9B0] uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              Step 4 of 4
            </span>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">{t('day0_baseline')}</h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              These initial sliders establish your baseline. All future wellness scores compare relative to today.
            </p>
          </div>

          <div className="flex flex-col gap-5 bg-slate-950/20 p-4 border border-slate-800 rounded-md">
            {/* Sleep slider */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-gray-300">{t('sleep_quality')}</span>
                <span className="font-space font-bold text-[#00C9B0] bg-[#00C9B0]/10 px-2 py-0.5 rounded border border-[#00C9B0]/20">
                  {sleep} / 10
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={sleep}
                onChange={(e) => setSleep(e.target.value)}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer focus:outline-none accent-[#00C9B0]"
              />
            </div>

            {/* Confidence slider */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-gray-300">{t('confidence')}</span>
                <span className="font-space font-bold text-[#00C9B0] bg-[#00C9B0]/10 px-2 py-0.5 rounded border border-[#00C9B0]/20">
                  {confidence} / 10
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={confidence}
                onChange={(e) => setConfidence(e.target.value)}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer focus:outline-none accent-[#00C9B0]"
              />
            </div>

            {/* Study Hours slider */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-gray-300">{t('study_hours')}</span>
                <span className="font-space font-bold text-[#00C9B0] bg-[#00C9B0]/10 px-2 py-0.5 rounded border border-[#00C9B0]/20">
                  {studyHours} hrs / day
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="16"
                step="1"
                value={studyHours}
                onChange={(e) => setStudyHours(e.target.value)}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer focus:outline-none accent-[#00C9B0]"
              />
            </div>
          </div>

          <div className="flex gap-4 mt-2">
            <button
              onClick={handlePrev}
              className="flex-1 bg-transparent hover:bg-slate-800 border border-slate-800 hover:border-slate-750 text-white py-2.5 text-sm font-bold rounded-md transition-all cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={handleFinish}
              className="flex-1 bg-[#00C9B0] hover:bg-[#00b29c] text-[#060B18] py-2.5 text-sm font-bold rounded-md transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {t('finish_setup')}
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
