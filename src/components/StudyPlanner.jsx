import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Sparkles, 
  CheckSquare, 
  Plus, 
  Loader2, 
  Trash2, 
  Check, 
  ChevronRight
} from 'lucide-react';
import { db } from '../firebase';

export default function StudyPlanner({ user, profile }) {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  // AI Suggestions State
  const [suggesting, setSuggesting] = useState(false);
  const [suggestedTasks, setSuggestedTasks] = useState(null);
  const [pendingTaskTitle, setPendingTaskTitle] = useState('');

  // Load tasks from mock database
  const loadTasks = useCallback(async () => {
    try {
      const snap = await db.getDocs(`users/${user.uid}/tasks`);
      const list = [];
      snap.docs.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      // Sort tasks: Active first, then by date
      list.sort((a, _b) => (a.status === 'Done' ? 1 : -1));
      setTasks(list);
    } catch (err) {
      console.error("Failed to load tasks:", err);
    }
  }, [user.uid]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleAddTaskSubmit = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    // Check if task is vague (less than 4 words) to trigger AI suggestion intercept
    const words = newTaskTitle.trim().split(/\s+/);
    if (words.length <= 2) {
      setSuggesting(true);
      setPendingTaskTitle(newTaskTitle.trim());
      setNewTaskTitle('');
      
      try {
        const response = await fetch('/api/suggest-tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task_title: newTaskTitle.trim(),
            exam_type: profile.targetExams?.[0] || 'JEE',
            language: profile.language || 'en'
          })
        });
        
        if (response.ok) {
          const suggestions = await response.json();
          setSuggestedTasks(suggestions);
        } else {
          throw new Error("Failed to fetch suggestions");
        }
      } catch (err) {
        console.warn("AI suggest tasks failed, using mock:", err);
        // Mock fallback
        setSuggestedTasks([
          `1. Read core concepts of ${newTaskTitle.trim()} — 30 mins`,
          `2. Solve 10 mock problems of ${newTaskTitle.trim()} — 45 mins`,
          "3. Review incorrect answers & update notes — 15 mins"
        ]);
      } finally {
        setSuggesting(false);
      }
    } else {
      // Create standard task directly
      await createTasksInDb([newTaskTitle.trim()]);
      setNewTaskTitle('');
    }
  };

  const createTasksInDb = async (titles) => {
    for (const title of titles) {
      const task = {
        title,
        status: 'Not Started', // 'Not Started' | 'In Progress' | 'Done' | 'Skipped'
        createdAt: new Date().toISOString()
      };
      await db.addDoc(`users/${user.uid}/tasks`, task);
    }
    await loadTasks();
  };

  const handleAcceptAISuggestions = async () => {
    if (!suggestedTasks) return;
    await createTasksInDb(suggestedTasks);
    setSuggestedTasks(null);
    setPendingTaskTitle('');
  };

  const handleKeepOriginalTask = async () => {
    await createTasksInDb([pendingTaskTitle]);
    setSuggestedTasks(null);
    setPendingTaskTitle('');
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    await db.updateDoc(`users/${user.uid}/tasks`, taskId, { status: newStatus });
    await loadTasks();
  };

  const handleDeleteTask = async (taskId) => {
    await db.deleteDoc(`users/${user.uid}/tasks`, taskId);
    await loadTasks();
  };

  // Get Phase based on countdown
  const getExamPhaseInfo = () => {
    if (!profile.examDates || Object.keys(profile.examDates).length === 0) {
      return { phase: "Syllabus Intensive", percent: 45 };
    }
    const nextExamName = Object.keys(profile.examDates)[0];
    const examDate = new Date(profile.examDates[nextExamName]);
    const today = new Date();
    const diffDays = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays > 90) return { name: "Phase 1: Syllabus Completion", desc: "Focus on building core conceptual structures.", color: "bg-indigo-500", percent: 25 };
    if (diffDays > 30) return { name: "Phase 2: Revision & Practice", desc: "Solve chapter tests, formula sheets & summary notes.", color: "bg-teal-500", percent: 50 };
    if (diffDays > 7) return { name: "Phase 3: Mock Test Intensive", desc: "Regular mock simulations and error reviews.", color: "bg-amber-500", percent: 75 };
    return { name: "Phase 4: Final Week Calm", desc: "Prioritize sleep and mental grounding. No new concepts.", color: "bg-emerald-500", percent: 95 };
  };

  const phase = getExamPhaseInfo();

  return (
    <div className="flex flex-col gap-5 relative text-slate-300">
      
      {/* Upper Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-[#00A389]" />
          <h2 className="text-sm font-bold text-white font-space uppercase tracking-wider">
            {t('study_planner')}
          </h2>
        </div>
      </div>

      {/* Exam Countdown Milestone Phases */}
      <section className="bg-slate-950/40 border border-slate-800 p-4 rounded-md flex flex-col gap-3 shadow-sm">
        <div className="flex justify-between items-start text-xs">
          <div className="flex flex-col gap-1">
            <span className="font-bold text-white leading-none">{phase.name}</span>
            <span className="text-[10px] text-slate-400 font-medium">{phase.desc}</span>
          </div>
          <span className="font-space font-bold text-[#00A389]">
            {phase.percent}% Journey
          </span>
        </div>
        
        {/* Milestone progress bar */}
        <div className="h-2 w-full bg-slate-850 rounded-full overflow-hidden">
          <div className={`h-full ${phase.color} rounded-full transition-all duration-500`} style={{ width: `${phase.percent}%` }} />
        </div>
      </section>

      {/* Task input form */}
      <form onSubmit={handleAddTaskSubmit} className="flex gap-2">
        <input
          type="text"
          required
          placeholder="e.g. Solve Physics electrostatics or Study Chemistry..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-855 rounded-md text-white focus:ring-2 focus:ring-[#00A389] focus:outline-none placeholder-slate-600 font-semibold text-xs"
        />
        <button
          type="submit"
          disabled={suggesting}
          className="px-4 bg-[#00A389] hover:bg-[#008e77] text-white rounded-md text-xs font-bold transition-all shadow-sm flex items-center justify-center cursor-pointer disabled:opacity-50"
        >
          {suggesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        </button>
      </form>

      {/* AI SUGGESTION INTERCEPT DIALOG */}
      {suggestedTasks && (
        <div className="p-4 bg-indigo-950/40 border border-indigo-900/30 rounded-md flex flex-col gap-3.5 animate-scale-up shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-405" />
            <span className="text-xs font-bold text-indigo-305">Gemini AI Plan Suggestion</span>
          </div>
          
          <div className="text-xs text-slate-450 leading-relaxed">
            Instead of "<span className="font-bold text-slate-200">{pendingTaskTitle}</span>", let's add these bite-sized, structured study milestones:
          </div>

          <div className="flex flex-col gap-1.5 pl-2 border-l border-[#00A389]/30 font-space text-[11px] text-[#00A389] font-medium">
            {suggestedTasks.map((t, idx) => (
              <span key={idx} className="flex items-center gap-1.5">
                <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
                {t}
              </span>
            ))}
          </div>

          <div className="flex gap-2 mt-1">
            <button
              onClick={handleAcceptAISuggestions}
              className="px-3.5 py-1.5 bg-[#00A389] hover:bg-[#008e77] text-white text-xs font-bold rounded-md transition-all cursor-pointer"
            >
              Accept AI Breakdown
            </button>
            <button
              onClick={handleKeepOriginalTask}
              className="px-3.5 py-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-750 text-slate-350 text-xs font-bold rounded-md transition-all cursor-pointer"
            >
              Keep Original
            </button>
          </div>
        </div>
      )}

      {/* TASKS LIST */}
      <div className="flex flex-col gap-2.5 max-h-[280px] overflow-y-auto pr-1">
        {tasks.length > 0 ? (
          tasks.map(task => (
            <div 
              key={task.id} 
              className={`p-3 bg-slate-900/20 border border-slate-850 rounded-md flex justify-between items-center gap-4 hover:border-slate-750 transition-all shadow-sm ${
                task.status === 'Done' ? 'opacity-50 bg-slate-950/10' : ''
              }`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                {/* Status cycle click checkbox */}
                <button
                  onClick={() => handleUpdateStatus(task.id, task.status === 'Done' ? 'Not Started' : 'Done')}
                  className={`w-4.5 h-4.5 rounded border flex items-center justify-center shrink-0 cursor-pointer ${
                    task.status === 'Done' 
                      ? 'bg-[#00A389] border-[#00A389] text-white' 
                      : 'border-slate-750 hover:border-slate-650 bg-slate-950'
                  }`}
                >
                  {task.status === 'Done' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>
                
                <span className={`text-xs font-bold truncate ${
                  task.status === 'Done' ? 'line-through text-slate-500' : 'text-slate-200'
                }`}>
                  {task.title}
                </span>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {/* Status select dropdown */}
                <select
                  value={task.status}
                  onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                  className="px-2 py-0.5 border border-slate-805 bg-slate-950 text-[9px] font-bold text-slate-400 rounded focus:ring-1 focus:ring-[#00A389] focus:outline-none cursor-pointer"
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                  <option value="Skipped">Skipped</option>
                </select>

                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <span className="text-xs text-slate-500 text-center py-6">No study tasks logged yet. Add one above!</span>
        )}
      </div>

    </div>
  );
}
