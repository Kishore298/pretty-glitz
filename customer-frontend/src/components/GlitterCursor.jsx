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
      ? ['#C9A84C', '#D4AF37', '#FFD700', '#E8C85A']
      : ['#C9A84C', '#D4AF37', '#B8975A', '#A67D3D'];

    class Particle {
      constructor(initialY = null) {
        this.reset(initialY !== null ? initialY : Math.random() * height);
      }
      reset(startY) {
        this.x = Math.random() * width;
        this.y = startY !== undefined ? startY : height + 10;
        // Light mode: smaller, subtler particles
        this.radius = isDark ? (Math.random() * 1.6 + 0.3) : (Math.random() * 1.4 + 0.3);
        this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
        this.speedY = -(Math.random() * 0.5 + 0.12);
        this.speedX = Math.random() * 0.4 - 0.2;
        this.opacity = isDark ? (Math.random() * 0.7 + 0.2) : (Math.random() * 0.3 + 0.15);
        this.opacityDir = Math.random() > 0.5 ? 1 : -1;
        this.opacitySpeed = Math.random() * 0.015 + 0.005;
        this.shape = Math.random() < 0.2 ? 'diamond' : 'circle';
        this.rotation = Math.random() * Math.PI;
        this.rotSpeed = (Math.random() - 0.5) * 0.015;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.opacity += this.opacitySpeed * this.opacityDir;
        const lowerBound = isDark ? 0.05 : 0.05;
        const upperBound = isDark ? 1.0 : 0.5;
        if (this.opacity >= upperBound || this.opacity <= lowerBound) this.opacityDir *= -1;
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

        ctx.shadowColor = isDark ? 'rgba(201, 168, 76, 0.3)' : 'rgba(166, 125, 61, 0.2)';
        ctx.shadowBlur = isDark ? 5 : 3;

        if (this.shape === 'diamond') {
          ctx.translate(this.x, this.y);
          ctx.rotate(this.rotation);
          const r = this.radius * 1.6;
          ctx.beginPath();
          ctx.moveTo(0, -r);
          ctx.lineTo(r * 0.5, 0);
          ctx.lineTo(0, r);
          ctx.lineTo(-r * 0.5, 0);
          ctx.closePath();
          ctx.fill();

          ctx.globalAlpha = safeOpacity * 0.15;
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2);
          grad.addColorStop(0, this.color);
          grad.addColorStop(1, isDark ? 'rgba(0,0,0,0)' : 'rgba(253,251,247,0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, r * 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.translate(this.x, this.y);
          ctx.beginPath();
          ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
          ctx.fill();

          if (this.radius > 1.2) {
            ctx.globalAlpha = safeOpacity * 0.12;
            const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius * 2.5);
            grad.addColorStop(0, this.color);
            grad.addColorStop(1, isDark ? 'rgba(0,0,0,0)' : 'rgba(253,251,247,0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      }
    }

    // Fewer particles on light mode, max 60 total
    const baseDensity = isDark ? 20000 : 30000;
    const maxParticles = isDark ? 60 : 40;
    const count = Math.min(Math.floor((width * height) / baseDensity), maxParticles);
    let particles = Array.from({ length: count }, () => new Particle());

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      const newCount = Math.min(Math.floor((width * height) / baseDensity), maxParticles);
      particles = Array.from({ length: newCount }, () => new Particle());
    };
    window.addEventListener('resize', handleResize);

    let rafId;
    const animate = () => {
      // Pause when tab is not visible
      if (document.hidden) {
        rafId = requestAnimationFrame(animate);
        return;
      }
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
