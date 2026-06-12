import Slider from "@react-native-community/slider";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { EditPreview } from "@/components/edit-preview";
import { Screen } from "@/components/screen";
import { entriesRepo } from "@/data/entries-repo";
import { useTheme } from "@/hooks/use-theme";
import { bakeColorMatrix } from "@/image/bake";
import {
  buildColorMatrix,
  isNeutral,
  NEUTRAL_ADJUSTMENTS,
  type EditAdjustments,
  type FilterPreset,
} from "@/image/color-matrix";
import { cropCenterSquare, flip, rotate } from "@/image/geometry";
import { confirmAsync } from "@/lib/confirm";
import type { Entry } from "@/types/entry";

const PRESETS: { key: FilterPreset; label: string }[] = [
  { key: "none", label: "None" },
  { key: "bw", label: "B&W" },
  { key: "warm", label: "Warm" },
  { key: "cool", label: "Cool" },
];

export default function EditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const entryId = Number(id);
  const { colors } = useTheme();
  const router = useRouter();

  const [entry, setEntry] = useState<Entry | null>(null);
  // The geometry-transformed image the color matrix previews on top of.
  const [workingUri, setWorkingUri] = useState<string | null>(null);
  const [adjustments, setAdjustments] =
    useState<EditAdjustments>(NEUTRAL_ADJUSTMENTS);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    entriesRepo.getById(entryId).then((found) => {
      if (found) {
        setEntry(found);
        setWorkingUri(found.imageUri);
      }
    });
  }, [entryId]);

  const matrix = useMemo(() => buildColorMatrix(adjustments), [adjustments]);

  if (!entry || !workingUri) {
    return <Screen centered />;
  }

  const geometryChanged = workingUri !== entry.imageUri;
  const dirty = geometryChanged || !isNeutral(adjustments);

  async function applyGeometry(op: (uri: string) => Promise<string>) {
    if (busy || !workingUri) return;
    setBusy(true);
    try {
      setWorkingUri(await op(workingUri));
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (busy || !workingUri) return;
    if (!dirty) {
      router.back();
      return;
    }
    setBusy(true);
    try {
      const finalUri = isNeutral(adjustments)
        ? workingUri
        : await bakeColorMatrix(workingUri, matrix);
      await entriesRepo.applyEdit(entryId, finalUri);
      router.back();
    } finally {
      setBusy(false);
    }
  }

  async function revert() {
    const ok = await confirmAsync(
      "Revert to original?",
      "All edits to this photo will be discarded.",
      "Revert",
    );
    if (!ok) return;
    await entriesRepo.revertEdit(entryId);
    router.back();
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.previewArea}>
        <EditPreview uri={workingUri} matrix={matrix} />
      </View>

      <View style={styles.toolRow}>
        <Tool label="⟲" onPress={() => applyGeometry((u) => rotate(u, -90))} />
        <Tool label="⟳" onPress={() => applyGeometry((u) => rotate(u, 90))} />
        <Tool
          label="Flip H"
          onPress={() => applyGeometry((u) => flip(u, "horizontal"))}
        />
        <Tool
          label="Flip V"
          onPress={() => applyGeometry((u) => flip(u, "vertical"))}
        />
        <Tool label="Square" onPress={() => applyGeometry(cropCenterSquare)} />
      </View>

      <View style={styles.sliderRow}>
        <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>
          Brightness
        </Text>
        <Slider
          style={styles.slider}
          minimumValue={-50}
          maximumValue={50}
          step={5}
          value={adjustments.brightness}
          minimumTrackTintColor={colors.accent}
          onValueChange={(brightness) =>
            setAdjustments((a) => ({ ...a, brightness }))
          }
        />
      </View>
      <View style={styles.sliderRow}>
        <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>
          Contrast
        </Text>
        <Slider
          style={styles.slider}
          minimumValue={-50}
          maximumValue={50}
          step={5}
          value={adjustments.contrast}
          minimumTrackTintColor={colors.accent}
          onValueChange={(contrast) =>
            setAdjustments((a) => ({ ...a, contrast }))
          }
        />
      </View>

      <View style={styles.presetRow}>
        {PRESETS.map((p) => (
          <Pressable
            key={p.key}
            onPress={() => setAdjustments((a) => ({ ...a, preset: p.key }))}
            style={[
              styles.presetChip,
              { backgroundColor: colors.surface },
              adjustments.preset === p.key && {
                backgroundColor: colors.accent,
              },
            ]}
          >
            <Text
              style={[
                styles.presetLabel,
                {
                  color:
                    adjustments.preset === p.key ? "#FFF" : colors.text,
                },
              ]}
            >
              {p.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.actions}>
        {entry.editedAt !== null && (
          <Pressable onPress={revert} disabled={busy} hitSlop={8}>
            <Text style={[styles.revertLabel, { color: colors.danger }]}>
              Revert to original
            </Text>
          </Pressable>
        )}
        <View style={styles.actionButtons}>
          <Pressable
            style={[styles.action, { backgroundColor: colors.surface }]}
            onPress={() => router.back()}
            disabled={busy}
          >
            <Text style={[styles.actionLabel, { color: colors.text }]}>
              Cancel
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.action,
              { backgroundColor: colors.accent },
              (busy || !dirty) && styles.dimmed,
            ]}
            onPress={save}
            disabled={busy || !dirty}
          >
            <Text style={[styles.actionLabel, { color: "#FFF" }]}>
              {busy ? "Working…" : "Save"}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function Tool({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tool, { backgroundColor: colors.surface }]}
    >
      <Text style={[styles.toolLabel, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 16, gap: 12 },
  previewArea: { flex: 1, borderRadius: 12, overflow: "hidden" },
  toolRow: { flexDirection: "row", gap: 8, justifyContent: "center" },
  tool: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  toolLabel: { fontSize: 15, fontWeight: "600" },
  sliderRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sliderLabel: { fontSize: 13, width: 76 },
  slider: { flex: 1, height: 32 },
  presetRow: { flexDirection: "row", gap: 8, justifyContent: "center" },
  presetChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  presetLabel: { fontSize: 14, fontWeight: "600" },
  actions: { gap: 12 },
  revertLabel: { fontSize: 14, fontWeight: "600", textAlign: "center" },
  actionButtons: { flexDirection: "row", gap: 12 },
  action: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  actionLabel: { fontSize: 15, fontWeight: "600" },
  dimmed: { opacity: 0.5 },
});
