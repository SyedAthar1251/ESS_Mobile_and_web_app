import React, { useState } from "react";
import { useTranslation } from "react-i18next";

// Inline SVG Icons
const Icons = {
  home: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  person: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  chat: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  image: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  settings: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

interface NavItem {
  icon: React.ReactNode;
  label: string;
}

const navItems: NavItem[] = [
  { icon: Icons.home, label: "Home" },
  { icon: Icons.person, label: "Profile" },
  { icon: Icons.chat, label: "Message" },
  { icon: Icons.image, label: "Photos" },
  { icon: Icons.settings, label: "Settings" },
];

// ============================================
// Style 1: Magic Indicator (Original)
// ============================================
const MagicNav = ({ activeIndex, setActiveIndex }: { activeIndex: number; setActiveIndex: (index: number) => void }) => {
  return (
    <div className="w-full max-w-[400px] h-[120px] bg-white rounded-xl relative flex items-center justify-center px-2">
      <ul className="flex w-full justify-between items-start relative px-2">
        {navItems.map((item, index) => (
          <li
            key={index}
            className={`list-none relative z-10 cursor-pointer transition-all duration-300 w-[70px] h-[70px] flex items-center justify-center ${
              activeIndex === index ? "active" : ""
            }`}
            onClick={() => setActiveIndex(index)}
          >
            <a
              href="#"
              className="relative flex flex-col items-center justify-center no-underline w-full"
            >
              <span
                className={`transition-all duration-500 flex items-center justify-center ${
                  activeIndex === index
                    ? "transform -translate-y-6"
                    : ""
                }`}
                style={{ color: activeIndex === index ? "#29fd53" : "#222327" }}
              >
                {item.icon}
              </span>
              <span
                className={`text-[10px] font-medium absolute transition-all duration-500 whitespace-nowrap ${
                  activeIndex === index
                    ? "opacity-100 transform translate-y-4"
                    : "opacity-0 transform translate-y-2"
                }`}
                style={{ color: "#222327" }}
              >
                {item.label}
              </span>
            </a>
          </li>
        ))}

        {/* Indicator */}
        <div
          className="absolute top-0 w-[70px] h-[70px] bg-[#29fd53] rounded-full border-[6px] border-[#222327] transition-all duration-500 z-0"
          style={{
            transform: `translateX(${activeIndex * 70}px)`,
          }}
        >
          {/* Left curve */}
          <div
            className="absolute top-1/2 left-[-16px] w-4 h-4 bg-transparent"
            style={{
              borderTopRightRadius: "16px",
              boxShadow: "1px -8px 0 0 #222327",
            }}
          />
          {/* Right curve */}
          <div
            className="absolute top-1/2 right-[-16px] w-4 h-4 bg-transparent"
            style={{
              borderTopLeftRadius: "16px",
              boxShadow: "-1px -8px 0 0 #222327",
            }}
          />
        </div>
      </ul>
    </div>
  );
};

// ============================================
// Style 2: Modern Pill Navigation
// ============================================
const ModernPillNav = ({ activeIndex, setActiveIndex }: { activeIndex: number; setActiveIndex: (index: number) => void }) => {
  return (
    <div className="w-full max-w-[400px] bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full p-2 flex justify-between items-center shadow-xl">
      {/* Sliding Pill Background */}
      <div
        className="absolute w-16 h-12 bg-white rounded-full transition-all duration-300 ease-out"
        style={{
          transform: `translateX(${activeIndex * 80}px)`,
          marginLeft: "8px",
        }}
      />
      
      {navItems.map((item, index) => (
        <button
          key={index}
          onClick={() => setActiveIndex(index)}
          className={`relative z-10 flex flex-col items-center justify-center w-16 h-12 transition-all duration-300 ${
            activeIndex === index ? "text-violet-600" : "text-white/70 hover:text-white"
          }`}
        >
          <span className={`transition-transform duration-300 ${activeIndex === index ? "scale-110" : ""}`}>
            {item.icon}
          </span>
          <span className={`text-[10px] font-medium mt-1 transition-opacity duration-300 ${
            activeIndex === index ? "opacity-100" : "opacity-0"
          }`}>
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
};

// ============================================
// Style 3: Floating Bubble Nav
// ============================================
const FloatingBubbleNav = ({ activeIndex, setActiveIndex }: { activeIndex: number; setActiveIndex: (index: number) => void }) => {
  return (
    <div className="w-full max-w-[400px] bg-[#1a1a2e] rounded-2xl p-4 flex justify-between items-center shadow-2xl border border-[#16213e]">
      {navItems.map((item, index) => (
        <button
          key={index}
          onClick={() => setActiveIndex(index)}
          className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
            activeIndex === index
              ? "bg-gradient-to-br from-pink-500 to-rose-500 shadow-lg shadow-pink-500/30 scale-110"
              : "bg-transparent hover:bg-[#16213e]"
          }`}
        >
          <span className={`transition-colors duration-300 ${
            activeIndex === index ? "text-white" : "text-gray-400"
          }`}>
            {item.icon}
          </span>
          
          {/* Active indicator dot */}
          {activeIndex === index && (
            <span className="absolute -bottom-1 w-1.5 h-1.5 bg-white rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
};

// ============================================
// Style 4: Minimal Line Nav
// ============================================
const MinimalLineNav = ({ activeIndex, setActiveIndex }: { activeIndex: number; setActiveIndex: (index: number) => void }) => {
  return (
    <div className="w-full max-w-[400px] bg-white rounded-2xl p-6 flex justify-between items-center shadow-lg">
      {navItems.map((item, index) => (
        <button
          key={index}
          onClick={() => setActiveIndex(index)}
          className="relative flex flex-col items-center group"
        >
          <span className={`transition-colors duration-300 ${
            activeIndex === index ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"
          }`}>
            {item.icon}
          </span>
          
          {/* Animated underline */}
          <span 
            className={`absolute -bottom-2 h-0.5 bg-indigo-600 transition-all duration-300 rounded-full ${
              activeIndex === index ? "w-full" : "w-0"
            }`}
          />
          
          <span className={`text-[10px] mt-2 transition-colors duration-300 ${
            activeIndex === index ? "text-indigo-600 font-medium" : "text-gray-400"
          }`}>
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
};

// ============================================
// Style 5: Magic Bubble (Mixed)
// ============================================
const MagicBubbleNav = ({ activeIndex, setActiveIndex }: { activeIndex: number; setActiveIndex: (index: number) => void }) => {
  return (
    <div className="w-full max-w-[400px] bg-[#1a1a2e] rounded-2xl p-3 flex justify-between items-center relative shadow-2xl border border-[#16213e]">
      {/* Magic Indicator Background with Curves */}
      <div
        className="absolute top-1 w-[68px] h-[68px] bg-gradient-to-br from-emerald-400 to-green-500 rounded-full transition-all duration-500 z-0 shadow-lg shadow-emerald-500/40"
        style={{
          transform: `translateX(${activeIndex * 76}px)`,
          marginLeft: "4px",
        }}
      >
        {/* Left curve */}
        <div
          className="absolute top-1/2 left-[-14px] w-3.5 h-3.5 bg-transparent"
          style={{
            borderTopRightRadius: "14px",
            boxShadow: "1px -7px 0 0 #1a1a2e",
          }}
        />
        {/* Right curve */}
        <div
          className="absolute top-1/2 right-[-14px] w-3.5 h-3.5 bg-transparent"
          style={{
            borderTopLeftRadius: "14px",
            boxShadow: "-1px -7px 0 0 #1a1a2e",
          }}
        />
      </div>
      
      {navItems.map((item, index) => (
        <button
          key={index}
          onClick={() => setActiveIndex(index)}
          className={`relative z-10 w-[68px] h-[68px] flex flex-col items-center justify-center transition-all duration-300 ${
            activeIndex === index ? "" : "hover:scale-105"
          }`}
        >
          <span className={`transition-all duration-300 ${
            activeIndex === index 
              ? "text-white transform -translate-y-1" 
              : "text-gray-400 hover:text-gray-200"
          }`}>
            {item.icon}
          </span>
          <span className={`text-[9px] font-medium mt-1 transition-all duration-300 ${
            activeIndex === index 
              ? "text-white opacity-100" 
              : "text-gray-500 opacity-0"
          }`}>
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
};

// ============================================
// Style 6: Neon Glow
// ============================================
const NeonGlowNav = ({ activeIndex, setActiveIndex }: { activeIndex: number; setActiveIndex: (index: number) => void }) => {
  return (
    <div className="w-full max-w-[400px] bg-black/80 backdrop-blur-lg rounded-full p-3 flex justify-between items-center border border-purple-500/30 shadow-lg shadow-purple-500/10">
      {navItems.map((item, index) => (
        <button
          key={index}
          onClick={() => setActiveIndex(index)}
          className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
            activeIndex === index
              ? "bg-purple-600 shadow-[0_0_20px_rgba(147,51,234,0.6)] scale-110"
              : "hover:bg-white/10"
          }`}
        >
          <span className={`transition-all duration-300 ${
            activeIndex === index ? "text-white" : "text-gray-500"
          }`}>
            {item.icon}
          </span>
          
          {/* Glow ring */}
          {activeIndex === index && (
            <span className="absolute inset-0 rounded-full animate-pulse">
              <span className="absolute inset-0 rounded-full bg-purple-400 animate-ping opacity-20" />
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

// ============================================
// Style 7: Circle Icons
// ============================================
const CircleIconNav = ({ activeIndex, setActiveIndex }: { activeIndex: number; setActiveIndex: (index: number) => void }) => {
  return (
    <div className="w-full max-w-[400px] bg-white rounded-full p-2 flex justify-between items-center shadow-xl">
      {navItems.map((item, index) => (
        <button
          key={index}
          onClick={() => setActiveIndex(index)}
          className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
            activeIndex === index
              ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30"
              : "bg-gray-100 text-gray-400 hover:bg-gray-200"
          }`}
        >
          {item.icon}
        </button>
      ))}
    </div>
  );
};

// ============================================
// Main Page Component
// ============================================
const MagicNavPage = () => {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [navStyle, setNavStyle] = useState(0);

  const navStyles = [
    { name: "Magic", component: <MagicNav activeIndex={activeIndex} setActiveIndex={setActiveIndex} /> },
    { name: "Pill", component: <ModernPillNav activeIndex={activeIndex} setActiveIndex={setActiveIndex} /> },
    { name: "Bubble", component: <FloatingBubbleNav activeIndex={activeIndex} setActiveIndex={setActiveIndex} /> },
    { name: "Line", component: <MinimalLineNav activeIndex={activeIndex} setActiveIndex={setActiveIndex} /> },
    { name: "Magic+Bubble", component: <MagicBubbleNav activeIndex={activeIndex} setActiveIndex={setActiveIndex} /> },
    { name: "Neon", component: <NeonGlowNav activeIndex={activeIndex} setActiveIndex={setActiveIndex} /> },
    { name: "Circle", component: <CircleIconNav activeIndex={activeIndex} setActiveIndex={setActiveIndex} /> },
  ];

  return (
    <div className="min-h-screen bg-[#222327] flex flex-col items-center justify-start p-4 pt-8">
      {/* Page Title */}
      <h1 className="text-white text-2xl font-semibold mb-8">
        Navigation Designs
      </h1>

      {/* Style Selector */}
      <div className="flex gap-2 mb-8 flex-wrap justify-center">
        {navStyles.map((style, index) => (
          <button
            key={index}
            onClick={() => setNavStyle(index)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              navStyle === index
                ? "bg-[#29fd53] text-black"
                : "bg-[#2d2d35] text-gray-400 hover:bg-[#3d3d45]"
            }`}
          >
            {style.name}
          </button>
        ))}
      </div>

      {/* Current Navigation Style */}
      <div className="mb-8">
        {navStyles[navStyle].component}
      </div>

      {/* Info Text */}
      <p className="text-gray-400 text-sm text-center max-w-xs">
        Click on any navigation style above to preview different designs
      </p>
    </div>
  );
};

export default MagicNavPage;
