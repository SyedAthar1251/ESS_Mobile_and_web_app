import React, { useState, useRef, useEffect } from "react";

interface PunchSliderProps {
  isPunchedIn: boolean;
  isLoading: boolean;
  onPunch: () => Promise<void>;
  disabled?: boolean;
}

export default function PunchSlider({ isPunchedIn, isLoading, onPunch, disabled = false }: PunchSliderProps) {
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

  return (
    <div
      ref={containerRef}
      className={`relative z-20 flex-1 h-16 rounded-2xl overflow-hidden cursor-pointer transition-all ${
        isPunchedIn ? "bg-red-500" : "bg-green-500"
      } ${isLoading || disabled ? "opacity-70 cursor-not-allowed" : ""}`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => setDragging(false)}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Text - alignment: punch in = right, punch out = left */}
      <div className={`absolute inset-0 flex items-center text-white font-bold text-lg z-10 ${
        isPunchedIn ? "justify-start pl-8" : "justify-end pr-8"
      }`}>
        {disabled
          ? "✓ Attendance Completed"
          : isLoading
          ? "Processing..."
          : isSliderComplete()
          ? "✓ Release to Confirm"
          : isPunchedIn
          ? "Slide to Punch Out"
          : "Slide to Punch In"}
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
          {isPunchedIn ? "←" : "→"}
        </span>
      </div>
    </div>
  );
}
