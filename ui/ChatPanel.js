// ChatPanel.js — 提示词输入与 AI 交互（右中）

import { eventBus } from '../engine/EventBus.js';

export class ChatPanel {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.render();
    this.typing = false;
  }

  render() {
    this.container.innerHTML = `
      <div class="panel-header">交互窗口</div>
      <div id="chat-messages"></div>
      <div id="chat-input-area">
        <textarea id="chat-input" rows="2" placeholder="输入你的行动或对话..."></textarea>
        <button id="chat-send-btn">发送</button>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const input = this.container.querySelector('#chat-input');
    const sendBtn = this.container.querySelector('#chat-send-btn');

    sendBtn.addEventListener('click', () => this.sendMessage());
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
  }

  sendMessage() {
    const input = this.container.querySelector('#chat-input');
    const text = input.value.trim();
    if (!text || this.typing) return;

    this.addMessage('user', text);
    input.value = '';

    eventBus.emit('chat:user_input', { text });
  }

  addMessage(role, text) {
    const messagesEl = this.container.querySelector('#chat-messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${role}`;

    const roleLabel = { user: '你', assistant: 'AI', system: '系统' }[role] || role;
    msgDiv.innerHTML = `<div class="msg-role">${roleLabel}</div><div>${this.escapeHtml(text)}</div>`;

    messagesEl.appendChild(msgDiv);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  setTyping(state) {
    this.typing = state;
    const sendBtn = this.container.querySelector('#chat-send-btn');
    sendBtn.disabled = state;

    let indicator = this.container.querySelector('.typing-indicator');
    if (state) {
      if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        const messagesEl = this.container.querySelector('#chat-messages');
        messagesEl.appendChild(indicator);
      }
      indicator.textContent = 'AI 正在思考...';
      indicator.scrollIntoView({ behavior: 'smooth' });
    } else if (indicator) {
      indicator.remove();
    }
  }

  clear() {
    const messagesEl = this.container.querySelector('#chat-messages');
    messagesEl.innerHTML = '';
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
