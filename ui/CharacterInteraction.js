// CharacterInteraction.js — Canvas 人物点击交互

import { eventBus } from '../engine/EventBus.js';

export class CharacterInteraction {
  constructor(canvas, gameEngine) {
    this.canvas = canvas;
    this.gameEngine = gameEngine;
    this.overlay = null;
    this.tooltip = null;
    this.menu = null;
    this.hoveredChar = null;

    this.bindEvents();
  }

  bindEvents() {
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('click', (e) => this.onClick(e));
    this.canvas.addEventListener('mouseleave', () => this.hideTooltip());

    // Click outside to close menu
    document.addEventListener('click', (e) => {
      if (this.menu && !this.menu.contains(e.target) && e.target !== this.canvas) {
        this.hideMenu();
      }
    });
  }

  getCanvasCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  onMouseMove(e) {
    const { x, y } = this.getCanvasCoords(e);
    const char = this.gameEngine.getCharacterAt(x, y);

    if (char !== this.hoveredChar) {
      this.hoveredChar = char;
      if (char) {
        this.showTooltip(e, char);
        this.canvas.style.cursor = 'pointer';
      } else {
        this.hideTooltip();
        this.canvas.style.cursor = 'crosshair';
      }
    }
  }

  onClick(e) {
    const { x, y } = this.getCanvasCoords(e);
    const char = this.gameEngine.getCharacterAt(x, y);

    if (char) {
      this.showMenu(e, char);
      eventBus.emit('character:clicked', { characterId: char.id, name: char.displayName || char.name });
    } else {
      this.hideMenu();
    }
  }

  showTooltip(e, char) {
    this.hideTooltip();
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'character-tooltip';
    this.tooltip.textContent = `${char.displayName || char.name} [点击互动]`;
    document.body.appendChild(this.tooltip);
    this.positionElement(this.tooltip, e.clientX, e.clientY - 30);
  }

  hideTooltip() {
    if (this.tooltip) {
      this.tooltip.remove();
      this.tooltip = null;
    }
  }

  showMenu(e, char) {
    this.hideMenu();
    this.menu = document.createElement('div');
    this.menu.className = 'character-menu';

    const actions = [
      { label: `与 ${char.displayName || char.name} 对话`, action: 'talk' },
      { label: '查看状态', action: 'status' },
      { label: '赠送物品', action: 'gift' }
    ];

    actions.forEach(act => {
      const btn = document.createElement('button');
      btn.textContent = act.label;
      btn.addEventListener('click', () => {
        this.handleAction(act.action, char);
        this.hideMenu();
      });
      this.menu.appendChild(btn);
    });

    document.body.appendChild(this.menu);
    this.positionElement(this.menu, e.clientX, e.clientY);
  }

  hideMenu() {
    if (this.menu) {
      this.menu.remove();
      this.menu = null;
    }
  }

  handleAction(action, char) {
    switch (action) {
      case 'talk':
        eventBus.emit('character:action', { action: 'talk', characterId: char.id });
        break;
      case 'status':
        this.showCharacterStatus(char);
        break;
      case 'gift':
        eventBus.emit('character:action', { action: 'gift', characterId: char.id });
        break;
    }
  }

  showCharacterStatus(char) {
    const stats = char.stats || {};
    const statText = Object.entries(stats)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' | ');

    eventBus.emit('chat:system_message', {
      text: `[${char.displayName || char.name}] 状态 — ${statText || '无数据'}`
    });
  }

  positionElement(el, x, y) {
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
  }
}
