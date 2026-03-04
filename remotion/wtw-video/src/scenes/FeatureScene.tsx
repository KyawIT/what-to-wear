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
import { PhoneMockup } from "../PhoneMockup";

const { fontFamily: playfair } = loadFont("normal", {
  weights: ["700"],
  subsets: ["latin"],
});

const { fontFamily: inter } = loadInter("normal", {
  weights: ["300", "400", "500"],
  subsets: ["latin"],
});

export const FeatureScene: React.FC<{
  screenshot: string;
  label: string;
  title: string;
  description: string;
  phonePosition?: "left" | "right";
}> = ({ screenshot, label, title, description, phonePosition = "left" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isLeft = phonePosition === "left";

  // Phone entrance
  const phoneSpring = spring({ frame, fps, config: { damping: 15, stiffness: 80 } });
  const phoneX = interpolate(phoneSpring, [0, 1], [isLeft ? -200 : 200, 0]);
  const phoneOpacity = interpolate(phoneSpring, [0, 1], [0, 1]);

  // Text animations staggered
  const labelSpring = spring({ frame: frame - 10, fps, config: { damping: 200 }, durationInFrames: 20 });
  const titleSpring = spring({ frame: frame - 18, fps, config: { damping: 200 }, durationInFrames: 20 });
  const descSpring = spring({ frame: frame - 26, fps, config: { damping: 200 }, durationInFrames: 20 });

  // Accent dot
  const dotScale = spring({ frame: frame - 5, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(160deg, #FAF7F2 0%, #F5EDE4 40%, #EDE3D6 100%)",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 80,
      }}
    >
      {/* Background accent */}
      <div
        style={{
          position: "absolute",
          top: isLeft ? -100 : "auto",
          bottom: isLeft ? "auto" : -100,
          right: isLeft ? -100 : "auto",
          left: isLeft ? "auto" : -100,
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "rgba(212, 165, 116, 0.08)",
        }}
      />

      {/* Phone side */}
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          order: isLeft ? 0 : 1,
          opacity: phoneOpacity,
          transform: `translateX(${phoneX}px)`,
        }}
      >
        <PhoneMockup screenshot={screenshot} />
      </div>

      {/* Text side */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 20,
          order: isLeft ? 1 : 0,
          paddingLeft: isLeft ? 40 : 0,
          paddingRight: isLeft ? 0 : 40,
        }}
      >
        {/* Accent dot + label */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#D4A574",
              transform: `scale(${dotScale})`,
            }}
          />
          <div
            style={{
              fontFamily: inter,
              fontSize: 16,
              fontWeight: 500,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#D4A574",
              opacity: labelSpring,
              transform: `translateX(${interpolate(labelSpring, [0, 1], [20, 0])}px)`,
            }}
          >
            {label}
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontFamily: playfair,
            fontSize: 52,
            fontWeight: 700,
            color: "#2C2420",
            lineHeight: 1.15,
            opacity: titleSpring,
            transform: `translateY(${interpolate(titleSpring, [0, 1], [30, 0])}px)`,
          }}
        >
          {title}
        </div>

        {/* Description */}
        <div
          style={{
            fontFamily: inter,
            fontSize: 22,
            fontWeight: 300,
            color: "#8B7355",
            lineHeight: 1.6,
            maxWidth: 400,
            opacity: descSpring,
            transform: `translateY(${interpolate(descSpring, [0, 1], [20, 0])}px)`,
          }}
        >
          {description}
        </div>
      </div>
    </AbsoluteFill>
  );
};
