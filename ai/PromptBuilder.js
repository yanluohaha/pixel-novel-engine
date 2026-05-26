// PromptBuilder.js — 根据状态构建结构化 prompt

import { SYSTEM_PROMPT } from './SystemPrompt.js';

export class PromptBuilder {
  buildStoryPrompt(userInput, state, context = {}) {
    const messages = [];

    // System prompt
    messages.push({ role: 'system', content: SYSTEM_PROMPT });

    // World context
    const worldContext = this.buildWorldContext(state);
    if (worldContext) {
      messages.push({ role: 'user', content: worldContext });
    }

    // Current state
    const stateContext = this.buildStateContext(state);
    if (stateContext) {
      messages.push({ role: 'user', content: stateContext });
    }

    // History (last 10 exchanges)
    const historyContext = this.buildHistoryContext(state);
    if (historyContext) {
      messages.push({ role: 'user', content: historyContext });
    }

    // Player input
    const inputText = context.characterId
      ? `[对 ${context.characterName || context.characterId} 说/做] ${userInput}`
      : userInput;

    // 检测是否是世界创建请求
    const isWorldCreation = this.detectWorldCreation(userInput, state);

    if (isWorldCreation) {
      messages.push({ role: 'user', content: `玩家希望创建一个新的世界：${inputText}\n\n请根据这个设定，生成完整的世界数据（主场景 + 初始角色），严格按 JSON 格式输出。注意：\n1. 使用 scene_command action: "create" 创建主场景\n2. 使用 character_commands 中 action: "create" 创建 2-4 个初始角色\n3. 设置合适的 story flags\n4. 提供开场 narrative` });
    } else {
      messages.push({ role: 'user', content: `玩家输入：${inputText}\n\n请生成下一步剧情，严格按 JSON 格式输出。` });
    }

    return messages;
  }

  detectWorldCreation(input, state) {
    // 如果当前没有主场景，任何输入都视为世界创建
    if (!state.story?.sceneTree?.master) return true;

    // 检测创建世界的关键词
    const creationKeywords = [
      '创建', '新建', '开始', '设定', '定义', '我要', '我想',
      '世界', '剧情', '故事', '学校', '城市', '奇幻', '科幻',
      '校园', '都市', '冒险', 'create', 'new world', 'start'
    ];
    const lowerInput = input.toLowerCase();
    return creationKeywords.some(kw => lowerInput.includes(kw.toLowerCase()));
  }

  buildWorldContext(state) {
    const title = state.story?.title;
    if (!title) return null;

    return `=== 世界设定 ===\n故事标题：${title}\n\n这是一个像素风格的互动世界。场景以程序化像素画呈现，角色为可交互的像素精灵。请保持叙述简洁生动，适合视觉化呈现。`;
  }

  buildStateContext(state) {
    // 如果还没有世界，不需要状态上下文
    if (!state.story?.sceneTree?.master) return null;

    const lines = ['=== 当前状态 ==='];

    // Scene
    const sceneId = state.story?.currentSceneId;
    const master = state.story?.sceneTree?.master;
    const unlocked = state.story?.sceneTree?.unlocked || [];
    const currentScene = unlocked.find(s => s.id === sceneId) || master;

    if (currentScene) {
      lines.push(`当前场景：${currentScene.name} (${currentScene.id})`);
      lines.push(`场景类型：${currentScene.type || 'outdoor'}`);
      lines.push(`时间：${currentScene.environment?.timeOfDay || 'day'}`);
      lines.push(`天气：${currentScene.environment?.weather || 'clear'}`);
      if (currentScene.ambientDescription) {
        lines.push(`场景描述：${currentScene.ambientDescription}`);
      }
    }

    // All scenes
    const allScenes = [master, ...unlocked].filter(Boolean);
    if (allScenes.length > 1) {
      lines.push(`\n已解锁场景：`);
      allScenes.forEach(s => {
        lines.push(`- ${s.name} (${s.id})`);
      });
    }

    // Characters present
    const presentIds = currentScene?.charactersPresent || [];
    if (presentIds.length > 0) {
      lines.push('\n在场角色：');
      presentIds.forEach(id => {
        const char = state.characters?.[id];
        if (char) {
          const stats = Object.entries(char.stats || {})
            .map(([k, v]) => `${k}:${v}`)
            .join(', ');
          lines.push(`- ${char.displayName || char.name} (${id}): 表情=${char.state?.expression || 'neutral'}, 姿势=${char.state?.pose || 'idle'}, 位置=(${char.state?.position?.x?.toFixed(2) || 0.5}, ${char.state?.position?.y?.toFixed(2) || 0.7})${stats ? `, 属性={${stats}}` : ''}`);
        }
      });
    }

    // All characters
    const allChars = Object.values(state.characters || {});
    if (allChars.length > presentIds.length) {
      lines.push('\n其他角色：');
      allChars.filter(c => !presentIds.includes(c.id)).forEach(char => {
        lines.push(`- ${char.displayName || char.name} (${char.id})`);
      });
    }

    // Player
    lines.push(`\n玩家：${state.player?.name || '玩家'}`);
    if (state.player?.inventory?.length > 0) {
      const items = state.player.inventory.map(i => `${i.name}x${i.quantity || 1}`).join(', ');
      lines.push(`背包：${items}`);
    }

    // Flags
    const flags = state.story?.flags || {};
    const flagEntries = Object.entries(flags);
    if (flagEntries.length > 0) {
      lines.push(`\n故事标记：${flagEntries.map(([k, v]) => `${k}=${v}`).join(', ')}`);
    }

    return lines.join('\n');
  }

  buildHistoryContext(state) {
    const history = state.story?.history || [];
    if (history.length === 0) return null;

    const relevant = history
      .filter(h => h.type === 'narration' || h.type === 'dialogue' || h.type === 'player_input')
      .slice(-10);

    if (relevant.length === 0) return null;

    const lines = ['=== 最近剧情 ==='];
    relevant.forEach(entry => {
      if (entry.type === 'player_input') {
        lines.push(`[玩家] ${entry.text}`);
      } else if (entry.type === 'dialogue' && entry.meta?.speaker) {
        lines.push(`[${entry.meta.speaker}] ${entry.text}`);
      } else {
        lines.push(entry.text);
      }
    });

    return lines.join('\n');
  }
}
