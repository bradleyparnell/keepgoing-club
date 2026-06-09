import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'kg_onboarded';

const steps = [
  {
    icon: '🧱',
    title: 'Add Your Projects',
    desc: 'In the Projects tab, hit "Add Project" and name what you\'re building. Set how many bricks (25-min sessions) you want to lay per day.',
  },
  {
    icon: '⏱️',
    title: 'Start Focusing',
    desc: 'Tap a project then hit "Start Focusing." The timer runs for 25 minutes — no distractions. Every completed session = one brick laid.',
  },
  {
    icon: '🔁',
    title: 'Work in Cycles',
    desc: 'After 4 bricks you earn a long break. The app tracks your wall automatically — keep stacking until the wall is complete.',
  },
  {
    icon: '🎧',
    title: 'Use the Sounds',
    desc: 'Hit the Sounds tab for neural entrainment audio — Gamma for deep focus, Alpha to unwind, Theta for creativity, Beta for energy.',
  },
];

export default function OnboardingModal() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  }

  if (!visible) return null;

  const current = steps[step];
  const isLast  = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-sm p-7 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">{current.icon}</div>
          <h2 className="text-white font-black text-xl">{current.title}</h2>
          <p className="text-zinc-400 text-sm mt-2 leading-relaxed">{current.desc}</p>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-2 mb-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-6 bg-red-700' : 'w-1.5 bg-zinc-700'
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {!isLast && (
            <button
              onClick={dismiss}
              className="flex-1 py-2.5 rounded-xl text-zinc-500 hover:text-zinc-300 text-sm font-semibold transition-colors"
            >
              Skip
            </button>
          )}
          <button
            onClick={isLast ? dismiss : () => setStep(s => s + 1)}
            className="flex-1 py-2.5 rounded-xl bg-red-800 hover:bg-red-700 text-white font-bold text-sm transition-colors"
          >
            {isLast ? "Let's Go 🧱" : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
