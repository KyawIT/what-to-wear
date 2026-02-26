import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, LayoutChangeEvent, Text as RNText, View } from "react-native";
import { Pressable } from "@/components/ui/pressable";
import { styles } from "./WardrobeTabSwitcher.styles";

type TabType = "items" | "outfits";

type WardrobeTabSwitcherProps = {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
};

export default function WardrobeTabSwitcher({ activeTab, onChangeTab }: WardrobeTabSwitcherProps) {
  const [tabBarWidth, setTabBarWidth] = useState(0);
  const slideAnim = useRef(new Animated.Value(activeTab === "items" ? 0 : 1)).current;

  const indicatorWidth = useMemo(() => {
    if (!tabBarWidth) return 0;
    return (tabBarWidth - 8) / 2;
  }, [tabBarWidth]);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: activeTab === "items" ? 0 : 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [activeTab, slideAnim]);

  const handleLayoutTabBar = (event: LayoutChangeEvent) => {
    setTabBarWidth(event.nativeEvent.layout.width);
  };

  const indicatorTransform = {
    transform: [
      {
        translateX: slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, indicatorWidth],
        }),
      },
    ],
  };

  return (
    <View style={styles.tabContainer}>
      <View style={styles.tabBar} onLayout={handleLayoutTabBar}>
        {indicatorWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.tabIndicator, { width: indicatorWidth }, indicatorTransform]}
          />
        ) : null}
        <Pressable onPress={() => onChangeTab("items")} style={styles.tab}>
          <RNText style={[styles.tabText, activeTab === "items" && styles.tabTextActive]}>Items</RNText>
        </Pressable>
        <Pressable onPress={() => onChangeTab("outfits")} style={styles.tab}>
          <RNText style={[styles.tabText, activeTab === "outfits" && styles.tabTextActive]}>Outfits</RNText>
        </Pressable>
      </View>
    </View>
  );
}
