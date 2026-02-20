import * as React from "react";
import Svg, { Path, Circle, Rect, Ellipse, G } from "react-native-svg";
import { colors } from "@/lib/theme";

interface FashionPersonIllustrationProps {
  width?: number;
  height?: number;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  skinTone?: string;
}

export const FashionPersonIllustration: React.FC<FashionPersonIllustrationProps> = ({
  width = 200,
  height = 200,
  primaryColor = colors.primary,
  secondaryColor = colors.secondary,
  accentColor = colors.accent,
  skinTone = "#FFDAB9",
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 200 200" fill="none">
      {/* Person */}
      <G>
        {/* Hair */}
        <Path
          d="M85 30 Q70 35 68 55 Q65 70 70 75 L75 70 Q73 55 80 45 Q90 35 105 35 Q120 35 125 50 Q127 60 125 70 L130 75 Q135 65 132 50 Q130 30 105 25 Q90 25 85 30Z"
          fill={accentColor}
        />
        {/* Face */}
        <Ellipse cx="100" cy="55" rx="22" ry="25" fill={skinTone} />
        {/* Eyes */}
        <Circle cx="92" cy="52" r="2" fill={accentColor} />
        <Circle cx="108" cy="52" r="2" fill={accentColor} />
        {/* Smile */}
        <Path
          d="M95 62 Q100 67 105 62"
          stroke={accentColor}
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        {/* Blush */}
        <Ellipse cx="88" cy="58" rx="4" ry="2" fill="#FFB6C1" opacity="0.5" />
        <Ellipse cx="112" cy="58" rx="4" ry="2" fill="#FFB6C1" opacity="0.5" />
      </G>

      {/* Body - Stylish outfit */}
      <G>
        {/* Neck */}
        <Rect x="94" y="78" width="12" height="10" fill={skinTone} />
        {/* Shirt/Blouse */}
        <Path
          d="M70 88 L65 105 L75 107 L75 145 L125 145 L125 107 L135 105 L130 88 L115 95 L100 92 L85 95 L70 88Z"
          fill={primaryColor}
          stroke={secondaryColor}
          strokeWidth="1"
        />
        {/* Collar detail */}
        <Path
          d="M90 92 L100 100 L110 92"
          stroke={secondaryColor}
          strokeWidth="2"
          fill="none"
        />
        {/* Arms */}
        <Path
          d="M65 105 L50 130 L58 135 L75 107"
          fill={primaryColor}
          stroke={secondaryColor}
          strokeWidth="1"
        />
        <Path
          d="M135 105 L150 130 L142 135 L125 107"
          fill={primaryColor}
          stroke={secondaryColor}
          strokeWidth="1"
        />
        {/* Hands */}
        <Ellipse cx="54" cy="132" rx="6" ry="5" fill={skinTone} />
        <Ellipse cx="146" cy="132" rx="6" ry="5" fill={skinTone} />
      </G>

      {/* Pants/Skirt */}
      <Path
        d="M75 145 L70 195 L95 195 L100 160 L105 195 L130 195 L125 145 L75 145Z"
        fill={secondaryColor}
        stroke={accentColor}
        strokeWidth="1"
      />

      {/* Phone in hand showing outfit */}
      <G>
        <Rect x="140" y="118" width="18" height="30" rx="3" fill={accentColor} />
        <Rect x="142" y="121" width="14" height="24" rx="1" fill="#E8E4DC" />
        {/* Mini outfit on phone screen */}
        <Rect x="145" y="125" width="8" height="6" rx="1" fill={primaryColor} />
        <Rect x="145" y="133" width="8" height="8" rx="1" fill={secondaryColor} />
      </G>

      {/* Floating clothing items around */}
      <G opacity="0.6">
        {/* Small shirt */}
        <Path
          d="M25 50 L22 58 L26 59 L26 72 L38 72 L38 59 L42 58 L39 50 L35 53 L32 51 L29 53 L25 50Z"
          fill={primaryColor}
        />
        {/* Small pants */}
        <Path
          d="M165 45 L163 65 L170 65 L172 55 L174 65 L181 65 L179 45 L165 45Z"
          fill={secondaryColor}
        />
        {/* Small dress */}
        <Path
          d="M30 130 L27 138 L30 139 L26 160 L44 160 L40 139 L43 138 L40 130 L37 132 L35 131 L33 132 L30 130Z"
          fill="#E8D4C4"
        />
        {/* Hanger */}
        <Path
          d="M168 95 L168 100 L160 100 L168 95 L176 100 L168 100"
          stroke={accentColor}
          strokeWidth="1.5"
          fill="none"
        />
        <Circle cx="168" cy="95" r="2" fill={accentColor} />
      </G>

      {/* Sparkles */}
      <G fill={primaryColor}>
        <Circle cx="15" cy="80" r="2" opacity="0.5" />
        <Circle cx="185" cy="75" r="2.5" opacity="0.4" />
        <Circle cx="20" cy="170" r="1.5" opacity="0.6" />
        <Circle cx="175" cy="165" r="2" opacity="0.5" />
      </G>
    </Svg>
  );
};

export default FashionPersonIllustration;
