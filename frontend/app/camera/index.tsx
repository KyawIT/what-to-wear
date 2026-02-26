import React, { useRef, useState } from "react";
import { View, Pressable } from "react-native";
import { CameraView, useCameraPermissions, CameraType } from "expo-camera";
import { router } from "expo-router";
import { X, Zap, ZapOff, RefreshCw } from "lucide-react-native";

import ImagePermissionGate from "@/components/common/ImagePermissionGate";
import { styles } from "@/styles/screens/camera/index.styles";

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [flash, setFlash] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const toggleFlash = () => setFlash((prev) => !prev);
  const toggleFacing = () =>
    setFacing((prev) => (prev === "back" ? "front" : "back"));

  const handleCapture = async () => {
    if (!cameraRef.current) return;

    const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
    if (!photo) return;

    router.replace({
      pathname: "/preview",
      params: {
        id: `camera_${Date.now()}`,
        uri: photo.uri,
      },
    });
  };

  return (
    <View style={styles.container}>
      <ImagePermissionGate
        permission={permission}
        requestPermission={requestPermission}
        title="Allow access to your camera"
        description="We need camera access so you can take photos of your clothing items."
        ctaAllowText="Allow Camera Access"
        ctaSettingsText="Open Settings"
      >
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          flash={flash ? "on" : "off"}
        />

        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable style={styles.iconButton} onPress={() => router.back()}>
            <X size={22} color="#FFFFFF" strokeWidth={2} />
          </Pressable>

          <Pressable style={styles.iconButton} onPress={toggleFlash}>
            {flash ? (
              <Zap size={22} color="#FFFFFF" strokeWidth={2} />
            ) : (
              <ZapOff size={22} color="#FFFFFF" strokeWidth={2} />
            )}
          </Pressable>
        </View>

        {/* Bottom bar */}
        <View style={styles.bottomBar}>
          <Pressable style={styles.iconButton} onPress={toggleFacing}>
            <RefreshCw size={22} color="#FFFFFF" strokeWidth={2} />
          </Pressable>

          <Pressable style={styles.captureOuter} onPress={handleCapture}>
            <View style={styles.captureInner} />
          </Pressable>

          <View style={styles.spacer} />
        </View>
      </ImagePermissionGate>
    </View>
  );
}
