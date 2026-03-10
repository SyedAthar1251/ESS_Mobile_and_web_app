import React, { useState, useRef, useEffect } from "react";

interface PunchSliderProps {
  isPunchedIn: boolean;
  isLoading: boolean;
  onPunch: () => Promise<void>;
}

export default function PunchSlider({ isPunchedIn, isLoading, onPunch }: PunchSliderProps) {
  const [position, setPosition] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  // Check if slider has been dragged enough (at least 80% of the way)
  const isSliderComplete = () => {
    const max = getMaxPosition();
    return position >= max * 0.8; // 80% threshold
  };
  const getMaxPosition = () => {
    const knobWidth = 56; // w-14 = 56px
    const padding = 8; // left-2 right-2 = 8px each side
    return containerWidth - knobWidth - (padding * 2);
  };

  // Measure container width on mount and resize
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
      // For punch out: slide from right to left
      // User starts from right side, so we calculate distance from right
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

  // Touch support for mobile
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

  // Calculate knob position
  const getKnobLeft = () => {
    const max = getMaxPosition();
    if (isPunchedIn) {
      // Start from right side
      return max - position;
    }
    // Start from left side
    return position;
  };

  return (
    <div
      ref={containerRef}
      className={`relative z-20 flex-1 h-16 rounded-2xl overflow-hidden cursor-pointer transition-all ${
        isPunchedIn ? "bg-red-500" : "bg-green-500"
      } ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
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
        {isLoading
          ? "Processing..."
          : isSliderComplete()
          ? "✓ Release to Confirm"
          : isPunchedIn
          ? "Slide to Punch Out"
          : "Slide to Punch In"}
      </div>

      {/* Slider Knob - Arrow only with animation and bold style */}
      <div
        className="absolute top-2 h-12 w-14 flex items-center justify-center z-20"
        style={{ left: `${getKnobLeft()}px` }}
        onMouseDown={() => !isLoading && setDragging(true)}
        onTouchStart={() => !isLoading && setDragging(true)}
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
