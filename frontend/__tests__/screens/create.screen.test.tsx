import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import CreateScreen from "@/app/(tabs)/create";

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockGetToken = jest.fn().mockResolvedValue("token-123");
const mockFetchAllWearables = jest.fn();
const mockFetchWearableCategories = jest.fn();

jest.mock("expo-router", () => {
  const React = require("react");
  return {
    router: {
      push: (...args: unknown[]) => mockPush(...args),
      back: (...args: unknown[]) => mockBack(...args),
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
}));

jest.mock("@/api/backend/category.api", () => ({
  fetchWearableCategories: (...args: unknown[]) => mockFetchWearableCategories(...args),
}));

jest.mock("@/components/navigation/app-header", () => {
  const React = require("react");
  const { Text, View } = require("react-native");
  return {
    AppHeader: ({ title, right }: { title: string; right?: React.ReactNode }) => (
      <View>
        <Text>{title}</Text>
        {right}
      </View>
    ),
  };
});

jest.mock("@/components/ui/box", () => {
  const React = require("react");
  const { View } = require("react-native");
  return { Box: ({ children }: { children: React.ReactNode }) => <View>{children}</View> };
});

jest.mock("@/components/ui/hstack", () => {
  const React = require("react");
  const { View } = require("react-native");
  return { HStack: ({ children }: { children: React.ReactNode }) => <View>{children}</View> };
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

jest.mock("@/components/common/CreateLoadingState", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return () => <Text>loading</Text>;
});

jest.mock("@/components/common/CreateErrorState", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ error }: { error: string }) => <Text>{error}</Text>,
  };
});

jest.mock("@/components/common/CreateEmptyWardrobeState", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    __esModule: true,
    default: () => <Text>empty-wardrobe</Text>,
  };
});

describe("Create screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockFetchAllWearables.mockResolvedValue([
      { id: "w1", title: "Blue Tee", categoryId: "c1", cutoutImageUrl: "https://img/1.png" },
      { id: "w2", title: "Black Jeans", categoryId: "c2", cutoutImageUrl: "https://img/2.png" },
    ]);

    mockFetchWearableCategories.mockResolvedValue([
      { id: "c1", name: "Tops" },
      { id: "c2", name: "Bottoms" },
    ]);
  });

  it("continues to compose after selecting at least two items", async () => {
    const { getByText } = render(<CreateScreen />);

    await waitFor(() => {
      expect(getByText("Blue Tee")).toBeTruthy();
      expect(getByText("Black Jeans")).toBeTruthy();
    });

    fireEvent.press(getByText("Blue Tee"));
    fireEvent.press(getByText("Black Jeans"));
    fireEvent.press(getByText("Continue"));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/compose",
        params: { itemIds: JSON.stringify(["w1", "w2"]) },
      });
    });
  });
});
