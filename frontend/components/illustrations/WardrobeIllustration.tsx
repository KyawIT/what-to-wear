import * as React from "react";
import Svg, { Path, Circle, Rect, Ellipse, G } from "react-native-svg";

interface WardrobeIllustrationProps {
  width?: number;
  height?: number;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
}

export const WardrobeIllustration: React.FC<WardrobeIllustrationProps> = ({
  width = 280,
  height = 220,
  primaryColor = "#D4A574",
  secondaryColor = "#8B7355",
  accentColor = "#4A3728",
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 280 220" fill="none">
      {/* Background clothing rack */}
      <Rect x="40" y="30" width="200" height="8" rx="4" fill={secondaryColor} />
      <Rect x="45" y="38" width="4" height="140" fill={secondaryColor} />
      <Rect x="231" y="38" width="4" height="140" fill={secondaryColor} />

      {/* Hanger 1 - T-shirt */}
      <G>
        <Path
          d="M80 38 L80 50 L60 50 L80 38 L100 50 L80 50"
          stroke={accentColor}
          strokeWidth="2"
          fill="none"
        />
        <Circle cx="80" cy="38" r="3" fill={accentColor} />
        {/* T-shirt */}
        <Path
          d="M60 55 L55 70 L65 72 L65 110 L95 110 L95 72 L105 70 L100 55 L90 60 L80 58 L70 60 L60 55Z"
          fill={primaryColor}
          stroke={secondaryColor}
          strokeWidth="1"
        />
        <Path
          d="M70 60 Q80 65 90 60"
          stroke={secondaryColor}
          strokeWidth="1.5"
          fill="none"
        />
      </G>

      {/* Hanger 2 - Dress */}
      <G>
        <Path
          d="M140 38 L140 50 L120 50 L140 38 L160 50 L140 50"
          stroke={accentColor}
          strokeWidth="2"
          fill="none"
        />
        <Circle cx="140" cy="38" r="3" fill={accentColor} />
        {/* Dress */}
        <Path
          d="M125 55 L120 65 L125 67 L118 130 L162 130 L155 67 L160 65 L155 55 L147 58 L140 56 L133 58 L125 55Z"
          fill="#E8D4C4"
          stroke={secondaryColor}
          strokeWidth="1"
        />
        <Path
          d="M133 58 Q140 62 147 58"
          stroke={secondaryColor}
          strokeWidth="1.5"
          fill="none"
        />
        <Ellipse cx="140" cy="90" rx="12" ry="3" fill={primaryColor} opacity="0.5" />
      </G>

      {/* Hanger 3 - Jacket */}
      <G>
        <Path
          d="M200 38 L200 50 L180 50 L200 38 L220 50 L200 50"
          stroke={accentColor}
          strokeWidth="2"
          fill="none"
        />
        <Circle cx="200" cy="38" r="3" fill={accentColor} />
        {/* Jacket */}
        <Path
          d="M175 55 L168 75 L178 77 L178 115 L195 115 L195 70 L205 70 L205 115 L222 115 L222 77 L232 75 L225 55 L215 62 L200 58 L185 62 L175 55Z"
          fill={secondaryColor}
          stroke={accentColor}
          strokeWidth="1"
        />
        <Path
          d="M185 62 Q200 68 215 62"
          stroke={accentColor}
          strokeWidth="1.5"
          fill="none"
        />
        {/* Jacket buttons */}
        <Circle cx="195" cy="85" r="2" fill={accentColor} />
        <Circle cx="195" cy="100" r="2" fill={accentColor} />
      </G>

      {/* Shoes on floor */}
      <G>
        <Path
          d="M70 175 Q60 175 55 180 Q50 190 60 195 L90 195 Q95 190 90 180 Q85 175 70 175Z"
          fill={accentColor}
        />
        <Path
          d="M100 178 Q90 178 85 183 Q80 193 90 198 L120 198 Q125 193 120 183 Q115 178 100 178Z"
          fill={secondaryColor}
        />
      </G>

      {/* Bag */}
      <G>
        <Rect x="180" y="165" width="40" height="35" rx="4" fill={primaryColor} />
        <Path
          d="M188 165 Q188 150 200 150 Q212 150 212 165"
          stroke={secondaryColor}
          strokeWidth="3"
          fill="none"
        />
        <Rect x="195" y="175" width="10" height="6" rx="2" fill={secondaryColor} />
      </G>

      {/* Decorative elements - floating hearts/stars */}
      <Circle cx="30" cy="80" r="4" fill={primaryColor} opacity="0.4" />
      <Circle cx="250" cy="100" r="3" fill={primaryColor} opacity="0.5" />
      <Circle cx="25" cy="150" r="2" fill={secondaryColor} opacity="0.4" />
      <Circle cx="255" cy="60" r="3" fill={secondaryColor} opacity="0.3" />
    </Svg>
  );
};

export default WardrobeIllustration;
