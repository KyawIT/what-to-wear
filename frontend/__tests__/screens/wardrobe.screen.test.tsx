import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import WardrobeScreen from "@/app/(tabs)/wardrobe";

const mockPush = jest.fn();
const mockGetToken = jest.fn().mockResolvedValue("token-123");
const mockFetchAllWearables = jest.fn();
const mockFetchWearablesByCategory = jest.fn();
const mockFetchWearableCategories = jest.fn();
const mockFetchAllOutfits = jest.fn();

jest.mock("expo-router", () => {
  const React = require("react");
  return {
    router: {
      push: (...args: unknown[]) => mockPush(...args),
    },
    useFocusEffect: (effect: () => void | (() => void)) => {
      React.useEffect(() => effect(), [effect]);
    },
  };
});

jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  };
});

jest.mock("expo-image", () => {
  const { Image } = require("react-native");
  return { Image };
});

jest.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: () => ({ data: { user: { id: "user-1" } } }),
  },
}));

jest.mock("@/lib/keycloak", () => ({
  getKeycloakAccessToken: (...args: unknown[]) => mockGetToken(...args),
}));

jest.mock("@/api/backend/wearable.api", () => ({
  fetchAllWearables: (...args: unknown[]) => mockFetchAllWearables(...args),
  fetchWearablesByCategory: (...args: unknown[]) => mockFetchWearablesByCategory(...args),
  fetWearableById: jest.fn(),
  deleteWearableById: jest.fn(),
}));

jest.mock("@/api/backend/outfit.api", () => ({
  fetchAllOutfits: (...args: unknown[]) => mockFetchAllOutfits(...args),
  fetchOutfitById: jest.fn(),
  deleteOutfitById: jest.fn(),
}));

jest.mock("@/api/backend/category.api", () => ({
  fetchWearableCategories: (...args: unknown[]) => mockFetchWearableCategories(...args),
}));

jest.mock("@/components/navigation/app-header", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    AppHeader: ({ title }: { title: string }) => <Text>{title}</Text>,
  };
});

jest.mock("@/components/ui/pressable", () => {
  const React = require("react");
  const { Pressable } = require("react-native");
  return {
    Pressable: ({ children, onPress, disabled, ...rest }: { children: React.ReactNode; onPress?: () => void; disabled?: boolean }) => (
      <Pressable onPress={onPress} disabled={disabled} {...rest}>
        {children}
      </Pressable>
    ),
  };
});

jest.mock("@/components/ui/hstack", () => {
  const React = require("react");
  const { View } = require("react-native");
  return { HStack: ({ children }: { children: React.ReactNode }) => <View>{children}</View> };
});

jest.mock("@/components/ui/vstack", () => {
  const React = require("react");
  const { View } = require("react-native");
  return { VStack: ({ children }: { children: React.ReactNode }) => <View>{children}</View> };
});

jest.mock("@/components/ui/center", () => {
  const React = require("react");
  const { View } = require("react-native");
  return { Center: ({ children }: { children: React.ReactNode }) => <View>{children}</View> };
});

jest.mock("@/components/ui/spinner", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return { Spinner: () => <Text>spinner</Text> };
});

jest.mock("@/components/ui/input", () => {
  const React = require("react");
  const { TextInput, View } = require("react-native");
  return {
    Input: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    InputSlot: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    InputIcon: () => null,
    InputField: ({ placeholder, value, onChangeText }: { placeholder?: string; value?: string; onChangeText?: (v: string) => void }) => (
      <TextInput placeholder={placeholder} value={value} onChangeText={onChangeText} />
    ),
  };
});

jest.mock("@/components/ui/fab", () => {
  const React = require("react");
  const { Pressable } = require("react-native");
  return {
    Fab: ({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) => <Pressable onPress={onPress}>{children}</Pressable>,
    FabIcon: () => null,
  };
});

jest.mock("@/components/ui/icon", () => ({
  SearchIcon: () => null,
  AddIcon: () => null,
  CloseIcon: () => null,
  Icon: () => null,
}));

jest.mock("@/components/ui/modal", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    Modal: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    ModalBackdrop: () => null,
    ModalContent: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    ModalHeader: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    ModalBody: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    ModalFooter: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    ModalCloseButton: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  };
});

jest.mock("@/components/ui/alert-dialog", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    AlertDialog: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    AlertDialogBackdrop: () => null,
    AlertDialogBody: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    AlertDialogContent: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    AlertDialogFooter: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    AlertDialogHeader: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  };
});

jest.mock("@/components/ui/button", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  return {
    Button: ({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) => <Pressable onPress={onPress}>{children}</Pressable>,
    ButtonText: ({ children }: { children: React.ReactNode }) => <Text>{children}</Text>,
  };
});

jest.mock("@/components/ui/badge", () => {
  const React = require("react");
  const { Text, View } = require("react-native");
  return {
    Badge: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    BadgeText: ({ children }: { children: React.ReactNode }) => <Text>{children}</Text>,
  };
});

jest.mock("@/components/ui/divider", () => ({ Divider: () => null }));

jest.mock("@/components/common/WardrobeErrorState", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ message }: { message: string }) => <Text>{message}</Text>,
  };
});

jest.mock("@/components/common/WardrobeListEmptyState", () => {
  const React = require("react");
  const { Text, View } = require("react-native");
  return {
    __esModule: true,
    default: ({ title, subtitle }: { title: string; subtitle: string }) => (
      <View>
        <Text>{title}</Text>
        <Text>{subtitle}</Text>
      </View>
    ),
  };
});

describe("Wardrobe screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockFetchAllWearables.mockResolvedValue([
      { id: "w1", title: "Blue Tee", categoryId: "c1", cutoutImageUrl: "https://img/1.png" },
      { id: "w2", title: "Black Jeans", categoryId: "c2", cutoutImageUrl: "https://img/2.png" },
    ]);
    mockFetchWearablesByCategory.mockResolvedValue([]);
    mockFetchWearableCategories.mockResolvedValue([
      { id: "c1", name: "Tops" },
      { id: "c2", name: "Bottoms" },
    ]);
    mockFetchAllOutfits.mockResolvedValue([
      { id: "o1", title: "Street Fit", imageUrl: "https://img/o1.png", description: "", wearableIds: [], createdAt: "", updatedAt: "" },
    ]);
  });

  it("filters items by search and switches to outfits tab", async () => {
    const { getByText, getByPlaceholderText, queryByText } = render(<WardrobeScreen />);

    await waitFor(() => {
      expect(getByText("Blue Tee")).toBeTruthy();
      expect(getByText("Black Jeans")).toBeTruthy();
    });

    fireEvent.changeText(getByPlaceholderText("Search by name..."), "jeans");

    expect(queryByText("Blue Tee")).toBeNull();
    expect(getByText("Black Jeans")).toBeTruthy();

    fireEvent.press(getByText("Outfits"));

    await waitFor(() => {
      expect(mockFetchAllOutfits).toHaveBeenCalled();
      expect(getByText("Street Fit")).toBeTruthy();
    });

    fireEvent.changeText(getByPlaceholderText("Search outfits..."), "formal");

    await waitFor(() => {
      expect(queryByText("Street Fit")).toBeNull();
      expect(getByText("No outfits found")).toBeTruthy();
    });
  });
});
