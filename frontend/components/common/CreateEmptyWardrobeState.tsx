import React from "react";
import { Text as RNText, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Shirt, Plus } from "lucide-react-native";
import { colors } from "@/lib/theme";
import { AppHeader } from "@/components/navigation/app-header";
import { Center } from "@/components/ui/center";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { styles } from "./CreateEmptyWardrobeState.styles";

type CreateEmptyWardrobeStateProps = {
  onAddItems: () => void;
};

export default function CreateEmptyWardrobeState({ onAddItems }: CreateEmptyWardrobeStateProps) {
  return (
    <SafeAreaView className="flex-1 bg-background-50" edges={["top"]}>
      <AppHeader title="Create Outfit" titleStyle={styles.headerTitle} />
      <Center className="flex-1 px-8">
        <View style={styles.emptyIcon}>
          <Shirt size={40} color={colors.primary} strokeWidth={1.5} />
        </View>
        <RNText style={styles.emptyTitle}>Your wardrobe is empty</RNText>
        <RNText style={styles.emptySubtitle}>Start by adding items from the Scan tab</RNText>
        <Pressable onPress={onAddItems} className="rounded-full px-6 py-3 active:opacity-80 mt-6" style={{ backgroundColor: colors.primary }}>
          <HStack className="items-center">
            <Plus size={18} color="#FFFFFF" />
            <RNText style={[styles.buttonText, { marginLeft: 8 }]}>Add Items</RNText>
          </HStack>
        </Pressable>
      </Center>
    </SafeAreaView>
  );
}

