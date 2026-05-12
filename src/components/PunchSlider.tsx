import React, { useState, useRef, useEffect } from "react";

interface PunchSliderProps {
  isPunchedIn: boolean;
  isLoading: boolean;
  onPunch: () => Promise<void>;
  disabled?: boolean;
  isOnBreak?: boolean;
  hasTakenBreakToday?: boolean;
}

export default function PunchSlider({ isPunchedIn, isLoading, onPunch, disabled = false, isOnBreak = false, hasTakenBreakToday = false }: PunchSliderProps) {
  const [position, setPosition] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  const isSliderComplete = () => {
    const max = getMaxPosition();
    return position >= max * 0.8;
  };
  const getMaxPosition = () => {
    const knobWidth = 56;
    const padding = 8;
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

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !containerRef.current || isLoading) return;

    const rect = containerRef.current.getBoundingClientRect();
    let newPos = e.clientX - rect.left - 8;

    if (isPunchedIn) {
      newPos = (rect.width - 8) - e.clientX;
    }

    if (newPos < 0) newPos = 0;
    if (newPos > getMaxPosition()) newPos = getMaxPosition();

    setPosition(newPos);
  };

  const handleMouseUp = async () => {
    setDragging(false);

    if (position >= getMaxPosition() - 5) {
      await onPunch();
    }

    setPosition(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragging || !containerRef.current || isLoading) return;

    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    let newPos = touch.clientX - rect.left - 8;

    if (isPunchedIn) {
      newPos = (rect.width - 8) - touch.clientX;
    }

    if (newPos < 0) newPos = 0;
    if (newPos > getMaxPosition()) newPos = getMaxPosition();

    setPosition(newPos);
  };

  const handleTouchEnd = async () => {
    setDragging(false);

    if (position >= getMaxPosition() - 5) {
      await onPunch();
    }

    setPosition(0);
  };

  const getKnobLeft = () => {
    const max = getMaxPosition();
    if (isPunchedIn) {
      return max - position;
    }
    return position;
  };

  // Simple SVG arrow icons
  const ArrowRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );

  const ArrowLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );

  // Determine the current action and button color based on state
  // 4-step flow: Punch In (green) -> Break Out (orange) -> Break In (blue) -> Punch Out (red)
  const getButtonColor = () => {
    if (!isPunchedIn) return "bg-green-500"; // Punch In
    if (!isOnBreak && !hasTakenBreakToday) return "bg-orange-500"; // Break Out (first time)
    if (!isOnBreak && hasTakenBreakToday) return "bg-red-500"; // Punch Out (after break)
    return "bg-blue-500"; // Break In
  };

  const getButtonText = () => {
    if (disabled) return "✓ Attendance Completed";
    if (isLoading) return "Processing...";
    if (isSliderComplete()) return "✓ Release to Confirm";
    
    if (!isPunchedIn) return "Slide to Punch In";
    if (!isOnBreak && !hasTakenBreakToday) return "Slide to Break Out";
    if (!isOnBreak && hasTakenBreakToday) return "Slide to Punch Out";
    return "Slide to Break In";
  };

  const getSliderDirection = () => {
    // For punch in and break in, slide right (→)
    // For break out and punch out, slide left (←)
    if (!isPunchedIn) return "→";
    if (!isOnBreak && !hasTakenBreakToday) return "←";
    if (!isOnBreak && hasTakenBreakToday) return "←";
    return "→";
  };

  const getTextAlignment = () => {
    // Punch In & Break In: right aligned
    // Break Out & Punch Out: left aligned
    if (!isPunchedIn) return "justify-end pr-8";
    if (!isOnBreak && !hasTakenBreakToday) return "justify-start pl-8";
    if (!isOnBreak && hasTakenBreakToday) return "justify-start pl-8";
    return "justify-end pr-8";
  };

  return (
    <div
      ref={containerRef}
      className={`relative z-20 flex-1 h-16 rounded-2xl overflow-hidden cursor-pointer transition-all ${getButtonColor()} ${isLoading || disabled ? "opacity-70 cursor-not-allowed" : ""}`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => setDragging(false)}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Text - alignment based on state */}
      <div className={`absolute inset-0 flex items-center text-white font-bold text-lg z-10 ${getTextAlignment()}`}>
        {getButtonText()}
      </div>

      {/* Slider Knob - Arrow only with animation */}
      <div
        className="absolute top-2 h-12 w-14 flex items-center justify-center z-20"
        style={{ left: `${getKnobLeft()}px` }}
        onMouseDown={() => !(isLoading || disabled) && setDragging(true)}
        onTouchStart={() => !(isLoading || disabled) && setDragging(true)}
      >
        <span className={`text-white font-black text-4xl drop-shadow-xl ${
          !isLoading ? (isSliderComplete() ? "animate-bounce" : "animate-pulse") : ""
        }`}>
          {getSliderDirection()}
        </span>
      </div>
    </div>
  );
}
