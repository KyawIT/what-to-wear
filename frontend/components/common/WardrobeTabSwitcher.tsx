import React from "react";
import { Text as RNText, View } from "react-native";
import { Pressable } from "@/components/ui/pressable";
import { styles } from "./WardrobeTabSwitcher.styles";

type TabType = "items" | "outfits";

type WardrobeTabSwitcherProps = {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
};

export default function WardrobeTabSwitcher({ activeTab, onChangeTab }: WardrobeTabSwitcherProps) {
  return (
    <View style={styles.tabContainer}>
      <View style={styles.tabBar}>
        <Pressable onPress={() => onChangeTab("items")} style={[styles.tab, activeTab === "items" && styles.tabActive]}>
          <RNText style={[styles.tabText, activeTab === "items" && styles.tabTextActive]}>Items</RNText>
        </Pressable>
        <Pressable onPress={() => onChangeTab("outfits")} style={[styles.tab, activeTab === "outfits" && styles.tabActive]}>
          <RNText style={[styles.tabText, activeTab === "outfits" && styles.tabTextActive]}>Outfits</RNText>
        </Pressable>
      </View>
    </View>
  );
}

