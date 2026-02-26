import { Text, View, ScrollView, TouchableOpacity, Dimensions, Animated, Easing } from "react-native";
import { Image } from "expo-image";
import { authClient } from "@/lib/auth-client";
import { router, useNavigationContainerRef } from "expo-router";
import { useEffect, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/lib/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const HERO_CARD_WIDTH = Math.min(SCREEN_WIDTH - 40, 370);
const MASCOT_WIDTH = Math.min(SCREEN_WIDTH * 0.52, 220);
const MASCOT_HEIGHT = MASCOT_WIDTH * 1.5;

const promptChips = ["Coffee date?", "Office day?", "Rain incoming"]; 

export default function Index() {
  const { data: isAuthenticated } = authClient.useSession();
  const navContainerRef = useNavigationContainerRef();
  const insets = useSafeAreaInsets();
  const chipEntrance = useRef(promptChips.map(() => new Animated.Value(0))).current;
  const chipFloat = useRef(promptChips.map(() => new Animated.Value(0))).current;
  const ctaSparkles = useRef(
    (() => {
      const rand = (min: number, max: number) => min + Math.random() * (max - min);
      const firstClockwise = Math.random() > 0.5;

      return [
        {
          size: 92,
          orbitRadius: rand(92, 118),
          phase: rand(0, 1),
          opacity: 0.12,
          color: "rgba(255, 212, 161, 1)",
          clockwise: firstClockwise,
          duration: rand(8500, 12000),
        },
        {
          size: 74,
          orbitRadius: rand(84, 110),
          phase: rand(0, 1),
          opacity: 0.09,
          color: "rgba(255, 240, 220, 1)",
          clockwise: !firstClockwise,
          duration: rand(9500, 13000),
        },
      ];
    })(),
  ).current;
  const ctaOrbitValues = useRef(ctaSparkles.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (isAuthenticated && navContainerRef.isReady()) {
      router.replace({ pathname: "/(tabs)" });
    }
  }, [isAuthenticated, navContainerRef]);

  useEffect(() => {
    const entrance = Animated.stagger(
      110,
      chipEntrance.map((value) =>
        Animated.spring(value, {
          toValue: 1,
          useNativeDriver: true,
          speed: 15,
          bounciness: 6,
        }),
      ),
    );
    entrance.start();

    const loops = chipFloat.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 160),
          Animated.timing(value, {
            toValue: 1,
            duration: 15000,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 5000,
            useNativeDriver: true,
          }),
        ]),
      ),
    );
    loops.forEach((loop) => loop.start());

    return () => {
      entrance.stop();
      loops.forEach((loop) => loop.stop());
    };
  }, [chipEntrance, chipFloat]);

  useEffect(() => {
    const loops = ctaOrbitValues.map((orbitValue, index) => {
      orbitValue.setValue(ctaSparkles[index].phase);
      return Animated.loop(
        Animated.timing(orbitValue, {
          toValue: ctaSparkles[index].phase + 1,
          duration: ctaSparkles[index].duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
    });
    loops.forEach((loop) => loop.start());

    return () => {
      loops.forEach((loop) => loop.stop());
    };
  }, [ctaOrbitValues, ctaSparkles]);

  const signIn = async () => {
    await authClient.signIn.oauth2({
      providerId: "keycloak",
      callbackURL: "/",
    });
  };

  return (
    <View className="flex-1 bg-background-50" style={{ backgroundColor: colors.background }}>
      <ScrollView
        contentContainerClassName="flex-grow"
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 28,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5">
          <View
            style={{
              width: HERO_CARD_WIDTH,
              alignSelf: "center",
              borderRadius: 30,
              paddingHorizontal: 20,
              paddingTop: 18,
              paddingBottom: 22,
              backgroundColor: "#FFF9F1",
              borderWidth: 1,
              borderColor: "#ECDCC7",
              shadowColor: "#BDAA92",
              shadowOpacity: 0.2,
              shadowRadius: 24,
              shadowOffset: { width: 0, height: 12 },
              elevation: 5,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                width: 220,
                height: 220,
                borderRadius: 110,
                backgroundColor: "#FBEFD9",
                position: "absolute",
                top: -86,
                right: -64,
                opacity: 0.85,
              }}
            />
            <View
              style={{
                width: 180,
                height: 180,
                borderRadius: 90,
                backgroundColor: "#F5DFC3",
                position: "absolute",
                bottom: -80,
                left: -64,
                opacity: 0.5,
              }}
            />

            <View className="mb-3">
              <View>
                <Text
                  style={{
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 12,
                    color: colors.secondaryDark,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                  }}
                >
                  Closet assistant
                </Text>
                <Text
                  style={{
                    fontFamily: "PlayfairDisplay_600SemiBold",
                    fontSize: 32,
                    color: colors.textPrimary,
                    letterSpacing: -0.5,
                    marginTop: 2,
                  }}
                >
                  What to Wear
                </Text>
              </View>
            </View>

            <View className="items-center mb-3">
              <View
                style={{
                  width: MASCOT_WIDTH + 38,
                  height: MASCOT_WIDTH + 38,
                  borderRadius: (MASCOT_WIDTH + 38) / 2,
                  backgroundColor: "#F3E5D0",
                  position: "absolute",
                  top: (MASCOT_HEIGHT - MASCOT_WIDTH - 38) / 2 + 12,
                  opacity: 0.9,
                }}
              />

              <Image
                source={require("../assets/mascot/mascot-dilemma.png")}
                style={{
                  width: MASCOT_WIDTH,
                  height: MASCOT_HEIGHT,
                }}
                contentFit="contain"
              />
            </View>

            <Text
              style={{
                fontFamily: "PlayfairDisplay_500Medium",
                fontSize: 22,
                color: colors.textPrimary,
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              What should I wear?
            </Text>

            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 13,
                color: colors.textSecondary,
                textAlign: "center",
                lineHeight: 19,
                paddingHorizontal: 10,
                marginBottom: 14,
              }}
            >
              Scan it. Style it. Wear it.
            </Text>

            <View className="flex-row flex-wrap justify-center">
              {promptChips.map((chip, index) => (
                <Animated.View
                  key={chip}
                  style={{
                    paddingHorizontal: 10,
                    height: 30,
                    borderRadius: 15,
                    justifyContent: "center",
                    backgroundColor: "#F9ECDA",
                    borderWidth: 1,
                    borderColor: "#E8D3B8",
                    marginHorizontal: 4,
                    marginBottom: 8,
                    opacity: chipEntrance[index],
                    transform: [
                      {
                        translateY: chipEntrance[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [8, 0],
                        }),
                      },
                      {
                        translateY: chipFloat[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -3],
                        }),
                      },
                    ],
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Inter_500Medium",
                      fontSize: 12,
                      color: colors.secondaryDark,
                    }}
                  >
                    {chip}
                  </Text>
                </Animated.View>
              ))}
            </View>
          </View>
        </View>

        <View className="flex-1" />

        <View className="px-5 mt-7">
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={signIn}
            style={{
              width: "100%",
              height: 68,
              borderRadius: 22,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#3B2D21",
              borderWidth: 1,
              borderColor: "#644B35",
              shadowColor: "#2A1E15",
              shadowOpacity: 0.25,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 8 },
              elevation: 6,
              paddingHorizontal: 16,
              overflow: "hidden",
            }}
          >
            {ctaSparkles.map((sparkle, index) => {
              const progress = Animated.modulo(ctaOrbitValues[index], 1);
              const orbitRotation = progress.interpolate({
                inputRange: [0, 1],
                outputRange: sparkle.clockwise ? ["0deg", "360deg"] : ["360deg", "0deg"],
              });

              return (
                <Animated.View
                  key={`cta-sparkle-${index}`}
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: sparkle.size,
                    height: sparkle.size,
                    marginLeft: -sparkle.size / 2,
                    marginTop: -sparkle.size / 2,
                    borderRadius: sparkle.size / 2,
                    backgroundColor: sparkle.color,
                    opacity: sparkle.opacity,
                    transform: [
                      {
                        rotate: orbitRotation,
                      },
                      {
                        translateX: sparkle.orbitRadius,
                      },
                      {
                        scale: progress.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [0.92, 1.06, 0.92],
                        }),
                      },
                    ],
                  }}
                />
              );
            })}
            <View className="w-full flex-row items-center justify-between">
              <View>
                <Text
                  style={{
                    fontFamily: "Inter_700Bold",
                    fontSize: 11,
                    color: "#D7B086",
                    letterSpacing: 1.1,
                    textTransform: "uppercase",
                    marginBottom: 2,
                    opacity: 0.95,
                  }}
                >
                  Outfit Assistant
                </Text>
                <Text
                  style={{
                    fontFamily: "Inter_700Bold",
                    fontSize: 18,
                    color: "#FFF8EE",
                    letterSpacing: 0.2,
                  }}
                >
                  Get Started
                </Text>
              </View>

              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "#F6E5D1",
                  borderWidth: 1,
                  borderColor: "#E9CFB0",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontFamily: "Inter_700Bold",
                    fontSize: 20,
                    color: "#3B2D21",
                    marginTop: -2,
                  }}
                >
                  →
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.65} onPress={signIn} className="mt-4">
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 13,
                color: colors.textMuted,
                textAlign: "center",
              }}
            >
              Already have an account?{" "}
              <Text style={{ fontFamily: "Inter_600SemiBold", color: colors.textPrimary }}>
                Sign In
              </Text>
            </Text>
          </TouchableOpacity>

          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 11,
              color: colors.textMuted,
              textAlign: "center",
              marginTop: 14,
              opacity: 0.7,
            }}
          >
            Terms & Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
