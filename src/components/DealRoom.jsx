import React, { useState } from 'react';
import { 
  Sparkles, 
  Calendar, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Users, 
  ShieldCheck, 
  DollarSign, 
  Clock, 
  Activity,
  FileCheck
} from 'lucide-react';

export default function DealRoom({
  tasks,
  toggleTask,
  dealInfo,
  onSignOff,
  isSigned
}) {
  const [showTranscript, setShowTranscript] = useState(false);
  const [signatureName, setSignatureName] = useState('');

  const completedCount = tasks.filter(t => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const allCompleted = completedCount === tasks.length;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 flex flex-col gap-8 animate-fade-in">
      
      {/* HEADER SECTION */}
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-indigo-600 flex items-center justify-center text-white font-space font-bold text-lg shadow-sm">
              P
            </div>
            <span className="font-space font-bold text-gray-900 tracking-tight text-xl">pact</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              Deal Room
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium bg-gray-100 border border-gray-200 px-3 py-1 rounded-md">
            <span className={`w-2 h-2 rounded-full ${isSigned ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
            {isSigned ? 'Approved & Sealed' : 'Action Required'}
          </div>
        </div>

        <div className="mt-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
            {dealInfo.title}
          </h1>
          <p className="text-gray-500 text-sm mt-1.5 flex flex-wrap items-center gap-y-1 gap-x-4">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4 text-gray-400" />
              {dealInfo.provider} & {dealInfo.client}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4 text-gray-400" />
              Generated {dealInfo.meetingDate}
            </span>
          </p>
        </div>
      </header>

      {/* PROGRESS BAR SECTION */}
      <section className="bg-white border border-gray-200 rounded-md p-5 shadow-sm flex flex-col gap-3">
        <div className="flex justify-between items-center text-sm">
          <span className="font-semibold text-gray-900 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-indigo-600" />
            Milestone Verification Progress
          </span>
          <span className="font-space font-bold text-indigo-600 text-sm">
            {progressPercent}% Complete ({completedCount}/{tasks.length})
          </span>
        </div>
        <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-600 transition-all duration-500 ease-in-out rounded-full" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-gray-500">
          Verify and check off all critical milestones below to unlock the final Pact sign-off.
        </p>
      </section>

      {/* DATA DISPLAY: SCOPE & PRICING */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          Deal Structure & Scope
        </h2>
        <div className="bg-gray-50 border border-gray-200 p-5 rounded-md flex flex-col gap-4 font-space">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-indigo-500" /> Monthly Retainer
              </span>
              <span className="text-lg font-bold text-gray-900">
                {dealInfo.pricing.monthly}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-indigo-500" /> Setup Fee
              </span>
              <span className="text-lg font-bold text-gray-900">
                {dealInfo.pricing.setup}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-indigo-500" /> Pilot Duration
              </span>
              <span className="text-lg font-bold text-gray-900">
                {dealInfo.pricing.duration}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-indigo-500" /> SLA Target
              </span>
              <span className="text-lg font-bold text-gray-900">
                {dealInfo.pricing.sla}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 flex flex-col gap-1.5">
            <div className="text-xs text-gray-600 flex justify-between">
              <span>Go-Live Target:</span>
              <span className="font-semibold text-gray-900">{dealInfo.pricing.goLive}</span>
            </div>
            <div className="text-xs text-gray-600 flex justify-between">
              <span>Billing Cycle:</span>
              <span className="font-semibold text-gray-900">Net 30, starting post-pilot</span>
            </div>
          </div>
        </div>
      </section>

      {/* AI TRANSCRIPT SUMMARY (COLLAPSIBLE) */}
      <section className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors focus:ring-2 focus:ring-indigo-500 focus:outline-none text-left"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-semibold text-gray-900">
              AI Sales Call Transcript Analysis
            </span>
          </div>
          {showTranscript ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>
        
        {showTranscript && (
          <div className="px-5 pb-5 border-t border-gray-150 pt-4 bg-gray-50/30 flex flex-col gap-4 animate-fade-in">
            <div className="text-xs text-gray-600 leading-relaxed space-y-3">
              <p>
                <strong>Summary of Discussion:</strong> In the call conducted on {dealInfo.meetingDate}, representatives from <strong>{dealInfo.provider}</strong> and <strong>{dealInfo.client}</strong> aligned on the sandbox validation plan. To hit the <strong>{dealInfo.pricing.goLive}</strong> launch date, both parties committed to completing their respective tasks by June 15th.
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>{dealInfo.provider} is responsible for webhook routing, endpoint setup, and whitelisting.</li>
                <li>{dealInfo.client} will handle raw product catalog uploads and payment sandbox keys.</li>
                <li>Uptime terms are fixed under the standard {dealInfo.pricing.sla} SLA framework.</li>
              </ul>
            </div>
            <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-md text-[11px] text-indigo-700 leading-relaxed">
              <strong>Transcription Source Log:</strong> "Discovery Call & Sync Alignment (18:42 mins). Voice prints verified for client PM and partner architect. Automated parser run success."
            </div>
          </div>
        )}
      </section>

      {/* TASK CHECKLIST SECTION */}
      <section className="flex flex-col gap-4">
        <div className="flex justify-between items-center border-b border-gray-200 pb-2">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Required Actions & Verification Checklist
          </h2>
          <span className="text-xs text-gray-500 font-medium">
            Owner assignment marked
          </span>
        </div>

        <div className="flex flex-col gap-3.5">
          {tasks.map(task => (
            <div
              key={task.id}
              onClick={() => !isSigned && toggleTask(task.id)}
              className={`p-4 bg-white border rounded-md shadow-sm flex items-start justify-between gap-4 transition-all duration-300 ${
                isSigned ? 'opacity-75' : 'hover:border-gray-300 cursor-pointer'
              } ${
                task.completed ? 'border-emerald-100 bg-emerald-50/10' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <button
                  type="button"
                  disabled={isSigned}
                  aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
                  className={`mt-0.5 min-w-[24px] min-h-[24px] w-6 h-6 rounded border transition-colors flex items-center justify-center focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                    task.completed 
                      ? 'bg-emerald-500 border-emerald-500 text-white' 
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                >
                  {task.completed && <Check className="w-4 h-4 stroke-[3]" />}
                </button>

                <div className="flex flex-col gap-0.5">
                  <span className={`text-sm font-semibold transition-all ${
                    task.completed ? 'line-through text-gray-400' : 'text-gray-900'
                  }`}>
                    {task.title}
                  </span>
                  <span className="text-[10px] font-space font-medium text-gray-400">
                    Category: {task.category}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  task.owner === dealInfo.client
                    ? 'bg-blue-50 text-blue-700 border border-blue-100'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                }`}>
                  {task.owner}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SIGN OFF / APPROVAL SECTION */}
      <section className="bg-white border border-gray-200 rounded-md p-6 shadow-sm flex flex-col gap-5 mt-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-md font-bold text-gray-900 flex items-center gap-1.5">
            <FileCheck className="w-5 h-5 text-indigo-600" />
            Binding Sign-Off & Execution
          </h3>
          <p className="text-xs text-gray-500">
            By typing your full name and submitting this Pact, you approve the AI-extracted deal room criteria and sign off on all verified milestones.
          </p>
        </div>

        {isSigned ? (
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-md flex flex-col items-center justify-center text-center gap-2 animate-scale-up">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-sm">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-bold text-emerald-800">
                Pact Sealed & Executed
              </span>
              <span className="text-xs text-emerald-600 font-space font-medium">
                Signed by: {dealInfo.signedBy} | Date: {dealInfo.signedAt}
              </span>
            </div>
          </div>
        ) : (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (allCompleted && signatureName.trim()) {
                onSignOff(signatureName.trim());
              }
            }}
            className="flex flex-col sm:flex-row gap-3 items-end"
          >
            <div className="flex flex-col gap-1.5 flex-1 w-full">
              <label htmlFor="signature" className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Full Legal Name
              </label>
              <input
                id="signature"
                type="text"
                required
                disabled={!allCompleted}
                placeholder={allCompleted ? "Type name to sign off..." : "Complete all tasks to sign off"}
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-gray-400 disabled:bg-gray-50 disabled:placeholder-gray-300 disabled:cursor-not-allowed font-semibold text-gray-900"
              />
            </div>

            <button
              type="submit"
              disabled={!allCompleted || !signatureName.trim()}
              className={`px-6 py-2 text-sm font-semibold rounded-md transition-all shadow-sm flex items-center justify-center gap-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none w-full sm:w-auto h-[38px] ${
                allCompleted && signatureName.trim()
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
                  : 'bg-indigo-600/50 text-white/70 opacity-50 cursor-not-allowed'
              }`}
            >
              Sign Off Pact
            </button>
          </form>
        )}
      </section>

    </div>
  );
}
