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
  icon
}: PunchSliderProps) {
  const [position, setPosition] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  const isSliderComplete = () => {
    const max = getMaxPosition();
    return position >= max * 0.85;
  };

  const getMaxPosition = () => {
    const knobWidth = 56;
    const padding = 12;
    return containerWidth - knobWidth - (padding * 2);
  };

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

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

    // Determine direction based on slideDirection or fallback to isPunchedIn
    const moveRight = slideDirection === "right" || (!slideDirection && !isPunchedIn);
    const moveLeft = slideDirection === "left" || (!slideDirection && isPunchedIn);

    if (moveRight) {
      newPos = e.clientX - rect.left - 12;
    } else if (moveLeft) {
      newPos = (rect.width - 12) - e.clientX;
    } else {
      newPos = 0;
    }

    if (newPos < 0) newPos = 0;
    if (newPos > getMaxPosition()) newPos = getMaxPosition();

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
     // No preventDefault needed - touch-action: none CSS handles it
     e.stopPropagation();
     if (isLoading || disabled) return;
     setDragging(true);
   };

  const handleTouchMove = (e: TouchEvent) => {
    if (!dragging || !containerRef.current || isLoading) return;

    const rect = containerRef.current.getBoundingClientRect();
    const touch = (e as TouchEvent).touches[0];
    let newPos: number;

    const moveRight = slideDirection === "right" || (!slideDirection && !isPunchedIn);
    const moveLeft = slideDirection === "left" || (!slideDirection && isPunchedIn);

    if (moveRight) {
      newPos = touch.clientX - rect.left - 12;
    } else if (moveLeft) {
      newPos = (rect.width - 12) - touch.clientX;
    } else {
      newPos = 0;
    }

    if (newPos < 0) newPos = 0;
    if (newPos > getMaxPosition()) newPos = getMaxPosition();

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

  // Attach global mouse/touch listeners for smooth drag outside element
  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [dragging, position, slideDirection, isPunchedIn, isLoading]);

  const getKnobLeft = () => {
    const max = getMaxPosition();
    if (slideDirection === "left") {
      return max - position;
    }
    if (slideDirection === "right") {
      return position;
    }
    if (isPunchedIn) {
      return max - position;
    }
    return position;
  };

  // Color system: soft backgrounds with strong accent colors
  const getColors = () => {
    if (customColor) {
      const colorMap: Record<string, { bg: string; knob: string; border: string; shadow: string; text: string }> = {
        'bg-orange-500': { bg: 'bg-orange-50', knob: 'bg-orange-500', border: 'border-orange-200', shadow: 'shadow-orange-200', text: 'text-orange-600' },
        'bg-red-500': { bg: 'bg-red-50', knob: 'bg-red-500', border: 'border-red-200', shadow: 'shadow-red-200', text: 'text-red-600' },
        'bg-blue-500': { bg: 'bg-blue-50', knob: 'bg-blue-500', border: 'border-blue-200', shadow: 'shadow-blue-200', text: 'text-blue-600' },
        'bg-green-500': { bg: 'bg-green-50', knob: 'bg-green-500', border: 'border-green-200', shadow: 'shadow-green-200', text: 'text-green-600' },
      };
      return colorMap[customColor] || { bg: 'bg-gray-50', knob: 'bg-gray-500', border: 'border-gray-200', shadow: 'shadow-gray-200', text: 'text-gray-600' };
    }

    if (!isPunchedIn) return { bg: 'bg-green-50', knob: 'bg-green-500', border: 'border-green-200', shadow: 'shadow-green-200', text: 'text-green-600' };
    if (!isOnBreak && !hasTakenBreakToday) return { bg: 'bg-orange-50', knob: 'bg-orange-500', border: 'border-orange-200', shadow: 'shadow-orange-200', text: 'text-orange-600' };
    if (!isOnBreak && hasTakenBreakToday) return { bg: 'bg-red-50', knob: 'bg-red-500', border: 'border-red-200', shadow: 'shadow-red-200', text: 'text-red-600' };
    return { bg: 'bg-blue-50', knob: 'bg-blue-500', border: 'border-blue-200', shadow: 'shadow-blue-200', text: 'text-blue-600' };
  };

  const colors = getColors();
  const progress = getMaxPosition() > 0 ? (position / getMaxPosition()) * 100 : 0;

  return (
    <div className="relative">
      {/* Card Header - optional title/subtitle/icon row */}
      {(title || icon || subtitle) && (
        <div className="flex items-center gap-3 mb-3">
          {icon && (
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm border ${colors.border}`}
              style={{ backgroundColor: `color-mix(in srgb, ${colors.knob.replace('bg-', '')} 12%, white)` }}
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

      {/* Premium Slider Track */}
      <div
        ref={containerRef}
        className={`
          relative h-14 rounded-2xl overflow-hidden
          ${colors.bg} border ${colors.border}
          shadow-lg
          transition-all duration-300
          ${disabled || isLoading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
          touch-none
        `}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Gradient overlay for depth */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.03) 100%)`,
          }}
        />

        {/* Progress fill with animated gradient */}
        <div
          className={`absolute top-0 left-0 h-full ${colors.knob} transition-all duration-150 ease-out`}
          style={{
            width: `${Math.min(progress, 100)}%`,
            opacity: 0.18,
            background: `linear-gradient(90deg, ${colors.knob.replace('bg-', '')}22 0%, ${colors.knob.replace('bg-', '')}40 100%)`,
          }}
        />

        {/* Label text */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <span className={`text-sm font-bold ${colors.text}`}>
            {customLabel || (isLoading ? "Processing..." : disabled ? "Completed" : "Slide to confirm")}
          </span>
        </div>

        {/* Frosted Glass Knob */}
        <div
          className={`
            absolute top-1.5 h-11 w-14
            flex items-center justify-center
            bg-white/90 backdrop-blur-md
            border-2
            shadow-lg
            transition-all duration-150 ease-out
            ${dragging ? 'scale-105' : 'scale-100'}
            ${isLoading ? 'cursor-wait' : 'cursor-grab active:cursor-grabbing'}
          `}
          style={{
            left: `${getKnobLeft()}px`,
            borderColor: `color-mix(in srgb, ${colors.knob.replace('bg-', '')} 40%, white)`,
            boxShadow: dragging
              ? `0 10px 25px -5px ${colors.knob.replace('bg-', '')}40, 0 8px 10px -6px ${colors.knob.replace('bg-', '')}30`
              : `0 4px 6px -1px ${colors.knob.replace('bg-', '')}20, 0 2px 4px -2px ${colors.knob.replace('bg-', '')}15`,
          }}
        >
          <span className={`${colors.knob.replace('bg-', 'text-')} text-2xl drop-shadow-md font-bold`}>
            {slideDirection === "left" ? "←" : slideDirection === "right" ? "→" : isPunchedIn ? "←" : "→"}
          </span>
        </div>
      </div>
    </div>
  );
}
