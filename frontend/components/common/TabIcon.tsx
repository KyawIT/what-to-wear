import { View, Text } from "react-native";
import React from "react";
import { Home, User, Sparkles, Shirt, Camera } from "lucide-react-native";

// Beige theme colors
const colors = {
  active: "#D4A574",
  inactive: "#9B8B7F",
  activeBg: "#D4A57420",
};

interface TabIconProps {
  iconType: string;
  focused: boolean;
}

const TabIcon = ({ iconType, focused }: TabIconProps) => {
  const color = focused ? colors.active : colors.inactive;
  const size = 24;

  const renderIcon = () => {
    switch (iconType) {
      case "home":
        return <Home size={size} color={color} strokeWidth={focused ? 2.5 : 2} />;
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
        backgroundColor: focused ? colors.activeBg : "transparent",
      }}
    >
      {renderIcon()}
    </View>
  );
};

export default TabIcon;
