// LFU (Least Frequently Used) cache: when full, remove the entry used the fewest times.
// Each entry counts its uses. The cache is small (50 entries), so finding the
// least used entry by looking at all of them is fast enough.
export class LFUCache {
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

    entry.uses = entry.uses + 1;

    return entry.value;
  }

  set(key, value, ttlMs) {
    const old = this.entries.get(key);

    if (!old && this.entries.size >= this.capacity) {
      let leastUsedKey = null;
      let fewestUses = Infinity;

      for (const [entryKey, entry] of this.entries) {
        if (entry.uses < fewestUses) {
          fewestUses = entry.uses;
          leastUsedKey = entryKey;
        }
      }

      this.entries.delete(leastUsedKey);
    }

    this.entries.set(key, {
      value: value,
      expiresAt: Date.now() + ttlMs,
      uses: old ? old.uses : 0
    });
  }
}
