import { Image } from "expo-image";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Screen } from "@/components/screen";
import { entriesRepo } from "@/data/entries-repo";
import { useTheme } from "@/hooks/use-theme";
import { confirmAsync } from "@/lib/confirm";
import { formatDateHeader } from "@/lib/date";
import type { Entry } from "@/types/entry";

const MOODS = ["😄", "🙂", "😐", "😔", "😤"];

export default function DetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const entryId = Number(id);
  const { colors } = useTheme();
  const router = useRouter();

  const [entry, setEntry] = useState<Entry | null>(null);
  const [missing, setMissing] = useState(false);
  const [note, setNote] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [savingNote, setSavingNote] = useState(false);

  // Refetch on focus so an edit made in /edit/[id] shows up on return.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      entriesRepo.getById(entryId).then((found) => {
        if (!active) return;
        if (!found) {
          setMissing(true);
          return;
        }
        setEntry(found);
        setNote(found.note ?? "");
        setMood(found.mood);
      });
      return () => {
        active = false;
      };
    }, [entryId]),
  );

  if (missing) {
    return (
      <Screen centered>
        <Text style={{ color: colors.textSecondary }}>
          This entry no longer exists.
        </Text>
      </Screen>
    );
  }

  if (!entry) {
    return <Screen centered />;
  }

  const noteDirty = note !== (entry.note ?? "") || mood !== entry.mood;
  const takenAt = new Date(entry.createdAt);

  async function saveNote() {
    if (savingNote) return;
    setSavingNote(true);
    try {
      const trimmed = note.trim();
      await entriesRepo.updateNote(entryId, trimmed || null, mood);
      setEntry((e) =>
        e ? { ...e, note: trimmed || null, mood } : e,
      );
      setNote(trimmed);
    } finally {
      setSavingNote(false);
    }
  }

  async function deleteEntry() {
    const ok = await confirmAsync(
      "Delete this selfie?",
      "The photo only exists inside FaceClock — there is no copy and no way to recover it.",
      "Delete",
    );
    if (!ok) return;
    await entriesRepo.remove(entryId);
    router.back();
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={[styles.flex, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
      >
        <Image
          source={{ uri: entry.imageUri }}
          style={[styles.photo, { backgroundColor: colors.surface }]}
          contentFit="contain"
        />

        <View style={styles.meta}>
          <Text style={[styles.date, { color: colors.text }]}>
            {formatDateHeader(entry.date)}
          </Text>
          <Text style={[styles.time, { color: colors.textSecondary }]}>
            {takenAt.toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            })}
            {entry.editedAt ? "  ·  edited" : ""}
          </Text>
        </View>

        <View style={styles.moodRow}>
          {MOODS.map((m) => (
            <Pressable
              key={m}
              onPress={() => setMood(mood === m ? null : m)}
              style={[
                styles.moodChip,
                { backgroundColor: colors.surface },
                mood === m && { backgroundColor: colors.accent },
              ]}
            >
              <Text style={styles.moodEmoji}>{m}</Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          style={[
            styles.noteInput,
            {
              color: colors.text,
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
          placeholder="Add a note about today…"
          placeholderTextColor={colors.textSecondary}
          value={note}
          onChangeText={setNote}
          multiline
        />

        {noteDirty && (
          <Pressable
            style={[styles.saveNote, { backgroundColor: colors.accent }]}
            onPress={saveNote}
            disabled={savingNote}
          >
            <Text style={styles.saveNoteLabel}>
              {savingNote ? "Saving…" : "Save note"}
            </Text>
          </Pressable>
        )}

        <View style={styles.actions}>
          <Pressable
            style={[styles.action, { backgroundColor: colors.surface }]}
            onPress={() => router.push(`/edit/${entryId}`)}
          >
            <Text style={[styles.actionLabel, { color: colors.text }]}>
              Edit photo
            </Text>
          </Pressable>
          <Pressable
            style={[styles.action, { backgroundColor: colors.surface }]}
            onPress={deleteEntry}
          >
            <Text style={[styles.actionLabel, { color: colors.danger }]}>
              Delete
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 48 },
  photo: { width: "100%", aspectRatio: 3 / 4, borderRadius: 12 },
  meta: { marginTop: 16 },
  date: { fontSize: 18, fontWeight: "600" },
  time: { fontSize: 14, marginTop: 2 },
  moodRow: { flexDirection: "row", gap: 8, marginTop: 16 },
  moodChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  moodEmoji: { fontSize: 22 },
  noteInput: {
    marginTop: 16,
    minHeight: 80,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    fontSize: 15,
    textAlignVertical: "top",
  },
  saveNote: {
    marginTop: 12,
    alignSelf: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  saveNoteLabel: { color: "#FFF", fontSize: 15, fontWeight: "600" },
  actions: { flexDirection: "row", gap: 12, marginTop: 24 },
  action: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  actionLabel: { fontSize: 15, fontWeight: "600" },
});
