// CharacterRenderer.js — 角色精灵渲染与动画

import { CANVAS_WIDTH, CANVAS_HEIGHT, EXPRESSION_PIXELS } from '../engine/Constants.js';

export class CharacterRenderer {
  constructor(animationEngine) {
    this.animEngine = animationEngine;
    this.spriteCache = new Map();
  }

  render(ctx, characters) {
    const sorted = Object.values(characters)
      .filter(c => c.state?.visible !== false)
      .sort((a, b) => (a.state?.position?.y || 0) - (b.state?.position?.y || 0));

    sorted.forEach(char => {
      this.drawCharacter(ctx, char);
    });
  }

  drawCharacter(ctx, char) {
    const pos = char.state?.position || { x: 0.5, y: 0.7 };
    const x = Math.floor(pos.x * CANVAS_WIDTH);
    const y = Math.floor(pos.y * CANVAS_HEIGHT);
    const scale = 2;
    const facing = char.state?.facing || 'right';

    const pose = char.state?.pose || 'idle';
    let offset = { x: 0, y: 0 };
    if (pose === 'idle') {
      offset = this.animEngine.getIdleOffset(char.id);
    } else if (pose === 'walking') {
      offset = this.animEngine.getWalkOffset(char.id);
    }

    const drawX = x + offset.x;
    const drawY = y + offset.y;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(drawX, drawY + 18, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw sprite
    this.drawSprite(ctx, char, drawX, drawY, scale, facing);

    // Name tag
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    const name = char.displayName || char.name;
    const nameWidth = name.length * 6 + 4;
    ctx.fillRect(drawX - nameWidth / 2, drawY - 26, nameWidth, 10);
    ctx.fillStyle = '#fff';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(name, drawX, drawY - 18);
  }

  drawSprite(ctx, char, cx, cy, scale, facing) {
    const palette = char.sprite || {};
    const bodyColor = palette.bodyColor || '#ffdbac';
    const hairColor = palette.hairColor || '#5d4037';
    const eyeColor = palette.eyeColor || '#3e2723';
    const outfitColor = palette.outfitColor || '#1565c0';
    const expression = char.state?.expression || 'neutral';

    // Body pixels (16x20 grid, centered)
    const bodyPixels = this.getBodyPixels();
    const hairPixels = this.getHairPixels(palette.hairStyle);
    const outfitPixels = this.getOutfitPixels(palette.outfitStyle);
    const exprPixels = EXPRESSION_PIXELS[expression] || EXPRESSION_PIXELS.neutral;

    const drawPixel = (px, py, color) => {
      const fx = facing === 'left' ? -px : px;
      ctx.fillStyle = color;
      ctx.fillRect(cx + fx * scale - 8 * scale, cy + py * scale - 20 * scale, scale, scale);
    };

    // Draw outfit (behind body)
    outfitPixels.forEach(p => drawPixel(p.x, p.y, outfitColor));

    // Draw body
    bodyPixels.forEach(p => drawPixel(p.x, p.y, bodyColor));

    // Draw hair
    hairPixels.forEach(p => drawPixel(p.x, p.y, hairColor));

    // Draw eyes
    if (exprPixels.eyes) {
      exprPixels.eyes.forEach(p => drawPixel(p.x, p.y, eyeColor));
    }

    // Draw mouth
    if (exprPixels.mouth) {
      exprPixels.mouth.forEach(p => drawPixel(p.x, p.y, '#b71c1c'));
    }
  }

  getBodyPixels() {
    const pixels = [];
    // Head
    for (let y = 2; y < 10; y++) {
      for (let x = 4; x < 12; x++) {
        pixels.push({ x, y });
      }
    }
    // Neck
    pixels.push({ x: 7, y: 10 }, { x: 8, y: 10 });
    // Torso
    for (let y = 11; y < 17; y++) {
      for (let x = 5; x < 11; x++) {
        pixels.push({ x, y });
      }
    }
    // Arms
    for (let y = 11; y < 15; y++) {
      pixels.push({ x: 3, y }, { x: 4, y });
      pixels.push({ x: 11, y }, { x: 12, y });
    }
    // Legs
    for (let y = 17; y < 20; y++) {
      pixels.push({ x: 6, y }, { x: 9, y });
    }
    return pixels;
  }

  getHairPixels(style = 'default') {
    const pixels = [];

    switch (style) {
      case 'short':
        for (let x = 3; x < 13; x++) {
          pixels.push({ x, y: 1 });
          pixels.push({ x, y: 2 });
        }
        for (let y = 2; y < 5; y++) {
          pixels.push({ x: 3, y });
          pixels.push({ x: 12, y });
        }
        break;
      case 'long':
        for (let x = 3; x < 13; x++) {
          pixels.push({ x, y: 1 });
          pixels.push({ x, y: 2 });
        }
        for (let y = 2; y < 10; y++) {
          pixels.push({ x: 3, y });
          pixels.push({ x: 12, y });
        }
        break;
      case 'ponytail':
        for (let x = 3; x < 13; x++) {
          pixels.push({ x, y: 1 });
          pixels.push({ x, y: 2 });
        }
        for (let y = 2; y < 5; y++) {
          pixels.push({ x: 3, y });
          pixels.push({ x: 12, y });
        }
        // Ponytail
        for (let y = 3; y < 8; y++) {
          pixels.push({ x: 12, y });
          pixels.push({ x: 13, y });
        }
        break;
      case 'spiky':
        for (let x = 3; x < 13; x++) {
          pixels.push({ x, y: 2 });
        }
        pixels.push({ x: 3, y: 1 });
        pixels.push({ x: 5, y: 0 });
        pixels.push({ x: 7, y: 1 });
        pixels.push({ x: 9, y: 0 });
        pixels.push({ x: 11, y: 1 });
        break;
      default:
        for (let x = 3; x < 13; x++) {
          pixels.push({ x, y: 1 });
          pixels.push({ x, y: 2 });
        }
        for (let y = 2; y < 6; y++) {
          pixels.push({ x: 3, y });
          pixels.push({ x: 12, y });
        }
        pixels.push({ x: 4, y: 3 }, { x: 5, y: 3 });
        pixels.push({ x: 10, y: 3 }, { x: 11, y: 3 });
    }
    return pixels;
  }

  getOutfitPixels(style = 'default') {
    const pixels = [];

    switch (style) {
      case 'uniform':
        // 校服/制服样式
        for (let y = 11; y < 16; y++) {
          for (let x = 5; x < 11; x++) {
            if (y === 11 || x === 5 || x === 10) {
              pixels.push({ x, y });
            }
          }
        }
        // 领带
        pixels.push({ x: 8, y: 11 });
        pixels.push({ x: 8, y: 12 });
        // 裤子/裙子
        for (let y = 16; y < 20; y++) {
          pixels.push({ x: 5, y }, { x: 6, y });
          pixels.push({ x: 9, y }, { x: 10, y });
        }
        break;
      case 'dress':
        // 连衣裙
        for (let y = 11; y < 18; y++) {
          for (let x = 5; x < 11; x++) {
            pixels.push({ x, y });
          }
        }
        break;
      case 'suit':
        // 西装
        for (let y = 11; y < 16; y++) {
          for (let x = 5; x < 11; x++) {
            pixels.push({ x, y });
          }
        }
        // 领子
        pixels.push({ x: 6, y: 11 });
        pixels.push({ x: 9, y: 11 });
        for (let y = 16; y < 20; y++) {
          pixels.push({ x: 5, y }, { x: 6, y });
          pixels.push({ x: 9, y }, { x: 10, y });
        }
        break;
      default:
        for (let y = 11; y < 16; y++) {
          for (let x = 5; x < 11; x++) {
            if (y === 11 || x === 5 || x === 10) {
              pixels.push({ x, y });
            }
          }
        }
        for (let y = 16; y < 20; y++) {
          pixels.push({ x: 5, y }, { x: 6, y });
          pixels.push({ x: 9, y }, { x: 10, y });
        }
    }
    return pixels;
  }

  getHitbox(char) {
    const pos = char.state?.position || { x: 0.5, y: 0.7 };
    const x = pos.x * CANVAS_WIDTH;
    const y = pos.y * CANVAS_HEIGHT;
    return {
      x: x - 16,
      y: y - 40,
      width: 32,
      height: 48,
      characterId: char.id
    };
  }
}
