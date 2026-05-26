// Constants.js — 枚举、默认配置、调色板

export const EXPRESSIONS = [
  'neutral', 'happy', 'sad', 'angry', 'surprised', 'thoughtful'
];

export const POSES = [
  'idle', 'walking', 'sitting', 'arms_crossed'
];

export const TIME_OF_DAY = [
  'dawn', 'day', 'dusk', 'night'
];

export const WEATHER = [
  'clear', 'rain', 'snow', 'fog'
];

export const SCENE_TYPES = [
  'outdoor', 'indoor', 'cave', 'urban'
];

export const GROUND_TYPES = [
  'grass', 'dirt', 'stone', 'sand', 'snow', 'wood', 'cobblestone'
];

export const SKY_TYPES = [
  'clear', 'cloudy', 'starry', 'stormy'
];

export const DEFAULT_CONFIG = {
  apiEndpoint: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o-mini',
  temperature: 0.8,
  maxTokens: 1500
};

export const CANVAS_WIDTH = 320;
export const CANVAS_HEIGHT = 180;

export const STORAGE_KEYS = {
  autosave: 'pixel_novel_save_autosave',
  config: 'pixel_novel_config',
  meta: 'pixel_novel_meta'
};

// 环境调色板
export const ENVIRONMENT_PALETTES = {
  forest: {
    sky: { dawn: ['#2d1b4e', '#8b4513'], day: ['#87ceeb', '#e0f6ff'], dusk: ['#4a1a4a', '#ff6b35'], night: ['#0a0a1a', '#1a1a3e'] },
    ground: ['#2d5016', '#3a6b1a', '#1e3d0f'],
    tree: ['#1e3d0f', '#2d5016', '#0f2a05'],
    prop: ['#5c4033', '#8b7355']
  },
  tavern: {
    sky: { dawn: ['#3e2723', '#5d4037'], day: ['#5d4037', '#795548'], dusk: ['#4e342e', '#6d4c41'], night: ['#281a16', '#3e2723'] },
    ground: ['#4e342e', '#5d4037', '#3e2723'],
    tree: ['#3e2723', '#4e342e'],
    prop: ['#8d6e63', '#a1887f', '#ffcc80']
  },
  cave: {
    sky: { dawn: ['#1a1a1a', '#2d2d2d'], day: ['#2d2d2d', '#3d3d3d'], dusk: ['#1a1a1a', '#2d2d2d'], night: ['#0a0a0a', '#1a1a1a'] },
    ground: ['#3d3d3d', '#4d4d4d', '#2d2d2d'],
    tree: ['#2d2d2d', '#3d3d3d'],
    prop: ['#5d5d5d', '#6d6d6d', '#ffd54f']
  },
  urban: {
    sky: { dawn: ['#4a148c', '#ff8f00'], day: ['#42a5f5', '#90caf9'], dusk: ['#311b92', '#ff5722'], night: ['#0d1b2a', '#1b263b'] },
    ground: ['#616161', '#757575', '#424242'],
    tree: ['#33691e', '#558b2f'],
    prop: ['#8d6e63', '#bdbdbd', '#ff7043']
  }
};

// 角色基础调色板
export const CHARACTER_PALETTES = {
  hero: {
    body: '#ffdbac',
    hair: '#5d4037',
    eye: '#3e2723',
    outfit: '#1565c0'
  },
  mage: {
    body: '#f5f5f5',
    hair: '#e0e0e0',
    eye: '#7b1fa2',
    outfit: '#4a148c'
  },
  warrior: {
    body: '#d7ccc8',
    hair: '#212121',
    eye: '#b71c1c',
    outfit: '#5d4037'
  }
};

// 表情像素定义 (16x16 脸部区域)
export const EXPRESSION_PIXELS = {
  neutral: {
    eyes: [{x:4,y:6},{x:5,y:6},{x:10,y:6},{x:11,y:6}],
    mouth: [{x:6,y:10},{x:7,y:10},{x:8,y:10},{x:9,y:10}]
  },
  happy: {
    eyes: [{x:4,y:6},{x:5,y:6},{x:10,y:6},{x:11,y:6},{x:4,y:5},{x:11,y:5}],
    mouth: [{x:5,y:10},{x:6,y:11},{x:7,y:11},{x:8,y:11},{x:9,y:11},{x:10,y:10}]
  },
  sad: {
    eyes: [{x:4,y:6},{x:5,y:6},{x:10,y:6},{x:11,y:6},{x:5,y:5},{x:10,y:5}],
    mouth: [{x:6,y:11},{x:7,y:10},{x:8,y:10},{x:9,y:11}]
  },
  angry: {
    eyes: [{x:4,y:6},{x:5,y:6},{x:10,y:6},{x:11,y:6},{x:3,y:5},{x:6,y:5},{x:9,y:5},{x:12,y:5}],
    mouth: [{x:6,y:11},{x:7,y:11},{x:8,y:11},{x:9,y:11}]
  },
  surprised: {
    eyes: [{x:4,y:5},{x:5,y:5},{x:4,y:6},{x:5,y:6},{x:10,y:5},{x:11,y:5},{x:10,y:6},{x:11,y:6}],
    mouth: [{x:6,y:10},{x:7,y:11},{x:8,y:11},{x:9,y:10}]
  },
  thoughtful: {
    eyes: [{x:4,y:6},{x:5,y:6},{x:10,y:6},{x:11,y:6}],
    mouth: [{x:7,y:10},{x:8,y:10}]
  }
};
