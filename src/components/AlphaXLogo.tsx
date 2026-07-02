import React from "react";

interface AlphaXLogoProps {
  size?: number;
}

const AlphaXLogo: React.FC<AlphaXLogoProps> = ({ size = 96 }) => {
  const s = size;

  return (
    <div
      style={{
        width: s,
        height: s,
        borderRadius: s * 0.25,
        background: "#EEF1F6",
        boxShadow: [
          `${s * 0.1}px ${s * 0.1}px ${s * 0.19}px #C9CDD6`,
          `-${s * 0.063}px -${s * 0.063}px ${s * 0.146}px #FFFFFF`,
        ].join(", "),
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          fontSize: s * 0.355,
          fontWeight: 800,
          color: "#1D4E86",
          textShadow: [
            `0 0 ${s * 0.125}px rgba(62,111,176,0.65)`,
            `0 0 ${s * 0.292}px rgba(62,111,176,0.35)`,
            `0 0 ${s * 0.5}px rgba(62,111,176,0.18)`,
          ].join(", "),
          userSelect: "none",
          lineHeight: 1,
        }}
      >
        AX
      </span>
      <span
        style={{
          position: "absolute",
          bottom: s * 0.063,
          right: s * 0.063,
          background: "#1D4E86",
          borderRadius: s * 0.083,
          padding: `${s * 0.021}px ${s * 0.052}px`,
          boxShadow: [
            `0 0 ${s * 0.083}px rgba(62,111,176,0.75)`,
            `0 0 ${s * 0.188}px rgba(62,111,176,0.35)`,
          ].join(", "),
          fontSize: s * 0.073,
          fontWeight: 700,
          color: "#EEF1F6",
          letterSpacing: "0.5px",
          userSelect: "none",
          lineHeight: 1,
        }}
      >
        ESS
      </span>
    </div>
  );
};

export default AlphaXLogo;
