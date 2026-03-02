import React, { useCallback } from 'react';
import {
    Pressable,
    StyleSheet,
    Text,
    View,
    type TextInputProps,
    type StyleProp,
    type ViewStyle,
    type TextStyle,
} from 'react-native';
import { useFocusInput, type FocusInputConfig } from './FocusInputStore';
import { colors } from '@/lib/theme';

// ── Props ────────────────────────────────────────────────────────────

export interface FocusTextInputProps {
    /** Current value (controlled). */
    value: string;
    /** Callback when value changes (committed from overlay). */
    onChangeText: (text: string) => void;

    // TextInput props forwarded to overlay
    placeholder?: string;
    placeholderTextColor?: string;
    keyboardType?: TextInputProps['keyboardType'];
    autoCapitalize?: TextInputProps['autoCapitalize'];
    autoCorrect?: boolean;
    secureTextEntry?: boolean;
    textContentType?: TextInputProps['textContentType'];
    returnKeyType?: TextInputProps['returnKeyType'];
    maxLength?: number;
    multiline?: boolean;

    /** Overlay header label. */
    label?: string;

    /** Called after the overlay commits via onSubmitEditing (e.g. tag add). */
    onSubmitEditing?: () => void;

    // Visual styling for the inline display
    style?: StyleProp<TextStyle>;
    /** Container style wrapping the inline pressable. */
    containerStyle?: StyleProp<ViewStyle>;

    /** Style forwarded to the overlay input. */
    overlayInputStyle?: TextInputProps['style'];

    /** If true, the inline display is not rendered (for custom layouts). */
    renderInline?: boolean;

    /** Custom inline render. Receives the openOverlay callback. */
    children?: (openOverlay: () => void) => React.ReactNode;

    /** Additional props to spread. */
    editable?: boolean;
}

// ── Component ────────────────────────────────────────────────────────

export function FocusTextInput({
    value,
    onChangeText,
    placeholder,
    placeholderTextColor = colors.textMuted,
    keyboardType,
    autoCapitalize,
    autoCorrect,
    secureTextEntry,
    textContentType,
    returnKeyType,
    maxLength,
    multiline,
    label,
    onSubmitEditing,
    style,
    containerStyle,
    overlayInputStyle,
    children,
    editable = true,
}: FocusTextInputProps) {
    const { open } = useFocusInput();

    const handlePress = useCallback(() => {
        if (!editable) return;

        const config: FocusInputConfig = {
            label,
            inputProps: {
                placeholder,
                placeholderTextColor,
                keyboardType,
                autoCapitalize,
                autoCorrect,
                secureTextEntry,
                textContentType,
                returnKeyType,
                maxLength,
                multiline,
            },
            initialValue: value,
            onCommit: onChangeText,
            onSubmitEditing,
            inputStyle: overlayInputStyle,
        };
        open(config);
    }, [
        editable,
        label,
        placeholder,
        placeholderTextColor,
        keyboardType,
        autoCapitalize,
        autoCorrect,
        secureTextEntry,
        textContentType,
        returnKeyType,
        maxLength,
        multiline,
        value,
        onChangeText,
        onSubmitEditing,
        overlayInputStyle,
        open,
    ]);

    // Custom render mode
    if (children) {
        return <>{children(handlePress)}</>;
    }

    // Default inline display
    const displayValue = secureTextEntry && value ? '•'.repeat(value.length) : value;
    const isEmpty = !value;

    return (
        <Pressable
            onPress={handlePress}
            style={[styles.container, containerStyle]}
            accessibilityRole="button"
            accessibilityLabel={label ?? placeholder ?? 'Text input'}
            accessibilityHint="Double-tap to edit"
            disabled={!editable}
        >
            <View style={styles.innerWrap}>
                <Text
                    style={[
                        styles.displayText,
                        isEmpty && styles.placeholderText,
                        { color: isEmpty ? (placeholderTextColor ?? colors.textMuted) : colors.textPrimary },
                        style,
                    ]}
                    numberOfLines={multiline ? 4 : 1}
                >
                    {isEmpty ? placeholder : displayValue}
                </Text>
            </View>
        </Pressable>
    );
}

// ── Styles ───────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        // Mimics a standard TextInput appearance
    },
    innerWrap: {
        justifyContent: 'center',
        minHeight: 22,
    },
    displayText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 15,
        color: colors.textPrimary,
    },
    placeholderText: {
        color: colors.textMuted,
    },
});
