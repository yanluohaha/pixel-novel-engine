// AIClient.js — OpenAI-compatible API 客户端

export class AIClient {
  constructor(config = {}) {
    this.endpoint = config.apiEndpoint || 'https://api.openai.com/v1';
    this.apiKey = config.apiKey || '';
    this.model = config.model || 'gpt-4o-mini';
    this.temperature = config.temperature ?? 0.8;
    this.maxTokens = config.maxTokens || 1500;
  }

  configure(config) {
    if (config.apiEndpoint) this.endpoint = config.apiEndpoint;
    if (config.apiKey) this.apiKey = config.apiKey;
    if (config.model) this.model = config.model;
    if (config.temperature !== undefined) this.temperature = config.temperature;
    if (config.maxTokens) this.maxTokens = config.maxTokens;
  }

  async sendChat(messages) {
    const url = `${this.endpoint}/chat/completions`;
    const body = {
      model: this.model,
      messages,
      temperature: this.temperature,
      max_tokens: Math.max(this.maxTokens, 4000)
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Detect truncated JSON (incomplete response)
    if (content && !this.isCompleteJSON(content)) {
      console.warn('AI response appears truncated, attempting to complete...');
      // Try to extract and repair partial JSON
      return this.repairTruncatedJSON(content);
    }

    return content;
  }

  isCompleteJSON(text) {
    const trimmed = text.trim();
    if (!trimmed.startsWith('{')) return false;

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = 0; i < trimmed.length; i++) {
      const ch = trimmed[i];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (ch === '\\') {
        escaped = true;
        continue;
      }

      if (ch === '"') {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (ch === '{' || ch === '[') depth++;
        if (ch === '}' || ch === ']') depth--;
      }
    }

    return depth === 0 && !inString;
  }

  repairTruncatedJSON(text) {
    // Find the last complete property and close the JSON
    let trimmed = text.trim();

    // Remove trailing commas
    trimmed = trimmed.replace(/,\s*$/, '');

    // Try to find the last complete string value
    const lastQuote = trimmed.lastIndexOf('"');
    if (lastQuote > 0) {
      // Check if this quote opens or closes a string
      let escapes = 0;
      for (let i = lastQuote - 1; i >= 0 && trimmed[i] === '\\'; i--) {
        escapes++;
      }
      const isOpenQuote = (escapes % 2) === 0;

      if (isOpenQuote) {
        // String is not closed, close it
        trimmed = trimmed.substring(0, lastQuote) + '"';
      }
    }

    // Balance braces and brackets
    let braceDepth = 0;
    let bracketDepth = 0;
    let inStr = false;
    let esc = false;

    for (let i = 0; i < trimmed.length; i++) {
      const ch = trimmed[i];
      if (esc) { esc = false; continue; }
      if (ch === '\\') { esc = true; continue; }
      if (ch === '"') { inStr = !inStr; continue; }
      if (!inStr) {
        if (ch === '{') braceDepth++;
        if (ch === '}') braceDepth--;
        if (ch === '[') bracketDepth++;
        if (ch === ']') bracketDepth--;
      }
    }

    // Close any open strings
    if (inStr) trimmed += '"';

    // Close arrays first, then objects
    while (bracketDepth > 0) { trimmed += ']'; bracketDepth--; }
    while (braceDepth > 0) { trimmed += '}'; braceDepth--; }

    return trimmed;
  }

  async *streamChat(messages) {
    const url = `${this.endpoint}/chat/completions`;
    const body = {
      model: this.model,
      messages,
      temperature: this.temperature,
      max_tokens: this.maxTokens,
      stream: true
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API ${response.status}: ${errText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (trimmed.startsWith('data: ')) {
          try {
            const json = JSON.parse(trimmed.slice(6));
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) yield delta;
          } catch (e) {
            // skip malformed
          }
        }
      }
    }
  }
}
