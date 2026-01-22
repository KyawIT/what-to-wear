import {ScrollView, FlatList, Dimensions, View} from "react-native";
import { Image } from "expo-image";
import React, { useEffect, useState, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { authClient } from "@/lib/auth-client";
import { router } from "expo-router";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Input, InputField, InputSlot, InputIcon } from "@/components/ui/input";
import { Fab, FabIcon } from "@/components/ui/fab";
import { Card } from "@/components/ui/card";
import { Center } from "@/components/ui/center";
import { Spinner } from "@/components/ui/spinner";
import { SearchIcon, AddIcon, CloseIcon , Icon } from "@/components/ui/icon";
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
import { Calendar ,
  Shirt,
  LayoutGrid,
  Watch,
  Footprints,
  HardHat,
  Gem,
} from "lucide-react-native";

import {
  WearableCategory,
  WearableResponseDto,
} from "@/api/backend/wearable.model";
import {
  fetchWearablesByCategory,
  fetchAllWearables,
  fetWearableById,
} from "@/api/backend/wearable.api";
import { colors } from "@/lib/theme";

type TabType = "items" | "outfits";
type CategoryFilter = "ALL" | WearableCategory;

// Category configuration with icons
const CATEGORIES: {
  key: CategoryFilter;
  label: string;
  icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
}[] = [
  { key: "ALL", label: "All", icon: LayoutGrid },
  { key: "SHIRT", label: "Shirts", icon: Shirt },
  { key: "PANTS", label: "Pants", icon: ({ size, color }) => (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: size * 0.7, color }}>👖</Text>
    </View>
  )},
  { key: "JACKET", label: "Jackets", icon: ({ size, color, strokeWidth }) => (
    <Shirt size={size} color={color} strokeWidth={strokeWidth} />
  )},
  { key: "SHOES", label: "Shoes", icon: Footprints },
  { key: "WATCH", label: "Watches", icon: Watch },
  { key: "HAT", label: "Hats", icon: HardHat },
  { key: "ACCESSORY", label: "Accessories", icon: Gem },
];

