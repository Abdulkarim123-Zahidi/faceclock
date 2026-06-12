import { Image } from "expo-image";
import { Link, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { Screen } from "@/components/screen";
import { entriesRepo } from "@/data/entries-repo";
import { useTheme } from "@/hooks/use-theme";
import { formatDateHeader } from "@/lib/date";
import type { Entry } from "@/types/entry";

const COLUMNS = 3;
const GAP = 6;

type DayGroup = { date: string; items: Entry[] };

function groupByDay(entries: Entry[]): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const entry of entries) {
    const last = groups[groups.length - 1];
    if (last && last.date === entry.date) {
      last.items.push(entry);
    } else {
      groups.push({ date: entry.date, items: [entry] });
    }
  }
  return groups;
}

export default function GalleryScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  // null = still loading (avoids flashing the empty state on launch).
  const [entries, setEntries] = useState<Entry[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      entriesRepo.listAll().then((all) => {
        if (active) setEntries(all);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const groups = useMemo(() => groupByDay(entries ?? []), [entries]);
  const tileSize = (Math.min(width, 600) - 16 * 2 - GAP * (COLUMNS - 1)) / COLUMNS;

  if (entries === null) {
    return <Screen centered />;
  }

  if (entries.length === 0) {
    return (
      <Screen centered>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          No selfies yet
        </Text>
        <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
          Take your first selfie to start your timeline.
        </Text>
        <Link href="/camera" asChild>
          <Pressable
            style={StyleSheet.flatten([
              styles.primaryButton,
              { backgroundColor: colors.accent },
            ])}
          >
            <Text style={styles.primaryButtonLabel}>Open camera</Text>
          </Pressable>
        </Link>
      </Screen>
    );
  }

  return (
    <Screen style={styles.listScreen}>
      <FlatList
        data={groups}
        keyExtractor={(group) => group.date}
        contentContainerStyle={styles.listContent}
        renderItem={({ item: group }) => (
          <View style={styles.group}>
            <View style={styles.groupHeader}>
              <Text style={[styles.groupTitle, { color: colors.text }]}>
                {formatDateHeader(group.date)}
              </Text>
              {group.items.length > 1 && (
                <Text
                  style={[styles.groupCount, { color: colors.textSecondary }]}
                >
                  {group.items.length} photos
                </Text>
              )}
            </View>
            <View style={styles.tiles}>
              {group.items.map((entry) => (
                <Pressable
                  key={entry.id}
                  onPress={() => router.push(`/detail/${entry.id}`)}
                >
                  <Image
                    source={{ uri: entry.thumbUri ?? entry.imageUri }}
                    style={[
                      styles.tile,
                      { width: tileSize, height: tileSize },
                      { backgroundColor: colors.surface },
                    ]}
                    contentFit="cover"
                  />
                </Pressable>
              ))}
            </View>
          </View>
        )}
      />
      <Link href="/camera" asChild>
        <Pressable
          style={StyleSheet.flatten([
            styles.fab,
            { backgroundColor: colors.accent },
          ])}
        >
          <Text style={styles.fabLabel}>+</Text>
        </Pressable>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  listScreen: { padding: 0 },
  listContent: { padding: 16, paddingBottom: 96 },
  group: { marginBottom: 20 },
  groupHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  groupTitle: { fontSize: 16, fontWeight: "600" },
  groupCount: { fontSize: 13 },
  tiles: { flexDirection: "row", flexWrap: "wrap", gap: GAP },
  tile: { borderRadius: 10 },
  fab: {
    position: "absolute",
    bottom: 24,
    alignSelf: "center",
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  fabLabel: { color: "#FFF", fontSize: 32, lineHeight: 36 },
  emptyTitle: { fontSize: 22, fontWeight: "600", marginBottom: 8 },
  emptyHint: { fontSize: 15, textAlign: "center", marginBottom: 16 },
  primaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  primaryButtonLabel: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
});
