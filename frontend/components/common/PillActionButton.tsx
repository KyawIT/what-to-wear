import React from "react";
import { Sparkles } from "lucide-react-native";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { colors } from "@/lib/theme";

type PillActionButtonProps = {
  loading: boolean;
  loadingLabel: string;
  label: string;
  onPress: () => void;
};

export default function PillActionButton({ loading, loadingLabel, label, onPress }: PillActionButtonProps) {
  return (
    <Pressable onPress={onPress} disabled={loading} className="active:opacity-60">
      <HStack
        className="items-center rounded-full px-3 py-1.5"
        style={{ backgroundColor: `${colors.primary}15`, borderWidth: 1, borderColor: `${colors.primary}30`, opacity: loading ? 0.7 : 1 }}
      >
        {loading ? <Spinner size="small" color={colors.primary} /> : <Sparkles size={12} color={colors.primary} />}
        <Text className="ml-1.5" style={{ color: colors.primary, fontSize: 12, fontFamily: "Inter_600SemiBold" }}>
          {loading ? loadingLabel : label}
        </Text>
      </HStack>
    </Pressable>
  );
}
