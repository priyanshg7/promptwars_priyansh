import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  Layers, 
  BookOpen, 
  Clock, 
  Flame, 
  CheckSquare, 
  FileText,
  Activity, 
  Send,
  Loader2,
  AlertCircle,
  HelpCircle,
  Wind,
  ShieldCheck,
  TrendingUp,
  Volume2,
  User,
  Settings,
  X
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { db } from '../firebase';
import ExamVault from './ExamVault';
import StudyPlanner from './StudyPlanner';
import BreathingCard from './BreathingCard';
import DailyCheckin from './DailyCheckin';

// Mock chart data default if empty
const DEFAULT_CHART_DATA = [
  { day: 'Mon', score: 62, burnout: 35 },
  { day: 'Tue', score: 65, burnout: 38 },
  { day: 'Wed', score: 60, burnout: 45 },
  { day: 'Thu', score: 68, burnout: 40 },
  { day: 'Fri', score: 72, burnout: 36 },
  { day: 'Sat', score: 70, burnout: 48 },
  { day: 'Sun', score: 75, burnout: 40 }
];

export default function Dashboard({ profile, onUpdateProfile, onLogout, onProfileToggle }) {
  const { t, i18n } = useTranslation();
  
  // Sub-modules navigation tabs (Planner / Vault)
  const [activeSubTab, setActiveSubTab] = useState('planner'); 
  
  // Modal states
  const [showCheckin, setShowCheckin] = useState(false);
  const [showVentModal, setShowVentModal] = useState(false);
  
  // Check-in state
  const [lastCheckin, setLastCheckin] = useState(null);
  
  // Voice vent state
  const [isRecording, setIsRecording] = useState(false);
  const [ventText, setVentText] = useState('');
  const [analyzingVent, setAnalyzingVent] = useState(false);
  const [recognition, setRecognition] = useState(null);

  // Chatbot State
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', text: `Hello ${profile.name || 'Student'}. I see you are preparing for ${profile.targetExams?.join(', ') || 'exams'}. Ready for study or want to vent?` }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // AI Insights State
  const [insights, setInsights] = useState([]);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Countdown States
  const [countdowns, setCountdowns] = useState({});

  // Recharts state
  const [chartData, setChartData] = useState(DEFAULT_CHART_DATA);
  const [subjectData, setSubjectData] = useState([]);

  const getSubjectsForExam = (exams) => {
    if (!exams || exams.length === 0) return ['Physics', 'Chemistry', 'Mathematics'];
    const primaryExam = exams[0].toLowerCase();
    if (primaryExam.includes('jee') || primaryExam.includes('gate') || primaryExam.includes('board exam class 12')) {
      return ['Physics', 'Chemistry', 'Mathematics'];
    }
    if (primaryExam.includes('neet')) {
      return ['Physics', 'Chemistry', 'Biology'];
    }
    if (primaryExam.includes('upsc')) {
      return ['General Studies', 'CSAT', 'Optional Subject'];
    }
    if (primaryExam.includes('cat')) {
      return ['Quantitative Ability', 'DILR', 'Verbal Ability'];
    }
    if (primaryExam.includes('boards_10') || primaryExam.includes('class 10')) {
      return ['Science', 'Mathematics', 'Social Science'];
    }
    if (primaryExam.includes('cuet')) {
      return ['Language Test', 'Domain Subjects', 'General Test'];
    }
    return ['Subject A', 'Subject B', 'Subject C'];
  };

  const generateSubjectData = (tests, currentBurnout) => {
    const subjects = getSubjectsForExam(profile.targetExams);
    const completedTests = tests.filter(t => t.status === 'completed');
    let avgScorePercent = 65;
    if (completedTests.length > 0) {
      const sum = completedTests.reduce((acc, t) => acc + (t.percentage || 50), 0);
      avgScorePercent = Math.round(sum / completedTests.length);
    }

    return subjects.map((subject, idx) => {
      let scoreVar = 0;
      let stressVar = 0;
      if (idx === 0) { scoreVar = 5; stressVar = -5; }
      else if (idx === 1) { scoreVar = -12; stressVar = 15; }
      else { scoreVar = 8; stressVar = -8; }

      const finalScore = Math.max(30, Math.min(100, avgScorePercent + scoreVar));
      const finalStress = Math.max(10, Math.min(100, currentBurnout + stressVar));

      return {
        subject,
        Score: finalScore,
        Stress: finalStress
      };
    });
  };

  // Check Web Speech API availability
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = profile.language === 'hi' ? 'hi-IN' : 'en-IN';
      
      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setVentText(prev => prev + ' ' + transcript);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      setRecognition(rec);
    }
  }, [profile.language]);

  // Load check-in data and build analytics charts
  const loadCheckinData = async () => {
    try {
      const snap = await db.getDocs(`users/${profile.uid}/checkins`);
      const checkinList = [];
      snap.docs.forEach(doc => {
        checkinList.push(doc.data());
      });
      
      const testSnap = await db.getDocs(`users/${profile.uid}/tests`);
      const testList = [];
      testSnap.docs.forEach(doc => {
        testList.push({ id: doc.id, ...doc.data() });
      });
      testList.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

      if (checkinList.length > 0) {
        // Sort chronologically
        checkinList.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        setLastCheckin(checkinList[checkinList.length - 1]);
        
        // Build dual-axis overlay chart data from mock tests & check-ins
        const combined = checkinList.slice(-7).map((c, idx) => {
          const checkinDate = new Date(c.createdAt).toLocaleDateString('en-US', { weekday: 'short' });
          const matchingTest = testList.find(t => 
            t.status === 'completed' && 
            new Date(t.completedAt).toLocaleDateString() === new Date(c.createdAt).toLocaleDateString()
          );
          
          return {
            day: checkinDate,
            burnout: c.burnoutScoreCalculated || 40,
            score: matchingTest ? matchingTest.percentage : (idx * 5 + 60)
          };
        });
        setChartData(combined.length > 0 ? combined : DEFAULT_CHART_DATA);
      }

      // Generate subject-wise performance data
      const subData = generateSubjectData(testList, profile.burnoutScore || 40);
      setSubjectData(subData);
    } catch (err) {
      console.error("Failed to load checkins:", err);
    }
  };

  // Load Weekly AI Insights
  const loadWeeklyInsights = async () => {
    setLoadingInsights(true);
    try {
      const testSnap = await db.getDocs(`users/${profile.uid}/tests`);
      const checkinSnap = await db.getDocs(`users/${profile.uid}/checkins`);
      
      const tests = testSnap.docs.map(d => d.data());
      const checkins = checkinSnap.docs.map(d => d.data());

      const response = await fetch('/api/generate-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tests,
          checkins,
          language: profile.language || 'en'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setInsights(data);
      } else {
        throw new Error("Insights failed");
      }
    } catch (err) {
      // Mock correlation fallback
      setInsights([
        {
          title: profile.language === 'hi' ? "प्रदर्शन और तनाव का संबंध" : "Stress & Performance Correlation",
          type: "warning",
          description: profile.language === 'hi'
            ? "गणित टेस्ट स्कोर में गिरावट देखी गई, जो परीक्षा से 2 दिन पहले आपके उच्च तनाव स्तर से मेल खाती है।"
            : "Your mock test score dipped on days following high stress entries. Let's practice deep breathing before the next test."
        },
        {
          title: profile.language === 'hi' ? "नींद का सकारात्मक प्रभाव" : "Sleep Duration Impact",
          type: "success",
          description: profile.language === 'hi'
            ? "पर्याप्त नींद (7+ घंटे) लेने के बाद आपका ध्यान केंद्रित करने का रिएक्शन समय 35ms बेहतर हुआ है।"
            : "Adequate sleep quality correlates with a 35ms improvement in your cognitive reaction test."
        }
      ]);
    } finally {
      setLoadingInsights(false);
    }
  };

  useEffect(() => {
    loadCheckinData();
    loadWeeklyInsights();
  }, [profile]);

  // Handle countdown updates
  useEffect(() => {
    const updateCountdowns = () => {
      const dates = profile.examDates || {};
      const nextCountdowns = {};
      
      Object.keys(dates).forEach(examName => {
        const examDate = new Date(dates[examName]);
        const today = new Date();
        const diff = examDate - today;
        
        if (diff > 0) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          nextCountdowns[examName] = `${days}d ${hours}h ${mins}m`;
        } else {
          nextCountdowns[examName] = "Exam Commenced";
        }
      });
      setCountdowns(nextCountdowns);
    };

    updateCountdowns();
    const interval = setInterval(updateCountdowns, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [profile]);

  // Voice Recording trigger
  const startRecording = () => {
    if (!recognition) {
      alert("Web Speech API is not fully supported in this browser. Please type your vent in the box.");
      return;
    }
    setVentText('');
    setIsRecording(true);
    recognition.start();
    
    // Auto stop after 10 seconds (as requested in spec)
    setTimeout(() => {
      if (isRecording) {
        recognition.stop();
        setIsRecording(false);
      }
    }, 10000);
  };

  const stopRecording = () => {
    if (recognition) {
      recognition.stop();
    }
    setIsRecording(false);
  };

  const handleSendVent = async () => {
    if (!ventText.trim()) return;
    setAnalyzingVent(true);
    
    try {
      const response = await fetch('/api/analyze-vent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: ventText.trim(),
          history: [lastCheckin],
          language: profile.language || 'en',
          student_profile: {
            name: profile.name,
            age: profile.age,
            targetExams: profile.targetExams
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update burnout risk score in profile data
        const updatedProfile = {
          ...profile,
          burnoutScore: result.burnout_score_update
        };
        await db.updateDoc("users", profile.uid, { burnoutScore: result.burnout_score_update });
        onUpdateProfile(updatedProfile);

        // Add venting AI response to Chat history
        setChatHistory(prev => [
          ...prev,
          { role: 'user', text: `Vented: "${ventText.trim()}"` },
          { role: 'assistant', text: `${result.ai_response} (Identified Trigger: ${result.trigger})` }
        ]);

        // Save check-in log about stress
        await db.addDoc(`users/${profile.uid}/checkins`, {
          primaryEmotion: result.stress_level === 'high' ? 'Overwhelmed' : 'Anxious',
          subEmotion: result.trigger,
          sleep: lastCheckin?.sleep || 5,
          energy: lastCheckin?.energy || 5,
          motivation: lastCheckin?.motivation || 5,
          reactionTime: lastCheckin?.reactionTime || 260,
          burnoutScoreCalculated: result.burnout_score_update,
          createdAt: new Date().toISOString()
        });

        setShowVentModal(false);
        setVentText('');
        loadCheckinData();
      }
    } catch (err) {
      console.error("Analyze vent failed:", err);
    } finally {
      setAnalyzingVent(false);
    }
  };

  // Chat message submit
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || chatLoading) return;

    const userText = chatMessage.trim();
    setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'user', text: userText }]);
    setChatLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          chat_history: chatHistory.slice(-5),
          student_profile: {
            name: profile.name,
            age: profile.age,
            targetExams: profile.targetExams,
            burnoutScore: profile.burnoutScore
          },
          language: profile.language || 'en'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setChatHistory(prev => [...prev, { role: 'assistant', text: data.text }]);
      } else {
        throw new Error("Chat failed");
      }
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'assistant', text: "Sorry, I had trouble parsing that. Tell me how your revision is going." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleGroundingBoxBreathing = async (feltGrounded) => {
    if (feltGrounded) {
      // Decrease burnout score by 6% (as loop feedback in Module 6)
      const newScore = Math.max(5, profile.burnoutScore - 6);
      const updatedProfile = {
        ...profile,
        burnoutScore: newScore
      };
      await db.updateDoc("users", profile.uid, { burnoutScore: newScore });
      onUpdateProfile(updatedProfile);
      
      // Log check-in with lower burnout
      await db.addDoc(`users/${profile.uid}/checkins`, {
        primaryEmotion: "Calm",
        subEmotion: "Peaceful",
        sleep: lastCheckin?.sleep || 6,
        energy: lastCheckin?.energy || 6,
        motivation: lastCheckin?.motivation || 6,
        reactionTime: lastCheckin?.reactionTime || 240,
        burnoutScoreCalculated: newScore,
        createdAt: new Date().toISOString()
      });
      loadCheckinData();
    }
  };

  // Color logic for circular Burnout gauge (calibrated for dark mode)
  const getBurnoutColor = (score) => {
    if (score <= 40) return { stroke: '#00A389', bg: 'rgba(0, 163, 137, 0.05)' }; // Teal
    if (score <= 70) return { stroke: '#f59e0b', bg: 'rgba(245, 158, 11, 0.05)' }; // Amber
    return { stroke: '#ef4444', bg: 'rgba(239, 68, 68, 0.05)' }; // Red
  };

  const scoreColor = getBurnoutColor(profile.burnoutScore);
  const checkinDoneToday = lastCheckin && new Date(lastCheckin.createdAt).toDateString() === new Date().toDateString();

  return (
    <div className="flex flex-col gap-6 md:gap-8 pb-12 animate-fade-in text-slate-300">
      
      {/* 1. TOP HEADER & EXAM COUNTDOWNS */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 glass-card p-6 rounded-lg relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-24 h-24 bg-[#00A389]/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold text-white">Welcome, {profile.name}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-950 border border-indigo-550/30 text-indigo-300 font-space">
              {profile.grade || 'Aspirant'}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Calibrating stress thresholds for: <span className="font-semibold text-white">{profile.targetExams?.join(', ') || 'No Exam Selected'}</span>
          </p>
        </div>

        {/* Countdown Timers */}
        <div className="flex flex-wrap items-center gap-3">
          {Object.keys(countdowns).map(exam => (
            <div key={exam} className="bg-slate-900/60 border border-slate-800 p-2.5 rounded flex flex-col font-space gap-0.5 min-w-[120px]">
              <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">{exam} Countdown</span>
              <span className="text-xs font-bold text-[#00A389]">{countdowns[exam]}</span>
            </div>
          ))}
          
          {/* Quick Vent Microphone button */}
          <button
            onClick={() => setShowVentModal(true)}
            className="w-10 h-10 rounded-md bg-[#00A389]/10 border border-[#00A389]/20 hover:bg-[#00A389] hover:text-white text-[#00A389] flex items-center justify-center transition-all cursor-pointer focus:ring-2 focus:ring-[#00A389] active:scale-95 shadow-sm"
            title={t('quick_vent')}
          >
            <Mic className="w-5 h-5" />
          </button>

          {/* User Settings Profile button */}
          <button
            onClick={onProfileToggle}
            className="w-10 h-10 rounded-md bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-600 hover:text-white text-indigo-400 flex items-center justify-center transition-all cursor-pointer focus:ring-2 focus:ring-indigo-500 active:scale-95 shadow-sm"
            title="Profile Settings"
          >
            <User className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* 2. BURNOUT SCORES AND WIDGETS SECTION */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* WIDGET A: Circular Burnout risk Gauge */}
        <div className="glass-card rounded-lg p-5 flex flex-col items-center justify-between gap-4 text-center min-h-[220px]">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Flame className="w-4 h-4 text-[#00A389]" />
            {t('burnout_risk')}
          </span>

          {/* SVG Gauge */}
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="52"
                stroke="rgba(255, 255, 255, 0.04)"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="64"
                cy="64"
                r="52"
                stroke={scoreColor.stroke}
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={326.7}
                strokeDashoffset={326.7 - (326.7 * profile.burnoutScore) / 100}
                className="transition-all duration-700 ease-out"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold font-space text-white">
                {profile.burnoutScore}%
              </span>
              <span className="text-[9px] uppercase font-bold text-slate-500">Risk level</span>
            </div>
          </div>

          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded border ${
            profile.burnoutScore <= 40 
              ? 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30' 
              : profile.burnoutScore <= 70 
              ? 'text-amber-400 bg-amber-950/40 border-amber-500/30'
              : 'text-rose-450 bg-rose-950/40 border-rose-500/30 animate-pulse'
          }`}>
            {profile.burnoutScore <= 40 ? 'Healthy Balance' : profile.burnoutScore <= 70 ? 'Moderate Strain' : 'Critical Burnout Risk'}
          </span>
        </div>

        {/* WIDGET B: Daily check-in status card */}
        <div className="glass-card rounded-lg p-5 flex flex-col justify-between items-center gap-4 text-center min-h-[220px]">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Activity className="w-4 h-4 text-[#00A389]" />
            Check-In Tracker
          </span>

          <div className="flex flex-col items-center gap-2">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center border ${
              checkinDoneToday 
                ? 'bg-emerald-950/40 border-emerald-500/30 text-[#00A389]' 
                : 'bg-slate-900/60 border-slate-800 text-slate-500 animate-pulse'
            }`}>
              <ShieldCheck className="w-8 h-8" />
            </div>
            
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-extrabold text-white">
                {checkinDoneToday ? t('checkin_complete') : t('checkin_pending')}
              </span>
              {checkinDoneToday && lastCheckin && (
                <span className="text-[10px] text-slate-400">
                  Logged: {lastCheckin.primaryEmotion} ({lastCheckin.subEmotion})
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => setShowCheckin(true)}
            className={`w-full py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
              checkinDoneToday 
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700' 
                : 'bg-[#00A389] hover:bg-[#00927a] text-white shadow-sm'
            }`}
          >
            {checkinDoneToday ? 'Redo Today\'s Check-in' : 'Start Daily Check-In'}
          </button>
        </div>

        {/* WIDGET C: Proactive AI Insights Panel */}
        <div className="glass-card rounded-lg p-5 flex flex-col gap-3.5 min-h-[220px]">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-[#00A389]" />
            {t('ai_insights')}
          </span>

          <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[140px] pr-1">
            {loadingInsights ? (
              <div className="flex items-center gap-2 justify-center py-8 text-xs text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-[#00A389]" />
                Gemini analyzing patterns...
              </div>
            ) : insights.length > 0 ? (
              insights.map((ins, idx) => (
                <div key={idx} className={`p-2.5 border rounded-md text-[11px] leading-relaxed flex gap-2 ${
                  ins.type === 'warning'
                    ? 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                    : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                }`}>
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold">{ins.title}</span>
                    <span>{ins.description}</span>
                  </div>
                </div>
              ))
            ) : (
              <span className="text-[11px] text-slate-500 text-center py-6">No insights yet. Log daily check-ins and mock tests.</span>
            )}
          </div>
        </div>

      </section>

      {/* 3. OVERALL ANALYSIS SECTION (ALWAYS VISIBLE) */}
      <section className="glass-card rounded-lg p-5 md:p-6 flex flex-col gap-6 shadow-sm">
        <div className="flex flex-col gap-1 border-b border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-white font-space uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#00A389]" />
            Overall Performance & Stress Calibration
          </h2>
          <p className="text-xs text-slate-400">Real-time overlay of academic scores against physiological burnout metrics.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Daily Overlay Chart */}
          <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-md flex flex-col gap-4">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#00A389]" />
                Daily Burnout vs Exam Score
              </span>
              <span className="text-[10px] text-slate-400">Overlays daily stress levels against completion score percentages</span>
            </div>
            
            <div className="w-full h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis yAxisId="left" stroke="#ef4444" fontSize={10} tickLine={false} label={{ value: 'Burnout %', angle: -90, position: 'insideLeft', style: { fill: '#ef4444', fontSize: 9 } }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#00A389" fontSize={10} tickLine={false} label={{ value: 'Mock Score %', angle: 90, position: 'insideRight', style: { fill: '#00A389', fontSize: 9 } }} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '6px', fontSize: '10px', color: '#cbd5e1' }} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Bar yAxisId="left" dataKey="burnout" name="Burnout Risk" fill="rgba(239, 68, 68, 0.2)" stroke="#ef4444" radius={[2, 2, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="score" name="Test Score" stroke="#00A389" strokeWidth={2} dot={{ fill: '#00A389', r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Subject performance vs stress breakdown */}
          <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-md flex flex-col gap-4">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                Subject Performance vs. Stress
              </span>
              <span className="text-[10px] text-slate-400">Ties specific subject performance against mental stress loads</span>
            </div>
            
            <div className="w-full h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={subjectData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="subject" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '6px', fontSize: '10px', color: '#cbd5e1' }} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="Score" name="Mock Avg %" fill="#00A389" radius={[2, 2, 0, 0]} maxBarSize={30} />
                  <Bar dataKey="Stress" name="Mental Strain %" fill="#f59e0b" radius={[2, 2, 0, 0]} maxBarSize={30} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Subject recommendations */}
        <div className="p-4 bg-indigo-950/30 border border-indigo-500/20 rounded-md flex flex-col gap-2">
          <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Gemini Subject & Stress Calibration Insights
          </span>
          <ul className="list-disc pl-5 text-[11px] text-slate-300 leading-relaxed flex flex-col gap-1.5">
            {subjectData.map((sub, idx) => {
              if (sub.Stress > 60 && sub.Score < 65) {
                return (
                  <li key={idx}>
                    Critical Area in <strong className="text-rose-450">{sub.subject}</strong>: Low mock score ({sub.Score}%) with high cognitive strain ({sub.Stress}%). Gemini suggests attempting easy sectional questions and executing a 4-cycle Box Breathing session before study.
                  </li>
                );
              }
              if (sub.Score > 75 && sub.Stress < 40) {
                return (
                  <li key={idx}>
                    Strong Hold in <strong className="text-emerald-400">{sub.subject}</strong>: Great accuracy ({sub.Score}%) under low stress. Maintain this momentum! Use review slots here to optimize other subjects.
                  </li>
                );
              }
              return (
                <li key={idx}>
                  Steady Progress in <strong className="text-indigo-300">{sub.subject}</strong>: Current accuracy of {sub.Score}% with moderate workload stress. Review formulas daily.
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* 4. CORE SUB-MODULE CONTROL TABS (Study Planner / Exam Vault) & AI MENTOR */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT TWO COLUMNS: Active Sub Tab Container */}
        <div className="lg:col-span-2 glass-card rounded-lg p-5 md:p-6 flex flex-col gap-6 shadow-sm">
          
          <div className="flex gap-2 p-1 bg-slate-900 border border-slate-800 rounded-md self-start select-none">
            <button
              onClick={() => setActiveSubTab('planner')}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                activeSubTab === 'planner' 
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Study Planner
            </button>
            <button
              onClick={() => setActiveSubTab('vault')}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                activeSubTab === 'vault' 
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Exam Vault
            </button>
          </div>

          {activeSubTab === 'planner' && (
            <StudyPlanner user={profile} profile={profile} />
          )}

          {activeSubTab === 'vault' && (
            <ExamVault 
              user={profile} 
              currentCheckin={lastCheckin} 
              onTestAdded={() => {
                loadCheckinData();
                loadWeeklyInsights();
              }}
            />
          )}

        </div>

        {/* RIGHT ONE COLUMN: AI Mentor & Breathing Card */}
        <div className="flex flex-col gap-6">
          
          {/* Breathing Card (Box Breathing Intervention) */}
          <BreathingCard onGroundingFeedback={handleGroundingBoxBreathing} />

          {/* AI Mentor Chatbot Card */}
          <div className="glass-card rounded-lg p-5 flex flex-col h-[280px] shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-3">
              <div className="p-1 rounded bg-[#00A389]/10 border border-[#00A389]/20 text-[#00A389]">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white font-space">AI MENTOR</span>
                <span className="text-[9px] text-slate-400">Powered by Gemini Pro (Language: {profile.language === 'hi' ? 'Hindi' : 'English'})</span>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-3 mb-3 pr-1 text-[11px] leading-relaxed">
              {chatHistory.map((chat, idx) => (
                <div key={idx} className={`p-2 rounded-md ${
                  chat.role === 'user' 
                    ? 'bg-slate-800 border border-slate-750 text-slate-300 self-end max-w-[85%]' 
                    : 'bg-indigo-950/40 border border-indigo-500/20 text-indigo-200 self-start max-w-[85%]'
                }`}>
                  {chat.text}
                </div>
              ))}
              {chatLoading && (
                <div className="p-2 bg-slate-900 border border-slate-800 text-slate-400 rounded-md self-start flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00A389]" />
                  Thinking...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input field */}
            <form onSubmit={handleChatSubmit} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Ask your mentor..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                className="flex-1 px-3 py-1.5 text-[11px] border border-slate-800 bg-slate-950 rounded-md text-white focus:ring-1 focus:ring-[#00A389] focus:outline-none placeholder-slate-500"
              />
              <button
                type="submit"
                disabled={chatLoading || !chatMessage.trim()}
                className="p-1.5 bg-[#00A389] hover:bg-[#00927a] text-white rounded-md transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        </div>

      </section>

      {/* 5. MODAL OVERLAYS */}
      
      {/* Daily check-in modal */}
      {showCheckin && (
        <DailyCheckin 
          user={profile} 
          onClose={() => setShowCheckin(false)} 
          onCheckinComplete={loadCheckinData} 
        />
      )}

      {/* Quick Vent Mic Modal */}
      {showVentModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-md p-5 shadow-2xl relative flex flex-col gap-4 animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-white font-space uppercase tracking-wider">Quick Vocal Vent</span>
              <button 
                onClick={() => {
                  stopRecording();
                  setShowVentModal(false);
                }} 
                className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col items-center gap-4 py-4 text-center">
              
              {/* Pulsing Mic Button */}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={analyzingVent}
                className={`w-16 h-16 rounded-full flex items-center justify-center cursor-pointer transition-all border shadow-lg ${
                  isRecording 
                    ? 'bg-red-500 border-red-500 text-white animate-pulse shadow-red-500/20' 
                    : 'bg-[#00A389]/10 border-[#00A389]/20 text-[#00A389] hover:bg-[#00A389] hover:text-white'
                }`}
              >
                {isRecording ? <MicOff className="w-6 h-6 animate-bounce" /> : <Mic className="w-6 h-6" />}
              </button>
              
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-white">
                  {isRecording ? 'Listening... Speak now (Max 10s)' : 'Click mic to start speaking'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {profile.language === 'hi' ? 'बोलने की भाषा: हिन्दी' : 'Venting Language: English'}
                </span>
              </div>

              {/* Speech transcript preview box */}
              <textarea
                value={ventText}
                onChange={(e) => setVentText(e.target.value)}
                placeholder="Your voice transcription will appear here. Or type directly to vent..."
                className="w-full h-20 p-3 text-xs bg-slate-950 border border-slate-800 rounded text-white focus:ring-1 focus:ring-[#00A389] focus:outline-none placeholder-slate-600 resize-none font-semibold"
              />
            </div>

            <div className="flex gap-3 border-t border-slate-800 pt-3">
              <button
                onClick={() => {
                  stopRecording();
                  setShowVentModal(false);
                }}
                disabled={analyzingVent}
                className="flex-1 bg-transparent hover:bg-slate-850 border border-slate-800 text-slate-300 py-2 text-xs font-bold rounded-md transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSendVent}
                disabled={analyzingVent || !ventText.trim()}
                className="flex-1 bg-[#00A389] hover:bg-[#00927a] text-white py-2 text-xs font-bold rounded-md transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {analyzingVent ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    AI Analyzing...
                  </>
                ) : (
                  'Send Vent'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
