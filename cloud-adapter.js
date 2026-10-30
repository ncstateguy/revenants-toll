// Maps the small storage API the game expects (the same shape claude.ai provides)
// onto Firebase Firestore. Each document is stored as JSON in field `j`, with simple
// top-level fields copied beside it so queries and security rules can read them.
export function makeAdapter(fs, db, getUser, getGuestName = () => null) {
  const enc = data => {
    const o = { j: JSON.stringify(data) };
    for (const k in data) {
      const v = data[k];
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') o[k] = v;
    }
    return o;
  };
  const dec = snap => {
    const d = snap.data();
    if (d && typeof d.j === 'string') { try { return JSON.parse(d.j); } catch (e) { /* fall through */ } }
    return d;
  };
  const firstName = u => {
    if (u && u.isAnonymous) return ((getGuestName() || 'Guest').trim() || 'Guest').slice(0, 20) + ' (guest)';
    return ((u && u.displayName) || 'Player').trim().split(/\s+/)[0].slice(0, 24);
  };
  const docRef = path => {
    const r = fs.doc(db, path);
    return {
      get: async () => { const s = await fs.getDoc(r); return { exists: s.exists(), id: s.id, data: () => dec(s) }; },
      set: async data => {
        const u = getUser();
        let d = data;
        if (u && path === 'players/' + u.uid) d = { ...data, name: firstName(u) };
        return fs.setDoc(r, enc(d));
      },
      delete: () => fs.deleteDoc(r),
    };
  };
  const col = (name, cons) => ({
    where: (f, op, v) => col(name, [...cons, fs.where(f, op, v)]),
    get: async () => {
      const base = fs.collection(db, name);
      const qs = await fs.getDocs(cons.length ? fs.query(base, ...cons) : base);
      return { docs: qs.docs.map(d => ({ id: d.id, data: () => dec(d) })) };
    },
    add: async data => { const r = await fs.addDoc(fs.collection(db, name), enc(data)); return { id: r.id }; },
    doc: id => docRef(name + '/' + id),
  });
  const db2 = { doc: docRef, collection: name => col(name, []) };
  const user = {
    id: async () => { const u = getUser(); return u ? u.uid : null; },
    profiles: async ids => {
      const out = {};
      await Promise.all(ids.map(async id => {
        try { const s = await docRef('players/' + id).get(); if (s.exists) out[id] = { name: s.data().name || 'A friend' }; } catch (e) { /* unreadable */ }
      }));
      return out;
    },
  };
  return { db: db2, user };
}
