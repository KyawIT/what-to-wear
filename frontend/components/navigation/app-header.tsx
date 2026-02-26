import React from "react";
import { Text, TextStyle, View, ViewStyle, StyleProp } from "react-native";
import { ChevronLeft } from "lucide-react-native";
import { BlurView } from "expo-blur";

import { Pressable } from "@/components/ui/pressable";
import { colors } from "@/lib/theme";
import { styles } from "./app-header.styles";

type AppHeaderProps = {
  title: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  onBack?: () => void;
  showBorder?: boolean;
  backgroundColor?: string;
  titleStyle?: TextStyle;
  containerStyle?: ViewStyle;
  sideWidth?: number;
  testID?: string;
};

type HeaderActionProps = {
  onPress?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  className?: string;
};

/**
 * A reusable glass-effect component for AppHeader clickables.
 */
export const HeaderAction = ({
  onPress,
  disabled,
  children,
  containerStyle,
  style,
  className = "active:opacity-70",
}: HeaderActionProps) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={className}
      style={[
        { borderRadius: 999, overflow: 'hidden' },
        containerStyle
      ]}
    >
      <BlurView
        intensity={40}
        tint="light"
        style={[
          styles.glassButton,
          style
        ]}
      >
        {children}
      </BlurView>
    </Pressable>
  );
};

const DEFAULT_SIDE_WIDTH = 96;

export const AppHeader = ({
  title,
  left,
  right,
  onBack,
  showBorder = true,
  backgroundColor = colors.background,
  titleStyle,
  containerStyle,
  sideWidth = DEFAULT_SIDE_WIDTH,
  testID,
}: AppHeaderProps) => {
  const leftNode = left ?? (onBack ? (
    <HeaderAction onPress={onBack}>
      <ChevronLeft size={22} color={colors.textSecondary} />
    </HeaderAction>
  ) : null);

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        {
          backgroundColor,
          borderBottomWidth: showBorder ? 1 : 0,
          borderBottomColor: colors.border,
        },
        containerStyle,
      ]}
    >
      <View style={[styles.sideRail, { width: sideWidth }]}>{leftNode}</View>

      <View style={styles.titleRail}>
        <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.title, titleStyle]}>
          {title}
        </Text>
      </View>

      <View style={[styles.sideRail, styles.rightRail, { width: sideWidth }]}>
        {right}
      </View>
    </View>
  );
};

