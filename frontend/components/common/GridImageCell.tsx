import React, { useEffect, useRef } from "react";
import { View, Pressable, Animated, StyleSheet } from "react-native";
import { Image } from "expo-image";
import * as MediaLibrary from "expo-media-library";

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
                                          activeBorderColor = "#5853DB",
                                      }: Props) {
    const scale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.spring(scale, {
            toValue: isActive ? 0.96 : 1,
            useNativeDriver: true,
            friction: 9,
            tension: 120,
        }).start();
    }, [isActive, scale]);

    return (
        <Pressable onPress={onPress}>
            <Animated.View style={{ width: size, height: size, transform: [{ scale }] }}>
                <View
                    style={{
                        width: "100%",
                        height: "100%",
                        borderWidth: isActive ? 2 : 0,
                        borderColor: isActive ? activeBorderColor : "transparent",
                    }}
                >
                    <Image
                        source={{ uri: item.uri }}
                        style={{ width: "100%", height: "100%" }}
                        contentFit="cover"
                    />

                    {isActive && (
                        <View
                            style={[
                                StyleSheet.absoluteFillObject,
                                { backgroundColor: "rgba(119,118,133,0.12)" },
                            ]}
                        />
                    )}
                </View>
            </Animated.View>
        </Pressable>
    );
}