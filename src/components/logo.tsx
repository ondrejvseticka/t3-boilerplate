interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LogoSvg({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    <svg
      width="110"
      height="32"
      viewBox="0 0 110 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Three colored nodes representing T3 Stack */}
      <circle cx="6" cy="6" r="4" fill="#E11D48" />
      <circle cx="6" cy="16" r="4" fill="#A855F7" />
      <circle cx="6" cy="26" r="4" fill="#3B82F6" />
      <line x1="16" y1="26" x2="28" y2="26" stroke="#3B82F6" strokeWidth="5" strokeLinecap="round" />
      <line x1="16" y1="16" x2="24" y2="16" stroke="#A855F7" strokeWidth="5" strokeLinecap="round" />
      <line x1="16" y1="6" x2="30" y2="6" stroke="#E11D48" strokeWidth="5" strokeLinecap="round" />
      {/* Text: T3 Boilerplate */}
      <text
        x="38"
        y="21"
        fill="#FFFFFF"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="16"
        fontWeight="bold"
        letterSpacing="-0.02em"
      >
        T3<tspan fill="#A855F7" fontWeight="normal">Stack</tspan>
      </text>
    </svg>
  );
}

export function Logo({ className = "", size = "md" }: LogoProps) {
  const heightClass = size === "sm" ? "h-6" : size === "lg" ? "h-10" : "h-8";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LogoSvg className={`${heightClass} w-auto`} />
    </div>
  );
}
