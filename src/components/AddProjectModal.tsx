import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Brick } from './Brick';

interface AddProjectModalProps {
  allocatedBricks: number;
  budgetBricks: number;
  onClose: () => void;
  onAdd: (name: string, bricks: number) => void;
}

export const AddProjectModal: React.FC<AddProjectModalProps> = ({
  allocatedBricks,
  budgetBricks,
  onClose,
  onAdd,
}) => {
  const [name, setName] = useState('');
  const [bricks, setBricks] = useState(4);

  const remainingAfter = budgetBricks - allocatedBricks - bricks;
  const overBudget = remainingAfter < 0;
  const budgetUsedPct = Math.min(100, Math.round(((allocatedBricks + bricks) / budgetBricks) * 100));

  function submit() {
    if (name.trim()) onAdd(name.trim(), bricks);
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-black text-2xl">New Mission 🧱</h3>
          <button onClick={onClose} className="btn btn-ghost btn-circle btn-sm">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-5">
          {/* Daily Budget Bar */}
          <div className="bg-base-200 rounded-xl p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-base-content/50">Daily Budget</span>
              <span className={`text-sm font-black ${overBudget ? 'text-error' : remainingAfter === 0 ? 'text-warning' : 'text-success'}`}>
                {overBudget
                  ? `${Math.abs(remainingAfter)} over 🔥`
                  : remainingAfter === 0
                  ? 'Budget full!'
                  : `${remainingAfter} bricks remaining`}
              </span>
            </div>
            <progress
              className={`progress w-full h-3 ${overBudget ? 'progress-error' : remainingAfter === 0 ? 'progress-warning' : 'progress-primary'}`}
              value={budgetUsedPct}
              max={100}
            />
            <div className="flex justify-between text-xs font-bold text-base-content/40 mt-1">
              <span>{allocatedBricks + bricks} assigned</span>
              <span>{budgetBricks} total</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-black uppercase tracking-wider mb-2 block text-base-content/60">
              What will you build?
            </label>
            <input
              type="text"
              className="input input-bordered w-full font-bold text-lg"
              placeholder="e.g. Build landing page"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              onKeyDown={e => e.key === 'Enter' && submit()}
            />
          </div>

          <div>
            <label className="text-sm font-black uppercase tracking-wider mb-3 block text-base-content/60">
              Assign Bricks 🧱
            </label>
            <div className="flex items-center gap-4 mb-3">
              <button
                onClick={() => setBricks(b => Math.max(1, b - 1))}
                className="btn btn-circle btn-outline btn-lg font-black text-xl"
              >
                −
              </button>
              <span className="text-5xl font-black w-16 text-center tabular-nums">{bricks}</span>
              <button
                onClick={() => setBricks(b => Math.min(12, b + 1))}
                className="btn btn-circle btn-outline btn-lg font-black text-xl"
              >
                +
              </button>
            </div>
            {/* Brick preview row */}
            <div className="flex flex-wrap gap-1.5 min-h-7">
              {Array.from({ length: bricks }).map((_, i) => (
                <Brick key={i} size={18} />
              ))}
            </div>
            <div className="text-xs font-bold text-base-content/40 mt-2">
              = {bricks * 25} minutes of deep work
            </div>
          </div>
        </div>

        <div className="modal-action gap-2 mt-6">
          <button onClick={onClose} className="btn btn-ghost font-bold flex-1">Cancel</button>
          <button
            onClick={submit}
            disabled={!name.trim()}
            className="btn btn-primary font-black flex-1"
          >
            Add to Battle Plan
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
};
