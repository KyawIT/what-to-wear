import React, { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";
import { Image } from "expo-image";

type SpinningMascotProps = {
  size?: number;
};

export default function SpinningMascot({ size = 120 }: SpinningMascotProps) {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [spinValue]);

  const rotate = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <Image
        source={require("../../assets/mascot/mascot-tail-chase.png")}
        style={{ width: size, height: size }}
        contentFit="contain"
      />
    </Animated.View>
  );
}
