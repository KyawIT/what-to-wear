import React, { useEffect, useRef } from "react";
import { View, Pressable, Animated } from "react-native";
import { Image } from "expo-image";
import * as MediaLibrary from "expo-media-library";
import { Check } from "lucide-react-native";
import { colors } from "@/lib/theme";

type Props = {
    item: MediaLibrary.Asset;
    size: number;
    isActive: boolean;
    onPress: () => void;
    activeBorderColor?: string;
};

export default function GridImageCell({
                                          item,
                                          size,
                                          isActive,
                                          onPress,
                                          activeBorderColor = colors.primary,
                                      }: Props) {
    const opacity = useRef(new Animated.Value(1)).current;
    const checkScale = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: isActive ? 0.7 : 1,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.spring(checkScale, {
                toValue: isActive ? 1 : 0,
                useNativeDriver: true,
                friction: 8,
                tension: 200,
            }),
        ]).start();
    }, [isActive, opacity, checkScale]);

    return (
        <Pressable onPress={onPress}>
            <View style={{ width: size, height: size }}>
                <Animated.View
                    style={{
                        width: "100%",
                        height: "100%",
                        opacity,
                    }}
                >
                    <Image
                        source={{ uri: item.uri }}
                        style={{ width: "100%", height: "100%" }}
                        contentFit="cover"
                    />
                </Animated.View>

                {/* Selection indicator - Instagram style */}
                <View
                    style={{
                        position: "absolute",
                        top: 6,
                        right: 6,
                    }}
                >
                    <Animated.View
                        style={{
                            transform: [{ scale: checkScale }],
                        }}
                    >
                        <View
                            style={{
                                height: 24,
                                width: 24,
                                borderRadius: 12,
                                backgroundColor: activeBorderColor,
                                alignItems: "center",
                                justifyContent: "center",
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.25,
                                shadowRadius: 3.84,
                                elevation: 5,
                            }}
                        >
                            <Check size={16} color="white" strokeWidth={3} />
                        </View>
                    </Animated.View>
                </View>

                {/* Border indicator when selected */}
                {isActive && (
                    <View
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            borderWidth: 2,
                            borderColor: activeBorderColor,
                        }}
                    />
                )}
            </View>
        </Pressable>
    );
}