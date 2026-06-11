import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Check, Target, PlayCircle, Minus, CheckCircle } from 'lucide-react';
import { Project, Task } from '../types';
import { AddProjectModal } from './AddProjectModal';
import { Brick } from './Brick';
import { DateStrip } from './DateStrip';
import { formatDateLabel, formatDateSubtitle } from '../utils/dateUtils';

interface ProjectsTabProps {
  projects: Project[];
  tasks: Task[];
  activeProjectId: string | null;
  dailyBudget: number;
  selectedDate: string;
  onDateChange: (date: string) => void;
  onSetActive: (id: string) => void;
  onStartFocusing: () => void;
  onSetBudget: (n: number) => void;
  onAddProject: (name: string, tomatoes: number, plannedDate: string) => void;
  onDeleteProject: (id: string) => void;
  onAddTask: (projectId: string, text: string) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateTomatoes: (projectId: string, total: number) => void;
  onUpdateNotes: (projectId: string, notes: string) => void;
  onMarkComplete: (projectId: string, completed: boolean) => void;
}

const QUOTES = [
  { text: "You have power over your mind, not outside events. Realize this and you will find strength.", author: "Marcus Aurelius" },
  { text: "The impediment to action advances action. What stands in the way becomes the way.", author: "Marcus Aurelius" },
  { text: "Luck is what happens when preparation meets opportunity.", author: "Seneca" },
  { text: "Begin at once to live, and count each separate day as a separate life.", author: "Seneca" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Either write something worth reading or do something worth writing.", author: "Benjamin Franklin" },
  { text: "No man was ever wise by chance.", author: "Seneca" },
  { text: "Perfection is achieved, not when there is nothing more to add, but when there is nothing left to take away.", author: "Antoine de Saint-Exupéry" },
  { text: "Do not wait to strike till the iron is hot, but make it hot by striking.", author: "William Butler Yeats" },
  { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Small deeds done are better than great deeds planned.", author: "Peter Marshall" },
  { text: "First, do. Then, perfect.", author: "Stoic Maxim" },
  { text: "Concentrate all your thoughts upon the work at hand. The sun's rays do not burn until brought to a focus.", author: "Alexander Graham Bell" },
];

const todayQuoteIndex = new Date().getDate() % QUOTES.length;

export const ProjectsTab: React.FC<ProjectsTabProps> = ({
  projects, tasks, activeProjectId, dailyBudget, selectedDate,
  onDateChange, onSetActive, onStartFocusing, onSetBudget,
  onAddProject, onDeleteProject, onAddTask,
  onToggleTask, onDeleteTask, onUpdateTomatoes, onUpdateNotes, onMarkComplete,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [taskInputs, setTaskInputs] = useState<Record<string, string>>({});
  type NoteEntry = { ts: string; text: string };
  const parseNotes = (raw: string): NoteEntry[] => {
    if (!raw) return [];
    try { const p = JSON.parse(raw); if (Array.isArray(p)) return p; } catch {}
    return [{ ts: '', text: raw }];
  };
  const [notesInput, setNotesInput] = useState<Record<string, string>>({});
  const [notesLogs, setNotesLogs] = useState<Record<string, NoteEntry[]>>({});

  const saveProjectNote = (projectId: string, projectNotes: string) => {
    const text = (notesInput[projectId] ?? '').trim();
    if (!text) return;
    const existing = notesLogs[projectId] ?? parseNotes(projectNotes);
    const entry: NoteEntry = { ts: new Date().toISOString(), text };
    const updated = [entry, ...existing];
    setNotesLogs(prev => ({ ...prev, [projectId]: updated }));
    setNotesInput(prev => ({ ...prev, [projectId]: '' }));
    onUpdateNotes(projectId, JSON.stringify(updated));
  };
  const deleteProjectNote = (projectId: string, idx: number, projectNotes: string) => {
    const existing = notesLogs[projectId] ?? parseNotes(projectNotes);
    const updated = existing.filter((_, i) => i !== idx);
    setNotesLogs(prev => ({ ...prev, [projectId]: updated }));
    onUpdateNotes(projectId, JSON.stringify(updated));
  };
  const fmtTs = (ts: string) => {
    if (!ts) return 'Saved note';
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  function addTask(projectId: string) {
    const text = (taskInputs[projectId] || '').trim();
    if (!text) return;
    onAddTask(projectId, text);
    setTaskInputs(prev => ({ ...prev, [projectId]: '' }));
  }

  const dayProjects = projects.filter(p => p.plannedDate === selectedDate);

  const allocatedBricks = dayProjects.reduce((sum, p) => sum + p.totalTomatoes, 0);
  const budgetRemaining = dailyBudget - allocatedBricks;
  const budgetPct = Math.min(100, Math.round((allocatedBricks / dailyBudget) * 100));
  const overBudget = allocatedBricks > dailyBudget;

  const headerLabel = formatDateLabel(selectedDate);
  const headerSubtitle = formatDateSubtitle(selectedDate);

  return (
    <div className="flex flex-col gap-4 p-4 pb-6">

      <DateStrip
        selectedDate={selectedDate}
        onDateChange={onDateChange}
        projectDates={new Set(projects.map(p => p.plannedDate))}
      />

      <div>
        <h2 className="text-2xl font-black">{headerLabel}</h2>
        <p className="text-sm font-semibold text-base-content/50 mt-0.5 italic">
          {headerSubtitle}
        </p>
      </div>

      <div className="card bg-base-200 shadow-sm">
        <div className="card-body p-4 gap-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-black text-sm uppercase tracking-wider text-base-content/50">Daily Brick Budget</div>
              <div className={`text-xl font-black mt-0.5 ${overBudget ? 'text-error' : budgetRemaining === 0 ? 'text-warning' : 'text-base-content'}`}>
                {overBudget
                  ? `${Math.abs(budgetRemaining)} over budget 🔥`
                  : budgetRemaining === 0
                  ? 'Budget fully loaded! 💪'
                  : `${budgetRemaining} bricks left to assign`}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => onSetBudget(Math.max(1, dailyBudget - 1))} className="btn btn-circle btn-xs btn-outline font-black">
                <Minus size={12} />
              </button>
              <div className="text-center">
                <div className="text-2xl font-black tabular-nums leading-none">{dailyBudget}</div>
                <div className="text-xs font-bold text-base-content/40">budget</div>
              </div>
              <button onClick={() => onSetBudget(Math.min(20, dailyBudget + 1))} className="btn btn-circle btn-xs btn-outline font-black">
                <Plus size={12} />
              </button>
            </div>
          </div>
          <progress
            className={`progress w-full h-3 ${overBudget ? 'progress-error' : budgetRemaining === 0 ? 'progress-warning' : 'progress-primary'}`}
            value={budgetPct}
            max={100}
          />
          <div className="flex justify-between text-xs font-bold text-base-content/40">
            <span>{allocatedBricks} assigned · {dayProjects.length} project{dayProjects.length !== 1 ? 's' : ''}</span>
            <span>{dailyBudget} total ({dailyBudget * 25} min)</span>
          </div>
        </div>
      </div>

      <button onClick={() => setShowModal(true)} className="btn btn-outline btn-primary w-full font-extrabold gap-2">
        <Plus size={18} /> Add Project
      </button>

      {dayProjects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
          <div className="text-6xl">🧱</div>
          <div className="font-black text-xl">Your wall doesn't build itself.</div>
          <div className="text-base-content/50 font-semibold text-sm max-w-xs">
            Every great wall starts with a single brick. Add your first project and get after it.
          </div>
        </div>
      )}

      {dayProjects.map(project => {
        const projTasks = tasks.filter(t => t.projectId === project.id);
        const doneTasks = projTasks.filter(t => t.done).length;
        const isActive = project.id === activeProjectId;
        const isExpanded = expandedId === project.id;
        const remaining = project.totalTomatoes - project.completedTomatoes;
        const isDone = project.isCompleted;

        return (
          <div key={project.id} className={`card bg-base-200 shadow-md transition-all ${isDone ? 'opacity-50 grayscale' : ''} ${isActive && !isDone ? 'ring-2 ring-primary' : ''}`}>
            <div className="card-body p-4 gap-3">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    {isActive && <span className="badge badge-primary badge-sm font-extrabold">ACTIVE</span>}
                    <span className="font-extrabold text-lg leading-tight">{project.name}</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {isActive ? (
                    <>
                      <button onClick={onStartFocusing} className="btn btn-xs btn-primary font-extrabold gap-1">
                        <PlayCircle size={11} /> Enter Arena
                      </button>
                      <button className="btn btn-xs btn-success font-extrabold gap-1 pointer-events-none">
                        <Target size={11} /> Active
                      </button>
                    </>
                  ) : (
                    <button onClick={() => onSetActive(project.id)} className="btn btn-xs btn-outline font-extrabold gap-1">
                      <Target size={11} /> Set Active
                    </button>
                  )}
                  <button
                    onClick={() => onMarkComplete(project.id, !isDone)}
                    title={isDone ? 'Mark incomplete' : 'Mark complete'}
                    className={`btn btn-xs btn-ghost opacity-50 hover:opacity-100 ${isDone ? 'text-primary' : 'hover:text-primary'}`}
                  >
                    {isDone ? <CheckCircle size={14} className="text-primary" /> : <Check size={14} />}
                  </button>
                  <button onClick={() => onDeleteProject(project.id)} className="btn btn-xs btn-ghost opacity-50 hover:opacity-100 hover:text-error">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: project.totalTomatoes }).map((_, i) => (
                  <Brick key={i} size={18} done={i < project.completedTomatoes} />
                ))}
              </div>

              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="text-sm font-extrabold">
                  <span className="text-error text-base">{remaining}</span>
                  <span className="text-base-content/50"> left · </span>
                  <span className="text-base-content/50">{project.completedTomatoes}/{project.totalTomatoes} done</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-black text-base-content/40 mr-1">🧱</span>
                  <button
                    onClick={() => onUpdateTomatoes(project.id, Math.max(project.completedTomatoes + 1, project.totalTomatoes - 1))}
                    disabled={project.totalTomatoes <= project.completedTomatoes + 1}
                    className="btn btn-xs btn-outline font-black w-7 h-7 min-h-0 p-0"
                  >−</button>
                  <span className="font-black w-6 text-center text-sm tabular-nums">{project.totalTomatoes}</span>
                  <button
                    onClick={() => onUpdateTomatoes(project.id, Math.min(12, project.totalTomatoes + 1))}
                    disabled={project.totalTomatoes >= 12}
                    className="btn btn-xs btn-outline font-black w-7 h-7 min-h-0 p-0"
                  >+</button>
                </div>
              </div>

              <button
                onClick={() => setExpandedId(isExpanded ? null : project.id)}
                className="flex items-center gap-1 text-xs font-extrabold text-base-content/50 hover:text-base-content transition-colors self-start"
              >
                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                TASKS ({doneTasks}/{projTasks.length})
              </button>

              {isExpanded && (
                <div className="flex flex-col gap-2 border-t border-base-300 pt-3">
                  {projTasks.length === 0 && (
                    <div className="text-xs font-semibold text-base-content/30 py-1">Break it down. Add your first task.</div>
                  )}
                  {projTasks.map(task => (
                    <div key={task.id} className="flex items-center gap-2 group">
                      <button onClick={() => onToggleTask(task.id)} className={`btn btn-xs btn-circle shrink-0 ${task.done ? 'btn-success' : 'btn-outline'}`}>
                        {task.done && <Check size={10} />}
                      </button>
                      <span className={`flex-1 text-sm font-semibold ${task.done ? 'line-through opacity-40' : ''}`}>{task.text}</span>
                      <button onClick={() => onDeleteTask(task.id)} className="btn btn-ghost btn-xs opacity-0 group-hover:opacity-60 hover:!opacity-100 text-error p-0 w-6 h-6 min-h-0">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-1">
                    <input
                      type="text"
                      className="input input-bordered input-sm flex-1 font-semibold"
                      placeholder="Add a task..."
                      value={taskInputs[project.id] || ''}
                      onChange={e => setTaskInputs(prev => ({ ...prev, [project.id]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && addTask(project.id)}
                    />
                    <button onClick={() => addTask(project.id)} className="btn btn-primary btn-sm font-black">
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Notes */}
                  <div className="border-t border-base-300 pt-3 mt-1">
                    <div className="text-xs font-black uppercase tracking-widest text-base-content/40 mb-2">📝 Notes</div>
                    <div className="flex flex-col gap-2">
                      <textarea
                        className="textarea textarea-bordered w-full text-sm font-medium resize-none bg-base-100/50 focus:outline-none focus:border-primary/50"
                        placeholder="Capture thoughts, blockers, next steps…"
                        rows={2}
                        value={notesInput[project.id] ?? ''}
                        onChange={e => setNotesInput(prev => ({ ...prev, [project.id]: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) saveProjectNote(project.id, project.notes ?? ''); }}
                      />
                      <button
                        className="btn btn-primary btn-sm font-black uppercase tracking-wide self-end"
                        onClick={() => saveProjectNote(project.id, project.notes ?? '')}
                        disabled={!(notesInput[project.id] ?? '').trim()}
                      >
                        Save Note
                      </button>
                      {(notesLogs[project.id] ?? parseNotes(project.notes ?? '')).length > 0 && (
                        <div className="flex flex-col gap-2 mt-1 max-h-48 overflow-y-auto">
                          {(notesLogs[project.id] ?? parseNotes(project.notes ?? '')).map((entry, idx) => (
                            <div key={idx} className="bg-base-100/60 rounded-lg px-3 py-2 flex flex-col gap-1 group">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">{fmtTs(entry.ts)}</span>
                                <button
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-base-content/30 hover:text-error text-xs font-bold px-1"
                                  onClick={() => deleteProjectNote(project.id, idx, project.notes ?? '')}
                                  title="Delete note"
                                >✕</button>
                              </div>
                              <p className="text-sm font-medium text-base-content/80 whitespace-pre-wrap">{entry.text}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}



      <div className="card bg-base-200 mt-2 shadow-sm">
        <div className="card-body p-4 text-center">
          <div className="text-3xl mb-2">📜</div>
          <p className="font-bold italic text-base-content/80 text-sm leading-relaxed">
            "{QUOTES[todayQuoteIndex].text}"
          </p>
          <p className="text-xs font-black text-base-content/40 mt-2 uppercase tracking-widest">
            — {QUOTES[todayQuoteIndex].author}
          </p>
        </div>
      </div>

      {showModal && (
        <AddProjectModal
          allocatedBricks={allocatedBricks}
          budgetBricks={dailyBudget}
          selectedDate={selectedDate}
          onClose={() => setShowModal(false)}
          onAdd={(name, bricks) => {
            onAddProject(name, bricks, selectedDate);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
};
