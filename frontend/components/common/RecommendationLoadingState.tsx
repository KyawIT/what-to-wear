import React, { useEffect, useRef } from "react";
import { Text as RNText, View, Animated, Easing } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "./RecommendationLoadingState.styles";

const LINE_HEIGHT = 160;
const DOT_POSITIONS = [0.2, 0.5, 0.8];

type RecommendationLoadingStateProps = {
  message: string;
};

export default function RecommendationLoadingState({ message }: RecommendationLoadingStateProps) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const sweep = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    const dots = [dot1, dot2, dot3];
    const loop = Animated.loop(
      Animated.sequence([
        Animated.stagger(
          280,
          dots.map((d) =>
            Animated.spring(d, {
              toValue: 1,
              useNativeDriver: true,
              speed: 14,
              bounciness: 10,
            })
          )
        ),
        Animated.delay(900),
        Animated.parallel(
          dots.map((d) =>
            Animated.timing(d, {
              toValue: 0,
              duration: 500,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            })
          )
        ),
        Animated.delay(400),
      ])
    );
    loop.start();

    const sweepLoop = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: 1600,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      })
    );
    sweepLoop.start();

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    );
    glowLoop.start();

    return () => {
      loop.stop();
      sweepLoop.stop();
      glowLoop.stop();
      dot1.stopAnimation();
      dot2.stopAnimation();
      dot3.stopAnimation();
      sweep.stopAnimation();
      glow.stopAnimation();
    };
  }, [dot1, dot2, dot3, fadeIn, glow, sweep]);

  const renderDot = (anim: Animated.Value, positionRatio: number) => (
    <Animated.View
      style={[
        styles.dot,
        {
          top: LINE_HEIGHT * positionRatio - 6,
          opacity: anim,
          transform: [{ scale: anim }],
        },
      ]}
    />
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FAF7F2" }} edges={["top"]}>
      <Animated.View style={[styles.container, { opacity: fadeIn }]}>
        <View style={styles.threadHost}>
          <View style={styles.threadLine} />
          <Animated.View
            style={[
              styles.threadSweep,
              {
                opacity: glow,
                transform: [
                  {
                    translateY: sweep.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, LINE_HEIGHT - 28],
                    }),
                  },
                ],
              },
            ]}
          />
          {renderDot(dot1, DOT_POSITIONS[0])}
          {renderDot(dot2, DOT_POSITIONS[1])}
          {renderDot(dot3, DOT_POSITIONS[2])}
        </View>
        <RNText style={styles.loadingText}>{message}</RNText>
      </Animated.View>
    </SafeAreaView>
  );
}
