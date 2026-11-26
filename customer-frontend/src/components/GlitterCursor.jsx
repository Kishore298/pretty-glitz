import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * Ambient background glitter – floating gold particles rendered using
 * pre-baked offscreen canvas sprites (no per-frame shadowBlur or gradient allocations)
 * and paused automatically when the browser tab is hidden or reduced-motion is requested.
 */
const GlitterBackground = () => {
  const canvasRef = useRef(null);
  const { isDark } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return undefined;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const COLORS = isDark
      ? ['#C9A84C', '#D4AF37', '#FFD700', '#E8C85A']
      : ['#C9A84C', '#D4AF37', '#B8975A', '#A67D3D'];

    // Pre-bake lightweight radial glow sprite once per color (zero per-frame gradient allocations)
    const SPRITE_SIZE = 24;
    const HALF = SPRITE_SIZE / 2;
    const sprites = COLORS.map((color) => {
      const off = document.createElement('canvas');
      off.width = SPRITE_SIZE;
      off.height = SPRITE_SIZE;
      const octx = off.getContext('2d');
      const grad = octx.createRadialGradient(HALF, HALF, 0, HALF, HALF, HALF);
      grad.addColorStop(0, color);
      grad.addColorStop(0.35, color);
      grad.addColorStop(1, 'rgba(201, 168, 76, 0)');
      octx.fillStyle = grad;
      octx.beginPath();
      octx.arc(HALF, HALF, HALF, 0, Math.PI * 2);
      octx.fill();
      return off;
    });

    class Particle {
      constructor(initialY = null) {
        this.reset(initialY !== null ? initialY : Math.random() * height);
      }
      reset(startY) {
        this.x = Math.random() * width;
        this.y = startY !== undefined ? startY : height + 10;
        this.radius = isDark ? (Math.random() * 1.6 + 0.4) : (Math.random() * 1.3 + 0.35);
        this.colorIdx = Math.floor(Math.random() * COLORS.length);
        this.speedY = -(Math.random() * 0.45 + 0.12);
        this.speedX = Math.random() * 0.35 - 0.175;
        this.opacity = isDark ? (Math.random() * 0.65 + 0.2) : (Math.random() * 0.28 + 0.12);
        this.opacityDir = Math.random() > 0.5 ? 1 : -1;
        this.opacitySpeed = Math.random() * 0.012 + 0.004;
        this.shape = Math.random() < 0.2 ? 1 : 0; // 1: diamond, 0: circle
        this.rotation = Math.random() * Math.PI;
        this.rotSpeed = (Math.random() - 0.5) * 0.014;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.opacity += this.opacitySpeed * this.opacityDir;
        const upperBound = isDark ? 0.95 : 0.45;
        if (this.opacity >= upperBound || this.opacity <= 0.05) this.opacityDir *= -1;
        if (this.shape === 1) this.rotation += this.rotSpeed;
        if (this.y < -10) this.reset();
        if (this.x < -10) this.x = width + 5;
        if (this.x > width + 10) this.x = -5;
      }
      draw() {
        const safeOpacity = this.opacity < 0.02 ? 0.02 : this.opacity > 1 ? 1 : this.opacity;
        ctx.globalAlpha = safeOpacity;
        const sprite = sprites[this.colorIdx];

        if (this.shape === 1) {
          ctx.save();
          ctx.translate(this.x, this.y);
          ctx.rotate(this.rotation);
          const r = this.radius * 2.1;
          ctx.fillStyle = COLORS[this.colorIdx];
          ctx.beginPath();
          ctx.moveTo(0, -r);
          ctx.lineTo(r * 0.5, 0);
          ctx.lineTo(0, r);
          ctx.lineTo(-r * 0.5, 0);
          ctx.closePath();
          ctx.fill();
          const glowSize = r * 3.2;
          ctx.globalAlpha = safeOpacity * 0.45;
          ctx.drawImage(sprite, -glowSize / 2, -glowSize / 2, glowSize, glowSize);
          ctx.restore();
        } else {
          const size = this.radius * 5;
          ctx.drawImage(sprite, this.x - size / 2, this.y - size / 2, size, size);
        }
      }
    }

    const baseDensity = isDark ? 24000 : 34000;
    const maxParticles = isDark ? 45 : 30;
    const count = Math.min(Math.floor((width * height) / baseDensity), maxParticles);
    let particles = Array.from({ length: count }, () => new Particle());

    let resizeTimer = null;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        const newCount = Math.min(Math.floor((width * height) / baseDensity), maxParticles);
        particles = Array.from({ length: newCount }, () => new Particle());
      }, 150);
    };
    window.addEventListener('resize', handleResize, { passive: true });

    let rafId = null;
    const animate = () => {
      if (document.hidden) {
        rafId = null;
        return;
      }
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < particles.length; i += 1) {
        particles[i].update();
        particles[i].draw();
      }
      ctx.globalAlpha = 1;
      rafId = requestAnimationFrame(animate);
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && rafId === null) {
        rafId = requestAnimationFrame(animate);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (!document.hidden) {
      rafId = requestAnimationFrame(animate);
    }

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      id="glitter-canvas"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
};

export default GlitterBackground;