const Wardrobe = () => {
  const { data } = authClient.useSession();
  const [activeTab, setActiveTab] = useState<TabType>("items");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("ALL");
  const [wearables, setWearables] = useState<WearableResponseDto[]>([]);
  const [loadingWearables, setLoadingWearables] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedWearable, setSelectedWearable] = useState<WearableResponseDto | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const screenWidth = Dimensions.get("window").width;
  const ITEM_SIZE = (screenWidth - 48) / 2;

  useEffect(() => {
    if (!data?.user?.id) return;

    const fetchData = async () => {
      setLoadingWearables(true);
      try {
        let items: WearableResponseDto[];
        if (activeCategory === "ALL") {
          items = await fetchAllWearables(data.user.id);
        } else {
          items = await fetchWearablesByCategory(
            data.user.id,
            activeCategory as WearableCategory
          );
        }
        setWearables(items);
      } catch (err) {
        console.error("Failed to fetch wearables:", err);
        setWearables([]);
      } finally {
        setLoadingWearables(false);
      }
    };

    fetchData();
  }, [activeCategory, data?.user?.id]);

  const filteredWearables = useMemo(() => {
    if (!searchQuery.trim()) return wearables;
    const query = searchQuery.toLowerCase().trim();
    return wearables.filter((item) =>
      item.title.toLowerCase().includes(query)
    );
  }, [wearables, searchQuery]);

  const renderCategoryIcon = (
    category: typeof CATEGORIES[number],
    isActive: boolean
  ) => {
    const IconComponent = category.icon;
    return (
      <IconComponent
        size={24}
        color={isActive ? colors.primary : colors.textMuted}
        strokeWidth={isActive ? 2.5 : 2}
      />
    );
  };

  const renderWearableItem = ({ item }: { item: WearableResponseDto }) => (
    <Pressable
      onPress={async () => {
        if (!data?.user?.id) return;
        setShowModal(true);
        setLoadingDetail(true);
        setSelectedWearable(null);
        try {
          const detail = await fetWearableById(data.user.id, item.id);
          setSelectedWearable(detail);
        } catch (err) {
          console.error("Failed to fetch wearable detail:", err);
        } finally {
          setLoadingDetail(false);
        }
      }}
      className="active:opacity-80 mb-4"
    >
      <Card
        variant="elevated"
        className="overflow-hidden bg-white rounded-lg shadow-sm"
        style={{
          width: ITEM_SIZE,
          height: ITEM_SIZE * 1.2,
        }}
      >
        {item.cutoutImageUrl ? (
          <Image
            source={{ uri: item.cutoutImageUrl }}
            style={{ width: "100%", height: "100%" }}
            contentFit="contain"
          />
        ) : (
          <Center className="flex-1">
            <Shirt size={32} color={colors.textMuted} />
            <Text size="xs" className="text-center px-2 mt-2 text-typography-400" numberOfLines={2}>
              {item.title}
            </Text>
          </Center>
        )}
      </Card>
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-background-50" edges={["top"]}>
      {/* Header */}
      <HStack className="h-14 items-center justify-center px-4 border-b border-outline-200">
        <Heading size="xl" className="text-typography-800">
          My Wardrobe
        </Heading>
      </HStack>

      {/* Tab Switcher */}
      <Box className="px-4 pt-4">
        <HStack className="rounded-full p-1 bg-background-100">
          <Pressable
            onPress={() => setActiveTab("items")}
            className={`flex-1 py-2 rounded-full items-center ${
              activeTab === "items" ? "bg-background-0" : ""
            }`}
          >
            <Text
              size="md"
              bold={activeTab === "items"}
              className={activeTab === "items" ? "text-typography-800" : "text-typography-400"}
            >
              Items
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("outfits")}
            className={`flex-1 py-2 rounded-full items-center ${
              activeTab === "outfits" ? "bg-background-0" : ""
            }`}
          >
            <Text
              size="md"
              bold={activeTab === "outfits"}
              className={activeTab === "outfits" ? "text-typography-800" : "text-typography-400"}
            >
              Outfits
            </Text>
          </Pressable>
        </HStack>
      </Box>

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
                {CATEGORIES.map((category) => (
                  <Pressable
                    key={category.key}
                    onPress={() => setActiveCategory(category.key)}
                    className="items-center mr-4"
                    style={{ minWidth: 56 }}
                  >
                    <Box
                      className={`h-14 w-14 rounded-full items-center justify-center mb-2 ${
                        activeCategory === category.key
                          ? "bg-primary-100 border-2 border-primary-500"
                          : "bg-background-100"
                      }`}
                    >
                      {renderCategoryIcon(category, activeCategory === category.key)}
                    </Box>
                    <Text
                      size="xs"
                      className={
                        activeCategory === category.key
                          ? "text-primary-500 font-semibold"
                          : "text-typography-400"
                      }
                    >
                      {category.label}
                    </Text>
                  </Pressable>
                ))}
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
                />
              </Input>
            </>
          }
          ListEmptyComponent={
            loadingWearables ? (
              <Center className="pt-12">
                <Spinner size="large" className="text-primary-500" />
                <Text className="text-typography-400 mt-4">Loading...</Text>
              </Center>
            ) : (
              <Center className="pt-12 px-4">
                <Box className="h-24 w-24 rounded-full items-center justify-center mb-4 bg-primary-50">
                  <Shirt size={40} color={colors.primary} strokeWidth={1.5} />
                </Box>
                <Heading size="md" className="mb-2 text-center text-typography-600">
                  {searchQuery
                    ? "No items found"
                    : activeCategory === "ALL"
                    ? "Your wardrobe is empty"
                    : `No ${activeCategory.toLowerCase()} items yet`}
                </Heading>
                <Text size="sm" className="text-center text-typography-400">
                  {searchQuery
                    ? "Try a different search term"
                    : "Start adding items to build your wardrobe"}
                </Text>
              </Center>
            )
          }
          renderItem={renderWearableItem}
        />
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingTop: 48, alignItems: "center", paddingHorizontal: 32 }}
        >
          <Box className="h-24 w-24 rounded-full items-center justify-center mb-4 bg-primary-50">
            <LayoutGrid size={40} color={colors.primary} strokeWidth={1.5} />
          </Box>
          <Heading size="md" className="mb-2 text-center text-typography-600">
            Outfits coming soon
          </Heading>
          <Text size="sm" className="text-center text-typography-400">
            Create and save your favorite outfit combinations
          </Text>
        </ScrollView>
      )}

      {/* Floating Action Button */}
      <Fab
        size="lg"
        placement="bottom right"
        onPress={() => router.push("/scan")}
        className="bg-primary-500 shadow-hard-2"
      >
        <FabIcon as={AddIcon} className="text-typography-0" />
      </Fab>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="md">
        <ModalBackdrop />
        <ModalContent className={"rounded-3xl"}>
          <ModalHeader>
            <Heading size="md" className="text-typography-800">
              Wearable Details
            </Heading>
            <ModalCloseButton onPress={() => setShowModal(false)}>
              <Icon as={CloseIcon} className="text-typography-500" />
            </ModalCloseButton>
          </ModalHeader>
          <ModalBody>
            {loadingDetail ? (
              <Center className="py-8">
                <Spinner size="large" className="text-primary-500" />
                <Text className="text-typography-400 mt-3">Loading...</Text>
              </Center>
            ) : selectedWearable ? (
              <VStack className="gap-4">
                <Card
                  variant="elevated"
                  className="overflow-hidden"
                  style={{ height: 220 }}
                >
                  {selectedWearable.cutoutImageUrl ? (
                    <Image
                      source={{ uri: selectedWearable.cutoutImageUrl }}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="contain"
                    />
                  ) : (
                    <Center className="flex-1">
                      <Shirt size={40} color={colors.textMuted} />
                      <Text
                        size="sm"
                        className="text-center px-2 mt-2 text-typography-400"
                      >
                        {selectedWearable.title}
                      </Text>
                    </Center>
                  )}
                </Card>

                <VStack className="gap-1">
                  <Heading size="lg" className="text-typography-800">
                    {selectedWearable.title}
                  </Heading>
                  <Text size="sm" className="text-typography-400">
                    {selectedWearable.category}
                  </Text>
                </VStack>

                {selectedWearable.description ? (
                  <Text size="sm" className="text-typography-700">
                    {selectedWearable.description}
                  </Text>
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
                  <Text size="sm" className="text-typography-500">
                    Added{" "}
                    {new Date(selectedWearable.createdAt).toLocaleDateString()}
                  </Text>
                </HStack>
              </VStack>
            ) : (
              <Center className="py-8">
                <Text className="text-typography-400">
                  Unable to load item details.
                </Text>
              </Center>
            )}
          </ModalBody>
          <ModalFooter>

          </ModalFooter>
        </ModalContent>
      </Modal>
    </SafeAreaView>
  );
};

export default Wardrobe;
