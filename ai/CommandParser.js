// CommandParser.js — 解析 AI 响应为可执行命令

export class CommandParser {
  parse(responseText) {
    if (!responseText || typeof responseText !== 'string') {
      return this.createErrorResult('Empty response');
    }

    // Try to extract JSON from the response
    let jsonText = this.extractJSON(responseText);
    if (!jsonText) {
      return this.createErrorResult('No JSON found in response');
    }

    try {
      const data = JSON.parse(jsonText);
      return this.validateAndNormalize(data);
    } catch (e) {
      // Try to clean up common JSON issues
      const cleaned = this.attemptRepair(jsonText);
      if (cleaned) {
        try {
          const data = JSON.parse(cleaned);
          return this.validateAndNormalize(data);
        } catch (e2) {
          return this.createErrorResult(`JSON parse error: ${e2.message}`);
        }
      }
      return this.createErrorResult(`JSON parse error: ${e.message}`);
    }
  }

  extractJSON(text) {
    // Try code block first
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }

    // Try to find JSON object boundaries
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return text.substring(firstBrace, lastBrace + 1);
    }

    // If the entire text looks like JSON
    const trimmed = text.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      return trimmed;
    }

    return null;
  }

  attemptRepair(jsonText) {
    let cleaned = jsonText;

    // Fix unescaped newlines inside string values
    cleaned = this.fixUnescapedNewlines(cleaned);

    // Replace Chinese quotes with escaped regular quotes
    cleaned = cleaned.replace(/[\u201c\u201d]/g, '\\"');

    // Remove trailing commas before } or ]
    cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

    // Replace single quotes with double quotes (carefully)
    cleaned = cleaned.replace(/'/g, '"');

    // Fix missing commas between adjacent properties (rare but happens)
    cleaned = cleaned.replace(/}(\s*)"/g, '},$1"');
    cleaned = cleaned.replace(/](\s*)"/g, '],$1"');

    return cleaned;
  }

  fixUnescapedNewlines(text) {
    // Replace raw newlines inside JSON string values with \n
    // This is a best-effort approach: find text between "..." that contains newlines
    let result = '';
    let inString = false;
    let escaped = false;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const code = text.charCodeAt(i);

      if (escaped) {
        result += ch;
        escaped = false;
        continue;
      }

      if (ch === '\\') {
        result += ch;
        escaped = true;
        continue;
      }

      if (ch === '"') {
        inString = !inString;
        result += ch;
        continue;
      }

      // Escape newlines and carriage returns inside strings
      if (inString && (ch === '\n' || ch === '\r')) {
        result += '\\n';
        continue;
      }

      // Escape tab characters inside strings
      if (inString && ch === '\t') {
        result += '\\t';
        continue;
      }

      // Escape backspace inside strings
      if (inString && ch === '\b') {
        result += '\\b';
        continue;
      }

      // Escape form feed inside strings
      if (inString && ch === '\f') {
        result += '\\f';
        continue;
      }

      result += ch;
    }

    return result;
  }

  validateAndNormalize(data) {
    const result = {
      narrative: '',
      scene_command: null,
      character_commands: [],
      state_updates: { flags: {}, inventory_changes: null, relationships: [] },
      choices: null,
      valid: true,
      errors: []
    };

    // narrative
    if (typeof data.narrative === 'string') {
      result.narrative = data.narrative.trim();
    } else {
      result.errors.push('Missing or invalid "narrative"');
    }

    // scene_command
    if (data.scene_command && typeof data.scene_command === 'object') {
      const sc = data.scene_command;
      if (sc.action && sc.target) {
        result.scene_command = {
          action: sc.action,
          target: sc.target,
          params: sc.params || {}
        };
      } else {
        result.errors.push('Invalid scene_command: missing action or target');
      }
    }

    // character_commands
    if (Array.isArray(data.character_commands)) {
      data.character_commands.forEach((cmd, i) => {
        if (cmd.action && cmd.target) {
          result.character_commands.push({
            action: cmd.action,
            target: cmd.target,
            params: cmd.params || {}
          });
        } else {
          result.errors.push(`Invalid character_commands[${i}]: missing action or target`);
        }
      });
    }

    // state_updates
    if (data.state_updates && typeof data.state_updates === 'object') {
      const su = data.state_updates;
      if (su.flags && typeof su.flags === 'object') {
        result.state_updates.flags = su.flags;
      }
      if (su.inventory_changes && typeof su.inventory_changes === 'object') {
        result.state_updates.inventory_changes = su.inventory_changes;
      }
      if (Array.isArray(su.relationships)) {
        result.state_updates.relationships = su.relationships.filter(r =>
          r.a && r.b && typeof r.delta === 'number'
        );
      }
    }

    // choices
    if (Array.isArray(data.choices)) {
      result.choices = data.choices
        .filter(c => c.text)
        .map(c => ({
          text: c.text,
          hint: c.hint || '',
          type: ['action', 'dialogue', 'item'].includes(c.type) ? c.type : 'action'
        }));
    }

    if (result.errors.length > 0) {
      console.warn('CommandParser validation warnings:', result.errors);
    }

    return result;
  }

  createErrorResult(error) {
    return {
      narrative: `[系统错误: ${error}]`,
      scene_command: null,
      character_commands: [],
      state_updates: { flags: {}, inventory_changes: null, relationships: [] },
      choices: null,
      valid: false,
      errors: [error]
    };
  }
}
