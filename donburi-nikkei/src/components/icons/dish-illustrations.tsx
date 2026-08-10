import { cn } from "@/lib/utils";
import type { DishIllustration } from "@/lib/types";

interface DishArtProps {
  className?: string;
}

function Frame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("h-full w-full", className)}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="bg-gold" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#fff8ea" />
          <stop offset="100%" stopColor="#f1ead9" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="49" fill="url(#bg-gold)" />
      <circle cx="50" cy="50" r="48" fill="none" stroke="#c9a24b" strokeOpacity="0.35" />
      {children}
    </svg>
  );
}

function Donburi() {
  return (
    <Frame>
      <path d="M22 52 a28 16 0 0 0 56 0 Z" fill="#1c1712" />
      <path d="M20 50 a30 13 0 0 0 60 0 Z" fill="#faf6ee" stroke="#1c1712" strokeWidth="2" />
      <circle cx="40" cy="47" r="4.5" fill="#c1442d" />
      <circle cx="52" cy="45" r="4" fill="#e8735c" />
      <circle cx="61" cy="49" r="3.5" fill="#5b7b5a" />
      <circle cx="47" cy="52" r="3" fill="#c9a24b" />
      <path d="M30 47 q20 -10 40 0" stroke="#c9a24b" strokeWidth="1.5" fill="none" opacity="0.6" />
      <path d="M46 24 q-4 6 0 10" stroke="#c9a24b" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />
      <path d="M54 22 q-4 6 0 10" stroke="#c9a24b" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />
    </Frame>
  );
}

function Nigiri() {
  return (
    <Frame>
      <ellipse cx="38" cy="60" rx="16" ry="9" fill="#faf6ee" stroke="#1c1712" strokeWidth="2" />
      <path d="M25 55 q13 -12 26 0" fill="#e8735c" stroke="#1c1712" strokeWidth="2" strokeLinejoin="round" />
      <ellipse cx="66" cy="55" rx="15" ry="8.5" fill="#faf6ee" stroke="#1c1712" strokeWidth="2" />
      <path d="M58 49 h16 v6 h-16 z" fill="#1c1712" />
      <path d="M60 47 q6 -4 12 0" fill="#c1442d" stroke="#1c1712" strokeWidth="1.5" />
    </Frame>
  );
}

function Temaki() {
  return (
    <Frame>
      <path d="M50 24 L74 74 L26 74 Z" fill="#1c1712" />
      <path d="M50 30 L69 70 L31 70 Z" fill="#faf6ee" />
      <path d="M40 42 q10 -6 20 0" stroke="#c1442d" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M36 52 q14 -8 28 0" stroke="#5b7b5a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="50" cy="63" r="3" fill="#c9a24b" />
    </Frame>
  );
}

function Gyoza() {
  return (
    <Frame>
      <path
        d="M28 55 a22 18 0 1 1 44 0 q-3 10 -22 12 q-19 -2 -22 -12 Z"
        fill="#f1ead9"
        stroke="#1c1712"
        strokeWidth="2"
      />
      <path
        d="M31 52 q19 -14 38 0"
        fill="none"
        stroke="#1c1712"
        strokeWidth="2"
        strokeDasharray="3 3"
      />
      <path d="M28 55 a22 18 0 1 1 44 0" fill="none" stroke="#c1442d" strokeWidth="1.5" opacity="0.4" />
    </Frame>
  );
}

function Drink() {
  return (
    <Frame>
      <path d="M38 30 h24 l-4 44 h-16 z" fill="#e4ede2" stroke="#1c1712" strokeWidth="2" />
      <path d="M40 40 h20" stroke="#5b7b5a" strokeWidth="2" />
      <path d="M44 20 q6 6 0 12" stroke="#c9a24b" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M54 20 q6 6 0 12" stroke="#c9a24b" strokeWidth="2" fill="none" strokeLinecap="round" />
    </Frame>
  );
}

function Dessert() {
  return (
    <Frame>
      <ellipse cx="50" cy="66" rx="26" ry="7" fill="#f1ead9" stroke="#1c1712" strokeWidth="2" />
      <circle cx="40" cy="50" r="12" fill="#faf6ee" stroke="#1c1712" strokeWidth="2" />
      <circle cx="62" cy="52" r="9" fill="#e8735c" stroke="#1c1712" strokeWidth="2" />
      <circle cx="40" cy="46" r="2" fill="#c9a24b" />
    </Frame>
  );
}

function Yakisoba() {
  return (
    <Frame>
      <ellipse cx="50" cy="58" rx="27" ry="14" fill="#faf6ee" stroke="#1c1712" strokeWidth="2" />
      <path d="M28 56 q10 -14 22 0 q10 -14 22 0" stroke="#c9a24b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M30 62 q10 -12 20 0 q10 -12 20 0" stroke="#c1442d" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7" />
      <circle cx="40" cy="50" r="2.5" fill="#5b7b5a" />
      <circle cx="58" cy="52" r="2.5" fill="#5b7b5a" />
    </Frame>
  );
}

function Sashimi() {
  return (
    <Frame>
      <rect x="24" y="58" width="52" height="6" rx="3" fill="#1c1712" opacity="0.85" />
      <path d="M30 58 l8 -20 h10 l-6 20 Z" fill="#e8735c" stroke="#1c1712" strokeWidth="1.5" />
      <path d="M46 58 l8 -22 h10 l-6 22 Z" fill="#c1442d" stroke="#1c1712" strokeWidth="1.5" />
      <path d="M62 58 l6 -16 h8 l-4 16 Z" fill="#e8735c" stroke="#1c1712" strokeWidth="1.5" />
    </Frame>
  );
}

const map: Record<DishIllustration, () => React.ReactElement> = {
  donburi: Donburi,
  nigiri: Nigiri,
  temaki: Temaki,
  gyoza: Gyoza,
  drink: Drink,
  dessert: Dessert,
  yakisoba: Yakisoba,
  sashimi: Sashimi,
};

export function DishArt({ type, className }: { type: DishIllustration } & DishArtProps) {
  const Illustration = map[type];
  return (
    <div className={cn("relative", className)}>
      <Illustration />
    </div>
  );
}
