import { ScrollView, FlatList, Dimensions, Alert, Text as RNText, View } from "react-native";
import { Image } from "expo-image";
import React, { useEffect, useState, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { authClient } from "@/lib/auth-client";
import { router, useFocusEffect } from "expo-router";
import { getKeycloakAccessToken } from "@/lib/keycloak";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Pressable } from "@/components/ui/pressable";
import { Input, InputField, InputSlot, InputIcon } from "@/components/ui/input";
import { Fab, FabIcon } from "@/components/ui/fab";
import { Center } from "@/components/ui/center";
import { Spinner } from "@/components/ui/spinner";
import { SearchIcon, AddIcon, CloseIcon, Icon } from "@/components/ui/icon";
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from "@/components/ui/modal";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Divider } from "@/components/ui/divider";
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
} from "@/components/ui/alert-dialog";
import { Button, ButtonText } from "@/components/ui/button";
import { AppHeader } from "@/components/navigation/app-header";
import { Calendar, Shirt, LayoutGrid } from "lucide-react-native";

import {
  WearableResponseDto,
} from "@/api/backend/wearable.model";
import {
  fetchWearablesByCategory,
  fetchAllWearables,
  fetWearableById,
  deleteWearableById,
} from "@/api/backend/wearable.api";
import {
  fetchAllOutfits,
  fetchOutfitById,
  deleteOutfitById,
} from "@/api/backend/outfit.api";
import {
  fetchWearableCategories,
  WearableCategoryDto,
} from "@/api/backend/category.api";
import { OutfitResponseDto } from "@/api/backend/outfit.model";
import { colors } from "@/lib/theme";
import { resolveImageUrl } from "@/lib/resolve-image-url";
import WardrobeErrorState from "@/components/common/WardrobeErrorState";
import WardrobeTabSwitcher from "@/components/common/WardrobeTabSwitcher";
import WardrobeListEmptyState from "@/components/common/WardrobeListEmptyState";
import { styles } from "../../styles/screens/tabs/wardrobe.styles";

type TabType = "items" | "outfits";
type CategoryFilter = string;
type DeleteTargetType = "wearable" | "outfit";

