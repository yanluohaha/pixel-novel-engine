// AnimationEngine.js — 补间、待机动画、行走循环

export class AnimationEngine {
  constructor() {
    this.tweens = [];
    this.animations = new Map(); // characterId -> animation state
    this.transitions = [];
    this.time = 0;
  }

  update(deltaTime) {
    this.time += deltaTime;

    // Update tweens
    this.tweens = this.tweens.filter(tween => {
      tween.elapsed += deltaTime;
      const progress = Math.min(tween.elapsed / tween.duration, 1);
      const eased = this.ease(tween.easing, progress);
      const current = tween.from + (tween.to - tween.from) * eased;
      tween.target[tween.property] = current;

      if (progress >= 1) {
        if (tween.onComplete) tween.onComplete();
        return false;
      }
      return true;
    });

    // Update character animations
    this.animations.forEach((anim, charId) => {
      anim.time += deltaTime;
    });

    // Update transitions
    this.transitions = this.transitions.filter(tr => {
      tr.elapsed += deltaTime;
      return tr.elapsed < tr.duration;
    });
  }

  addTween(target, property, from, to, duration, easing = 'linear', onComplete) {
    target[property] = from;
    this.tweens.push({
      target,
      property,
      from,
      to,
      duration,
      elapsed: 0,
      easing,
      onComplete
    });
  }

  playIdle(characterId) {
    this.animations.set(characterId, {
      type: 'idle',
      time: 0
    });
  }

  playWalk(characterId, direction) {
    this.animations.set(characterId, {
      type: 'walk',
      time: 0,
      direction
    });
  }

  stopAnimation(characterId) {
    this.animations.delete(characterId);
  }

  getIdleOffset(characterId) {
    const anim = this.animations.get(characterId);
    if (!anim || anim.type !== 'idle') return { x: 0, y: 0 };
    const bob = Math.sin(anim.time * 0.003) * 1.5;
    return { x: 0, y: bob };
  }

  getWalkOffset(characterId) {
    const anim = this.animations.get(characterId);
    if (!anim || anim.type !== 'walk') return { x: 0, y: 0 };
    const cycle = (anim.time * 0.005) % (Math.PI * 2);
    const bob = Math.abs(Math.sin(cycle)) * 2;
    const sway = Math.sin(cycle) * 0.5;
    return { x: sway, y: -bob };
  }

  addTransition(type, duration = 500) {
    this.transitions.push({
      type,
      duration,
      elapsed: 0
    });
  }

  drawTransitions(ctx, width, height) {
    this.transitions.forEach(tr => {
      const progress = tr.elapsed / tr.duration;
      if (tr.type === 'fade_in') {
        ctx.fillStyle = `rgba(0,0,0,${1 - progress})`;
        ctx.fillRect(0, 0, width, height);
      } else if (tr.type === 'fade_out') {
        ctx.fillStyle = `rgba(0,0,0,${progress})`;
        ctx.fillRect(0, 0, width, height);
      } else if (tr.type === 'wipe') {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width * progress, height);
      }
    });
  }

  ease(type, t) {
    switch (type) {
      case 'ease_in': return t * t;
      case 'ease_out': return 1 - (1 - t) * (1 - t);
      case 'ease_in_out': return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      default: return t;
    }
  }
}
