import {Text, View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {Image} from "expo-image";

export default function Index() {
    return (
        <SafeAreaView>
            <View className={"h-screen-safe justify-center items-center bg-primary-0"}>
                <View className="rounded-2xl items-center justify-center">
                    <Image
                        source={require("../assets/logo/logo-lg.png")}
                        style={{ width: 120, height: 120 }}
                        contentFit="contain"
                    />
                </View>
                <Text className={"text-2xl"}>
                    <Text className={"text-indigo-500 font-extrabold"}>What</Text>
                    <Text className={"text-red-500 font-extrabold"}>To</Text>
                    <Text className={"text-indigo-500 font-extrabold"}>Wear</Text>
                </Text>
                <Text className={"text-xl font-bold"}>Scan it. Style it. Wear it.</Text>
                <Text className={"text-lg text- p-5"}>
                    Digitize your wardrobe, create outfits, and get fresh AI inspiration anytime.
                    Your clothes — finally organized.
                </Text>
            </View>
        </SafeAreaView>
    );
}
