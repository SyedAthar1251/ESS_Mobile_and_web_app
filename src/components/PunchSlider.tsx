import React, { useState, useRef, useEffect } from "react";

interface PunchSliderProps {
  isPunchedIn: boolean;
  isLoading: boolean;
  onPunch: () => Promise<void>;
  disabled?: boolean;
  isOnBreak?: boolean;
  hasTakenBreakToday?: boolean;
  customLabel?: string;
  customColor?: string;
  slideDirection?: "left" | "right";
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

const KNOB_WIDTH = 72;
const TRACK_PADDING = 8;

export default function PunchSlider({
  isPunchedIn,
  isLoading,
  onPunch,
  disabled = false,
  isOnBreak = false,
  hasTakenBreakToday = false,
  customLabel,
  customColor,
  slideDirection,
  title,
  subtitle,
  icon,
}: PunchSliderProps) {
  const [position, setPosition] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  const getEffectiveDirection = (): "left" | "right" => {
    if (slideDirection) return slideDirection;
    if (isOnBreak || !isPunchedIn) return "right";
    return "left";
  };

  const direction = getEffectiveDirection();
  const isRightSlide = direction === "right";

  const getMaxPosition = () => {
    return Math.max(containerWidth - KNOB_WIDTH - TRACK_PADDING * 2, 0);
  };

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  useEffect(() => {
    setPosition(0);
  }, [direction]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLoading || disabled) return;
    setDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragging || !containerRef.current || isLoading) return;

    const rect = containerRef.current.getBoundingClientRect();
    let newPos: number;

    if (isRightSlide) {
      newPos = e.clientX - rect.left - TRACK_PADDING;
    } else {
      newPos = rect.right - e.clientX - TRACK_PADDING;
    }

    const max = getMaxPosition();
    if (newPos < 0) newPos = 0;
    if (newPos > max) newPos = max;

    setPosition(newPos);
  };

  const handleMouseUp = async () => {
    if (!dragging) return;
    setDragging(false);

    if (position >= getMaxPosition() - 5) {
      await onPunch();
    }

    setPosition(0);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (isLoading || disabled) return;
    setDragging(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!dragging || !containerRef.current || isLoading) return;

    const rect = containerRef.current.getBoundingClientRect();
    const touch = (e as TouchEvent).touches[0];
    let newPos: number;

    if (isRightSlide) {
      newPos = touch.clientX - rect.left - TRACK_PADDING;
    } else {
      newPos = rect.right - touch.clientX - TRACK_PADDING;
    }

    const max = getMaxPosition();
    if (newPos < 0) newPos = 0;
    if (newPos > max) newPos = max;

    setPosition(newPos);
  };

  const handleTouchEnd = async () => {
    if (!dragging) return;
    setDragging(false);

    if (position >= getMaxPosition() - 5) {
      await onPunch();
    }

    setPosition(0);
  };

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleTouchEnd);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        window.removeEventListener("touchmove", handleTouchMove);
        window.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [dragging, position, slideDirection, isPunchedIn, isOnBreak, isLoading]);

  const getKnobLeft = () => {
    const max = getMaxPosition();
    if (isRightSlide) {
      return TRACK_PADDING + position;
    }
    return TRACK_PADDING + max - position;
  };

  const getColors = () => {
    if (customColor) {
      const colorMap: Record<string, { bg: string; knob: string; border: string; shadow: string; text: string; accent: string }> = {
        "bg-orange-500": { bg: "bg-orange-50", knob: "bg-orange-500", border: "border-orange-200", shadow: "shadow-orange-200", text: "text-orange-600", accent: "#f97316" },
        "bg-red-500": { bg: "bg-red-50", knob: "bg-red-500", border: "border-red-200", shadow: "shadow-red-200", text: "text-red-600", accent: "#ef4444" },
        "bg-blue-500": { bg: "bg-blue-50", knob: "bg-blue-500", border: "border-blue-200", shadow: "shadow-blue-200", text: "text-blue-600", accent: "#3b82f6" },
        "bg-green-500": { bg: "bg-green-50", knob: "bg-green-500", border: "border-green-200", shadow: "shadow-green-200", text: "text-green-600", accent: "#22c55e" },
      };
      return colorMap[customColor] || { bg: "bg-gray-50", knob: "bg-gray-500", border: "border-gray-200", shadow: "shadow-gray-200", text: "text-gray-600", accent: "#6b7280" };
    }

    if (!isPunchedIn) return { bg: "bg-green-50", knob: "bg-green-500", border: "border-green-200", shadow: "shadow-green-200", text: "text-green-600", accent: "#22c55e" };
    if (!isOnBreak && !hasTakenBreakToday) return { bg: "bg-orange-50", knob: "bg-orange-500", border: "border-orange-200", shadow: "shadow-orange-200", text: "text-orange-600", accent: "#f97316" };
    if (!isOnBreak && hasTakenBreakToday) return { bg: "bg-red-50", knob: "bg-red-500", border: "border-red-200", shadow: "shadow-red-200", text: "text-red-600", accent: "#ef4444" };
    return { bg: "bg-blue-50", knob: "bg-blue-500", border: "border-blue-200", shadow: "shadow-blue-200", text: "text-blue-600", accent: "#3b82f6" };
  };

  const colors = getColors();
  const progress = getMaxPosition() > 0 ? (position / getMaxPosition()) * 100 : 0;

  return (
    <div className="relative">
      {(title || icon || subtitle) && (
        <div className="flex items-center gap-3 mb-3">
          {icon && (
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm border ${colors.border}`}
              style={{ backgroundColor: `color-mix(in srgb, ${colors.knob.replace("bg-", "")} 12%, white)` }}
            >
              {icon}
            </div>
          )}
          <div className="flex-1">
            {title && <h3 className="text-sm font-bold text-gray-800 leading-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className={`
          relative h-14 rounded-2xl overflow-hidden
          ${colors.bg} border ${colors.border}
          shadow-lg
          transition-all duration-300
          ${disabled || isLoading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
          touch-none
        `}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.03) 100%)",
          }}
        />

        <div
          className="absolute top-0 h-full transition-all duration-150 ease-out"
          style={{
            width: `${Math.min(progress, 100)}%`,
            left: isRightSlide ? 0 : undefined,
            right: isRightSlide ? undefined : 0,
            opacity: 0.18,
            background: `linear-gradient(${isRightSlide ? "90deg" : "270deg"}, ${colors.accent}22 0%, ${colors.accent}44 100%)`,
          }}
        />

        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none px-20">
          <span className={`text-sm font-bold ${colors.text}`}>
            {customLabel || (isLoading ? "Processing..." : disabled ? "Completed" : "Slide to confirm")}
          </span>
        </div>

        <div
          className={`
            absolute top-1/2 -translate-y-1/2
            h-11 rounded-2xl
            flex items-center justify-center
            bg-white/90 backdrop-blur-md
            border-2
            shadow-lg
            transition-all duration-150 ease-out
            ${dragging ? "scale-[1.03]" : "scale-100"}
            ${isLoading ? "cursor-wait" : "cursor-grab active:cursor-grabbing"}
          `}
          style={{
            width: KNOB_WIDTH,
            left: getKnobLeft(),
            borderColor: `${colors.accent}66`,
            boxShadow: dragging
              ? `0 10px 25px -5px ${colors.accent}40, 0 8px 10px -6px ${colors.accent}30`
              : `0 4px 6px -1px ${colors.accent}20, 0 2px 4px -2px ${colors.accent}15`,
          }}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke={colors.accent}
            viewBox="0 0 24 24"
            strokeWidth={2.5}
          >
            {isRightSlide ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}
