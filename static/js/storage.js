/* localStorage-backed history / favorites / aliases.
   Uses the same keys as the React `useLocalStorage` hook so existing data
   on this domain is preserved. */
window.LCC = window.LCC || {};

(function (LCC) {
  const KEY_HISTORY = 'commandHistory';
  const KEY_FAVS = 'commandFavorites';
  const KEY_ALIASES = 'commandAliases';
  const HISTORY_LIMIT = 50;

  function readArray(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_e) {
      return [];
    }
  }

  function writeArray(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_e) { /* quota or serialization */ }
    window.dispatchEvent(new CustomEvent('lcc:storage', { detail: { key } }));
  }

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'id-' + Math.random().toString(16).slice(2) + Date.now().toString(16);
  }

  LCC.history = {
    list() { return readArray(KEY_HISTORY); },
    add(command, type) {
      const cmd = (command || '').trim();
      if (!cmd) return;
      const list = readArray(KEY_HISTORY);
      if (list.length && list[0].command === cmd) return;
      list.unshift({ id: uuid(), command: cmd, type, timestamp: Date.now() });
      writeArray(KEY_HISTORY, list.slice(0, HISTORY_LIMIT));
    },
    clear() { writeArray(KEY_HISTORY, []); },
  };

  LCC.favorites = {
    list() { return readArray(KEY_FAVS); },
    has(command) { return readArray(KEY_FAVS).some(f => f.command === command); },
    toggle(command, type) {
      const cmd = (command || '').trim();
      if (!cmd) return;
      const list = readArray(KEY_FAVS);
      const filtered = list.filter(f => f.command !== cmd);
      if (filtered.length === list.length) {
        filtered.unshift({ id: uuid(), command: cmd, type, timestamp: Date.now() });
      }
      writeArray(KEY_FAVS, filtered);
    },
    remove(command) {
      writeArray(KEY_FAVS, readArray(KEY_FAVS).filter(f => f.command !== command));
    },
  };

  LCC.aliases = {
    list() { return readArray(KEY_ALIASES); },
    save(alias) {
      const list = readArray(KEY_ALIASES);
      if (alias.id) {
        const idx = list.findIndex(a => a.id === alias.id);
        if (idx >= 0) list[idx] = alias;
      } else {
        alias.id = uuid();
        list.unshift(alias);
      }
      writeArray(KEY_ALIASES, list);
      return alias;
    },
    remove(id) { writeArray(KEY_ALIASES, readArray(KEY_ALIASES).filter(a => a.id !== id)); },
  };

  LCC.uuid = uuid;
})(window.LCC);
