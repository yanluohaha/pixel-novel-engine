// StateManager.js — 中央状态容器与变更

import { eventBus } from '../engine/EventBus.js';
import { DEFAULT_CONFIG } from '../engine/Constants.js';

const INITIAL_STATE = {
  version: '1.0',
  story: {
    title: '',
    currentSceneId: null,
    sceneTree: {
      master: null,
      unlocked: []
    },
    flags: {},
    history: []
  },
  characters: {},
  player: {
    name: '玩家',
    inventory: [],
    stats: {}
  },
  config: { ...DEFAULT_CONFIG }
};

export class StateManager {
  constructor() {
    this.state = this.deepClone(INITIAL_STATE);
    this.listeners = [];
  }

  getState() {
    return this.deepClone(this.state);
  }

  setState(newState) {
    this.state = this.deepClone(newState);
    this.notify();
  }

  dispatch(action) {
    const prevState = this.deepClone(this.state);
    this.state = this.reduce(this.state, action);
    if (JSON.stringify(prevState) !== JSON.stringify(this.state)) {
      this.notify();
    }
  }

  reduce(state, action) {
    const newState = this.deepClone(state);

    switch (action.type) {
      case 'INIT_STATE':
        return action.payload ? this.deepClone(action.payload) : newState;

      case 'SET_CONFIG':
        newState.config = { ...newState.config, ...action.payload };
        return newState;

      case 'PLAYER_INPUT':
        newState.story.history.push({
          timestamp: new Date().toISOString(),
          type: 'player_input',
          text: action.payload.text
        });
        return newState;

      case 'APPLY_AI_COMMANDS': {
        const { narrative, scene_command, character_commands, state_updates } = action.payload;

        // 追加 narrative
        if (narrative) {
          newState.story.history.push({
            timestamp: new Date().toISOString(),
            type: 'narration',
            text: narrative
          });
        }

        // scene_command
        if (scene_command) {
          this.applySceneCommand(newState, scene_command);
        }

        // character_commands
        if (character_commands && Array.isArray(character_commands)) {
          character_commands.forEach(cmd => this.applyCharacterCommand(newState, cmd));
        }

        // state_updates
        if (state_updates) {
          if (state_updates.flags) {
            newState.story.flags = { ...newState.story.flags, ...state_updates.flags };
          }
          if (state_updates.inventory_changes) {
            this.applyInventoryChanges(newState, state_updates.inventory_changes);
          }
          if (state_updates.relationships) {
            this.applyRelationshipChanges(newState, state_updates.relationships);
          }
        }

        return newState;
      }

      case 'UPDATE_CHARACTER_STATE':
        if (newState.characters[action.payload.characterId]) {
          newState.characters[action.payload.characterId].state = {
            ...newState.characters[action.payload.characterId].state,
            ...action.payload.state
          };
        }
        return newState;

      case 'SET_SCENE':
        newState.story.currentSceneId = action.payload.sceneId;
        return newState;

      case 'UNLOCK_SCENE':
        if (newState.story.sceneTree.master && action.payload.sceneId !== newState.story.sceneTree.master.id) {
          const scene = newState.story.sceneTree.unlocked.find(s => s.id === action.payload.sceneId);
          if (scene) scene.unlocked = true;
        }
        return newState;

      case 'ADD_HISTORY':
        newState.story.history.push({
          timestamp: new Date().toISOString(),
          ...action.payload
        });
        return newState;

      case 'CREATE_WORLD':
        // 用户定义新世界时，由 AI 返回完整的世界数据
        if (action.payload.title) newState.story.title = action.payload.title;
        if (action.payload.master) {
          newState.story.sceneTree.master = action.payload.master;
          newState.story.currentSceneId = action.payload.master.id;
        }
        if (action.payload.unlocked) newState.story.sceneTree.unlocked = action.payload.unlocked;
        if (action.payload.characters) newState.characters = { ...newState.characters, ...action.payload.characters };
        if (action.payload.player) newState.player = { ...newState.player, ...action.payload.player };
        if (action.payload.flags) newState.story.flags = { ...newState.story.flags, ...action.payload.flags };
        return newState;

      default:
        return newState;
    }
  }

