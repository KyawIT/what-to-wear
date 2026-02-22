import React, { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text as RNText, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { AppHeader } from "@/components/navigation/app-header";
import { Input, InputField } from "@/components/ui/input";
import { Button, ButtonText } from "@/components/ui/button";
import { Pressable } from "@/components/ui/pressable";
import { Center } from "@/components/ui/center";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { getKeycloakAccessToken } from "@/lib/keycloak";
import { fetchAllWearables } from "@/api/backend/wearable.api";
import { fetchOutfitById, updateOutfitById } from "@/api/backend/outfit.api";
import { WearableResponseDto } from "@/api/backend/wearable.model";
import { colors } from "@/lib/theme";

export default function EditOutfitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = authClient.useSession();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allWearables, setAllWearables] = useState<WearableResponseDto[]>([]);
  const [selectedWearableIds, setSelectedWearableIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagsText, setTagsText] = useState("");

  const outfitId = useMemo(() => (typeof id === "string" ? id : ""), [id]);

  useEffect(() => {
    if (!data?.user?.id || !outfitId) return;

    (async () => {
      setLoading(true);
      try {
        const accessToken = await getKeycloakAccessToken(data.user.id);
        const [outfit, wearables] = await Promise.all([
          fetchOutfitById(outfitId, accessToken),
          fetchAllWearables(accessToken),
        ]);

        setAllWearables(wearables);
        setTitle(outfit.title ?? "");
        setDescription(outfit.description ?? "");
        setTagsText((outfit.tags ?? []).join(", "));
        setSelectedWearableIds((outfit.wearables ?? []).map((w) => w.id));
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Failed to load outfit";
        Alert.alert("Error", msg, [{ text: "Back", onPress: () => router.back() }]);
      } finally {
        setLoading(false);
      }
    })();
  }, [data?.user?.id, outfitId]);

  const toggleWearable = (wearableId: string) => {
    setSelectedWearableIds((prev) =>
      prev.includes(wearableId) ? prev.filter((id) => id !== wearableId) : [...prev, wearableId]
    );
  };

  const onSave = async () => {
    if (!data?.user?.id || !outfitId) return;
    if (!title.trim()) {
      Alert.alert("Missing title", "Please enter an outfit title.");
      return;
    }
    if (selectedWearableIds.length < 2) {
      Alert.alert("Need items", "Please select at least 2 items for this outfit.");
      return;
    }

    try {
      setSaving(true);
      const accessToken = await getKeycloakAccessToken(data.user.id);
      await updateOutfitById(
        outfitId,
        {
          title,
          description,
          tags: tagsText
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          wearableIds: selectedWearableIds,
        },
        accessToken
      );
      Alert.alert("Saved", "Outfit updated successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to update outfit";
      Alert.alert("Update failed", msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background-50" edges={["top"]}>
        <AppHeader title="Edit Outfit" titleStyle={styles.headerTitle} onBack={() => router.back()} />
        <Center className="flex-1">
          <Spinner size="large" className="text-primary-500" />
        </Center>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background-50" edges={["top"]}>
      <AppHeader title="Edit Outfit" titleStyle={styles.headerTitle} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <RNText style={styles.label}>Title</RNText>
        <Input variant="rounded" size="xl" className="mb-4 bg-background-100 border-outline-200">
          <InputField value={title} onChangeText={setTitle} placeholder="Outfit title" maxLength={80} />
        </Input>

        <RNText style={styles.label}>Description</RNText>
        <Input variant="rounded" size="xl" className="mb-4 bg-background-100 border-outline-200">
          <InputField
            value={description}
            onChangeText={setDescription}
            placeholder="Description"
            maxLength={250}
          />
        </Input>

        <RNText style={styles.label}>Tags (comma separated)</RNText>
        <Input variant="rounded" size="xl" className="mb-4 bg-background-100 border-outline-200">
          <InputField value={tagsText} onChangeText={setTagsText} placeholder="street, winter, casual" />
        </Input>

        <RNText style={styles.label}>Included items</RNText>
        <RNText style={styles.noteText}>Preview image remains unchanged after editing metadata/items.</RNText>
        <View style={styles.itemsWrap}>
          {allWearables.map((wearable) => {
            const active = selectedWearableIds.includes(wearable.id);
            return (
              <Pressable
                key={wearable.id}
                onPress={() => toggleWearable(wearable.id)}
                style={[styles.itemChip, active && styles.itemChipActive]}
              >
                <RNText style={[styles.itemText, active && styles.itemTextActive]}>
                  {wearable.title}
                </RNText>
              </Pressable>
            );
          })}
        </View>

        <Button onPress={onSave} isDisabled={saving} className="bg-primary-500 mt-2">
          <ButtonText>{saving ? "Saving..." : "Save changes"}</ButtonText>
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 22,
    color: "#3D2E22",
    letterSpacing: -0.3,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  noteText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 10,
  },
  itemsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  itemChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E4D7C5",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  itemChipActive: {
    borderColor: colors.primary,
    backgroundColor: "#F7E9D7",
  },
  itemText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#7A6A5A",
  },
  itemTextActive: {
    color: colors.primary,
  },
});
