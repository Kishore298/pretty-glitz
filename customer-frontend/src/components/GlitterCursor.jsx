import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

// Ambient background glitter – floating particles in the brand color palette
// Works beautifully in BOTH dark mode (vibrant on dark) and light mode (soft pastel on white)
const GlitterBackground = () => {
  const canvasRef = useRef(null);
  const { isDark } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Premium gold palette depending on theme
    const COLORS = isDark
      ? ['#D4AF37', '#F5C542', '#FFD700', '#FFE08A'] // Bright gold for dark mode
      : ['#FFB90F', '#FFC125', '#FFD700', '#FF8C00']; // Brighter, more vibrant gold for light mode

    class Particle {
      constructor(initialY = null) {
        this.reset(initialY !== null ? initialY : Math.random() * height);
      }
      reset(startY) {
        this.x = Math.random() * width;
        this.y = startY !== undefined ? startY : height + 10;
        this.radius = isDark ? (Math.random() * 1.8 + 0.35) : (Math.random() * 2.2 + 0.6);
        this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
        this.speedY = -(Math.random() * 0.6 + 0.15);
        this.speedX = Math.random() * 0.5 - 0.25;
        this.opacity = isDark ? (Math.random() * 0.8 + 0.2) : (Math.random() * 0.5 + 0.5);
        this.opacityDir = Math.random() > 0.5 ? 1 : -1;
        this.opacitySpeed = Math.random() * 0.02 + 0.008;
        // Some particles are diamond-shaped sparkles
        this.shape = Math.random() < 0.25 ? 'diamond' : 'circle';
        this.rotation = Math.random() * Math.PI;
        this.rotSpeed = (Math.random() - 0.5) * 0.02;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.opacity += this.opacitySpeed * this.opacityDir;
        const lowerBound = isDark ? -0.2 : 0.3;
        if (this.opacity >= 1.2 || this.opacity <= lowerBound) this.opacityDir *= -1;
        this.rotation += this.rotSpeed;
        if (this.y < -10) this.reset();
        if (this.x < -10) this.x = width + 5;
        if (this.x > width + 10) this.x = -5;
      }
      draw() {
        const safeOpacity = Math.max(0, Math.min(1, this.opacity));
        if (safeOpacity <= 0) return;

        ctx.save();
        ctx.globalAlpha = safeOpacity;
        ctx.fillStyle = this.color;

        // Add subtle shadow for visibility and brighter glow
        ctx.shadowColor = isDark ? 'rgba(255, 215, 0, 0.4)' : 'rgba(255, 185, 15, 0.4)';
        ctx.shadowBlur = isDark ? 6 : 4;

        if (this.shape === 'diamond') {
          // Diamond sparkle
          ctx.translate(this.x, this.y);
          ctx.rotate(this.rotation);
          const r = this.radius * 1.8;
          ctx.beginPath();
          ctx.moveTo(0, -r);
          ctx.lineTo(r * 0.5, 0);
          ctx.lineTo(0, r);
          ctx.lineTo(-r * 0.5, 0);
          ctx.closePath();
          ctx.fill();

          // Glow halo for diamonds
          ctx.globalAlpha = safeOpacity * 0.25;
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2.5);
          grad.addColorStop(0, this.color);
          grad.addColorStop(1, isDark ? 'rgba(0,0,0,0)' : 'rgba(255,255,255,0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, r * 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Soft circle
          ctx.translate(this.x, this.y);
          ctx.beginPath();
          ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
          ctx.fill();

          // Glow for larger circles
          if (this.radius > 1.5) {
            ctx.globalAlpha = safeOpacity * 0.2;
            const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius * 3);
            grad.addColorStop(0, this.color);
            grad.addColorStop(1, isDark ? 'rgba(0,0,0,0)' : 'rgba(255,255,255,0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      }
    }

    // ~1 particle per 18000px² – scale intelligently, max 75
    const count = Math.min(Math.floor((width * height) / 18000), 75);
    let particles = Array.from({ length: count }, () => new Particle());

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      const newCount = Math.min(Math.floor((width * height) / 18000), 75);
      particles = Array.from({ length: newCount }, () => new Particle());
    };
    window.addEventListener('resize', handleResize);

    let rafId;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => { p.update(); p.draw(); });
      rafId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(rafId);
    };
  }, [isDark]);

  return <canvas ref={canvasRef} id="glitter-canvas" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 0 }} />;
};

export default GlitterBackground;
