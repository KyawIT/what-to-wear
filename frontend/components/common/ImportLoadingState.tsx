import React, { useEffect, useRef, useState } from "react";
import { View, Animated, Easing } from "react-native";
import { Link } from "lucide-react-native";
import { colors } from "@/lib/theme";
import { styles } from "./ImportLoadingState.styles";

const ORBIT_RADIUS = 56;
const PARTICLE_COUNT = 4;

const STATUS_MESSAGES = [
  { title: "Connecting", subtitle: "Reaching out to the store..." },
  { title: "Fetching product", subtitle: "Grabbing the details..." },
  { title: "Extracting images", subtitle: "Finding the best shots..." },
  { title: "Almost there", subtitle: "Wrapping things up..." },
];

export default function ImportLoadingState() {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const orbit = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.9)).current;
  const iconSpin = useRef(new Animated.Value(0)).current;
  const outerPulse = useRef(new Animated.Value(0.85)).current;
  const dotOpacities = useRef(
    Array.from({ length: PARTICLE_COUNT }, () => new Animated.Value(0))
  ).current;

  const [msgIndex, setMsgIndex] = useState(0);
  const msgFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Orbit rotation
    const orbitLoop = Animated.loop(
      Animated.timing(orbit, {
        toValue: 1,
        duration: 3200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    orbitLoop.start();

    // Inner ring pulse
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.9,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // Outer ring counter-pulse
    const outerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(outerPulse, {
          toValue: 1.05,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(outerPulse, {
          toValue: 0.85,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    outerLoop.start();

    // Icon gentle rocking
    const spinLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(iconSpin, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(iconSpin, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    spinLoop.start();

    // Staggered particle fade-in/out
    const particleLoops = dotOpacities.map((op, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 400),
          Animated.timing(op, {
            toValue: 1,
            duration: 600,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(op, {
            toValue: 0.2,
            duration: 800,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay(Math.max(0, (PARTICLE_COUNT - 1 - i) * 400)),
        ])
      )
    );
    particleLoops.forEach((l) => l.start());

    // Cycling status messages
    const interval = setInterval(() => {
      Animated.timing(msgFade, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setMsgIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
        Animated.timing(msgFade, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 2800);

    return () => {
      orbitLoop.stop();
      pulseLoop.stop();
      outerLoop.stop();
      spinLoop.stop();
      particleLoops.forEach((l) => l.stop());
      clearInterval(interval);
      orbit.stopAnimation();
      pulse.stopAnimation();
      outerPulse.stopAnimation();
      iconSpin.stopAnimation();
      dotOpacities.forEach((o) => o.stopAnimation());
    };
  }, [fadeIn, orbit, pulse, outerPulse, iconSpin, dotOpacities, msgFade]);

  const iconRotate = iconSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ["-8deg", "8deg"],
  });

  const renderParticle = (index: number) => {
    const angle = (index / PARTICLE_COUNT) * 2 * Math.PI;
    const isSmall = index % 2 === 1;

    const translateX = orbit.interpolate({
      inputRange: [0, 1],
      outputRange: [
        Math.cos(angle) * ORBIT_RADIUS,
        Math.cos(angle + 2 * Math.PI) * ORBIT_RADIUS,
      ],
    });
    const translateY = orbit.interpolate({
      inputRange: [0, 1],
      outputRange: [
        Math.sin(angle) * ORBIT_RADIUS,
        Math.sin(angle + 2 * Math.PI) * ORBIT_RADIUS,
      ],
    });

    return (
      <Animated.View
        key={index}
        style={[
          isSmall ? styles.particleSmall : styles.particle,
          {
            opacity: dotOpacities[index],
            transform: [{ translateX }, { translateY }],
          },
        ]}
      />
    );
  };

  const msg = STATUS_MESSAGES[msgIndex];

  return (
    <Animated.View style={[styles.container, { opacity: fadeIn }]}>
      <View style={styles.orbitHost}>
        {/* Outer glow ring */}
        <Animated.View
          style={[
            styles.glowRingOuter,
            { transform: [{ scale: outerPulse }] },
          ]}
        />

        {/* Inner glow ring */}
        <Animated.View
          style={[styles.glowRing, { transform: [{ scale: pulse }] }]}
        />

        {/* Center icon */}
        <Animated.View
          style={[
            styles.iconCircle,
            { transform: [{ rotate: iconRotate }] },
          ]}
        >
          <Link size={26} color={colors.primary} strokeWidth={2} />
        </Animated.View>

        {/* Orbiting particles */}
        {Array.from({ length: PARTICLE_COUNT }, (_, i) => renderParticle(i))}
      </View>

      {/* Status text */}
      <Animated.Text style={[styles.statusText, { opacity: msgFade }]}>
        {msg.title}
      </Animated.Text>
      <Animated.Text style={[styles.subtitleText, { opacity: msgFade }]}>
        {msg.subtitle}
      </Animated.Text>
    </Animated.View>
  );
}
