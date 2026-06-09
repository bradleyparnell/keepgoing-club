import React from 'react';

interface BrickProps {
  size?: number;  // height in px; width = size * 1.6
  done?: boolean;
  faded?: boolean;
}

// Tough SVG brick icon. Replaces the tomato.
// Active: deep terracotta with mortar lines, surface texture, and a diagonal crack.
// Done: dark charcoal with a scratched check mark.
export const Brick: React.FC<BrickProps> = ({ size = 24, done = false, faded = false }) => {
  const w = Math.round(size * 1.6);
  const h = size;

  if (done) {
    return (
      <svg
        width={w}
        height={h}
        viewBox="0 0 32 20"
        style={{ opacity: faded ? 0.22 : 1, display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
        aria-hidden="true"
      >
        {/* Base — charcoal grey */}
        <rect x="0.5" y="0.5" width="31" height="19" rx="2.5" fill="#252525" stroke="#111" strokeWidth="1"/>
        {/* Subtle top highlight */}
        <rect x="1" y="1" width="30" height="5" rx="2" fill="#333" opacity="0.9"/>
        {/* Mortar grooves */}
        <rect x="0" y="7" width="32" height="1" fill="#111" opacity="0.7"/>
        <rect x="0" y="13" width="32" height="1" fill="#111" opacity="0.6"/>
        {/* Vertical brick breaks */}
        <rect x="7" y="0" width="0.8" height="7" fill="#111" opacity="0.5"/>
        <rect x="19" y="7" width="0.8" height="6" fill="#111" opacity="0.5"/>
        <rect x="26" y="13" width="0.8" height="7" fill="#111" opacity="0.5"/>
        {/* Check mark — scratched into the brick */}
        <path
          d="M9 10 L13 14.5 L23 7"
          stroke="#555"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 32 20"
      style={{ opacity: faded ? 0.28 : 1, display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      aria-hidden="true"
    >
      {/* Base — deep terracotta */}
      <rect x="0.5" y="0.5" width="31" height="19" rx="2.5" fill="#7A1E0C" stroke="#3A0804" strokeWidth="1"/>

      {/* Upper face — slightly lighter to suggest clay depth */}
      <rect x="1" y="1" width="30" height="7" rx="2" fill="#9A2A14" opacity="0.85"/>

      {/* Bottom shadow band */}
      <rect x="0.5" y="13" width="31" height="6.5" rx="2.5" fill="#4A1008" opacity="0.7"/>

      {/* Surface gloss — very subtle top-left sheen */}
      <rect x="2" y="1.5" width="18" height="2.5" rx="1" fill="white" opacity="0.055"/>

      {/* Mortar grooves — horizontal courses */}
      <rect x="0" y="7" width="32" height="1.2" fill="#2A0804" opacity="0.65"/>
      <rect x="0" y="12.5" width="32" height="1" fill="#2A0804" opacity="0.55"/>

      {/* Vertical brick head joints (staggered like real brick bonds) */}
      <rect x="7" y="0.5" width="0.8" height="7" fill="#2A0804" opacity="0.45"/>
      <rect x="19" y="7" width="0.8" height="5.5" fill="#2A0804" opacity="0.4"/>
      <rect x="26" y="13.5" width="0.8" height="6" fill="#2A0804" opacity="0.4"/>

      {/* Diagonal crack — the signature grit mark */}
      <path
        d="M12 1.5 L15 7.5 L11.5 9.5 L14.5 18.5"
        stroke="#1A0402"
        strokeWidth="1.3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />

      {/* Surface grit spots — imperfections in the clay */}
      <circle cx="4" cy="10" r="0.75" fill="#2A0804" opacity="0.45"/>
      <circle cx="23" cy="4"  r="0.6"  fill="#2A0804" opacity="0.4"/>
      <circle cx="29" cy="16" r="0.65" fill="#2A0804" opacity="0.38"/>
      <circle cx="9" cy="16" r="0.5"  fill="#1A0402" opacity="0.35"/>
    </svg>
  );
};
