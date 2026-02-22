import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "@/components/navigation/app-header";
import { Center } from "@/components/ui/center";
import { Spinner } from "@/components/ui/spinner";
import { styles } from "./EditOutfitLoadingState.styles";

type EditOutfitLoadingStateProps = {
  onBack: () => void;
};

export default function EditOutfitLoadingState({ onBack }: EditOutfitLoadingStateProps) {
  return (
    <SafeAreaView className="flex-1 bg-background-50" edges={["top"]}>
      <AppHeader title="Edit Outfit" titleStyle={styles.headerTitle} onBack={onBack} />
      <Center className="flex-1">
        <Spinner size="large" className="text-primary-500" />
      </Center>
    </SafeAreaView>
  );
}
