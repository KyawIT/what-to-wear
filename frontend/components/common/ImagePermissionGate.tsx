import React, {useEffect, useMemo, useRef} from "react";
import {Animated, View} from "react-native";
import {Pressable} from "@/components/ui/pressable"
import {Text} from "@/components/ui/text"
import * as Linking from "expo-linking";
import type {PermissionResponse} from "expo-modules-core";

type Props = {
    permission: PermissionResponse | null | undefined;
    requestPermission: () => Promise<PermissionResponse>;
    title?: string;
    description?: string;
    ctaAllowText?: string;
    ctaSettingsText?: string;
    children: React.ReactNode;
    icon?: React.ReactNode;
};

const ImagePermissionGate = ({
                                 permission,
                                 requestPermission,
                                 title = "Allow access",
                                 description = "We need access so you can pick and post " +
                                     "content directly in the app. " +
                                     "Nothing is shared without your permission.",
                                 ctaAllowText = "Allow Access",
                                 ctaSettingsText = "Open Settings",
                                 children,
                                 icon,
                             }: Props) => {
    const anim = useRef(new Animated.Value(0)).current;

    const granted = !!permission?.granted;
    const canAskAgain = permission?.canAskAgain !== false;

    const ctaText = useMemo(
        () => (canAskAgain ? ctaAllowText : ctaSettingsText),
        [canAskAgain, ctaAllowText, ctaSettingsText]
    );

    useEffect(() => {
        Animated.timing(anim, {
            toValue: granted ? 1 : 0,
            duration: 220,
            useNativeDriver: true,
        }).start();
    }, [granted, anim]);

    useEffect(() => {
        if (!granted) {
            anim.setValue(0);
            Animated.timing(anim, {
                toValue: 1,
                duration: 280,
                useNativeDriver: true,
            }).start();
        }
    }, [granted, anim]); // only for the gate screen entry

    const handleCTA = async () => {
        if (canAskAgain) {
            await requestPermission();
            return;
        }
        await Linking.openSettings();
    };

    if (granted) return <>{children}</>;

    return (
        <View className="flex-1 bg-black items-center justify-center px-6">
            <Animated.View
                style={{
                    width: "100%",
                    opacity: anim,
                    transform: [
                        {
                            translateY: anim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [14, 0],
                            }),
                        },
                    ],
                }}
            >
                <View className="items-center">
                    {icon ? <View className="mb-5">{icon}</View> : null}

                    <Text className="text-white text-xl font-semibold text-center">
                        {title}
                    </Text>

                    <Text className="mt-3 text-neutral-400 text-sm text-center">
                        {description}
                    </Text>

                    <Pressable
                        onPress={handleCTA}
                        className="mt-6 w-full rounded-full bg-primary-500 py-3"
                    >
                        <Text className="text-center text-base font-semibold text-white">
                            {ctaText}
                        </Text>
                    </Pressable>

                    <Text className="mt-4 text-xs text-neutral-500 text-center">
                        {canAskAgain
                            ? "You can change this anytime in Settings → Privacy → Photos."
                            : "Photo access is currently blocked. Open Settings to allow it."}
                    </Text>
                </View>
            </Animated.View>
        </View>
    );
}
export default ImagePermissionGate
