import { View } from "react-native";
import React from "react";
import { Tabs } from "expo-router";
import TabIcon from "@/components/common/TabIcon";

const _Layout = () => {
  return (
    <View className="flex-1 bg-background-50">
      <Tabs
        screenOptions={{
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: "#FAF7F2",
            borderTopWidth: 1,
            borderTopColor: "#E8DED3",
            paddingTop: 8,
            paddingBottom: 8,
            height: 80,
            elevation: 0,
            shadowColor: "#4A3728",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
          },
          tabBarActiveTintColor: "#D4A574",
          tabBarInactiveTintColor: "#9B8B7F",
          tabBarItemStyle: {
            paddingVertical: 4,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon iconType="recommendation" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="scan"
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon iconType="scan" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="create"
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon iconType="create" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="wardrobe"
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon iconType="wardrobe" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon iconType="profile" focused={focused} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
};

export default _Layout;
