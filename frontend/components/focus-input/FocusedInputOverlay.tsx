import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Dimensions,
    Keyboard,
    KeyboardEvent,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    Easing,
    FadeIn,
    FadeOut,
    SlideInDown,
    SlideOutDown,
} from 'react-native-reanimated';
import { useFocusInput } from './FocusInputContext';
import { colors } from '@/lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MARGIN = 16;
const CARD_WIDTH = SCREEN_WIDTH - CARD_MARGIN * 2;

const ANIM_DURATION = 320;
const EASING = Easing.out(Easing.cubic);

// ── Overlay ──────────────────────────────────────────────────────────

export function FocusedInputOverlay() {
    const { isOpen, config, draftValue, setDraftValue, close } = useFocusInput();
    const insets = useSafeAreaInsets();
    const inputRef = useRef<TextInput>(null);

    // Track keyboard height in React state.
    // The card is only rendered once this is > 0, preventing it from
    // ever appearing at bottom: 0 (behind the keyboard).
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [cardReady, setCardReady] = useState(false);

    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const onShow = (e: KeyboardEvent) => {
            setKeyboardHeight(e.endCoordinates.height);
            setCardReady(true);
        };
        const onHide = () => {
            setKeyboardHeight(0);
            setCardReady(false);
        };

        const showSub = Keyboard.addListener(showEvent, onShow);
        const hideSub = Keyboard.addListener(hideEvent, onHide);

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    // Auto-focus when overlay opens — this triggers the keyboard to show,
    // which sets keyboardHeight, which positions the card correctly.
    useEffect(() => {
        if (isOpen) {
            setCardReady(false);
            // Small delay so the hidden TextInput is mounted before we focus it
            const timer = setTimeout(() => inputRef.current?.focus(), 80);
            return () => clearTimeout(timer);
        } else {
            setCardReady(false);
            setKeyboardHeight(0);
        }
    }, [isOpen]);

    const handleDone = useCallback(() => {
        Keyboard.dismiss();
        setTimeout(() => close(true), 60);
    }, [close]);

    const handleCancel = useCallback(() => {
        Keyboard.dismiss();
        setTimeout(() => close(false), 60);
    }, [close]);

    const handleSubmitEditing = useCallback(() => {
        if (config?.onSubmitEditing) {
            config.onSubmitEditing();
            return;
        }
        handleDone();
    }, [config, handleDone]);

    if (!isOpen || !config) return null;

    const isMultiline = config.inputProps.multiline === true;
    const showCharCounter =
        config.inputProps.maxLength != null && config.inputProps.maxLength > 0;

    // Use a safe fallback position when keyboard height is not yet known.
    // 340 is a reasonable iOS keyboard height — if the real value differs,
    // it snaps to the correct spot in a single frame once keyboardWillShow fires.
    const cardBottom = cardReady ? keyboardHeight + 12 : 340 + 12;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {/* Backdrop: blur + dim */}
            <Animated.View
                style={StyleSheet.absoluteFill}
                entering={FadeIn.duration(ANIM_DURATION).easing(EASING)}
                exiting={FadeOut.duration(220).easing(EASING)}
            >
                <Pressable style={StyleSheet.absoluteFill} onPress={handleDone}>
                    <BlurView
                        intensity={45}
                        tint="dark"
                        style={StyleSheet.absoluteFill}
                        experimentalBlurMethod="dimezisBlurView"
                    />
                    <View style={[StyleSheet.absoluteFill, styles.dimOverlay]} />
                </Pressable>
            </Animated.View>

            {/* Card — always rendered so TextInput can receive focus and trigger keyboard.
                 Starts invisible (opacity 0) until the real keyboard height is known. */}
            <Animated.View
                style={[
                    styles.cardWrapper,
                    { bottom: cardBottom, opacity: cardReady ? 1 : 0 },
                ]}
                entering={FadeIn.duration(ANIM_DURATION).easing(EASING)}
                exiting={SlideOutDown.duration(200).easing(EASING)}
            >
                <View style={styles.card}>
                    {/* Header row: Cancel / Label / Done */}
                    <View style={styles.headerRow}>
                        <Pressable
                            onPress={handleCancel}
                            hitSlop={12}
                            style={styles.headerButton}
                        >
                            <Text style={styles.cancelText}>Cancel</Text>
                        </Pressable>

                        {config.label ? (
                            <Text style={styles.labelText} numberOfLines={1}>
                                {config.label}
                            </Text>
                        ) : (
                            <View style={{ flex: 1 }} />
                        )}

                        <Pressable
                            onPress={handleDone}
                            hitSlop={12}
                            style={styles.headerButton}
                        >
                            <Text style={styles.doneText}>Done</Text>
                        </Pressable>
                    </View>

                    {/* Input */}
                    <View style={styles.inputContainer}>
                        <TextInput
                            ref={inputRef}
                            value={draftValue}
                            onChangeText={setDraftValue}
                            onSubmitEditing={handleSubmitEditing}
                            {...config.inputProps}
                            returnKeyType={isMultiline ? 'default' : (config.inputProps.returnKeyType ?? 'done')}
                            style={[
                                styles.input,
                                isMultiline && styles.inputMultiline,
                                config.inputStyle,
                            ]}
                            autoFocus={false}
                            blurOnSubmit={!isMultiline}
                            accessibilityLabel={config.label ?? config.inputProps.placeholder ?? 'Text input'}
                            accessibilityRole="text"
                        />
                    </View>

                    {/* Footer: char counter */}
                    {showCharCounter && (
                        <View style={styles.footerRow}>
                            <Text style={styles.charCounter}>
                                {draftValue.length}/{config.inputProps.maxLength}
                            </Text>
                        </View>
                    )}
                </View>
            </Animated.View>
        </View>
    );
}

// ── Styles ───────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    dimOverlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.32)',
    },

    cardWrapper: {
        position: 'absolute',
        left: CARD_MARGIN,
        width: CARD_WIDTH,
        zIndex: 9999,
    },

    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        borderRadius: 20,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(212, 165, 116, 0.35)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 24,
        elevation: 12,
        overflow: 'hidden',
    },

    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 8,
    },

    headerButton: {
        paddingVertical: 4,
        paddingHorizontal: 4,
        minWidth: 56,
    },

    cancelText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 15,
        color: colors.textSecondary,
    },

    doneText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 15,
        color: colors.primary,
        textAlign: 'right',
    },

    labelText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
        color: colors.textPrimary,
        textAlign: 'center',
        flex: 1,
        marginHorizontal: 8,
    },

    inputContainer: {
        paddingHorizontal: 16,
        paddingBottom: 4,
    },

    input: {
        fontFamily: 'Inter_400Regular',
        fontSize: 17,
        color: colors.textPrimary,
        backgroundColor: colors.backgroundSecondary,
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
        minHeight: 50,
    },

    inputMultiline: {
        minHeight: 110,
        maxHeight: 200,
        textAlignVertical: 'top',
        paddingTop: 14,
    },

    footerRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 20,
        paddingTop: 4,
        paddingBottom: 12,
    },

    charCounter: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: colors.textMuted,
    },
});