  applySceneCommand(state, cmd) {
    if (!cmd || !cmd.action) return;
    const { action, target, params } = cmd;

    if (action === 'set' || action === 'transition') {
      state.story.currentSceneId = target;
    }
    if (action === 'unlock') {
      const scene = state.story.sceneTree.unlocked.find(s => s.id === target);
      if (scene) scene.unlocked = true;
    }
    if (action === 'modify' && params) {
      const scene = state.story.sceneTree.unlocked.find(s => s.id === target)
        || (state.story.sceneTree.master?.id === target ? state.story.sceneTree.master : null);
      if (scene) {
        if (params.timeOfDay) scene.environment.timeOfDay = params.timeOfDay;
        if (params.weather) scene.environment.weather = params.weather;
        if (params.ambientDescription) scene.ambientDescription = params.ambientDescription;
      }
    }
    if (action === 'create' && params) {
      // 动态创建新场景
      const newScene = {
        id: target,
        name: params.name || target,
        type: params.type || 'outdoor',
        parentId: params.parentId || state.story.currentSceneId,
        unlocked: true,
        environment: params.environment || { timeOfDay: 'day', weather: 'clear', palette: 'urban' },
        layout: params.layout || { groundType: 'grass', skyType: 'clear', props: [] },
        charactersPresent: params.charactersPresent || [],
        ambientDescription: params.ambientDescription || ''
      };
      state.story.sceneTree.unlocked.push(newScene);
      state.story.currentSceneId = target;
    }
  }

  applyCharacterCommand(state, cmd) {
    if (!cmd || !cmd.target) return;
    const char = state.characters[cmd.target];
    if (!char) return;

    switch (cmd.action) {
      case 'move':
        if (cmd.params.position) {
          char.state.position = { ...char.state.position, ...cmd.params.position };
        }
        break;
      case 'set_expression':
        if (cmd.params.expression) char.state.expression = cmd.params.expression;
        break;
      case 'set_pose':
        if (cmd.params.pose) char.state.pose = cmd.params.pose;
        break;
      case 'update_stat':
        if (cmd.params.stat && typeof cmd.params.delta === 'number') {
          const current = char.stats[cmd.params.stat] || 0;
          char.stats[cmd.params.stat] = Math.max(0, Math.min(100, current + cmd.params.delta));
        }
        break;
      case 'speak':
        if (cmd.params.text) {
          state.story.history.push({
            timestamp: new Date().toISOString(),
            type: 'dialogue',
            text: cmd.params.text,
            meta: { speaker: char.displayName || char.name }
          });
        }
        break;
      case 'enter':
        char.state.visible = true;
        break;
      case 'exit':
        char.state.visible = false;
        break;
      case 'create':
        // 动态创建新角色
        if (cmd.params.characterData) {
          const newChar = cmd.params.characterData;
          state.characters[newChar.id] = newChar;
          // 将角色添加到当前场景
          const currentScene = this.getCurrentScene(state);
          if (currentScene && !currentScene.charactersPresent.includes(newChar.id)) {
            currentScene.charactersPresent.push(newChar.id);
          }
        }
        break;
    }
  }

  getCurrentScene(state) {
    const sceneId = state.story?.currentSceneId;
    if (!sceneId) return null;
    const master = state.story?.sceneTree?.master;
    if (master && master.id === sceneId) return master;
    const unlocked = state.story?.sceneTree?.unlocked || [];
    return unlocked.find(s => s.id === sceneId) || master;
  }

  applyInventoryChanges(state, changes) {
    if (!changes.characterId) return;
    const target = changes.characterId === 'player' ? state.player : state.characters[changes.characterId];
    if (!target) return;

    if (changes.add && Array.isArray(changes.add)) {
      changes.add.forEach(item => {
        const existing = target.inventory.find(i => i.id === item.id);
        if (existing) {
          existing.quantity = (existing.quantity || 1) + (item.quantity || 1);
        } else {
          target.inventory.push({ ...item, quantity: item.quantity || 1 });
        }
      });
    }
    if (changes.remove && Array.isArray(changes.remove)) {
      changes.remove.forEach(itemId => {
        const idx = target.inventory.findIndex(i => i.id === itemId);
        if (idx !== -1) {
          target.inventory[idx].quantity--;
          if (target.inventory[idx].quantity <= 0) {
            target.inventory.splice(idx, 1);
          }
        }
      });
    }
  }

  applyRelationshipChanges(state, changes) {
    if (!Array.isArray(changes)) return;
    changes.forEach(chg => {
      const { a, b, delta } = chg;
      if (!state.characters[a] || !state.characters[b]) return;
      if (!state.characters[a].relationships) state.characters[a].relationships = {};
      if (!state.characters[b].relationships) state.characters[b].relationships = {};
      const currentA = state.characters[a].relationships[b] || 0;
      const currentB = state.characters[b].relationships[a] || 0;
      state.characters[a].relationships[b] = Math.max(-100, Math.min(100, currentA + delta));
      state.characters[b].relationships[a] = Math.max(-100, Math.min(100, currentB + delta));
    });
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    const snapshot = this.getState();
    eventBus.emit('state:changed', snapshot);
    this.listeners.forEach(l => l(snapshot));
  }

  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  reset() {
    this.state = this.deepClone(INITIAL_STATE);
    this.notify();
  }
}

export const stateManager = new StateManager();
