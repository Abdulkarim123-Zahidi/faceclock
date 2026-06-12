import { Image } from "expo-image";
import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { clearPendingPhoto, getPendingPhoto } from "@/capture/pending-photo";
import { entriesRepo } from "@/data/entries-repo";
import { useTheme } from "@/hooks/use-theme";
import { toLocalDateString } from "@/lib/date";

export default function PreviewScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const photo = getPendingPhoto();

  // Deep-reload or direct URL visit: nothing to preview, go capture.
  if (!photo) {
    return <Redirect href="/camera" />;
  }

  function retake() {
    clearPendingPhoto();
    router.back();
  }

  async function persist() {
    if (!photo) return null;
    const now = new Date();
    const entry = await entriesRepo.create({
      sourceUri: photo.uri,
      date: toLocalDateString(now),
      createdAt: now.getTime(),
    });
    clearPendingPhoto();
    return entry;
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      if (await persist()) router.dismissTo("/");
    } finally {
      setSaving(false);
    }
  }

  // "Edit" saves first (the editor works on stored entries), then jumps
  // straight into it; edits are non-destructive so nothing is lost.
  async function saveAndEdit() {
    if (saving) return;
    setSaving(true);
    try {
      const entry = await persist();
      if (entry) router.replace(`/edit/${entry.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.root}>
      <Image
        source={{ uri: photo.uri }}
        style={styles.photo}
        contentFit="contain"
      />
      <View style={styles.actions}>
        <Pressable style={styles.secondary} onPress={retake} disabled={saving}>
          <Text style={styles.secondaryLabel}>Retake</Text>
        </Pressable>
        <Pressable
          style={styles.secondary}
          onPress={saveAndEdit}
          disabled={saving}
        >
          <Text style={styles.secondaryLabel}>Edit</Text>
        </Pressable>
        <Pressable
          style={[
            styles.primary,
            { backgroundColor: colors.accent },
            saving && styles.disabled,
          ]}
          onPress={save}
          disabled={saving}
        >
          <Text style={styles.primaryLabel}>
            {saving ? "Saving…" : "Save"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  photo: { flex: 1 },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingVertical: 20,
    backgroundColor: "#000",
  },
  primary: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
  },
  primaryLabel: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  secondary: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  secondaryLabel: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  disabled: { opacity: 0.4 },
});
