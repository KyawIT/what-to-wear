import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { PhoneMockup } from "../PhoneMockup";

const { fontFamily: inter } = loadInter("normal", {
  weights: ["300", "400", "500"],
  subsets: ["latin"],
});

export const ShowcaseScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Three phones staggered entrance
  const phone1Spring = spring({ frame: frame - 5, fps, config: { damping: 15, stiffness: 80 } });
  const phone2Spring = spring({ frame: frame - 15, fps, config: { damping: 15, stiffness: 80 } });
  const phone3Spring = spring({ frame: frame - 25, fps, config: { damping: 15, stiffness: 80 } });

  const phone1Y = interpolate(phone1Spring, [0, 1], [80, -20]);
  const phone2Y = interpolate(phone2Spring, [0, 1], [80, 20]);
  const phone3Y = interpolate(phone3Spring, [0, 1], [80, -20]);

  // Title
  const titleSpring = spring({ frame: frame - 0, fps, config: { damping: 200 }, durationInFrames: 25 });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(160deg, #2C2420 0%, #3D322B 50%, #4A3D34 100%)",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(212,165,116,0.15) 0%, transparent 70%)",
        }}
      />

      {/* Title at top */}
      <div
        style={{
          position: "absolute",
          top: 50,
          fontFamily: inter,
          fontSize: 16,
          fontWeight: 500,
          letterSpacing: 6,
          textTransform: "uppercase",
          color: "#D4A574",
          opacity: titleSpring,
        }}
      >
        Your Complete Wardrobe
      </div>

      {/* Three phones */}
      <div
        style={{
          display: "flex",
          gap: 30,
          alignItems: "center",
          marginTop: 20,
        }}
      >
        <div
          style={{
            opacity: phone1Spring,
            transform: `translateY(${phone1Y}px) rotate(-8deg)`,
          }}
        >
          <PhoneMockup
            screenshot="create-outfit-screen.png"
            style={{ width: 230, height: 470 }}
          />
        </div>
        <div
          style={{
            opacity: phone2Spring,
            transform: `translateY(${phone2Y}px)`,
            zIndex: 2,
          }}
        >
          <PhoneMockup
            screenshot="outfit-suggestion-screen.png"
            style={{ width: 260, height: 530 }}
          />
        </div>
        <div
          style={{
            opacity: phone3Spring,
            transform: `translateY(${phone3Y}px) rotate(8deg)`,
          }}
        >
          <PhoneMockup
            screenshot="compse-outfit-screen.png"
            style={{ width: 230, height: 470 }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
