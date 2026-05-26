// StorageManager.js — localStorage CRUD、JSON 导出/导入

import { STORAGE_KEYS } from '../engine/Constants.js';

export class StorageManager {
  static save(state, slot = 'autosave') {
    const key = slot === 'autosave' ? STORAGE_KEYS.autosave : `pixel_novel_save_${slot}`;
    const saveData = {
      version: '1.0',
      savedAt: new Date().toISOString(),
      state: JSON.parse(JSON.stringify(state))
    };
    try {
      localStorage.setItem(key, JSON.stringify(saveData));
      this.updateMeta(slot);
      return true;
    } catch (e) {
      console.error('StorageManager.save failed:', e);
      return false;
    }
  }

  static load(slot = 'autosave') {
    const key = slot === 'autosave' ? STORAGE_KEYS.autosave : `pixel_novel_save_${slot}`;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const saveData = JSON.parse(raw);
      return saveData.state || null;
    } catch (e) {
      console.error('StorageManager.load failed:', e);
      return null;
    }
  }

  static deleteSave(slot) {
    const key = `pixel_novel_save_${slot}`;
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('StorageManager.deleteSave failed:', e);
      return false;
    }
  }

  static listSaves() {
    const saves = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('pixel_novel_save_')) {
        try {
          const raw = localStorage.getItem(key);
          const data = JSON.parse(raw);
          saves.push({
            slot: key.replace('pixel_novel_save_', ''),
            savedAt: data.savedAt,
            version: data.version
          });
        } catch (e) {
          // skip invalid
        }
      }
    }
    return saves.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
  }

  static exportToJSON(state) {
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      state: JSON.parse(JSON.stringify(state))
    };
    return JSON.stringify(exportData, null, 2);
  }

  static importFromJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!data.state) throw new Error('Invalid import: missing state');
      return data.state;
    } catch (e) {
      console.error('StorageManager.importFromJSON failed:', e);
      return null;
    }
  }

  static saveConfig(config) {
    // 安全：绝不保存 apiKey
    const safeConfig = { ...config };
    delete safeConfig.apiKey;
    try {
      localStorage.setItem(STORAGE_KEYS.config, JSON.stringify(safeConfig));
      return true;
    } catch (e) {
      console.error('StorageManager.saveConfig failed:', e);
      return false;
    }
  }

  static loadConfig() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.config);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('StorageManager.loadConfig failed:', e);
      return null;
    }
  }

  static updateMeta(slot) {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.meta);
      const meta = raw ? JSON.parse(raw) : { startDate: new Date().toISOString(), playTime: 0 };
      meta.lastSlot = slot;
      meta.lastPlayed = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.meta, JSON.stringify(meta));
    } catch (e) {
      console.error('StorageManager.updateMeta failed:', e);
    }
  }

  static loadMeta() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.meta);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }
}
