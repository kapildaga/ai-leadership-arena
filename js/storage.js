/* AI Leadership Arena — storage, profiles and session management.
 * All persistence goes through StorageAdapter so a server backend can replace
 * localStorage later without touching the rest of the app. */
window.Arena = window.Arena || {};

(function (A) {
  const PREFIX = "ala:";
  const SCHEMA_VERSION = 2;
  const SESSION_TTL_MIN = 30; // idle minutes before a PIN-protected profile locks

  /* ---------- Storage adapter (swap for a REST adapter later) ---------- */
  const LocalAdapter = {
    get(key) {
      try { const raw = localStorage.getItem(PREFIX + key); return raw ? JSON.parse(raw) : null; }
      catch (e) { console.warn("Corrupt storage entry", key, e); return null; }
    },
    put(key, value) {
      try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; }
      catch (e) { console.error("Storage write failed", key, e); A.ui && A.ui.toast("Could not save progress: browser storage is full or blocked"); return false; }
    },
    remove(key) { localStorage.removeItem(PREFIX + key); },
    available() {
      try { localStorage.setItem(PREFIX + "_t", "1"); localStorage.removeItem(PREFIX + "_t"); return true; } catch (e) { return false; }
    }
  };
  let adapter = LocalAdapter;

  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const today = () => new Date().toISOString().slice(0, 10);

  async function hashPin(pin, salt) {
    const data = new TextEncoder().encode(salt + ":" + pin);
    if (window.crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest("SHA-256", data);
      return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
    }
    // Fallback (very old browsers / insecure contexts): simple non-cryptographic hash
    let h = 0; for (const b of data) h = (h * 31 + b) | 0; return "weak-" + h;
  }

  function blankProfileData(id) {
    const mastery = {}, tracks = {};
    (A.content ? A.content.tracks : []).forEach(t => {
      mastery[t.id] = 20;
      tracks[t.id] = { currentTier: 1, maxTier: 1, wins: 0, losses: 0, demoted: false, seen: {} };
    });
    return {
      schemaVersion: SCHEMA_VERSION, id,
      xp: 0, mastery, tracks,
      calibrated: false,
      attempts: 0,
      streak: { count: 0, lastDay: null, best: 0 },
      history: [],            // {ts, scenarioId, track, tier, score, xp, type}
      badges: [],             // badge ids
      reviewQueue: [],        // {scenarioId, dueAt (attempt #), stage}
      explored: [],           // expression keys "track:idx"
      drillsCompleted: 0,
      lastDrillDay: null,
      inProgress: null,       // resumable scenario / drill snapshot
      events: []              // promotion / demotion log
    };
  }

  /* Migrations keep old progress valid when content or schema changes. */
  function migrate(data) {
    if (!data) return data;
    if (!data.schemaVersion || data.schemaVersion < 2) {
      data.events = data.events || [];
      data.lastDrillDay = data.lastDrillDay || null;
      data.schemaVersion = 2;
    }
    // Ensure any newly added track exists in old profiles
    (A.content ? A.content.tracks : []).forEach(t => {
      if (data.mastery[t.id] == null) data.mastery[t.id] = 20;
      if (!data.tracks[t.id]) data.tracks[t.id] = { currentTier: 1, maxTier: 1, wins: 0, losses: 0, demoted: false, seen: {} };
    });
    return data;
  }

  const Store = {
    SCHEMA_VERSION,
    setAdapter(a) { adapter = a; },
    available: () => adapter.available(),

    /* ---------- Profiles ---------- */
    listProfiles() { return adapter.get("profiles") || []; },
    saveProfiles(list) { adapter.put("profiles", list); },
    getProfileMeta(id) { return this.listProfiles().find(p => p.id === id) || null; },

    async createProfile({ name, role, pin }) {
      const id = uid();
      const salt = uid();
      const meta = { id, name: name.trim(), role: (role || "").trim(), salt, pinHash: pin ? await hashPin(pin, salt) : null, createdAt: Date.now(), lastActive: Date.now() };
      const list = this.listProfiles(); list.push(meta); this.saveProfiles(list);
      adapter.put("p:" + id, blankProfileData(id));
      return meta;
    },
    async verifyPin(id, pin) {
      const meta = this.getProfileMeta(id);
      if (!meta || !meta.pinHash) return true;
      return (await hashPin(pin, meta.salt)) === meta.pinHash;
    },
    async setPin(id, pin) {
      const list = this.listProfiles(); const m = list.find(p => p.id === id); if (!m) return;
      m.pinHash = pin ? await hashPin(pin, m.salt) : null; this.saveProfiles(list);
    },
    deleteProfile(id) {
      this.saveProfiles(this.listProfiles().filter(p => p.id !== id));
      adapter.remove("p:" + id);
      const s = this.getSession(); if (s && s.profileId === id) this.endSession();
    },
    loadData(id) { return migrate(adapter.get("p:" + id)) || blankProfileData(id); },
    saveData(data) {
      adapter.put("p:" + data.id, data);
      const list = this.listProfiles(); const m = list.find(p => p.id === data.id);
      if (m) { m.lastActive = Date.now(); m.xp = data.xp; this.saveProfiles(list); }
    },

    /* ---------- Session ---------- */
    getSession() { return adapter.get("session"); },
    startSession(profileId) { adapter.put("session", { profileId, started: Date.now(), lastSeen: Date.now() }); },
    touchSession() { const s = this.getSession(); if (s) { s.lastSeen = Date.now(); adapter.put("session", s); } },
    endSession() { adapter.remove("session"); },
    /** Returns "active" | "locked" | "none" for the stored session. */
    sessionState() {
      const s = this.getSession(); if (!s) return "none";
      const meta = this.getProfileMeta(s.profileId); if (!meta) { this.endSession(); return "none"; }
      const idleMin = (Date.now() - s.lastSeen) / 60000;
      if (meta.pinHash && idleMin > SESSION_TTL_MIN) return "locked";
      return "active";
    },
    SESSION_TTL_MIN,

    /* ---------- Global settings (AI coach key stays on this device only) ---------- */
    getSettings() {
      const s = Object.assign({ provider: "openai", model: "gpt-4o-mini", apiKeys: { openai: "", anthropic: "" }, aiEnabled: false }, adapter.get("settings") || {});
      if (s.apiKey) { // migrate the earlier single-key (Anthropic-only) format
        s.apiKeys = Object.assign({}, s.apiKeys, { anthropic: s.apiKey }); delete s.apiKey;
        if (!adapter.get("settings").provider) s.provider = "anthropic";
      }
      s.apiKeys = Object.assign({ openai: "", anthropic: "" }, s.apiKeys);
      return s;
    },
    saveSettings(s) { adapter.put("settings", s); },

    /* ---------- Cohort (imported teammates) ---------- */
    getCohort() { return adapter.get("cohort") || []; },
    saveCohort(c) { adapter.put("cohort", c); },

    /* ---------- Export / import ---------- */
    exportProfile(id) {
      const meta = Object.assign({}, this.getProfileMeta(id));
      delete meta.salt; delete meta.pinHash; // never export credentials
      return { app: "ai-leadership-arena", exportedAt: new Date().toISOString(), schemaVersion: SCHEMA_VERSION, profile: meta, data: this.loadData(id) };
    },
    /** mode "cohort" adds a read-only leaderboard entry; mode "restore" restores as a playable profile. */
    importProfile(obj, mode) {
      if (!obj || obj.app !== "ai-leadership-arena" || !obj.profile || !obj.data) throw new Error("This file is not an AI Leadership Arena export.");
      if (mode === "cohort") {
        const c = this.getCohort().filter(x => x.sourceId !== obj.profile.id);
        c.push({ sourceId: obj.profile.id, name: obj.profile.name, role: obj.profile.role, xp: obj.data.xp, mastery: obj.data.mastery, attempts: obj.data.attempts, badges: (obj.data.badges || []).length, streak: (obj.data.streak || {}).best || 0, importedAt: Date.now() });
        this.saveCohort(c); return null;
      }
      const id = uid(); const salt = uid();
      const meta = { id, name: obj.profile.name + (this.listProfiles().some(p => p.name === obj.profile.name) ? " (restored)" : ""), role: obj.profile.role || "", salt, pinHash: null, createdAt: obj.profile.createdAt || Date.now(), lastActive: Date.now(), xp: obj.data.xp };
      const data = migrate(Object.assign({}, obj.data, { id }));
      data.inProgress = null;
      const list = this.listProfiles(); list.push(meta); this.saveProfiles(list);
      adapter.put("p:" + id, data);
      return meta;
    },
    resetAll() { Object.keys(localStorage).filter(k => k.startsWith(PREFIX)).forEach(k => localStorage.removeItem(k)); },

    today, uid
  };

  A.store = Store;
})(window.Arena);
