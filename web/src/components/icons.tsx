import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base = (props: IconProps) => ({
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...props,
});

export const TreeLogo = (p: IconProps) => (
  <svg {...base(p)} viewBox="0 0 32 32" strokeWidth={2.2}>
    <circle cx="16" cy="7" r="3.2" />
    <circle cx="7" cy="25" r="3.2" />
    <circle cx="16" cy="25" r="3.2" />
    <circle cx="25" cy="25" r="3.2" />
    <path d="M16 10.2v6.3M7 21.8v-2.3a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v2.3M16 16.5v5.3" />
  </svg>
);
export const SearchIcon = (p: IconProps) => (
  <svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
);
export const PlusIcon = (p: IconProps) => <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>;
export const MinusIcon = (p: IconProps) => <svg {...base(p)}><path d="M5 12h14" /></svg>;
export const FitIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M4 9V5a1 1 0 0 1 1-1h4M20 9V5a1 1 0 0 0-1-1h-4M4 15v4a1 1 0 0 0 1 1h4M20 15v4a1 1 0 0 1-1 1h-4" /></svg>
);
export const ExpandIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 3v18M3 12h18M8 7l4-4 4 4M8 17l4 4 4-4" /></svg>
);
export const CloseIcon = (p: IconProps) => <svg {...base(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>;
export const CalendarIcon = (p: IconProps) => (
  <svg {...base(p)}><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>
);
export const PinIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
);
export const IncenseIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M8 21h8M10 21V11M14 21V11M7 11h10M10 8c-1-1.5 1-2.5 0-4M14 8c-1-1.5 1-2.5 0-4" /></svg>
);
export const NoteIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5M9 13h7M9 17h5" /></svg>
);
export const PhoneIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z" /></svg>
);
export const TagIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z" /><circle cx="8" cy="8" r="1.5" /></svg>
);
export const LockIcon = (p: IconProps) => (
  <svg {...base(p)}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
);
