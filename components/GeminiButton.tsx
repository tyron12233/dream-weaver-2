import React, { useState, useRef, useLayoutEffect } from "react";
import { motion } from "framer-motion";

// Gemini-style button with responsive floating stars
// - Floating stars positions now depend on the measured button size (width/height)
// - Stars are distributed evenly around the button with small deterministic jitter
// - Stars are spaced farther apart and scale with button size instead of text length

function AnimatedSparkles({ size = 60, spin = false }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
      animate={spin ? { rotate: 360 } : { rotate: 0 }}
      transition={
        spin
          ? { repeat: Infinity, duration: 1.2, ease: "linear" }
          : { duration: 0 }
      }
      style={{ originX: "50%", originY: "50%" }}
    >
      <defs>
        <linearGradient
          id="geminiDiamondGradient"
          x1="0"
          y1="0"
          x2="40"
          y2="40"
        >
          <stop offset="0%" stopColor={spin ? "#0EA5E9" : "#7C3AED"} />
          <stop offset="100%" stopColor={spin ? "#7C3AED" : "#0EA5E9"} />
        </linearGradient>
      </defs>
      <g>
        <polygon
          points="20,4 36,20 20,36 4,20"
          fill="url(#geminiDiamondGradient)"
          stroke="#fff"
          strokeWidth="2"
          style={{
            filter: spin
              ? "drop-shadow(0 0 12px #0EA5E9)"
              : "drop-shadow(0 0 8px #6D28D9)",
          }}
        />
        <circle cx="20" cy="20" r="4.5" fill="#fff" opacity="0.7" />
      </g>
    </motion.svg>
  );
}

// Deterministic pseudo-random (so positions won't wildly jitter between renders)
function seededRandom(index, seed = 111) {
  const s = (index + seed) * 9301 + 49297;
  return (s % 233280) / 233280;
}

function FloatingStar({ index, isVisible, btnWidth, btnHeight, starCount }) {
  // base angle evenly distributed, add small jitter
  const baseAngle = index * (360 / Math.max(1, starCount));
  const rand = seededRandom(index, Math.floor(btnWidth + btnHeight));
  const angle = baseAngle + (rand - 0.5) * 30; // +/-15deg jitter

  // distance depends on button size: farther for larger buttons
  const radius = Math.max(btnWidth, btnHeight) / 2;
  // Extra padding so stars sit noticeably outside the button
  const extra = 12 + rand * Math.max(12, radius * 0.6);
  const distance = radius + extra;

  const x = Math.cos((angle * Math.PI) / 180) * distance;
  const y = Math.sin((angle * Math.PI) / 180) * distance;

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
      initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
      animate={
        isVisible
          ? { x: x, y: y, scale: [0, 1.4, 1], opacity: [0, 1, 0.9] }
          : { x: 0, y: 0, scale: 0, opacity: 0 }
      }
      transition={{
        duration: 0.6,
        delay: index * 0.04,
        ease: [0.23, 1, 0.32, 1],
      }}
    >
      <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden>
        <defs>
          <linearGradient
            id={`starGradient-${index}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="50%" stopColor="#FFA500" />
            <stop offset="100%" stopColor="#FFFF00" />
          </linearGradient>
        </defs>
        <path
          d="M8 0L9.5 5.5L16 5.5L11.5 8.5L13 14L8 11L3 14L4.5 8.5L0 5.5L6.5 5.5L8 0Z"
          fill={`url(#starGradient-${index})`}
        />
      </svg>
    </motion.div>
  );
}

export default function GeminiButton({
  onClick,
  children,
  loading = false,
  className = "",
  ...props
}) {
  const [isHover, setIsHover] = useState(false);
  const [btnSize, setBtnSize] = useState({ width: 100, height: 30 });
  const btnRef = useRef(null);

  // Measure button size so stars depend on actual button footprint (not text length)
  useLayoutEffect(() => {
    function measure() {
      if (!btnRef.current) return;
      const rect = btnRef.current.getBoundingClientRect();
      setBtnSize({ width: rect.width, height: rect.height });
    }

    measure();
    // watch for resize (user zoom, font changes, responsive layout)
    const ro = new ResizeObserver(measure);
    if (btnRef.current) ro.observe(btnRef.current);
    return () => ro.disconnect();
  }, []);

  // Generate array of stars
  const starCount = 11;
  const stars = Array.from({ length: starCount }, (_, i) => i);

  return (
    <motion.button
      ref={btnRef}
      data-transition-target="button"
      whileTap={{ scale: 0.98 }}
      initial={{ y: 0 }}
      onHoverStart={() => setIsHover(true)}
      onHoverEnd={() => setIsHover(false)}
      aria-pressed={loading ? "true" : "false"}
      aria-label={
        typeof children === "string" ? children : "Gemini action button"
      }
      onClick={onClick}
      className={
        `relative inline-flex items-center gap-3 px-5 py-3 rounded-2xl font-medium shadow-lg transition-all focus:outline-none focus:ring-4 ` +
        `focus:ring-[#6D28D9]/30 text-white overflow-visible ` +
        (isHover
          ? `bg-gradient-to-r from-[#8B5CF6] via-[#7C3AED] to-[#06B6D4] `
          : `bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#0EA5E9] `) +
        `shadow-[0_10px_30px_rgba(99,102,241,0.12)] ` +
        `${className}`
      }
      {...props}
    >
      {/* Floating stars container */}
      <div className="absolute inset-0 pointer-events-none">
        {stars.map((star) => (
          <FloatingStar
            key={star}
            index={star}
            isVisible={isHover && !loading}
            btnWidth={btnSize.width}
            btnHeight={btnSize.height}
            starCount={starCount}
          />
        ))}
      </div>

      {/* left animated sparkles / spinner */}
      <span className="relative flex items-center justify-center w-6 h-6 text-white/95 z-10">
        {loading ? (
          <svg
            className="w-5 h-5 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              className="opacity-25"
            />
            <path
              d="M22 12a10 10 0 00-10-10"
              stroke="currentColor"
              strokeWidth="4"
              className="opacity-75"
            />
          </svg>
        ) : (
          <AnimatedSparkles size={20} spin={isHover} />
        )}
      </span>

      {/* label */}
      <span className="whitespace-nowrap relative z-10">{children}</span>

      {/* subtle chevron / affordance */}
      <span className="ml-2 inline-flex items-center text-sm opacity-90 relative z-10">
        →
      </span>

      {/* decorative soft glow pulse (reverted to original purple-blue outer glow) */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          boxShadow: isHover
            ? "0 15px 45px rgba(139,92,246,0.15)"
            : "0 10px 40px rgba(99,102,241,0.12)",
          mixBlendMode: "screen",
        }}
      />
    </motion.button>
  );
}