const Wardrobe = () => {
  const { data } = authClient.useSession();
  const [activeTab, setActiveTab] = useState<TabType>("items");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("ALL");
  const [wearables, setWearables] = useState<WearableResponseDto[]>([]);
  const [loadingWearables, setLoadingWearables] = useState(false);
  const [outfits, setOutfits] = useState<OutfitResponseDto[]>([]);
  const [loadingOutfits, setLoadingOutfits] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<WearableCategoryDto[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedWearable, setSelectedWearable] = useState<WearableResponseDto | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showOutfitModal, setShowOutfitModal] = useState(false);
  const [selectedOutfit, setSelectedOutfit] = useState<OutfitResponseDto | null>(null);
  const [loadingOutfitDetail, setLoadingOutfitDetail] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetType, setDeleteTargetType] = useState<DeleteTargetType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const screenWidth = Dimensions.get("window").width;
  const ITEM_SIZE = (screenWidth - 48) / 2;

  useFocusEffect(
    React.useCallback(() => {
      setRetryCount((c) => c + 1);
    }, [])
  );

  useEffect(() => {
    if (!data?.user?.id) return;

    const fetchData = async () => {
      setLoadingWearables(true);
      setFetchError(null);
      try {
        const accessToken = await getKeycloakAccessToken(data.user.id);
        let items: WearableResponseDto[];
        if (activeCategory === "ALL") {
          items = await fetchAllWearables(accessToken);
        } else {
          items = await fetchWearablesByCategory(
            activeCategory,
            accessToken
          );
        }
        if (__DEV__ && items.length > 0) {
          console.log(
            "[Wardrobe] First image URL (raw → resolved):",
            items[0].cutoutImageUrl ?? "(none)",
            "→",
            resolveImageUrl(items[0].cutoutImageUrl) ?? "(none)"
          );
        }
        setWearables(items);
      } catch (err) {
        console.error("Failed to fetch wearables:", err);
        const msg = err instanceof Error ? err.message : "Failed to load wardrobe";
        setFetchError(msg);
        setWearables([]);
      } finally {
        setLoadingWearables(false);
      }
    };

    fetchData();
  }, [activeCategory, data?.user?.id, retryCount]);

  useEffect(() => {
    if (!data?.user?.id || activeTab !== "outfits") return;

    (async () => {
      setLoadingOutfits(true);
      try {
        const accessToken = await getKeycloakAccessToken(data.user.id);
        const list = await fetchAllOutfits(accessToken);
        setOutfits(list);
      } catch (err) {
        console.error("Failed to fetch outfits:", err);
        setOutfits([]);
      } finally {
        setLoadingOutfits(false);
      }
    })();
  }, [data?.user?.id, activeTab, retryCount]);

  useEffect(() => {
    if (!data?.user?.id) return;
    (async () => {
      try {
        const token = await getKeycloakAccessToken(data.user.id);
        setCategories(await fetchWearableCategories(token));
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      } finally {
        setLoadingCategories(false);
      }
    })();
  }, [data?.user?.id]);

  const activeCategoryName =
    activeCategory === "ALL"
      ? "All"
      : categories.find((c) => c.id === activeCategory)?.name ?? "";

  const filteredWearables = useMemo(() => {
    if (!searchQuery.trim()) return wearables;
    const query = searchQuery.toLowerCase().trim();
    return wearables.filter((item) =>
      item.title.toLowerCase().includes(query)
    );
  }, [wearables, searchQuery]);

  const filteredOutfits = useMemo(() => {
    if (!searchQuery.trim()) return outfits;
    const query = searchQuery.toLowerCase().trim();
    return outfits.filter((outfit) => outfit.title.toLowerCase().includes(query));
  }, [outfits, searchQuery]);

  const renderWearableItem = ({ item }: { item: WearableResponseDto }) => (
    <Pressable
      onPress={async () => {
        if (!data?.user?.id) return;
        setShowModal(true);
        setLoadingDetail(true);
        setSelectedWearable(null);
        try {
          const accessToken = await getKeycloakAccessToken(data.user.id);
          const detail = await fetWearableById(item.id, accessToken);
          setSelectedWearable(detail);
        } catch (err) {
          console.error("Failed to fetch wearable detail:", err);
        } finally {
          setLoadingDetail(false);
        }
      }}
      className="active:opacity-80 mb-4"
    >
      <View
        style={[styles.itemCard, { width: ITEM_SIZE, height: ITEM_SIZE * 1.2 }]}
      >
        {resolveImageUrl(item.cutoutImageUrl) ? (
          <Image
            source={{ uri: resolveImageUrl(item.cutoutImageUrl) }}
            style={{ width: "100%", height: "100%" }}
            contentFit="contain"
          />
        ) : (
          <Center className="flex-1">
            <Shirt size={32} color={colors.textMuted} />
          </Center>
        )}

        <View style={styles.itemLabel}>
          <RNText style={styles.itemLabelText} numberOfLines={1}>
            {item.title}
          </RNText>
        </View>
      </View>
    </Pressable>
  );

  const renderOutfitItem = ({ item }: { item: OutfitResponseDto }) => (
    <Pressable
      onPress={async () => {
        if (!data?.user?.id) return;
        setShowOutfitModal(true);
        setLoadingOutfitDetail(true);
        setSelectedOutfit(null);
        try {
          const accessToken = await getKeycloakAccessToken(data.user.id);
          const detail = await fetchOutfitById(item.id, accessToken);
          setSelectedOutfit(detail);
        } catch (err) {
          console.error("Failed to fetch outfit detail:", err);
        } finally {
          setLoadingOutfitDetail(false);
        }
      }}
      className="active:opacity-80 mb-4"
    >
      <View
        style={[styles.itemCard, { width: ITEM_SIZE, height: ITEM_SIZE * 1.2 }]}
      >
        {resolveImageUrl(item.imageUrl) ? (
          <Image
            source={{ uri: resolveImageUrl(item.imageUrl) }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : (
          <Center className="flex-1">
            <LayoutGrid size={32} color={colors.textMuted} />
          </Center>
        )}

        <View style={styles.itemLabel}>
          <RNText style={styles.itemLabelText} numberOfLines={1}>
            {item.title}
          </RNText>
        </View>
      </View>
    </Pressable>
  );

  const handleOpenDeleteWearableConfirm = () => {
    if (!selectedWearable) return;
    setDeleteTargetType("wearable");
    setShowDeleteConfirm(true);
  };

  const handleOpenDeleteOutfitConfirm = () => {
    if (!selectedOutfit) return;
    setDeleteTargetType("outfit");
    setShowDeleteConfirm(true);
  };

  const handleCloseDeleteConfirm = () => {
    if (isDeleting) return;
    setShowDeleteConfirm(false);
    setDeleteTargetType(null);
  };

  const handleEditWearable = () => {
    if (!selectedWearable) return;
    setShowModal(false);
    router.push(`/edit/wearable/${selectedWearable.id}`);
  };

  const handleEditOutfit = () => {
    if (!selectedOutfit) return;
    setShowOutfitModal(false);
    router.push(`/edit/outfit/${selectedOutfit.id}`);
  };

  const handleConfirmDelete = async () => {
    if (!data?.user?.id || !deleteTargetType) return;

    try {
      setIsDeleting(true);
      const accessToken = await getKeycloakAccessToken(data.user.id);

      if (deleteTargetType === "wearable") {
        if (!selectedWearable) return;
        const result = await deleteWearableById(selectedWearable.id, accessToken);
        if (!result.success) {
          Alert.alert("Delete failed", result.message ?? "Could not delete clothing item.");
          return;
        }
        setWearables((prev) => prev.filter((item) => item.id !== selectedWearable.id));
        setSelectedWearable(null);
        setShowModal(false);
        Alert.alert("Deleted", "Clothing item deleted successfully.");
      } else {
        if (!selectedOutfit) return;
        const result = await deleteOutfitById(selectedOutfit.id, accessToken);
        if (!result.success) {
          Alert.alert("Delete failed", result.message ?? "Could not delete outfit.");
          return;
        }
        setOutfits((prev) => prev.filter((item) => item.id !== selectedOutfit.id));
        setSelectedOutfit(null);
        setShowOutfitModal(false);
        Alert.alert("Deleted", "Outfit deleted successfully.");
      }

      setShowDeleteConfirm(false);
      setDeleteTargetType(null);
    } catch {
      Alert.alert("Delete failed", "Something went wrong. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (fetchError) {
    return (
      <WardrobeErrorState
        message={fetchError}
        onRetry={() => {
          setFetchError(null);
          setRetryCount((c) => c + 1);
        }}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background-50" edges={["top"]}>
      <AppHeader title="My Wardrobe" titleStyle={styles.headerTitle} />

      <WardrobeTabSwitcher
        activeTab={activeTab}
        onChangeTab={(tab) => {
          setActiveTab(tab);
          setSearchQuery("");
        }}
      />

      {activeTab === "items" ? (
        <FlatList
          data={filteredWearables}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 100,
            flexGrow: 1,
          }}
          columnWrapperStyle={filteredWearables.length > 0 ? { justifyContent: "space-between" } : undefined}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {/* Category Icons */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginHorizontal: -16, paddingVertical: 16 }}
                contentContainerStyle={{ paddingHorizontal: 16 }}
              >
                <Pressable
                    key="ALL"
                    onPress={() => setActiveCategory("ALL")}
                    className="items-center mr-4"
                    style={{ minWidth: 56 }}
                  >
                    <View
                      style={[
                        styles.categoryCircle,
                        activeCategory === "ALL" && styles.categoryCircleActive,
                      ]}
                    >
                      <LayoutGrid
                        size={24}
                        color={activeCategory === "ALL" ? colors.primary : colors.textMuted}
                      />
                    </View>
                    <RNText
                      style={[
                        styles.categoryLabel,
                        activeCategory === "ALL" && styles.categoryLabelActive,
                      ]}
                    >
                      All
                    </RNText>
                  </Pressable>
                  {!loadingCategories && categories.map((cat) => {
                    const isActive = activeCategory === cat.id;
                    const letter = cat.name.charAt(0).toUpperCase();
                    return (
                      <Pressable
                        key={cat.id}
                        onPress={() => setActiveCategory(cat.id)}
                        className="items-center mr-4"
                        style={{ minWidth: 56 }}
                      >
                        <View
                          style={[
                            styles.categoryCircle,
                            isActive && styles.categoryCircleActive,
                          ]}
                        >
                          <RNText
                            style={[
                              styles.categoryLetter,
                              { color: isActive ? colors.primary : colors.textMuted },
                            ]}
                          >
                            {letter}
                          </RNText>
                        </View>
                        <RNText
                          numberOfLines={1}
                          style={[
                            styles.categoryLabel,
                            isActive && styles.categoryLabelActive,
                          ]}
                        >
                          {cat.name}
                        </RNText>
                      </Pressable>
                    );
                  })}
              </ScrollView>

              {/* Search Bar */}
              <Input
                variant="rounded"
                size="xl"
                className="mb-4 bg-background-100 border-outline-200"
              >
                <InputSlot className="pl-4">
                  <InputIcon as={SearchIcon} className="text-typography-400" />
                </InputSlot>
                <InputField
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  className="text-typography-800"
                  style={{ fontFamily: "Inter_400Regular" }}
                />
              </Input>
            </>
          }
          ListEmptyComponent={
            loadingWearables ? (
              <Center className="pt-12">
                <Spinner size="large" className="text-primary-500" />
                <RNText style={styles.loadingText}>Loading...</RNText>
              </Center>
            ) : (
              <WardrobeListEmptyState
                icon={<Shirt size={40} color={colors.primary} strokeWidth={1.5} />}
                title={
                  searchQuery
                    ? "No items found"
                    : activeCategory === "ALL"
                    ? "Your wardrobe is empty"
                    : `No ${activeCategoryName} items yet`
                }
                subtitle={
                  searchQuery
                    ? "Try a different search term"
                    : "Start adding items to build your wardrobe"
                }
              />
            )
          }
          renderItem={renderWearableItem}
        />
      ) : (
        <FlatList
          data={filteredOutfits}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 100,
            flexGrow: 1,
          }}
          columnWrapperStyle={filteredOutfits.length > 0 ? { justifyContent: "space-between" } : undefined}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={{ paddingTop: 16 }}>
              <Input
                variant="rounded"
                size="xl"
                className="mb-4 bg-background-100 border-outline-200"
              >
                <InputSlot className="pl-4">
                  <InputIcon as={SearchIcon} className="text-typography-400" />
                </InputSlot>
                <InputField
                  placeholder="Search outfits..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  className="text-typography-800"
                  style={{ fontFamily: "Inter_400Regular" }}
                />
              </Input>
            </View>
          }
          ListEmptyComponent={
            loadingOutfits ? (
              <Center className="pt-12">
                <Spinner size="large" className="text-primary-500" />
                <RNText style={styles.loadingText}>Loading...</RNText>
              </Center>
            ) : (
              <WardrobeListEmptyState
                icon={<LayoutGrid size={40} color={colors.primary} strokeWidth={1.5} />}
                title={searchQuery ? "No outfits found" : "No outfits yet"}
                subtitle={
                  searchQuery
                    ? "Try a different search term"
                    : "Create and save your favorite outfit combinations"
                }
              />
            )
          }
          renderItem={renderOutfitItem}
        />
      )}

      {/* Floating Action Button */}
      <Fab
        size="lg"
        placement="bottom right"
        onPress={() => router.push(activeTab === "outfits" ? "/create" : "/scan")}
        className="bg-primary-500 shadow-hard-2"
      >
        <FabIcon as={AddIcon} className="text-typography-0" />
      </Fab>

      {/* Wearable Detail Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="md">
        <ModalBackdrop />
        <ModalContent className={"rounded-3xl"}>
          <ModalHeader>
            <RNText style={styles.modalTitle}>Details</RNText>
            <ModalCloseButton onPress={() => setShowModal(false)}>
              <Icon as={CloseIcon} className="text-typography-500" />
            </ModalCloseButton>
          </ModalHeader>
          <ModalBody>
            {loadingDetail ? (
              <Center className="py-8">
                <Spinner size="large" className="text-primary-500" />
                <RNText style={styles.loadingText}>Loading...</RNText>
              </Center>
            ) : selectedWearable ? (
              <VStack className="gap-4">
                <View style={styles.modalImageCard}>
                  {resolveImageUrl(selectedWearable.cutoutImageUrl) ? (
                    <Image
                      source={{ uri: resolveImageUrl(selectedWearable.cutoutImageUrl) }}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="contain"
                    />
                  ) : (
                    <Center className="flex-1">
                      <Shirt size={40} color={colors.textMuted} />
                    </Center>
                  )}
                </View>

                <VStack className="gap-1">
                  <RNText style={styles.modalItemTitle}>
                    {selectedWearable.title}
                  </RNText>
                  <RNText style={styles.modalItemSub}>
                    {selectedWearable.categoryName}
                  </RNText>
                </VStack>

                {selectedWearable.description ? (
                  <RNText style={styles.modalDescription}>
                    {selectedWearable.description}
                  </RNText>
                ) : null}

                {selectedWearable.tags?.length ? (
                  <HStack className="flex-wrap gap-2">
                    {selectedWearable.tags.map((tag) => (
                      <Badge key={tag} variant="solid" className="bg-primary-100">
                        <BadgeText className="text-primary-700">{tag}</BadgeText>
                      </Badge>
                    ))}
                  </HStack>
                ) : null}

                <Divider className="bg-outline-200" />

                <HStack className="items-center gap-2">
                  <Calendar size={16} color={colors.textMuted} />
                  <RNText style={styles.modalDate}>
                    Added{" "}
                    {new Date(selectedWearable.createdAt).toLocaleDateString()}
                  </RNText>
                </HStack>
              </VStack>
            ) : (
              <Center className="py-8">
                <RNText style={styles.modalDate}>
                  Unable to load item details.
                </RNText>
              </Center>
            )}
          </ModalBody>
          <ModalFooter className="w-full">
            <HStack className="w-full gap-2">
              <Button
                action="secondary"
                variant="outline"
                className="flex-1"
                onPress={handleEditWearable}
                isDisabled={!selectedWearable || loadingDetail || isDeleting}
              >
                <ButtonText>Edit</ButtonText>
              </Button>
              <Button
                action="negative"
                className="flex-1 bg-error-600 data-[hover=true]:bg-error-700 data-[active=true]:bg-error-800"
                onPress={handleOpenDeleteWearableConfirm}
                isDisabled={!selectedWearable || loadingDetail || isDeleting}
              >
                <ButtonText>Delete</ButtonText>
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Outfit Detail Modal */}
      <Modal isOpen={showOutfitModal} onClose={() => setShowOutfitModal(false)} size="md">
        <ModalBackdrop />
        <ModalContent className={"rounded-3xl"}>
          <ModalHeader>
            <RNText style={styles.modalTitle}>Outfit Details</RNText>
            <ModalCloseButton onPress={() => setShowOutfitModal(false)}>
              <Icon as={CloseIcon} className="text-typography-500" />
            </ModalCloseButton>
          </ModalHeader>
          <ModalBody>
            {loadingOutfitDetail ? (
              <Center className="py-8">
                <Spinner size="large" className="text-primary-500" />
                <RNText style={styles.loadingText}>Loading...</RNText>
              </Center>
            ) : selectedOutfit ? (
              <VStack className="gap-4">
                <View style={styles.modalImageCard}>
                  {resolveImageUrl(selectedOutfit.imageUrl) ? (
                    <Image
                      source={{ uri: resolveImageUrl(selectedOutfit.imageUrl) }}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                    />
                  ) : (
                    <Center className="flex-1">
                      <LayoutGrid size={40} color={colors.textMuted} />
                    </Center>
                  )}
                </View>

                <VStack className="gap-1">
                  <RNText style={styles.modalItemTitle}>
                    {selectedOutfit.title}
                  </RNText>
                  <RNText style={styles.modalItemSub}>
                    {selectedOutfit.wearables?.length ?? 0} item(s)
                  </RNText>
                </VStack>

                {selectedOutfit.description ? (
                  <RNText style={styles.modalDescription}>
                    {selectedOutfit.description}
                  </RNText>
                ) : null}

                {selectedOutfit.tags?.length ? (
                  <HStack className="flex-wrap gap-2">
                    {selectedOutfit.tags.map((tag) => (
                      <Badge key={tag} variant="solid" className="bg-primary-100">
                        <BadgeText className="text-primary-700">{tag}</BadgeText>
                      </Badge>
                    ))}
                  </HStack>
                ) : null}

                {selectedOutfit.wearables?.length ? (
                  <VStack className="gap-2">
                    <RNText style={styles.modalSectionLabel}>
                      Included items
                    </RNText>
                    <HStack className="flex-wrap gap-2">
                      {selectedOutfit.wearables.map((wearable) => (
                        <Badge key={wearable.id} variant="outline">
                          <BadgeText>{wearable.title}</BadgeText>
                        </Badge>
                      ))}
                    </HStack>
                  </VStack>
                ) : null}

                <Divider className="bg-outline-200" />

                <HStack className="items-center gap-2">
                  <Calendar size={16} color={colors.textMuted} />
                  <RNText style={styles.modalDate}>
                    Added{" "}
                    {new Date(selectedOutfit.createdAt).toLocaleDateString()}
                  </RNText>
                </HStack>
              </VStack>
            ) : (
              <Center className="py-8">
                <RNText style={styles.modalDate}>
                  Unable to load outfit details.
                </RNText>
              </Center>
            )}
          </ModalBody>
          <ModalFooter className="w-full">
            <HStack className="w-full gap-2">
              <Button
                action="secondary"
                variant="outline"
                className="flex-1"
                onPress={handleEditOutfit}
                isDisabled={!selectedOutfit || loadingOutfitDetail || isDeleting}
              >
                <ButtonText>Edit</ButtonText>
              </Button>
              <Button
                action="negative"
                className="flex-1 bg-error-600 data-[hover=true]:bg-error-700 data-[active=true]:bg-error-800"
                onPress={handleOpenDeleteOutfitConfirm}
                isDisabled={!selectedOutfit || loadingOutfitDetail || isDeleting}
              >
                <ButtonText>Delete</ButtonText>
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation */}
      <AlertDialog isOpen={showDeleteConfirm} onClose={handleCloseDeleteConfirm} size="md">
        <AlertDialogBackdrop />
        <AlertDialogContent>
          <AlertDialogHeader>
            <RNText style={styles.alertTitle}>Confirm Deletion</RNText>
          </AlertDialogHeader>
          <AlertDialogBody>
            <RNText style={styles.alertBody}>
              {deleteTargetType === "wearable"
                ? "Delete this clothing item permanently? It will also be removed from any outfits that use it."
                : "Delete this outfit permanently? This action cannot be undone."}
            </RNText>
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button
              action="secondary"
              variant="outline"
              onPress={handleCloseDeleteConfirm}
              isDisabled={isDeleting}
            >
              <ButtonText>Cancel</ButtonText>
            </Button>
            <Button
              action="negative"
              onPress={handleConfirmDelete}
              isDisabled={isDeleting}
            >
              <ButtonText>{isDeleting ? "Deleting..." : "Delete"}</ButtonText>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SafeAreaView>
  );
};

export default Wardrobe;
