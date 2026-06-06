import React, { useState, useEffect } from 'react';
import DealRoom from './components/DealRoom';
import { Sparkles, RefreshCw, Layers } from 'lucide-react';

const INITIAL_DEAL_INFO = {
  title: "API Integration & Data Sync Agreement",
  provider: "DevFlow Inc.",
  client: "Apex Retail Group",
  meetingDate: "June 5, 2026",
  pricing: {
    monthly: "$2,500/mo",
    setup: "$5,000",
    duration: "3 Months",
    sla: "99.9% Uptime",
    goLive: "July 1, 2026"
  },
  signedBy: "",
  signedAt: ""
};

const INITIAL_TASKS = [
  { id: 'task-1', title: 'Whitelist client staging server IPs', category: 'Security', completed: false, owner: 'DevFlow Inc.' },
  { id: 'task-2', title: 'Verify Webhook signature validation endpoint', category: 'Security', completed: false, owner: 'DevFlow Inc.' },
  { id: 'task-3', title: 'Upload initial product catalog CSV in sandbox', category: 'Data Setup', completed: false, owner: 'Apex Retail Group' },
  { id: 'task-4', title: 'Configure Sandbox payment gateway keys', category: 'Integrations', completed: false, owner: 'Apex Retail Group' },
  { id: 'task-5', title: 'Establish SLA automated healthcheck routing', category: 'Infrastructure', completed: false, owner: 'DevFlow Inc.' },
  { id: 'task-6', title: 'Verify first test purchase webhook triggers successfully', category: 'Testing', completed: false, owner: 'Apex Retail Group' }
];

export default function App() {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('pact_tasks_v1');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [dealInfo, setDealInfo] = useState(() => {
    const saved = localStorage.getItem('pact_deal_info_v1');
    return saved ? JSON.parse(saved) : INITIAL_DEAL_INFO;
  });

  const [isSigned, setIsSigned] = useState(() => {
    const saved = localStorage.getItem('pact_is_signed_v1');
    return saved ? JSON.parse(saved) === 'true' : false;
  });

  useEffect(() => {
    localStorage.setItem('pact_tasks_v1', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('pact_deal_info_v1', JSON.stringify(dealInfo));
  }, [dealInfo]);

  useEffect(() => {
    localStorage.setItem('pact_is_signed_v1', String(isSigned));
  }, [isSigned]);

  const toggleTask = (taskId) => {
    setTasks(prev => 
      prev.map(task => 
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const handleSignOff = (name) => {
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    setDealInfo(prev => ({
      ...prev,
      signedBy: name,
      signedAt: today
    }));
    setIsSigned(true);
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset the Pact Deal Room state?")) {
      setTasks(INITIAL_TASKS);
      setDealInfo(INITIAL_DEAL_INFO);
      setIsSigned(false);
    }
  };

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
              Synced via Voice Transcript Parser
            </span>
            <button
              onClick={handleReset}
              className="text-[11px] font-semibold text-gray-600 hover:text-indigo-600 flex items-center gap-1 bg-white border border-gray-200 hover:border-indigo-100 px-2.5 py-1 rounded-md transition-colors cursor-pointer focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              title="Reset Pact Room"
            >
              <RefreshCw className="w-3 h-3" />
              Reset State
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 py-8">
        <DealRoom
          tasks={tasks}
          toggleTask={toggleTask}
          dealInfo={dealInfo}
          onSignOff={handleSignOff}
          isSigned={isSigned}
        />
      </main>

      {/* Simple accessible footer */}
      <footer className="border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-400 font-space">
        <p>© 2026 Pact Inc. All cryptographic handshakes and voice transcript parses are legally binding.</p>
      </footer>

    </div>
  );
}
