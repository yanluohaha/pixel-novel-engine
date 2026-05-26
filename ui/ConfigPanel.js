// ConfigPanel.js — API 配置面板（右上）

import { eventBus } from '../engine/EventBus.js';
import { DEFAULT_CONFIG } from '../engine/Constants.js';
import { StorageManager } from '../state/StorageManager.js';

export class ConfigPanel {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.config = { ...DEFAULT_CONFIG };
    this.render();
    this.loadSavedConfig();
  }

  render() {
    this.container.innerHTML = `
      <div class="panel-header">API 配置</div>
      <div class="config-form">
        <label>API Endpoint</label>
        <input type="text" id="cfg-endpoint" placeholder="https://api.openai.com/v1" value="${this.config.apiEndpoint}">
        
        <label>API Key</label>
        <input type="password" id="cfg-apikey" placeholder="sk-..." value="${this.config.apiKey}">
        
        <label>模型</label>
        <input type="text" id="cfg-model" placeholder="gpt-4o-mini" value="${this.config.model}">
        
        <label>Temperature</label>
        <input type="number" id="cfg-temp" min="0" max="2" step="0.1" value="${this.config.temperature}">
        
        <label>Max Tokens</label>
        <input type="number" id="cfg-tokens" min="100" max="4000" step="100" value="${this.config.maxTokens}">
        
        <button id="cfg-test-btn">测试连接</button>
        <button id="cfg-save-btn">保存配置</button>
        <div id="cfg-status" class="config-status"></div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    this.container.querySelector('#cfg-test-btn').addEventListener('click', () => this.testConnection());
    this.container.querySelector('#cfg-save-btn').addEventListener('click', () => this.saveConfig());

    // Auto-update config on input change
    ['cfg-endpoint', 'cfg-apikey', 'cfg-model', 'cfg-temp', 'cfg-tokens'].forEach(id => {
      this.container.querySelector(`#${id}`).addEventListener('change', () => this.readForm());
    });
  }

  readForm() {
    this.config = {
      apiEndpoint: this.container.querySelector('#cfg-endpoint').value.trim() || DEFAULT_CONFIG.apiEndpoint,
      apiKey: this.container.querySelector('#cfg-apikey').value.trim(),
      model: this.container.querySelector('#cfg-model').value.trim() || DEFAULT_CONFIG.model,
      temperature: parseFloat(this.container.querySelector('#cfg-temp').value) || DEFAULT_CONFIG.temperature,
      maxTokens: parseInt(this.container.querySelector('#cfg-tokens').value) || DEFAULT_CONFIG.maxTokens
    };
    eventBus.emit('config:updated', this.config);
  }

  async testConnection() {
    this.readForm();
    const statusEl = this.container.querySelector('#cfg-status');
    statusEl.textContent = '测试中...';
    statusEl.className = 'config-status';

    try {
      const response = await fetch(`${this.config.apiEndpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 5
        })
      });

      if (response.ok) {
        statusEl.textContent = '连接成功';
        statusEl.className = 'config-status ok';
      } else {
        const err = await response.text();
        statusEl.textContent = `连接失败: ${response.status}`;
        statusEl.className = 'config-status err';
        console.error('API test failed:', err);
      }
    } catch (e) {
      statusEl.textContent = `错误: ${e.message}`;
      statusEl.className = 'config-status err';
    }
  }

  saveConfig() {
    this.readForm();
    StorageManager.saveConfig(this.config);
    const statusEl = this.container.querySelector('#cfg-status');
    statusEl.textContent = '配置已保存';
    statusEl.className = 'config-status ok';
    setTimeout(() => { statusEl.textContent = ''; statusEl.className = 'config-status'; }, 2000);
  }

  loadSavedConfig() {
    const saved = StorageManager.loadConfig();
    if (saved) {
      this.config = { ...this.config, ...saved };
      this.container.querySelector('#cfg-endpoint').value = this.config.apiEndpoint;
      this.container.querySelector('#cfg-model').value = this.config.model;
      this.container.querySelector('#cfg-temp').value = this.config.temperature;
      this.container.querySelector('#cfg-tokens').value = this.config.maxTokens;
      eventBus.emit('config:updated', this.config);
    }
  }

  getConfig() {
    return { ...this.config };
  }
}
