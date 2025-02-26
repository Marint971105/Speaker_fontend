export class ProgressCache {
  constructor(expirationTime = 5000) { // 默认5秒缓存
    this.cache = new Map();
    this.expirationTime = expirationTime;
  }

  set(key, value) {
    const expirationTime = Date.now() + this.expirationTime;
    this.cache.set(key, { value, expirationTime });
  }

  get(key) {
    const data = this.cache.get(key);
    if (!data) return null;

    if (Date.now() > data.expirationTime) {
      this.cache.delete(key);
      return null;
    }

    return data.value;
  }
}
