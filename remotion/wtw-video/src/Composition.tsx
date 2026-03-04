import React from "react";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { HeroScene } from "./scenes/HeroScene";
import { FeatureScene } from "./scenes/FeatureScene";
import { ShowcaseScene } from "./scenes/ShowcaseScene";
import { CTAScene } from "./scenes/CTAScene";

export const MyComposition: React.FC = () => {
  return (
    <TransitionSeries>
      {/* Scene 1: Hero intro */}
      <TransitionSeries.Sequence durationInFrames={100}>
        <HeroScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 15 })}
      />

      {/* Scene 2: Upload & Scan */}
      <TransitionSeries.Sequence durationInFrames={110}>
        <FeatureScene
          screenshot="upload-image-screen.png"
          label="Step 1"
          title="Snap Your Clothes"
          description="Take a photo or import from your gallery. AI removes the background instantly for clean, catalog-ready images."
          phonePosition="left"
        />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={linearTiming({ durationInFrames: 18 })}
      />

      {/* Scene 3: Wardrobe */}
      <TransitionSeries.Sequence durationInFrames={110}>
        <FeatureScene
          screenshot="view-clothing-items-screen.png"
          label="Step 2"
          title="Build Your Digital Wardrobe"
          description="Organize everything by category. Shirts, shoes, accessories — your entire closet in one place."
          phonePosition="right"
        />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={slide({ direction: "from-left" })}
        timing={linearTiming({ durationInFrames: 18 })}
      />

      {/* Scene 4: Outfit Suggestions */}
      <TransitionSeries.Sequence durationInFrames={110}>
        <FeatureScene
          screenshot="outfit-suggestion-screen.png"
          label="Step 3"
          title="Get Styled by AI"
          description="Personalized outfit suggestions based on your wardrobe. Never wonder what to wear again."
          phonePosition="left"
        />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 20 })}
      />

      {/* Scene 5: Showcase — 3 phones */}
      <TransitionSeries.Sequence durationInFrames={100}>
        <ShowcaseScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 18 })}
      />

      {/* Scene 6: CTA */}
      <TransitionSeries.Sequence durationInFrames={110}>
        <CTAScene />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
