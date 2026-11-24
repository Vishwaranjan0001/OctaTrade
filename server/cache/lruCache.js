// LRU (Least Recently Used) cache: when full, remove the entry used longest ago.
// A Map keeps keys in insertion order, so the FIRST key is the least recently used.
// Using a key = delete it and set it again, which moves it to the end.
export class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.entries = new Map();
  }

  get(key) {
    const entry = this.entries.get(key);

    if (!entry || entry.expiresAt < Date.now()) {
      this.entries.delete(key);
      return undefined;
    }

    this.entries.delete(key);
    this.entries.set(key, entry);

    return entry.value;
  }

  set(key, value, ttlMs) {
    this.entries.delete(key);

    if (this.entries.size >= this.capacity) {
      const oldestKey = this.entries.keys().next().value;
      this.entries.delete(oldestKey);
    }

    this.entries.set(key, {
      value: value,
      expiresAt: Date.now() + ttlMs
    });
  }
}
