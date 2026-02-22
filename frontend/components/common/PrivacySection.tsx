import React from "react";
import { Text, View } from "react-native";
import { styles } from "./PrivacySection.styles";

type PrivacySectionProps = {
  icon: React.ReactNode;
  title: string;
  items: string[];
};

export default function PrivacySection({ icon, title, items }: PrivacySectionProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTitleRow}>
        <View style={styles.iconCircle}>{icon}</View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>

      <View style={styles.cardBody}>
        {items.map((item, index) => (
          <View key={index} style={styles.bulletRow}>
            <View style={styles.bullet} />
            <Text style={styles.bulletText}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

