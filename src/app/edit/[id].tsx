import Slider from "@react-native-community/slider";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { CropOverlay } from "@/components/crop-overlay";
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
import {
  cropCenterSquare,
  cropRect,
  flip,
  getImageSize,
  rotate,
  type CropRect,
} from "@/image/geometry";
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
  const [cropMode, setCropMode] = useState(false);
  const [imageDims, setImageDims] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const cropRectRef = useRef<CropRect | null>(null);

  useEffect(() => {
    entriesRepo.getById(entryId).then((found) => {
      if (found) {
        setEntry(found);
        setWorkingUri(found.imageUri);
      }
    });
  }, [entryId]);

  // The crop overlay needs pixel dimensions to map screen <-> image
  // coordinates; re-probe after every geometry change (rotate swaps them).
  useEffect(() => {
    if (!workingUri) return;
    let active = true;
    getImageSize(workingUri).then((dims) => {
      if (active) setImageDims(dims);
    });
    return () => {
      active = false;
    };
  }, [workingUri]);

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

  async function applyCrop() {
    const selection = cropRectRef.current;
    cropRectRef.current = null;
    setCropMode(false);
    if (selection) {
      await applyGeometry((u) => cropRect(u, selection));
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
        {cropMode && imageDims && (
          // Keyed by URI so the selection resets if the image changes.
          <CropOverlay
            key={workingUri}
            imageWidth={imageDims.width}
            imageHeight={imageDims.height}
            onRectChange={(r) => {
              cropRectRef.current = r;
            }}
          />
        )}
      </View>

      {cropMode ? (
        <>
          <Text style={[styles.cropHint, { color: colors.textSecondary }]}>
            Drag the corners or move the frame, then apply.
          </Text>
          <View style={styles.actionButtons}>
            <Pressable
              style={[styles.action, { backgroundColor: colors.surface }]}
              onPress={() => {
                cropRectRef.current = null;
                setCropMode(false);
              }}
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
                busy && styles.dimmed,
              ]}
              onPress={applyCrop}
              disabled={busy}
            >
              <Text style={[styles.actionLabel, { color: "#FFF" }]}>
                Apply crop
              </Text>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          <View style={styles.toolRow}>
            <Tool
              label="⟲"
              onPress={() => applyGeometry((u) => rotate(u, -90))}
            />
            <Tool
              label="⟳"
              onPress={() => applyGeometry((u) => rotate(u, 90))}
            />
            <Tool
              label="Flip H"
              onPress={() => applyGeometry((u) => flip(u, "horizontal"))}
            />
            <Tool
              label="Flip V"
              onPress={() => applyGeometry((u) => flip(u, "vertical"))}
            />
            <Tool
              label="Crop"
              onPress={() => imageDims && !busy && setCropMode(true)}
            />
            <Tool
              label="Square"
              onPress={() => applyGeometry(cropCenterSquare)}
            />
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
        </>
      )}
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
  toolRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  cropHint: { fontSize: 13, textAlign: "center" },
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
