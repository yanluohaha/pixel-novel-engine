// GameEngine.js — 主循环，协调所有子系统

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './Constants.js';
import { eventBus } from './EventBus.js';

export class GameEngine {
  constructor(sceneRenderer, characterRenderer, animationEngine, stateManager) {
    this.sceneRenderer = sceneRenderer;
    this.characterRenderer = characterRenderer;
    this.animEngine = animationEngine;
    this.stateManager = stateManager;

    this.canvas = null;
    this.ctx = null;
    this.running = false;
    this.lastTime = 0;

    this.bindEvents();
  }

  init(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');

    // Set internal resolution
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;

    // Start render loop
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.tick(t));
  }

  bindEvents() {
    eventBus.on('state:changed', (state) => {
      this.onStateChanged(state);
    });
  }

  onStateChanged(state) {
    // State changes will be picked up in next render
  }

  tick(timestamp) {
    if (!this.running) return;

    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;

    // Update animations
    this.animEngine.update(deltaTime);

    // Render
    this.render();

    requestAnimationFrame((t) => this.tick(t));
  }

  render() {
    const state = this.stateManager.getState();
    const ctx = this.ctx;
    const w = CANVAS_WIDTH;
    const h = CANVAS_HEIGHT;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Render scene
    const currentScene = this.getCurrentScene(state);
    this.sceneRenderer.render(currentScene);

    // Render characters
    const presentChars = this.getPresentCharacters(state);
    this.characterRenderer.render(ctx, presentChars);

    // Render transitions
    this.animEngine.drawTransitions(ctx, w, h);
  }

  getCurrentScene(state) {
    const sceneId = state.story?.currentSceneId;
    if (!sceneId) return null;

    const master = state.story?.sceneTree?.master;
    if (master && master.id === sceneId) return master;

    const unlocked = state.story?.sceneTree?.unlocked || [];
    return unlocked.find(s => s.id === sceneId) || master;
  }

  getPresentCharacters(state) {
    const scene = this.getCurrentScene(state);
    const presentIds = scene?.charactersPresent || [];
    const chars = {};
    presentIds.forEach(id => {
      if (state.characters?.[id]) {
        chars[id] = state.characters[id];
      }
    });
    return chars;
  }

  getCharacterAt(x, y) {
    const state = this.stateManager.getState();
    const presentChars = this.getPresentCharacters(state);

    for (const char of Object.values(presentChars)) {
      const hitbox = this.characterRenderer.getHitbox(char);
      if (
        x >= hitbox.x &&
        x <= hitbox.x + hitbox.width &&
        y >= hitbox.y &&
        y <= hitbox.y + hitbox.height
      ) {
        return char;
      }
    }
    return null;
  }

  stop() {
    this.running = false;
  }
}
