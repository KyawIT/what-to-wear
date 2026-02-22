import React from "react";
import { Text, View } from "react-native";
import { styles } from "./FeatureItem.styles";

type FeatureItemProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  isLast?: boolean;
};

export default function FeatureItem({ icon, title, description, isLast }: FeatureItemProps) {
  return (
    <View>
      <View style={styles.featureRow}>
        <View style={styles.featureIcon}>{icon}</View>
        <View style={styles.featureContent}>
          <Text style={styles.featureTitle}>{title}</Text>
          <Text style={styles.featureDesc}>{description}</Text>
        </View>
      </View>
      {!isLast && <View style={styles.featureDivider} />}
    </View>
  );
}

