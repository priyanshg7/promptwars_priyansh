import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Smile, 
  Activity, 
  Clock, 
  X, 
  Zap, 
  Moon, 
  Sparkles, 
  Compass, 
  FlameKindling,
  Timer,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { db } from '../firebase';

const PRIMARY_EMOTIONS = [
  { name: 'Happy', emoji: '😊', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { name: 'Calm', emoji: '😌', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { name: 'Anxious', emoji: '😰', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { name: 'Sad', emoji: '😔', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { name: 'Angry', emoji: '😠', color: 'bg-red-50 text-red-700 border-red-200' },
  { name: 'Numb', emoji: '😑', color: 'bg-gray-50 text-gray-700 border-gray-200' },
  { name: 'Excited', emoji: '🤩', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { name: 'Overwhelmed', emoji: '😵', color: 'bg-rose-50 text-rose-700 border-rose-200' }
];

const SUB_EMOTIONS = {
  Happy: ['Proud', 'Grateful', 'Hopeful', 'Content'],
  Calm: ['Peaceful', 'Focused', 'Relaxed', 'Clear-headed'],
  Anxious: ['Worried about results', 'Scared of family', 'Syllabus confusion', 'Time panic'],
  Sad: ['Hopeless', 'Lonely', 'Disappointed', 'Discouraged'],
  Angry: ['Frustrated', 'Resentful', 'Irritated', 'Helpless'],
  Numb: ['Empty', 'Detached', 'Exhausted', 'Apathetic'],
  Excited: ['Motivated', 'Energetic', 'Confident', 'Ready to hustle'],
  Overwhelmed: ['Too much syllabus', 'Too many tests', 'Losing track', 'Can\'t focus']
};

export default function DailyCheckin({ user, onClose, onCheckinComplete }) {
  const { t } = useTranslation();
  const [part, setPart] = useState('A'); // 'A' (Emotion Wheel) | 'B' (Sliders) | 'C' (Reaction Game)

  // Part A state
  const [selectedPrimary, setSelectedPrimary] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);

  // Part B state
  const [sleep, setSleep] = useState(6);
  const [energy, setEnergy] = useState(6);
  const [motivation, setMotivation] = useState(6);

  // Part C state: Reaction Game
  const [gameState, setGameState] = useState('idle'); // 'idle' | 'waiting' | 'ready' | 'clicked'
  const [startTime, setStartTime] = useState(0);
  const [reactionTime, setReactionTime] = useState(null);
  const [testCompleted, setTestCompleted] = useState(false);
  const [tapTimeout, setTapTimeout] = useState(null);

  useEffect(() => {
    return () => {
      if (tapTimeout) clearTimeout(tapTimeout);
    };
  }, [tapTimeout]);

  const handleSelectPrimary = (emotion) => {
    setSelectedPrimary(emotion);
    setSelectedSub(null); // Reset sub-emotion
  };

  const startReactionTest = () => {
    setGameState('waiting');
    setReactionTime(null);
    const delay = Math.random() * 2000 + 1000; // 1 to 3 seconds random delay
    
    const timeout = setTimeout(() => {
      setGameState('ready');
      setStartTime(Date.now());
    }, delay);
    setTapTimeout(timeout);
  };

  const handleCircleTap = () => {
    if (gameState === 'waiting') {
      // Clicked too early
      if (tapTimeout) clearTimeout(tapTimeout);
      setGameState('idle');
      alert("Too early! Tap only when the circle glows.");
      return;
    }

    if (gameState === 'ready') {
      const duration = Date.now() - startTime;
      setReactionTime(duration);
      setGameState('clicked');
      setTestCompleted(true);
    }
  };

  const getReactionInterpretation = (ms) => {
    if (!ms) return { text: '', color: 'text-gray-400' };
    if (ms < 220) return { text: 'Sharp Focus', color: 'text-emerald-700 bg-emerald-50 border border-emerald-200' };
    if (ms <= 280) return { text: 'Normal Response', color: 'text-yellow-700 bg-yellow-50 border border-yellow-200' };
    if (ms <= 350) return { text: 'Slightly Slow', color: 'text-amber-700 bg-amber-50 border border-amber-200' };
    return { text: 'High Cognitive Fatigue', color: 'text-rose-700 bg-rose-50 border border-rose-200' };
  };

  const submitCheckin = async () => {
    let baselineScore = 30;
    
    // Physiological parameters
    baselineScore += (10 - sleep) * 3;
    baselineScore += (10 - energy) * 3;
    baselineScore += (10 - motivation) * 2;
    
    // Cognitive parameter
    if (reactionTime) {
      if (reactionTime > 350) baselineScore += 15;
      else if (reactionTime > 280) baselineScore += 8;
      else if (reactionTime < 220) baselineScore -= 5;
    }
    
    // Emotional parameters
    const stressEmotions = ["Overwhelmed", "Anxious", "Numb", "Sad"];
    const positiveEmotions = ["Happy", "Calm", "Excited"];
    if (stressEmotions.includes(selectedPrimary)) {
      baselineScore += 15;
      if (selectedPrimary === "Overwhelmed") baselineScore += 10;
    } else if (positiveEmotions.includes(selectedPrimary)) {
      baselineScore -= 10;
    }

    // Clamp score between 0 and 100
    const finalBurnoutScore = Math.max(5, Math.min(100, Math.round(baselineScore)));

    const checkinData = {
      primaryEmotion: selectedPrimary,
      subEmotion: selectedSub,
      sleep: parseInt(sleep, 10),
      energy: parseInt(energy, 10),
      motivation: parseInt(motivation, 10),
      reactionTime: reactionTime || 260,
      burnoutScoreCalculated: finalBurnoutScore,
      createdAt: new Date().toISOString()
    };

    // Store in Firestore subcollection
    await db.addDoc(`users/${user.uid}/checkins`, checkinData);
    
    // Update user's current burnout score in main document
    await db.updateDoc("users", user.uid, {
      burnoutScore: finalBurnoutScore,
      lastCheckinDate: new Date().toLocaleDateString()
    });
    onCheckinComplete(checkinData);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-lg shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden animate-scale-up text-slate-350">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-955/40">
          <div className="flex items-center gap-2">
            <FlameKindling className="w-5 h-5 text-[#00A389]" />
            <h3 className="text-sm font-bold text-white font-space uppercase tracking-wider">
              {t('daily_checkin')}
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1 hover:bg-slate-850 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 flex flex-col gap-6">
          
          {/* Part A: Emotion Wheel */}
          {part === 'A' && (
            <div className="flex flex-col gap-5 animate-fade-in">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-[#00A389] uppercase tracking-widest font-space">Part A — Emotion Wheel</span>
                <h4 className="text-lg font-bold text-white leading-tight font-sans">How do you feel right now?</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  First, select your primary state, then choose the matching detail.
                </p>
              </div>

              {/* Primary grid representation of outer wheel */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PRIMARY_EMOTIONS.map(em => (
                  <button
                    key={em.name}
                    onClick={() => handleSelectPrimary(em.name)}
                    className={`p-3 rounded-md border text-center flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      selectedPrimary === em.name 
                        ? 'border-[#00A389] bg-[#00A389]/10 text-white shadow-sm font-bold'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-white hover:bg-slate-850'
                    }`}
                  >
                    <span className="text-xl">{em.emoji}</span>
                    <span className="text-xs font-semibold">{em.name}</span>
                  </button>
                ))}
              </div>

              {/* Inner ring representation: Sub-emotions */}
              {selectedPrimary && (
                <div className="bg-slate-950/30 p-4 border border-slate-800 rounded-md flex flex-col gap-3.5 animate-fade-in">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-[#00A389]" />
                    Refining: {selectedPrimary}
                  </span>
                  
                  <div className="flex flex-wrap gap-2">
                    {SUB_EMOTIONS[selectedPrimary].map(sub => (
                      <button
                        key={sub}
                        onClick={() => setSelectedSub(sub)}
                        className={`px-3 py-2 text-xs font-semibold rounded-md border transition-all cursor-pointer ${
                          selectedSub === sub
                            ? 'bg-[#00A389] border-[#00A389] text-white shadow-sm font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setPart('B')}
                disabled={!selectedPrimary || !selectedSub}
                className="mt-2 w-full bg-[#00A389] hover:bg-[#008e77] text-white py-2.5 text-sm font-bold rounded-md transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Sliders
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Part B: Physiological Sliders */}
          {part === 'B' && (
            <div className="flex flex-col gap-5 animate-fade-in">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-[#00A389] uppercase tracking-widest font-space">Part B — Physiological Sliders</span>
                <h4 className="text-lg font-bold text-white leading-tight">Rate your physical parameters</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  These track sleep and motivation proxies to predict burnout trends.
                </p>
              </div>

              <div className="flex flex-col gap-5 bg-slate-950/30 p-4 border border-slate-800 rounded-md">
                {/* Sleep Quality */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-350 flex items-center gap-1.5">
                      <Moon className="w-4 h-4 text-[#00A389]" />
                      🌙 {t('sleep_quality')}
                    </span>
                    <span className="font-space font-bold text-[#00A389]">
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
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer focus:outline-none accent-[#00A389]"
                  />
                </div>

                {/* Physical Energy */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-355 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-[#00A389]" />
                      ⚡ {t('energy')}
                    </span>
                    <span className="font-space font-bold text-[#00A389]">
                      {energy} / 10
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={energy}
                    onChange={(e) => setEnergy(e.target.value)}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer focus:outline-none accent-[#00A389]"
                  />
                </div>

                {/* Study Motivation */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-355 flex items-center gap-1.5">
                      <Smile className="w-4 h-4 text-[#00A389]" />
                      📚 {t('motivation')}
                    </span>
                    <span className="font-space font-bold text-[#00A389]">
                      {motivation} / 10
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={motivation}
                    onChange={(e) => setMotivation(e.target.value)}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer focus:outline-none accent-[#00A389]"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-2">
                <button
                  onClick={() => setPart('A')}
                  className="flex-1 bg-transparent hover:bg-slate-850 border border-slate-800 text-slate-300 py-2.5 text-sm font-bold rounded-md transition-all cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={() => setPart('C')}
                  className="flex-1 bg-[#00A389] hover:bg-[#008e77] text-white py-2.5 text-sm font-bold rounded-md transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Go to Tap Test
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Part C: Reaction Tap Test */}
          {part === 'C' && (
            <div className="flex flex-col gap-5 animate-fade-in">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-[#00A389] uppercase tracking-widest font-space">Part C — Reaction Tap Test</span>
                <h4 className="text-lg font-bold text-white leading-tight">{t('reaction_time')}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  We measure cognitive fatigue using reaction speeds.
                </p>
              </div>

              {/* Game Sandbox */}
              <div className="w-full h-[180px] bg-slate-950/30 rounded-md border border-slate-800 flex flex-col justify-center items-center relative overflow-hidden p-4">
                {gameState === 'idle' && (
                  <button
                    onClick={startReactionTest}
                    className="px-5 py-2.5 bg-slate-900 border border-slate-800 text-xs font-bold text-[#00A389] rounded-md hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <Timer className="w-4 h-4" />
                    Start Tap Test
                  </button>
                )}

                {gameState === 'waiting' && (
                  <span className="text-xs text-slate-450 font-semibold animate-pulse">
                    Wait for circle...
                  </span>
                )}

                {gameState === 'ready' && (
                  <button
                    onClick={handleCircleTap}
                    className="w-24 h-24 rounded-full bg-[#00A389] shadow-lg flex items-center justify-center cursor-pointer transform active:scale-95 transition-transform animate-scale-up text-white"
                  >
                    <span className="text-xs font-bold uppercase font-space">TAP NOW!</span>
                  </button>
                )}

                {gameState === 'clicked' && reactionTime && (
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="text-2xl font-extrabold font-space text-white">
                      {reactionTime}ms
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border uppercase tracking-wider ${
                      getReactionInterpretation(reactionTime).color
                    }`}>
                      {getReactionInterpretation(reactionTime).text}
                    </span>
                    
                    <button
                      onClick={startReactionTest}
                      className="mt-2 text-[10px] font-bold text-slate-500 hover:text-white underline cursor-pointer"
                    >
                      Retry Test
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-4 mt-2">
                <button
                  onClick={() => setPart('B')}
                  disabled={gameState === 'waiting' || gameState === 'ready'}
                  className="flex-1 bg-transparent hover:bg-slate-850 border border-slate-800 text-slate-300 py-2.5 text-sm font-bold rounded-md transition-all cursor-pointer disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={submitCheckin}
                  disabled={gameState === 'waiting' || gameState === 'ready'}
                  className="flex-1 bg-[#00A389] hover:bg-[#008e77] text-white py-2.5 text-sm font-bold rounded-md transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  Submit Check-In
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
