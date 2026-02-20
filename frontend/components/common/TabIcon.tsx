import { View, Text } from "react-native";
import React from "react";
import { LayoutGrid, User, Sparkles, Shirt, Camera } from "lucide-react-native";
import { colors } from "@/lib/theme";

interface TabIconProps {
  iconType: string;
  focused: boolean;
}

const TabIcon = ({ iconType, focused }: TabIconProps) => {
  const color = focused ? colors.primary : colors.textMuted;
  const size = 24;

  const renderIcon = () => {
    switch (iconType) {
      case "wardrobe":
        return <LayoutGrid size={size} color={color} strokeWidth={focused ? 2.5 : 2} />;
      case "profile":
        return <User size={size} color={color} strokeWidth={focused ? 2.5 : 2} />;
      case "recommendation":
        return <Sparkles size={size} color={color} strokeWidth={focused ? 2.5 : 2} />;
      case "create":
        return <Shirt size={size} color={color} strokeWidth={focused ? 2.5 : 2} />;
      case "scan":
        return <Camera size={size} color={color} strokeWidth={focused ? 2.5 : 2} />;
      default:
        return null;
    }
  };

  return (
    <View
      className="items-center justify-center rounded-full"
      style={{
        width: 48,
        height: 48,
        backgroundColor: focused ? `${colors.primary}20` : "transparent",
      }}
    >
      {renderIcon()}
    </View>
  );
};

export default TabIcon;
