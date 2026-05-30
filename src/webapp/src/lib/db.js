class Store {
  constructor(name) { this.name = name; }
  _all() {
    try { return JSON.parse(localStorage.getItem(this.name) || '[]'); } catch { return []; }
  }
  _save(arr) {
    try { localStorage.setItem(this.name, JSON.stringify(arr)); } catch {}
  }
  create(data) {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    const rec = { ...data, id, created_date: new Date().toISOString() };
    this._save([...this._all(), rec]);
    return rec;
  }
  filter(query, sortKey = '-created_date', limit = 200) {
    let arr = this._all();
    Object.entries(query || {}).forEach(([k, v]) => {
      arr = arr.filter(r => r[k] === v);
    });
    const desc = sortKey.startsWith('-');
    const sk = sortKey.replace(/^-/, '');
    arr.sort((a, b) => {
      const av = a[sk], bv = b[sk];
      if (typeof av === 'string' && typeof bv === 'string') return desc ? bv.localeCompare(av) : av.localeCompare(bv);
      return desc ? (bv || 0) - (av || 0) : (av || 0) - (bv || 0);
    });
    return arr.slice(0, limit);
  }
  update(id, data) {
    const arr = this._all().map(r => r.id === id ? { ...r, ...data } : r);
    this._save(arr);
  }
  delete(id) { this._save(this._all().filter(r => r.id !== id)); }
  list() { return this._all(); }
  clear() { this._save([]); }
}

export const Prediction = new Store('predictions');
export const BetLog = new Store('bet_logs');
export const PredictionAnalytics = new Store('analytics');
