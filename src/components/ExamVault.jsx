import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FileText, 
  Plus, 
  Calendar, 
  Award, 
  Clock, 
  Play, 
  CheckCircle, 
  AlertCircle,
  Wind,
  PlusCircle,
  Trophy,
  X
} from 'lucide-react';
import { db } from '../firebase';

export default function ExamVault({ user, currentCheckin, onTestAdded }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'ongoing' | 'completed'
  const [showAddForm, setShowAddForm] = useState(false);
  const [tests, setTests] = useState([]);
  
  // Form state
  const [testName, setTestName] = useState('');
  const [testType, setTestType] = useState('Mock Test');
  const [dateTime, setDateTime] = useState('');
  const [totalMarks, setTotalMarks] = useState('300');
  const [description, setDescription] = useState('');

  // Focus Mode state
  const [focusModeTest, setFocusModeTest] = useState(null);
  const [focusTimeLeft, setFocusTimeLeft] = useState(1800); // 30 minutes in seconds default
  const [focusActive, setFocusActive] = useState(false);
  const [showBreathingInFocus, setShowBreathingInFocus] = useState(false);

  // Score Logging state
  const [logScoreTest, setLogScoreTest] = useState(null);
  const [obtainedScore, setObtainedScore] = useState('');
  const [rank, setRank] = useState('');
  const [percentile, setPercentile] = useState('');

  // Load tests from mock database
  const loadTests = async () => {
    try {
      const snap = await db.getDocs(`users/${user.uid}/tests`);
      const list = [];
      snap.docs.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      // Sort chronologically
      list.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
      setTests(list);
    } catch (err) {
      console.error("Failed to load tests:", err);
    }
  };

  useEffect(() => {
    loadTests();
  }, [user]);

  // Focus Mode Timer
  useEffect(() => {
    let interval = null;
    if (focusActive && focusTimeLeft > 0) {
      interval = setInterval(() => {
        setFocusTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (focusTimeLeft === 0) {
      setFocusActive(false);
    }
    return () => clearInterval(interval);
  }, [focusActive, focusTimeLeft]);

  // Sync test states (e.g. check if an upcoming test date is reached to move to ongoing)
  useEffect(() => {
    const checkOngoingTests = () => {
      const now = new Date();
      let modified = false;
      const updated = tests.map(test => {
        if (test.status === 'upcoming' && new Date(test.dateTime) <= now) {
          modified = true;
          return { ...test, status: 'ongoing' };
        }
        return test;
      });
      if (modified) {
        setTests(updated);
        // Save back updates (mock database)
        updated.forEach(async t => {
          await db.updateDoc(`users/${user.uid}/tests`, t.id, { status: t.status });
        });
      }
    };

    checkOngoingTests();
    const timer = setInterval(checkOngoingTests, 15000);
    return () => clearInterval(timer);
  }, [tests]);

  const handleAddTest = async (e) => {
    e.preventDefault();
    if (!testName.trim() || !dateTime) return;

    const newTest = {
      name: testName,
      type: testType,
      dateTime,
      totalMarks: parseInt(totalMarks, 10),
      description,
      status: new Date(dateTime) <= new Date() ? 'ongoing' : 'upcoming',
      score: null,
      rank: null,
      percentile: null,
      emotionalTag: null
    };

    const docRef = await db.addDoc(`users/${user.uid}/tests`, newTest);
    setShowAddForm(false);
    
    // Clear inputs
    setTestName('');
    setDateTime('');
    setDescription('');
    
    await loadTests();
    if (onTestAdded) onTestAdded();
  };

  const handleLaunchFocus = (test) => {
    setFocusModeTest(test);
    setFocusTimeLeft(5400); // 90 minutes test timer simulation
    setFocusActive(true);
  };

  const handleExitFocus = () => {
    setFocusModeTest(null);
    setFocusActive(false);
  };

  const handleLogScoreSubmit = async (e) => {
    e.preventDefault();
    if (!logScoreTest || !obtainedScore) return;

    const percentage = Math.round((parseInt(obtainedScore, 10) / logScoreTest.totalMarks) * 100);
    
    // Attach current emotional tag from wellness check-in if logged today
    const emoTag = currentCheckin 
      ? `${currentCheckin.primaryEmotion} — ${currentCheckin.subEmotion}`
      : "No Emotion Logged";

    const updatedData = {
      status: 'completed',
      score: parseInt(obtainedScore, 10),
      percentage,
      rank: rank ? parseInt(rank, 10) : null,
      percentile: percentile ? parseFloat(percentile) : null,
      emotionalTag: emoTag,
      completedAt: new Date().toISOString()
    };

    await db.updateDoc(`users/${user.uid}/tests`, logScoreTest.id, updatedData);
    setLogScoreTest(null);
    setObtainedScore('');
    setRank('');
    setPercentile('');

    // Exit focus mode if in it
    if (focusModeTest) {
      setFocusModeTest(null);
      setFocusActive(false);
    }

    await loadTests();
    if (onTestAdded) onTestAdded(); // Refreshes dashboard insights
  };

  // Filters
  const upcomingTests = tests.filter(t => t.status === 'upcoming');
  const ongoingTests = tests.filter(t => t.status === 'ongoing');
  const completedTests = tests.filter(t => t.status === 'completed');

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  };

  return (
    <div className="flex flex-col gap-5 relative">
      
      {/* Upper header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#00C9B0]" />
          <h2 className="text-sm font-bold text-white font-space uppercase tracking-wider">
            {t('exam_vault')}
          </h2>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-3 py-1.5 bg-[#00C9B0]/10 border border-[#00C9B0]/20 text-[#00C9B0] hover:bg-[#00C9B0]/25 hover:text-white rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 focus:ring-2 focus:ring-[#00C9B0]"
        >
          <Plus className="w-3.5 h-3.5" />
          {t('add_test')}
        </button>
      </div>

      {/* Tabs list */}
      <div className="flex gap-2 p-1 bg-slate-950/40 border border-slate-850 rounded-md select-none">
        {['upcoming', 'ongoing', 'completed'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              activeTab === tab 
                ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-slate-900/50'
            }`}
          >
            {tab === 'upcoming' && `Upcoming (${upcomingTests.length})`}
            {tab === 'ongoing' && `Ongoing (${ongoingTests.length})`}
            {tab === 'completed' && `Completed (${completedTests.length})`}
          </button>
        ))}
      </div>

      {/* TAB CONTENTS */}
      <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
        
        {/* UPCOMING */}
        {activeTab === 'upcoming' && (
          upcomingTests.length > 0 ? (
            upcomingTests.map(test => (
              <div key={test.id} className="p-4 bg-slate-900/40 border border-slate-800 rounded-md flex justify-between items-center gap-4 hover:border-slate-700 transition-all">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-white">{test.name}</span>
                    <span className="text-[9px] font-space font-bold px-2 py-0.5 rounded-full bg-slate-800 text-gray-400">
                      {test.type}
                    </span>
                  </div>
                  <div className="flex gap-4 text-[10px] text-gray-500 font-medium font-space">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#00C9B0]" />
                      {new Date(test.dateTime).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#00C9B0]" />
                      {new Date(test.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="text-right flex flex-col gap-0.5 font-space">
                  <span className="text-xs text-gray-400">Total Marks</span>
                  <span className="text-sm font-bold text-white">{test.totalMarks}</span>
                </div>
              </div>
            ))
          ) : (
            <span className="text-xs text-gray-500 text-center py-4">No upcoming mock tests scheduled.</span>
          )
        )}

        {/* ONGOING */}
        {activeTab === 'ongoing' && (
          ongoingTests.length > 0 ? (
            ongoingTests.map(test => (
              <div key={test.id} className="p-4 bg-indigo-950/10 border border-indigo-900/40 rounded-md flex justify-between items-center gap-4 hover:border-indigo-800/60 transition-all">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-white">{test.name}</span>
                    <span className="text-[9px] font-space font-bold px-2 py-0.5 rounded-full bg-indigo-900/40 text-indigo-400 border border-indigo-900/20">
                      {test.type}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#00C9B0] font-semibold flex items-center gap-1 animate-pulse">
                    <AlertCircle className="w-3 h-3" /> Test time active!
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleLaunchFocus(test)}
                    className="px-3 py-1.5 bg-[#00C9B0] hover:bg-[#00b29c] text-[#060B18] text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1 focus:ring-2 focus:ring-[#00C9B0]"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Focus Mode
                  </button>
                  <button
                    onClick={() => setLogScoreTest(test)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold rounded-md border border-slate-700 transition-all cursor-pointer"
                  >
                    Log Score
                  </button>
                </div>
              </div>
            ))
          ) : (
            <span className="text-xs text-gray-500 text-center py-4">No tests are active right now.</span>
          )
        )}

        {/* COMPLETED */}
        {activeTab === 'completed' && (
          completedTests.length > 0 ? (
            completedTests.map(test => (
              <div key={test.id} className="p-4 bg-slate-900/20 border border-slate-800 rounded-md flex justify-between items-center gap-4 hover:border-slate-750 transition-all">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-white">{test.name}</span>
                    <span className="text-[9px] font-space font-bold px-2 py-0.5 rounded-full bg-slate-850 text-gray-400">
                      {test.type}
                    </span>
                  </div>
                  {/* Emotional Tag overlay */}
                  <div className="flex items-center gap-1 text-[9px] font-semibold text-gray-500 bg-slate-950/20 px-2 py-0.5 rounded w-max border border-slate-850">
                    <span className="text-[10px] text-indigo-400">Mind State:</span>
                    <span>{test.emotionalTag || 'No log'}</span>
                  </div>
                </div>

                <div className="flex gap-4 items-center">
                  <div className="text-right flex flex-col gap-0.5 font-space">
                    <span className="text-[9px] text-gray-500">Score</span>
                    <span className="text-sm font-extrabold text-[#00C9B0]">{test.score}/{test.totalMarks}</span>
                    <span className="text-[9px] text-gray-400">({test.percentage}%)</span>
                  </div>

                  {test.rank && (
                    <div className="text-right flex flex-col gap-0.5 font-space pl-3 border-l border-slate-800">
                      <span className="text-[9px] text-gray-500 flex items-center gap-0.5"><Trophy className="w-2.5 h-2.5 text-amber-500" /> Rank</span>
                      <span className="text-sm font-bold text-white">#{test.rank}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <span className="text-xs text-gray-500 text-center py-4">No completed tests logged.</span>
          )
        )}
      </div>

      {/* POPUP MODAL: ADD TEST FORM */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleAddTest}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-md shadow-2xl relative flex flex-col gap-4 p-5 md:p-6 animate-scale-up"
          >
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white font-space uppercase tracking-wider">Schedule Test Entry</h3>
              <button 
                type="button" 
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-white p-1 rounded hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Test Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Allen Mock test #10"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-800 bg-slate-950/40 rounded-md text-white focus:ring-2 focus:ring-[#00C9B0] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Test Type</label>
                  <select
                    value={testType}
                    onChange={(e) => setTestType(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-800 bg-slate-950/40 rounded-md text-white focus:ring-2 focus:ring-[#00C9B0] focus:outline-none cursor-pointer"
                  >
                    <option value="Mock Test" className="bg-slate-900">Mock Test</option>
                    <option value="Full Syllabus Test" className="bg-slate-900">Full Syllabus</option>
                    <option value="Chapter Test" className="bg-slate-900">Chapter Test</option>
                    <option value="Sectional Test" className="bg-slate-900">Sectional Test</option>
                    <option value="Main Exam" className="bg-slate-900">Main Exam</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Marks</label>
                  <input
                    type="number"
                    required
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-800 bg-slate-950/40 rounded-md text-white focus:ring-2 focus:ring-[#00C9B0] focus:outline-none font-space"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-800 bg-slate-950/40 rounded-md text-white focus:ring-2 focus:ring-[#00C9B0] focus:outline-none font-space"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Description (Optional)</label>
                <textarea
                  placeholder="Covers organic chemistry and thermodynamics..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="2"
                  className="w-full px-3 py-2 text-xs border border-slate-800 bg-slate-950/40 rounded-md text-white focus:ring-2 focus:ring-[#00C9B0] focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 w-full bg-[#00C9B0] hover:bg-[#00b29c] text-[#060B18] py-2 text-xs font-bold rounded-md transition-all shadow-md cursor-pointer"
            >
              Add Scheduled Test
            </button>
          </form>
        </div>
      )}

      {/* POPUP MODAL: LOG SCORE FORM */}
      {logScoreTest && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleLogScoreSubmit}
            className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-md shadow-2xl relative flex flex-col gap-4 p-5 md:p-6 animate-scale-up"
          >
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white font-space uppercase tracking-wider">Log Score: {logScoreTest.name}</h3>
              <button 
                type="button" 
                onClick={() => setLogScoreTest(null)}
                className="text-gray-400 hover:text-white p-1 rounded hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Obtained Marks (Max: {logScoreTest.totalMarks})</label>
                <input
                  type="number"
                  min="0"
                  max={logScoreTest.totalMarks}
                  required
                  placeholder="e.g. 198"
                  value={obtainedScore}
                  onChange={(e) => setObtainedScore(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-800 bg-slate-950/40 rounded-md text-white focus:ring-2 focus:ring-[#00C9B0] focus:outline-none font-space"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rank (Optional)</label>
                  <input
                    type="number"
                    placeholder="e.g. 248"
                    value={rank}
                    onChange={(e) => setRank(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-800 bg-slate-950/40 rounded-md text-white focus:ring-2 focus:ring-[#00C9B0] focus:outline-none font-space"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Percentile (Optional)</label>
                  <input
                    type="number"
                    step="0.001"
                    placeholder="e.g. 98.42"
                    value={percentile}
                    onChange={(e) => setPercentile(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-800 bg-slate-950/40 rounded-md text-white focus:ring-2 focus:ring-[#00C9B0] focus:outline-none font-space"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 w-full bg-[#00C9B0] hover:bg-[#00b29c] text-[#060B18] py-2 text-xs font-bold rounded-md transition-all shadow-md cursor-pointer"
            >
              Submit Results & Tag Emotions
            </button>
          </form>
        </div>
      )}

      {/* FULL-SCREEN OVERLAY: FOCUS MODE */}
      {focusActive && focusModeTest && (
        <div className="fixed inset-0 bg-[#060B18] z-50 flex flex-col justify-between p-6 md:p-12 animate-fade-in">
          
          {/* Header */}
          <div className="flex justify-between items-center border-b border-slate-850 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#00C9B0] animate-pulse" />
              <span className="text-xs font-bold font-space uppercase text-gray-400 tracking-wider">
                Ongoing Focus Mode
              </span>
            </div>
            <button
              onClick={handleExitFocus}
              className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-white rounded-md text-[10px] font-bold text-gray-400 transition-all cursor-pointer"
            >
              Exit Focus Session
            </button>
          </div>

          {/* Main Core Focus View */}
          <div className="flex-1 flex flex-col justify-center items-center gap-8 text-center max-w-md mx-auto">
            <div className="flex flex-col gap-2">
              <span className="text-2xl font-extrabold text-white tracking-tight leading-tight">
                {focusModeTest.name}
              </span>
              <span className="text-xs text-[#00C9B0] font-space font-medium uppercase tracking-wider">
                Active Mock Simulation
              </span>
            </div>

            {/* Simulated Time Counter */}
            <div className="flex flex-col items-center justify-center p-8 bg-slate-950/60 border border-slate-850 rounded-full w-48 h-48 shadow-lg">
              <Clock className="w-5 h-5 text-gray-500 mb-1" />
              <span className="text-3xl font-extrabold font-space text-white tracking-tight">
                {formatTime(focusTimeLeft)}
              </span>
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                Time Remaining
              </span>
            </div>

            <div className="flex flex-col items-center gap-3">
              <p className="text-xs text-gray-400 max-w-[280px]">
                Feeling anxious or facing time panic? Take a brief deep breath session to reset.
              </p>
              
              <button
                onClick={() => setShowBreathingInFocus(!showBreathingInFocus)}
                className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 focus:ring-2 focus:ring-[#00C9B0] focus:outline-none"
              >
                <Wind className="w-4 h-4 text-indigo-300" />
                {showBreathingInFocus ? 'Hide Box Breathing' : 'Box Breathing Reset'}
              </button>
            </div>
          </div>

          {/* Footer button */}
          <div className="w-full flex justify-center border-t border-slate-850 pt-4">
            <button
              onClick={() => setLogScoreTest(focusModeTest)}
              className="px-6 py-2.5 bg-[#00C9B0] hover:bg-[#00b29c] text-[#060B18] text-xs font-bold rounded-md transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              Submit Test & Enter Score
            </button>
          </div>

          {/* Floating Breathing block in focus mode */}
          {showBreathingInFocus && (
            <div className="fixed inset-x-4 bottom-20 md:left-auto md:right-12 md:bottom-12 md:max-w-xs z-50">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-md shadow-2xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold text-[#00C9B0] uppercase tracking-wider">Quick Box Breathing</span>
                  <button 
                    onClick={() => setShowBreathingInFocus(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {/* Embedded quick breathing visualizer */}
                <div className="flex flex-col items-center justify-center p-3 gap-3">
                  <div className="w-16 h-16 rounded-full bg-[#00C9B0]/20 animate-pulse flex items-center justify-center text-[10px] text-white font-bold font-space uppercase">
                    Breathe
                  </div>
                  <span className="text-[10px] text-gray-400 text-center leading-relaxed">
                    Box Breathing (4-4-4-4). Inhale, Hold, Exhale, Hold. Repeat.
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
