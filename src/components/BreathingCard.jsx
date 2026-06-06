import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Wind, Play, Pause, RotateCcw, Check, Sparkles } from 'lucide-react';

const CYCLE_STEPS = [
  { text: 'Inhale', duration: 4, state: 'inhale' },
  { text: 'Hold', duration: 4, state: 'hold-in' },
  { text: 'Exhale', duration: 4, state: 'exhale' },
  { text: 'Hold', duration: 4, state: 'hold-out' }
];

export default function BreathingCard({ onGroundingFeedback }) {
  const { t } = useTranslation();
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(4);
  const [completedCycles, setCompletedCycles] = useState(0);
  const [sessionFinished, setSessionFinished] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackAnswer, setFeedbackAnswer] = useState(null);

  useEffect(() => {
    let timer = null;
    if (isActive && !sessionFinished) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Move to next step in Box Breathing
            const nextIndex = (currentStepIndex + 1) % 4;
            setCurrentStepIndex(nextIndex);
            
            // If we completed a full cycle (step index goes back to 0)
            if (nextIndex === 0) {
              setCompletedCycles(c => {
                const updated = c + 1;
                if (updated >= 4) { // Target 4 cycles (approx 1 min) for demo convenience (2 min normally)
                  setIsActive(false);
                  setSessionFinished(true);
                  setShowFeedbackForm(true);
                }
                return updated;
              });
            }
            return CYCLE_STEPS[nextIndex].duration;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isActive, currentStepIndex, sessionFinished]);

  const handleToggle = () => {
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    setCurrentStepIndex(0);
    setTimeLeft(4);
    setCompletedCycles(0);
    setSessionFinished(false);
    setShowFeedbackForm(false);
    setFeedbackAnswer(null);
  };

  const handleFeedback = (feltGrounded) => {
    setFeedbackAnswer(feltGrounded ? 'yes' : 'no');
    // Callback to update parent/burnout state
    if (onGroundingFeedback) {
      onGroundingFeedback(feltGrounded);
    }
  };

  const currentStep = CYCLE_STEPS[currentStepIndex];

  return (
    <div className="glass-card rounded-md p-5 flex flex-col gap-4 shadow-sm select-none relative overflow-hidden animate-fade-in">
      
      {/* Background ambient pulse */}
      {isActive && (
        <div className="absolute inset-0 bg-[#00A389]/5 blur-2xl animate-pulse pointer-events-none" />
      )}

      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold text-[#00A389] uppercase tracking-widest flex items-center gap-1.5">
          <Wind className="w-3.5 h-3.5 animate-pulse" />
          {t('breathing_card')}
        </span>
        <span className="text-[10px] font-space font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
          Cycle {completedCycles}/4
        </span>
      </div>

      {!showFeedbackForm ? (
        <div className="flex flex-col items-center justify-center py-6 gap-6">
          
          {/* Animated Circle Container */}
          <div className="w-40 h-40 flex items-center justify-center relative">
            
            {/* Pulsing visual circle */}
            <div 
              className={`w-16 h-16 rounded-full border border-[#00A389]/40 flex items-center justify-center text-center transition-all duration-[4000ms] ease-in-out ${
                isActive ? currentStep.state : 'bg-slate-50'
              }`}
              style={{
                boxShadow: isActive ? '0 0 30px rgba(0, 163, 137, 0.15)' : 'none'
              }}
            >
              {/* Inner details */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-space font-bold text-slate-500 uppercase tracking-widest">
                  {isActive ? currentStep.text : 'Ready'}
                </span>
                {isActive && (
                  <span className="text-xl font-bold font-space text-slate-800 mt-1">
                    {timeLeft}s
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggle}
              className={`px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 cursor-pointer focus:ring-2 focus:ring-[#00A389] focus:outline-none ${
                isActive 
                  ? 'bg-slate-100 text-slate-700 border border-slate-200' 
                  : 'bg-[#00A389] hover:bg-[#008e77] text-white shadow-sm'
              }`}
            >
              {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isActive ? 'Pause' : 'Start Session'}
            </button>
            <button
              onClick={handleReset}
              className="p-2 border border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-800 rounded-md hover:bg-slate-100 transition-all cursor-pointer focus:ring-2 focus:ring-[#00A389]"
              title="Reset timer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-6 gap-4 animate-scale-up text-center">
          <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-250 flex items-center justify-center text-[#00A389] mb-1">
            <Check className="w-5 h-5" />
          </div>
          <div className="flex flex-col gap-1">
            <h5 className="text-sm font-bold text-slate-800">Session Completed</h5>
            <p className="text-xs text-slate-500 max-w-[280px]">
              Do you feel a bit more grounded and calm now?
            </p>
          </div>

          {feedbackAnswer === null ? (
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => handleFeedback(true)}
                className="px-4 py-1.5 bg-[#00A389] hover:bg-[#008e77] text-white text-xs font-bold rounded-md transition-all cursor-pointer"
              >
                Yes, Better
              </button>
              <button
                onClick={() => handleFeedback(false)}
                className="px-4 py-1.5 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-md transition-all cursor-pointer"
              >
                No, Still Tense
              </button>
            </div>
          ) : (
            <div className="mt-2 text-xs flex flex-col items-center gap-2">
              <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-750 rounded-md text-[11px] max-w-[300px] leading-relaxed flex gap-1.5">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-indigo-600" />
                <span>
                  {feedbackAnswer === 'yes'
                    ? 'Wonderful! We adjusted your Burnout Score down by 6%. Keep maintaining deep breaths.'
                    : 'Alright, we logged this. Gemini suggests taking a short 10-minute walk or listening to soft ambient music.'}
                </span>
              </div>
              <button
                onClick={handleReset}
                className="text-[10px] font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer mt-1"
              >
                Start Another Session
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
