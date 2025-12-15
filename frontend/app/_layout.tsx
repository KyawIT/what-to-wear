import { Stack } from "expo-router";

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '@/global.css';
import {authClient} from "@/lib/auth-client";
import {SafeAreaProvider} from "react-native-safe-area-context";
import {StatusBar} from "expo-status-bar";

export default function RootLayout() {
  const {data: isAuthenticated} = authClient.useSession();
  return (
      <SafeAreaProvider>
          <GluestackUIProvider>
              <StatusBar hidden={true}/>
              <Stack screenOptions={{headerShown: false}}/>
          </GluestackUIProvider>
      </SafeAreaProvider>
  );
}
