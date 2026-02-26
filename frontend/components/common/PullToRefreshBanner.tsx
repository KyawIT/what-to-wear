import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text as RNText, View } from "react-native";
import { Check, Sparkles } from "lucide-react-native";
import { colors } from "@/lib/theme";

type PullToRefreshBannerProps = {
  refreshing: boolean;
  label?: string;
  topOffset?: number;
};

export default function PullToRefreshBanner({
  refreshing,
  label = "Refreshing your style feed...",
  topOffset = 78,
}: PullToRefreshBannerProps) {
  const slideY = useRef(new Animated.Value(-70)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const complete = useRef(new Animated.Value(0)).current;
  const spinLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (refreshing) {
      complete.setValue(0);
      Animated.parallel([
        Animated.spring(slideY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
          tension: 90,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();

      spin.setValue(0);
      spinLoopRef.current?.stop();
      spinLoopRef.current = Animated.loop(
        Animated.timing(spin, {
          toValue: 1,
          duration: 900,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      spinLoopRef.current.start();
      return;
    }

    spinLoopRef.current?.stop();
    Animated.sequence([
      Animated.timing(complete, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideY, {
          toValue: -70,
          duration: 240,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      complete.setValue(0);
    });
  }, [complete, opacity, refreshing, slideY, spin]);

  const spinStyle = {
    transform: [
      {
        rotate: spin.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "360deg"],
        }),
      },
      {
        scale: complete.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.8],
        }),
      },
    ],
    opacity: complete.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0],
    }),
  };

  const checkStyle = {
    transform: [
      {
        scale: complete.interpolate({
          inputRange: [0, 1],
          outputRange: [0.6, 1],
        }),
      },
    ],
    opacity: complete,
  };

  return (
    <View pointerEvents="none" style={[styles.wrapper, { top: topOffset }]}>
      <Animated.View
        style={[
          styles.banner,
          {
            opacity,
            transform: [{ translateY: slideY }],
          },
        ]}
      >
        <Sparkles size={14} color={colors.primary} strokeWidth={2.5} />
        <View style={styles.iconStack}>
          <Animated.View style={[styles.absoluteIcon, spinStyle]}>
            <Sparkles size={15} color={colors.primary} strokeWidth={2.2} />
          </Animated.View>
          <Animated.View style={[styles.absoluteIcon, checkStyle]}>
            <Check size={15} color={colors.primary} strokeWidth={3} />
          </Animated.View>
        </View>
        <RNText style={styles.label}>{label}</RNText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 20,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF7EC",
    borderColor: "#F0DBC0",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: "#000000",
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  iconStack: {
    width: 16,
    height: 16,
    position: "relative",
  },
  absoluteIcon: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: "#6A4B2E",
  },
});
