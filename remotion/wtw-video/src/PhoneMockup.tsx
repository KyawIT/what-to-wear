import React from "react";
import { Img, staticFile } from "remotion";

export const PhoneMockup: React.FC<{
  screenshot: string;
  style?: React.CSSProperties;
}> = ({ screenshot, style }) => {
  return (
    <div
      style={{
        position: "relative",
        width: 280,
        height: 570,
        ...style,
      }}
    >
      {/* Phone frame */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 40,
          border: "6px solid #1a1a1a",
          background: "#1a1a1a",
          boxShadow: "0 25px 60px rgba(0,0,0,0.3), 0 8px 20px rgba(0,0,0,0.15)",
          overflow: "hidden",
        }}
      >
        {/* Notch */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: 120,
            height: 28,
            background: "#1a1a1a",
            borderBottomLeftRadius: 16,
            borderBottomRightRadius: 16,
            zIndex: 10,
          }}
        />
        {/* Screen */}
        <Img
          src={staticFile(screenshot)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </div>
    </div>
  );
};
