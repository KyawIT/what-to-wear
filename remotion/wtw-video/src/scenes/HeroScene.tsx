import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Playfair";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: playfair } = loadFont("normal", {
  weights: ["700"],
  subsets: ["latin"],
});

const { fontFamily: inter } = loadInter("normal", {
  weights: ["300", "400", "500"],
  subsets: ["latin"],
});

export const HeroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animated background circles
  const circle1Scale = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 40 });
  const circle2Scale = spring({ frame: frame - 8, fps, config: { damping: 200 }, durationInFrames: 40 });
  const circle3Scale = spring({ frame: frame - 16, fps, config: { damping: 200 }, durationInFrames: 40 });

  // Closet assistant label
  const labelOpacity = interpolate(frame, [10, 25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const labelY = interpolate(frame, [10, 25], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Main title
  const titleSpring = spring({ frame: frame - 15, fps, config: { damping: 15, stiffness: 120 } });
  const titleScale = interpolate(titleSpring, [0, 1], [0.6, 1]);
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);

  // Tagline
  const taglineOpacity = interpolate(frame, [35, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const taglineY = interpolate(frame, [35, 50], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Decorative line
  const lineWidth = interpolate(frame, [25, 45], [0, 80], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(160deg, #FAF7F2 0%, #F5EDE4 40%, #EDE3D6 100%)",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Background decorative circles */}
      <div
        style={{
          position: "absolute",
          top: -80,
          right: -60,
          width: 350,
          height: 350,
          borderRadius: "50%",
          background: "rgba(212, 165, 116, 0.12)",
          transform: `scale(${circle1Scale})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -100,
          left: -80,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "rgba(212, 165, 116, 0.08)",
          transform: `scale(${circle2Scale})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 200,
          left: 100,
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: "rgba(212, 165, 116, 0.06)",
          transform: `scale(${circle3Scale})`,
        }}
      />

      {/* Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        {/* Label */}
        <div
          style={{
            fontFamily: inter,
            fontSize: 18,
            fontWeight: 500,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#D4A574",
            opacity: labelOpacity,
            transform: `translateY(${labelY}px)`,
          }}
        >
          Closet Assistant
        </div>

        {/* Main Title */}
        <div
          style={{
            fontFamily: playfair,
            fontSize: 100,
            fontWeight: 700,
            color: "#2C2420",
            opacity: titleOpacity,
            transform: `scale(${titleScale})`,
            lineHeight: 1.1,
            textAlign: "center",
          }}
        >
          What to Wear
        </div>

        {/* Decorative line */}
        <div
          style={{
            width: lineWidth,
            height: 3,
            background: "linear-gradient(90deg, transparent, #D4A574, transparent)",
            borderRadius: 2,
          }}
        />

        {/* Tagline */}
        <div
          style={{
            fontFamily: inter,
            fontSize: 26,
            fontWeight: 300,
            color: "#8B7355",
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
            letterSpacing: 2,
          }}
        >
          Scan it. Style it. Wear it.
        </div>
      </div>
    </AbsoluteFill>
  );
};
