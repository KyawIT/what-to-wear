import React from "react";
import { Text, TextStyle, View, ViewStyle } from "react-native";
import { ChevronLeft } from "lucide-react-native";

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
    <Pressable onPress={onBack} style={styles.backButton}>
      <ChevronLeft size={22} color={colors.textSecondary} />
    </Pressable>
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

