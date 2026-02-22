import React from "react";
import { Text, View } from "react-native";
import { styles } from "./InfoRow.styles";

type InfoRowProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  isLast?: boolean;
};

export default function InfoRow({ icon, label, value, isLast }: InfoRowProps) {
  return (
    <View>
      <View style={styles.infoRow}>
        <View style={styles.infoIcon}>{icon}</View>
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>{label}</Text>
          <Text style={styles.infoValue}>{value}</Text>
        </View>
      </View>
      {!isLast && <View style={styles.rowDivider} />}
    </View>
  );
}

