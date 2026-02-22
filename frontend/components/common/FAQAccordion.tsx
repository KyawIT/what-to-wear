import React, { useState } from "react";
import { Text, View } from "react-native";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import { Pressable } from "@/components/ui/pressable";
import { colors } from "@/lib/theme";
import { styles } from "./FAQAccordion.styles";

export type FAQItem = {
  question: string;
  answer: string;
  icon: React.ReactNode;
};

type FAQAccordionProps = {
  item: FAQItem;
  isLast: boolean;
};

export default function FAQAccordion({ item, isLast }: FAQAccordionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View>
      <Pressable onPress={() => setExpanded(!expanded)} style={styles.faqRow}>
        <View style={styles.faqIcon}>{item.icon}</View>
        <Text style={styles.faqQuestion}>{item.question}</Text>
        {expanded ? (
          <ChevronUp size={18} color={colors.textMuted} />
        ) : (
          <ChevronDown size={18} color={colors.textMuted} />
        )}
      </Pressable>

      {expanded && (
        <View style={styles.faqAnswer}>
          <Text style={styles.faqAnswerText}>{item.answer}</Text>
        </View>
      )}

      {!isLast && <View style={styles.faqDivider} />}
    </View>
  );
}

