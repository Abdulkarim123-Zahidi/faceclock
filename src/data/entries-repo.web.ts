import { renderThumbnail } from "@/data/thumbnails";
import type { EntriesRepo, NewEntryInput } from "@/data/types";
import type { Entry } from "@/types/entry";

// Web implementation: expo-file-system does not exist in browsers and
// expo-sqlite's web support is alpha, so entries (metadata + image Blobs)
// live in a single IndexedDB store instead.

const DB_NAME = "faceclock";
const STORE = "entries";

type EntryRecord = {
  id?: number;
  date: string;
  imageBlob: Blob;
  thumbBlob: Blob | null;
  originalBlob: Blob | null;
  note: string | null;
  mood: string | null;
  createdAt: number;
  editedAt: number | null;
};

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, {
        keyPath: "id",
        autoIncrement: true,
      });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function asPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function store(mode: IDBTransactionMode): Promise<IDBObjectStore> {
  const db = await getDb();
  return db.transaction(STORE, mode).objectStore(STORE);
}

// Blobs need session-scoped object URLs for <Image>. Cache them per entry
// so repeated listAll() calls don't leak a new URL every render.
const urlCache = new Map<number, { image: string; thumb: string | null }>();

function materialize(record: EntryRecord): Entry {
  const id = record.id!;
  let urls = urlCache.get(id);
  if (!urls) {
    urls = {
      image: URL.createObjectURL(record.imageBlob),
      thumb: record.thumbBlob ? URL.createObjectURL(record.thumbBlob) : null,
    };
    urlCache.set(id, urls);
  }
  return {
    id,
    date: record.date,
    imageUri: urls.image,
    thumbUri: urls.thumb,
    originalUri: null,
    note: record.note,
    mood: record.mood,
    createdAt: record.createdAt,
    editedAt: record.editedAt,
  };
}

async function uriToBlob(uri: string): Promise<Blob> {
  // Works for data:, blob:, and http(s): URIs alike.
  const response = await fetch(uri);
  return response.blob();
}

export const entriesRepo: EntriesRepo = {
  async create(input: NewEntryInput): Promise<Entry> {
    const imageBlob = await uriToBlob(input.sourceUri);
    const thumbBlob = await uriToBlob(await renderThumbnail(input.sourceUri));

    const record: EntryRecord = {
      date: input.date,
      imageBlob,
      thumbBlob,
      originalBlob: null,
      note: input.note ?? null,
      mood: input.mood ?? null,
      createdAt: input.createdAt,
      editedAt: null,
    };

    const s = await store("readwrite");
    const id = (await asPromise(s.add(record))) as number;
    return materialize({ ...record, id });
  },

  async listAll(): Promise<Entry[]> {
    const s = await store("readonly");
    const records = (await asPromise(s.getAll())) as EntryRecord[];
    records.sort((a, b) => b.createdAt - a.createdAt);
    return records.map(materialize);
  },

  async getById(id: number): Promise<Entry | null> {
    const s = await store("readonly");
    const record = (await asPromise(s.get(id))) as EntryRecord | undefined;
    return record ? materialize(record) : null;
  },

  async remove(id: number): Promise<void> {
    const s = await store("readwrite");
    await asPromise(s.delete(id));
    const urls = urlCache.get(id);
    if (urls) {
      URL.revokeObjectURL(urls.image);
      if (urls.thumb) URL.revokeObjectURL(urls.thumb);
      urlCache.delete(id);
    }
  },
};
