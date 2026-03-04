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

export const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Ring animation
  const ringSpring = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 30 });
  const ring2Spring = spring({ frame: frame - 8, fps, config: { damping: 200 }, durationInFrames: 30 });
  const ring3Spring = spring({ frame: frame - 16, fps, config: { damping: 200 }, durationInFrames: 30 });

  // Title
  const titleSpring = spring({ frame: frame - 10, fps, config: { damping: 12 } });
  const titleScale = interpolate(titleSpring, [0, 1], [0.8, 1]);
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);

  // Tagline
  const taglineOpacity = interpolate(frame, [30, 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // CTA button
  const btnSpring = spring({ frame: frame - 35, fps, config: { damping: 15, stiffness: 120 } });
  const btnScale = interpolate(btnSpring, [0, 1], [0.5, 1]);
  const btnOpacity = interpolate(btnSpring, [0, 1], [0, 1]);

  // Gentle pulse on button
  const pulse = interpolate(
    frame % 40,
    [0, 20, 40],
    [1, 1.04, 1],
  );

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(160deg, #FAF7F2 0%, #F5EDE4 40%, #EDE3D6 100%)",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Concentric rings */}
      {[ringSpring, ring2Spring, ring3Spring].map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 300 + i * 180,
            height: 300 + i * 180,
            borderRadius: "50%",
            border: `1px solid rgba(212, 165, 116, ${0.2 - i * 0.05})`,
            transform: `translate(-50%, -50%) scale(${s})`,
          }}
        />
      ))}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
        }}
      >
        {/* App name */}
        <div
          style={{
            fontFamily: playfair,
            fontSize: 80,
            fontWeight: 700,
            color: "#2C2420",
            opacity: titleOpacity,
            transform: `scale(${titleScale})`,
            textAlign: "center",
          }}
        >
          What to Wear
        </div>

        {/* Tagline */}
        <div
          style={{
            fontFamily: inter,
            fontSize: 24,
            fontWeight: 300,
            color: "#8B7355",
            opacity: taglineOpacity,
            letterSpacing: 1,
          }}
        >
          Your AI-powered closet assistant
        </div>

        {/* CTA Button */}
        <div
          style={{
            marginTop: 20,
            opacity: btnOpacity,
            transform: `scale(${btnScale * (frame > 55 ? pulse : 1)})`,
          }}
        >
          <div
            style={{
              fontFamily: inter,
              fontSize: 20,
              fontWeight: 500,
              color: "#FAF7F2",
              background: "linear-gradient(135deg, #D4A574, #B8895A)",
              padding: "18px 50px",
              borderRadius: 40,
              letterSpacing: 2,
              boxShadow: "0 8px 30px rgba(212, 165, 116, 0.4)",
            }}
          >
            Download Now
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
