// SceneRenderer.js — Canvas 场景背景渲染

import { PixelArtGenerator } from './PixelArtGenerator.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../engine/Constants.js';

export class SceneRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.weatherParticles = [];
    this.cachedBackground = null;
    this.lastSceneId = null;
  }

  render(scene, targetCtx) {
    if (!scene) return;

    const ctx = targetCtx || this.ctx;
    const w = CANVAS_WIDTH;
    const h = CANVAS_HEIGHT;

    // Cache background if scene hasn't changed
    if (this.lastSceneId !== scene.id || !this.cachedBackground) {
      this.cachedBackground = this.generateBackground(scene);
      this.lastSceneId = scene.id;
    }

    // Draw cached background
    ctx.drawImage(this.cachedBackground, 0, 0, w, h);

    // Draw weather particles
    this.renderWeather(ctx, scene, w, h);
  }

  generateBackground(scene) {
    const offCanvas = document.createElement('canvas');
    offCanvas.width = CANVAS_WIDTH;
    offCanvas.height = CANVAS_HEIGHT;
    const ctx = offCanvas.getContext('2d');
    const w = CANVAS_WIDTH;
    const h = CANVAS_HEIGHT;

    const timeOfDay = scene.environment?.timeOfDay || 'day';
    const palette = this.getPalette(scene);

    // Sky / Ceiling
    this.drawSky(ctx, timeOfDay, palette, w, h, scene.type);

    // Ground / Floor
    this.drawGround(ctx, scene, palette, w, h);

    // Props
    if (scene.layout?.props) {
      this.drawProps(ctx, scene.layout.props, w, h);
    }

    return offCanvas;
  }

  getPalette(scene) {
    const type = scene.type || 'outdoor';
    const paletteName = scene.environment?.palette || 'forest';
    const defaults = { outdoor: 'forest', indoor: 'tavern', cave: 'cave', urban: 'urban' };
    const name = paletteName || defaults[type] || 'forest';

    const palettes = {
      forest: {
        sky: { dawn: ['#2d1b4e', '#8b4513'], day: ['#87ceeb', '#e0f6ff'], dusk: ['#4a1a4a', '#ff6b35'], night: ['#0a0a1a', '#1a1a3e'] },
        ground: ['#2d5016', '#3a6b1a', '#1e3d0f']
      },
      tavern: {
        sky: { dawn: ['#3e2723', '#5d4037'], day: ['#5d4037', '#795548'], dusk: ['#4e342e', '#6d4c41'], night: ['#281a16', '#3e2723'] },
        ground: ['#4e342e', '#5d4037', '#3e2723']
      },
      cave: {
        sky: { dawn: ['#1a1a1a', '#2d2d2d'], day: ['#2d2d2d', '#3d3d3d'], dusk: ['#1a1a1a', '#2d2d2d'], night: ['#0a0a0a', '#1a1a1a'] },
        ground: ['#3d3d3d', '#4d4d4d', '#2d2d2d']
      },
      urban: {
        sky: { dawn: ['#4a148c', '#ff8f00'], day: ['#42a5f5', '#90caf9'], dusk: ['#311b92', '#ff5722'], night: ['#0d1b2a', '#1b263b'] },
        ground: ['#616161', '#757575', '#424242']
      },
      school: {
        sky: { dawn: ['#ffcc80', '#ff9800'], day: ['#81d4fa', '#e1f5fe'], dusk: ['#4a148c', '#ff5722'], night: ['#1a237e', '#0d47a1'] },
        ground: ['#66bb6a', '#81c784', '#4caf50']
      },
      classroom: {
        sky: { dawn: ['#efebe9', '#d7ccc8'], day: ['#fff', '#f5f5f5'], dusk: ['#efebe9', '#d7ccc8'], night: ['#37474f', '#263238'] },
        ground: ['#d7ccc8', '#efebe9', '#bcaaa4']
      }
    };

    return palettes[name] || palettes.forest;
  }

  drawSky(ctx, timeOfDay, palette, w, h, sceneType) {
    // 室内场景不画天空，画天花板/墙壁上部
    if (sceneType === 'indoor') {
      const ceilingColor = palette.sky.day[0];
      ctx.fillStyle = ceilingColor;
      ctx.fillRect(0, 0, w, h * 0.45);
      return;
    }

    const skyColors = palette.sky[timeOfDay] || palette.sky.day;
    const horizonY = h * 0.55;

    const grad = ctx.createLinearGradient(0, 0, 0, horizonY);
    grad.addColorStop(0, skyColors[0]);
    grad.addColorStop(1, skyColors[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, horizonY);

    // Stars at night
    if (timeOfDay === 'night') {
      const stars = PixelArtGenerator.generateStarField(40, w, horizonY, 42);
      stars.forEach(star => {
        ctx.fillStyle = `rgba(255,255,255,${star.brightness})`;
        ctx.fillRect(Math.floor(star.x), Math.floor(star.y), star.size, star.size);
      });
    }

    // Clouds during day/dawn/dusk
    if (timeOfDay !== 'night') {
      for (let i = 0; i < 3; i++) {
        const cloud = PixelArtGenerator.generateCloud(i * 100, 16, 6);
        const offsetX = (i * 80 + 20) % w;
        const offsetY = 10 + i * 8;
        cloud.forEach(p => {
          ctx.fillStyle = p.color;
          ctx.fillRect(offsetX + p.x, offsetY + p.y, 1, 1);
        });
      }
    }
  }

  drawGround(ctx, scene, palette, w, h) {
    const horizonY = h * 0.55;
    const groundType = scene.layout?.groundType || 'grass';
    const colors = PixelArtGenerator.getTerrainColors(groundType);

    // Base ground
    for (let y = horizonY; y < h; y++) {
      const rowNoise = Math.sin(y * 0.1) * 0.5 + 0.5;
      const color = rowNoise < 0.3 ? colors[0] : rowNoise < 0.7 ? colors[1] : colors[2];
      ctx.fillStyle = color;
      ctx.fillRect(0, y, w, 1);
    }

    // Perspective detail lines
    ctx.strokeStyle = colors[2];
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const y = horizonY + 10 + i * 15;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  drawProps(ctx, props, w, h) {
    const horizonY = h * 0.55;

    props.forEach(prop => {
      const px = Math.floor(prop.x * w);
      const py = Math.floor(horizonY + prop.y * (h - horizonY));
      const scale = prop.scale || 1;

      switch (prop.type) {
        case 'tree': {
          const tree = PixelArtGenerator.generateTree(prop.variant || 0, 10, 16);
          tree.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.fillRect(px + p.x * scale, py + p.y * scale, scale, scale);
          });
          break;
        }
        case 'rock': {
          const rock = PixelArtGenerator.generateRock(prop.variant || 0, 6);
          rock.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.fillRect(px + p.x * scale, py + p.y * scale, scale, scale);
          });
          break;
        }
        case 'building': {
          const building = PixelArtGenerator.generateBuilding(prop.variant || 'stone', 2, 14, 20);
          building.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.fillRect(px + p.x * scale, py + p.y * scale, scale, scale);
          });
          break;
        }
        case 'school': {
          const school = PixelArtGenerator.generateSchool(prop.variant || 0, 20, 18);
          school.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.fillRect(px + p.x * scale, py + p.y * scale, scale, scale);
          });
          break;
        }
        case 'classroom': {
          const classroom = PixelArtGenerator.generateClassroom(prop.variant || 0, 20, 16);
          classroom.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.fillRect(px + p.x * scale, py + p.y * scale, scale, scale);
          });
          break;
        }
        case 'city_building': {
          const city = PixelArtGenerator.generateCityBuilding(prop.variant || 0, 14, 28);
          city.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.fillRect(px + p.x * scale, py + p.y * scale, scale, scale);
          });
          break;
        }
        case 'road': {
          const road = PixelArtGenerator.generateRoad(prop.variant || 0, 20, 4);
          road.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.fillRect(px + p.x * scale, py + p.y * scale, scale, scale);
          });
          break;
        }
        case 'shop': {
          const shop = PixelArtGenerator.generateShop(prop.variant || 0, 16, 14);
          shop.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.fillRect(px + p.x * scale, py + p.y * scale, scale, scale);
          });
          break;
        }
        case 'bench': {
          const bench = PixelArtGenerator.generateBench(prop.variant || 0, 8, 4);
          bench.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.fillRect(px + p.x * scale, py + p.y * scale, scale, scale);
          });
          break;
        }
        case 'light': {
          ctx.fillStyle = '#5d4037';
          ctx.fillRect(px, py, 2, 6);
          ctx.fillStyle = '#ffcc80';
          ctx.fillRect(px - 1, py - 2, 4, 4);
          ctx.fillStyle = 'rgba(255,204,128,0.2)';
          ctx.fillRect(px - 3, py - 4, 8, 8);
          break;
        }
      }
    });
  }

  renderWeather(ctx, scene, w, h) {
    const weather = scene.environment?.weather || 'clear';
    if (weather === 'clear') {
      this.weatherParticles = [];
      return;
    }

    if (weather === 'rain') {
      if (this.weatherParticles.length === 0) {
        this.weatherParticles = PixelArtGenerator.generateRain(60, w, h);
      }
      ctx.strokeStyle = 'rgba(174,194,224,0.6)';
      ctx.lineWidth = 1;
      this.weatherParticles.forEach(drop => {
        drop.y += drop.speed;
        if (drop.y > h) {
          drop.y = -drop.length;
          drop.x = Math.random() * w;
        }
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - 0.5, drop.y + drop.length);
        ctx.stroke();
      });
    } else if (weather === 'snow') {
      if (this.weatherParticles.length === 0) {
        this.weatherParticles = PixelArtGenerator.generateSnow(40, w, h);
      }
      this.weatherParticles.forEach(flake => {
        flake.y += flake.speed;
        flake.x += flake.drift;
        if (flake.y > h) {
          flake.y = -2;
          flake.x = Math.random() * w;
        }
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillRect(flake.x, flake.y, flake.size, flake.size);
      });
    } else if (weather === 'fog') {
      const fogGrad = ctx.createLinearGradient(0, 0, 0, h);
      fogGrad.addColorStop(0, 'rgba(200,200,210,0)');
      fogGrad.addColorStop(0.5, 'rgba(200,200,210,0.15)');
      fogGrad.addColorStop(1, 'rgba(200,200,210,0.3)');
      ctx.fillStyle = fogGrad;
      ctx.fillRect(0, 0, w, h);
    }
  }

  clearCache() {
    this.cachedBackground = null;
    this.lastSceneId = null;
    this.weatherParticles = [];
  }
}
