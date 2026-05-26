// PixelArtGenerator.js — 程序化像素图案生成

export class PixelArtGenerator {
  // 生成地形像素网格
  static generateTerrain(type, width, height) {
    const pixels = [];
    const colors = this.getTerrainColors(type);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const noise = Math.random();
        const color = noise < 0.3 ? colors[0] : noise < 0.7 ? colors[1] : colors[2];
        pixels.push({ x, y, color });
      }
    }
    return pixels;
  }

  static getTerrainColors(type) {
    const map = {
      grass: ['#2d5016', '#3a6b1a', '#1e3d0f'],
      dirt: ['#5d4037', '#6d4c41', '#4e342e'],
      stone: ['#616161', '#757575', '#424242'],
      sand: ['#f9a825', '#fbc02d', '#f57f17'],
      snow: ['#e0e0e0', '#f5f5f5', '#bdbdbd'],
      wood: ['#5d4037', '#6d4c41', '#4e342e'],
      cobblestone: ['#757575', '#9e9e9e', '#616161'],
      floor: ['#d7ccc8', '#efebe9', '#bcaaa4'],
      carpet: ['#5d4037', '#6d4c41', '#4e342e'],
      tile: ['#eceff1', '#cfd8dc', '#b0bec5'],
      linoleum: ['#e8eaf6', '#c5cae9', '#9fa8da'],
      concrete: ['#9e9e9e', '#bdbdbd', '#757575'],
      asphalt: ['#424242', '#616161', '#212121']
    };
    return map[type] || map.grass;
  }

  // 生成云朵形状
  static generateCloud(seed, width = 20, height = 8) {
    const pixels = [];
    const rng = this.seededRandom(seed);
    const centerX = width / 2;
    const centerY = height / 2;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = (x - centerX) / (width / 2);
        const dy = (y - centerY) / (height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);
        const noise = rng();
        if (dist < 0.7 + noise * 0.4) {
          pixels.push({ x, y, color: noise > 0.5 ? '#e0e0e0' : '#f5f5f5' });
        }
      }
    }
    return pixels;
  }

  // 生成星空
  static generateStarField(count, width, height, seed = 42) {
    const rng = this.seededRandom(seed);
    const stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.floor(rng() * width),
        y: Math.floor(rng() * height),
        brightness: 0.5 + rng() * 0.5,
        size: rng() > 0.9 ? 2 : 1
      });
    }
    return stars;
  }

  // 生成树木
  static generateTree(variant = 0, width = 12, height = 20) {
    const pixels = [];
    const rng = this.seededRandom(variant * 100);
    const trunkColor = '#5d4037';
    const leafColors = ['#2d5016', '#3a6b1a', '#1e3d0f', '#4a7c23'];

    const trunkX = Math.floor(width / 2);
    for (let y = height - 4; y < height; y++) {
      pixels.push({ x: trunkX, y, color: trunkColor });
      if (rng() > 0.5) pixels.push({ x: trunkX - 1, y, color: trunkColor });
    }

    for (let layer = 0; layer < 3; layer++) {
      const layerY = height - 6 - layer * 4;
      const layerWidth = 4 + (2 - layer) * 2;
      for (let y = layerY; y < layerY + 4; y++) {
        const rowWidth = layerWidth - (y - layerY);
        for (let x = trunkX - rowWidth; x <= trunkX + rowWidth; x++) {
          if (x >= 0 && x < width && rng() > 0.15) {
            pixels.push({ x, y, color: leafColors[Math.floor(rng() * leafColors.length)] });
          }
        }
      }
    }
    return pixels;
  }

  // 生成建筑轮廓
  static generateBuilding(style, stories = 2, width = 16, height = 24) {
    const pixels = [];
    const rng = this.seededRandom(stories * 50);
    const wallColor = style === 'stone' ? '#757575' : style === 'wood' ? '#6d4c41' : '#bdbdbd';
    const roofColor = style === 'stone' ? '#616161' : style === 'wood' ? '#5d4037' : '#8d6e63';
    const windowColor = '#ffcc80';

    for (let y = 4; y < height; y++) {
      for (let x = 2; x < width - 2; x++) {
        pixels.push({ x, y, color: wallColor });
      }
    }

    for (let y = 0; y < 4; y++) {
      const rw = width / 2 - y;
      for (let x = Math.floor(width / 2 - rw); x < Math.ceil(width / 2 + rw); x++) {
        pixels.push({ x, y, color: roofColor });
      }
    }

    const windowsPerRow = Math.floor((width - 6) / 3);
    for (let s = 0; s < stories; s++) {
      const wy = 6 + s * 8;
      for (let w = 0; w < windowsPerRow; w++) {
        const wx = 3 + w * 3;
        pixels.push({ x: wx, y: wy, color: windowColor });
        pixels.push({ x: wx + 1, y: wy, color: windowColor });
      }
    }

    for (let y = height - 5; y < height; y++) {
      pixels.push({ x: width / 2 - 1, y, color: '#3e2723' });
      pixels.push({ x: width / 2, y, color: '#3e2723' });
    }

    return pixels;
  }

  // 生成学校建筑
  static generateSchool(variant = 0, width = 20, height = 18) {
    const pixels = [];
    const rng = this.seededRandom(variant * 77);
    const wallColor = '#cfd8dc';
    const roofColor = '#455a64';
    const windowColor = '#81d4fa';
    const doorColor = '#5d4037';

    // 主墙体
    for (let y = 3; y < height; y++) {
      for (let x = 1; x < width - 1; x++) {
        pixels.push({ x, y, color: wallColor });
      }
    }

    // 平屋顶
    for (let x = 0; x < width; x++) {
      pixels.push({ x, y: 0, color: roofColor });
      pixels.push({ x, y: 1, color: roofColor });
      pixels.push({ x, y: 2, color: roofColor });
    }

    // 窗户（多排）
    for (let row = 0; row < 2; row++) {
      const wy = 5 + row * 6;
      for (let wx = 3; wx < width - 3; wx += 4) {
        pixels.push({ x: wx, y: wy, color: windowColor });
        pixels.push({ x: wx + 1, y: wy, color: windowColor });
        pixels.push({ x: wx, y: wy + 1, color: windowColor });
        pixels.push({ x: wx + 1, y: wy + 1, color: windowColor });
      }
    }

    // 大门
    for (let y = height - 5; y < height; y++) {
      pixels.push({ x: width / 2 - 1, y, color: doorColor });
      pixels.push({ x: width / 2, y, color: doorColor });
      pixels.push({ x: width / 2 + 1, y, color: doorColor });
    }

    // 校旗
    pixels.push({ x: width - 3, y: 3, color: '#b71c1c' });
    pixels.push({ x: width - 2, y: 3, color: '#b71c1c' });
    pixels.push({ x: width - 3, y: 4, color: '#fff' });
    pixels.push({ x: width - 2, y: 4, color: '#fff' });

    return pixels;
  }

  // 生成教室/室内场景
  static generateClassroom(variant = 0, width = 20, height = 16) {
    const pixels = [];
    const floorColor = '#d7ccc8';
    const wallColor = '#efebe9';
    const deskColor = '#8d6e63';
    const chairColor = '#5d4037';
    const boardColor = '#1b5e20';

    // 地板
    for (let y = height / 2; y < height; y++) {
      for (let x = 0; x < width; x++) {
        pixels.push({ x, y, color: (x + y) % 2 === 0 ? floorColor : '#bcaaa4' });
      }
    }

    // 后墙
    for (let x = 0; x < width; x++) {
      pixels.push({ x, y: 0, color: wallColor });
      pixels.push({ x, y: 1, color: wallColor });
    }

    // 黑板
    for (let x = 4; x < width - 4; x++) {
      pixels.push({ x, y: 1, color: boardColor });
      pixels.push({ x, y: 2, color: boardColor });
    }

    // 课桌椅
    for (let row = 0; row < 3; row++) {
      const dy = 6 + row * 4;
      for (let col = 0; col < 4; col++) {
        const dx = 2 + col * 5;
        // 桌子
        pixels.push({ x: dx, y: dy, color: deskColor });
        pixels.push({ x: dx + 1, y: dy, color: deskColor });
        pixels.push({ x: dx + 2, y: dy, color: deskColor });
        // 椅子
        pixels.push({ x: dx + 1, y: dy + 2, color: chairColor });
      }
    }

    return pixels;
  }

  // 生成城市建筑
  static generateCityBuilding(variant = 0, width = 14, height = 28) {
    const pixels = [];
    const rng = this.seededRandom(variant * 123);
    const wallColor = rng() > 0.5 ? '#90a4ae' : '#b0bec5';
    const windowColor = rng() > 0.7 ? '#ffeb3b' : '#37474f';
    const roofColor = '#546e7a';

    // 墙体
    for (let y = 2; y < height; y++) {
      for (let x = 2; x < width - 2; x++) {
        pixels.push({ x, y, color: wallColor });
      }
    }

    // 屋顶
    for (let x = 1; x < width - 1; x++) {
      pixels.push({ x, y: 0, color: roofColor });
      pixels.push({ x, y: 1, color: roofColor });
    }

    // 窗户网格
    for (let wy = 4; wy < height - 2; wy += 4) {
      for (let wx = 3; wx < width - 3; wx += 3) {
        pixels.push({ x: wx, y: wy, color: windowColor });
        pixels.push({ x: wx + 1, y: wy, color: windowColor });
      }
    }

    return pixels;
  }

  // 生成道路
  static generateRoad(variant = 0, width = 20, height = 4) {
    const pixels = [];
    const asphalt = '#424242';
    const line = '#ffeb3b';

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (y === Math.floor(height / 2) && x % 4 < 2) {
          pixels.push({ x, y, color: line });
        } else {
          pixels.push({ x, y, color: asphalt });
        }
      }
    }
    return pixels;
  }

  // 生成商店/便利店
  static generateShop(variant = 0, width = 16, height = 14) {
    const pixels = [];
    const wallColor = '#ffcc80';
    const awningColor = '#e53935';
    const windowColor = '#b3e5fc';
    const doorColor = '#5d4037';

    // 墙体
    for (let y = 3; y < height; y++) {
      for (let x = 1; x < width - 1; x++) {
        pixels.push({ x, y, color: wallColor });
      }
    }

    // 遮阳篷
    for (let x = 1; x < width - 1; x++) {
      pixels.push({ x, y: 2, color: x % 2 === 0 ? awningColor : '#fff' });
    }

    // 大橱窗
    for (let x = 3; x < 8; x++) {
      for (let y = 5; y < 10; y++) {
        pixels.push({ x, y, color: windowColor });
      }
    }

    // 门
    for (let y = 5; y < height; y++) {
      pixels.push({ x: 10, y, color: doorColor });
      pixels.push({ x: 11, y, color: doorColor });
    }

    return pixels;
  }

  // 生成公园长椅
  static generateBench(variant = 0, width = 8, height = 4) {
    const pixels = [];
    const woodColor = '#8d6e63';
    const metalColor = '#616161';

    for (let x = 0; x < width; x++) {
      pixels.push({ x, y: 1, color: woodColor });
      pixels.push({ x, y: 2, color: woodColor });
    }
    pixels.push({ x: 1, y: 3, color: metalColor });
    pixels.push({ x: width - 2, y: 3, color: metalColor });

    return pixels;
  }

  // 生成岩石
  static generateRock(variant = 0, size = 8) {
    const pixels = [];
    const rng = this.seededRandom(variant * 37);
    const colors = ['#757575', '#616161', '#9e9e9e'];
    const center = size / 2;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = (x - center) / center;
        const dy = (y - center) / center;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.8 + rng() * 0.3 && y > size / 4) {
          pixels.push({ x, y, color: colors[Math.floor(rng() * colors.length)] });
        }
      }
    }
    return pixels;
  }

  // 生成雨滴粒子
  static generateRain(count, width, height) {
    const drops = [];
    for (let i = 0; i < count; i++) {
      drops.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: 2 + Math.random() * 3,
        length: 2 + Math.floor(Math.random() * 3)
      });
    }
    return drops;
  }

  // 生成雪花粒子
  static generateSnow(count, width, height) {
    const flakes = [];
    for (let i = 0; i < count; i++) {
      flakes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: 0.3 + Math.random() * 0.7,
        drift: (Math.random() - 0.5) * 0.5,
        size: Math.random() > 0.7 ? 2 : 1
      });
    }
    return flakes;
  }

  // 简单伪随机数生成器 (seeded)
  static seededRandom(seed) {
    let s = seed;
    return function() {
      s = (s * 16807 + 0) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }
}
