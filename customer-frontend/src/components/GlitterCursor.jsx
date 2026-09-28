import React, { useEffect, useRef } from 'react';

const GlitterCursor = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    let particles = [];
    const colors = ['#FF1493', '#8A2BE2', '#FF00FF', '#FF8C00', '#FFD700', '#ffffff']; // Added white for extra sparkle

    class Particle {
      constructor() {
        this.reset(true);
      }
      reset(initial = false) {
        this.x = Math.random() * width;
        this.y = initial ? Math.random() * height : height + 10;
        this.size = Math.random() * 2 + 0.5;
        this.speedY = -(Math.random() * 0.5 + 0.2); // Float upwards slowly
        this.speedX = Math.random() * 0.4 - 0.2; // Drift left/right slightly
        this.color = colors[Math.floor(Math.random() * colors.length)];
        // Opacity oscillation
        this.life = Math.random() * Math.PI * 2;
        this.lifeSpeed = Math.random() * 0.02 + 0.01;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life += this.lifeSpeed;
        
        // Wrap around top to bottom
        if (this.y < -10) {
          this.reset();
        }
      }
      draw() {
        // Opacity pulses using sine wave between 0.1 and 0.8
        const opacity = (Math.sin(this.life) + 1) / 2 * 0.7 + 0.1;
        ctx.globalAlpha = opacity;
        ctx.fillStyle = this.color;
        
        // Draw tiny circle (looks better on dark mode)
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Occasional extra sparkle for slightly larger particles
        if (this.size > 1.5 && opacity > 0.6) {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
          ctx.globalAlpha = opacity * 0.3;
          ctx.fill();
        }
      }
    }

    // Adjust particle count based on screen size (prevent overload)
    const particleCount = Math.floor((width * height) / 10000); // 1 particle per 10k sq pixels
    
    for(let i=0; i<particleCount; i++) {
      particles.push(new Particle());
    }

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);

    let animationFrameId;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{ mixBlendMode: 'screen', opacity: 0.6 }} // Screen blend works great on dark mode, fine on light mode.
    />
  );
};

export default GlitterCursor;
