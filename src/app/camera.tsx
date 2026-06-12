import {
  CameraView,
  useCameraPermissions,
  type CameraType,
} from "expo-camera";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { setPendingPhoto } from "@/capture/pending-photo";
import { Screen } from "@/components/screen";
import { useTheme } from "@/hooks/use-theme";

const COUNTDOWN_SECONDS = 3;

export default function CameraScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [facing, setFacing] = useState<CameraType>("front");
  const [ready, setReady] = useState(false);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [capturing, setCapturing] = useState(false);

  // Tick the countdown once per second; capture when it runs out.
  useEffect(() => {
    if (countdown === null) return;
    const t = setTimeout(() => {
      if (countdown <= 1) {
        setCountdown(null);
        void capture();
      } else {
        setCountdown(countdown - 1);
      }
    }, 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  async function capture() {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync();
      if (photo) {
        setPendingPhoto(photo);
        router.push("/preview");
      }
    } finally {
      setCapturing(false);
    }
  }

  function onShutterPress() {
    if (countdown !== null) {
      setCountdown(null); // tap again cancels a running countdown
      return;
    }
    if (timerEnabled) {
      setCountdown(COUNTDOWN_SECONDS);
    } else {
      void capture();
    }
  }

  if (!permission) {
    return <Screen centered />;
  }

  if (!permission.granted) {
    const blocked = !permission.canAskAgain && Platform.OS !== "web";
    return (
      <Screen centered>
        <Text style={[styles.rationale, { color: colors.text }]}>
          FaceClock needs the camera to take your daily selfie. Photos never
          leave this device.
        </Text>
        {blocked ? (
          <Pressable
            style={[styles.button, { backgroundColor: colors.accent }]}
            onPress={() => Linking.openSettings()}
          >
            <Text style={styles.buttonLabel}>Open settings</Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.button, { backgroundColor: colors.accent }]}
            onPress={requestPermission}
          >
            <Text style={styles.buttonLabel}>Allow camera</Text>
          </Pressable>
        )}
      </Screen>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        onCameraReady={() => setReady(true)}
      />

      {countdown !== null && (
        <View pointerEvents="none" style={styles.countdownOverlay}>
          <Text style={styles.countdownText}>{countdown}</Text>
        </View>
      )}

      <View style={styles.controls}>
        <Pressable
          style={[styles.sideButton, timerEnabled && styles.sideButtonActive]}
          onPress={() => setTimerEnabled((v) => !v)}
        >
          <Text style={styles.sideButtonLabel}>
            {timerEnabled ? "3s ✓" : "3s"}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.shutter, (!ready || capturing) && styles.disabled]}
          disabled={!ready || capturing}
          onPress={onShutterPress}
        >
          <View style={styles.shutterInner} />
        </Pressable>

        <Pressable
          style={styles.sideButton}
          onPress={() => setFacing((f) => (f === "front" ? "back" : "front"))}
        >
          <Text style={styles.sideButtonLabel}>Flip</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  countdownOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  countdownText: {
    fontSize: 120,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
  },
  controls: {
    position: "absolute",
    bottom: 32,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
  },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFF",
  },
  disabled: { opacity: 0.4 },
  sideButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sideButtonActive: { backgroundColor: "rgba(124,58,237,0.8)" },
  sideButtonLabel: { color: "#FFF", fontSize: 15, fontWeight: "600" },
  rationale: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
    maxWidth: 320,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  buttonLabel: { color: "#FFF", fontSize: 16, fontWeight: "600" },
});
