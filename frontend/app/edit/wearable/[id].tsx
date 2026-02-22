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
import { fetWearableById, updateWearableById } from "@/api/backend/wearable.api";
import { fetchWearableCategories, WearableCategoryDto } from "@/api/backend/category.api";
import { colors } from "@/lib/theme";

export default function EditWearableScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = authClient.useSession();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<WearableCategoryDto[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagsText, setTagsText] = useState("");

  const wearableId = useMemo(() => (typeof id === "string" ? id : ""), [id]);

  useEffect(() => {
    if (!data?.user?.id || !wearableId) return;

    (async () => {
      setLoading(true);
      try {
        const accessToken = await getKeycloakAccessToken(data.user.id);
        const [wearable, fetchedCategories] = await Promise.all([
          fetWearableById(wearableId, accessToken),
          fetchWearableCategories(accessToken),
        ]);

        setCategories(fetchedCategories);
        setCategoryId(wearable.categoryId);
        setTitle(wearable.title ?? "");
        setDescription(wearable.description ?? "");
        setTagsText((wearable.tags ?? []).join(", "));
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Failed to load clothing item";
        Alert.alert("Error", msg, [{ text: "Back", onPress: () => router.back() }]);
      } finally {
        setLoading(false);
      }
    })();
  }, [data?.user?.id, wearableId]);

  const onSave = async () => {
    if (!data?.user?.id || !wearableId) return;
    if (!categoryId.trim()) {
      Alert.alert("Missing category", "Please select a category.");
      return;
    }
    if (!title.trim()) {
      Alert.alert("Missing title", "Please enter a title.");
      return;
    }

    try {
      setSaving(true);
      const accessToken = await getKeycloakAccessToken(data.user.id);
      await updateWearableById(
        wearableId,
        {
          categoryId,
          title,
          description,
          tags: tagsText
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        },
        accessToken
      );
      Alert.alert("Saved", "Clothing item updated successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to update clothing item";
      Alert.alert("Update failed", msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background-50" edges={["top"]}>
        <AppHeader title="Edit Item" titleStyle={styles.headerTitle} onBack={() => router.back()} />
        <Center className="flex-1">
          <Spinner size="large" className="text-primary-500" />
        </Center>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background-50" edges={["top"]}>
      <AppHeader title="Edit Item" titleStyle={styles.headerTitle} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <RNText style={styles.label}>Category</RNText>
        <View style={styles.categoryWrap}>
          {categories.map((category) => {
            const active = category.id === categoryId;
            return (
              <Pressable
                key={category.id}
                onPress={() => setCategoryId(category.id)}
                style={[styles.categoryChip, active && styles.categoryChipActive]}
              >
                <RNText style={[styles.categoryText, active && styles.categoryTextActive]}>
                  {category.name}
                </RNText>
              </Pressable>
            );
          })}
        </View>

        <RNText style={styles.label}>Title</RNText>
        <Input variant="rounded" size="xl" className="mb-4 bg-background-100 border-outline-200">
          <InputField value={title} onChangeText={setTitle} placeholder="Item title" maxLength={80} />
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
        <Input variant="rounded" size="xl" className="mb-6 bg-background-100 border-outline-200">
          <InputField value={tagsText} onChangeText={setTagsText} placeholder="casual, denim, blue" />
        </Input>

        <Button onPress={onSave} isDisabled={saving} className="bg-primary-500">
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
  categoryWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  categoryChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E4D7C5",
    backgroundColor: "#FFF8F0",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryChipActive: {
    borderColor: colors.primary,
    backgroundColor: "#F7E9D7",
  },
  categoryText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#7A6A5A",
  },
  categoryTextActive: {
    color: colors.primary,
  },
});
