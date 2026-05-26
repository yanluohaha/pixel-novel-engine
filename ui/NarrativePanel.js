// NarrativePanel.js — 底部小说文字剧情

export class NarrativePanel {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.typingEffect = true;
    this.typeQueue = [];
    this.typing = false;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="panel-header">剧情</div>
      <div id="narrative-content"></div>
    `;
  }

  append(text, type = 'narration', meta = {}) {
    const contentEl = this.container.querySelector('#narrative-content');

    const entry = document.createElement('div');
    entry.className = `narrative-entry ${type}`;

    if (meta.speaker) {
      entry.innerHTML = `<span class="speaker">${meta.speaker}:</span> `;
    }

    const textSpan = document.createElement('span');
    textSpan.className = 'entry-text';
    entry.appendChild(textSpan);
    contentEl.appendChild(entry);

    if (this.typingEffect && type === 'narration') {
      this.typeQueue.push({ element: textSpan, text });
      if (!this.typing) this.processTypeQueue();
    } else {
      textSpan.textContent = text;
    }

    contentEl.scrollTop = contentEl.scrollHeight;
  }

  async processTypeQueue() {
    if (this.typeQueue.length === 0) {
      this.typing = false;
      return;
    }

    this.typing = true;
    const { element, text } = this.typeQueue.shift();

    for (let i = 0; i < text.length; i++) {
      element.textContent += text[i];
      const contentEl = this.container.querySelector('#narrative-content');
      contentEl.scrollTop = contentEl.scrollHeight;
      await this.delay(15);
    }

    this.processTypeQueue();
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  clear() {
    const contentEl = this.container.querySelector('#narrative-content');
    contentEl.innerHTML = '';
    this.typeQueue = [];
    this.typing = false;
  }

  setTypingEffect(enabled) {
    this.typingEffect = enabled;
  }
}
