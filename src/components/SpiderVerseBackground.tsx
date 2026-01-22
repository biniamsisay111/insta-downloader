'use client';

import React, { useEffect, useRef } from 'react';

const AntigravityBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;

        const particles: Particle[] = [];
        const mouse = { x: -1000, y: -1000, vx: 0, vy: 0 };
        let lastMouse = { x: 0, y: 0 };

        // Grid settings
        const spacing = 45;
        const rows = Math.ceil(height / spacing) + 1;
        const cols = Math.ceil(width / spacing) + 1;

        class Particle {
            x: number;
            y: number;
            baseX: number;
            baseY: number;
            vx: number;
            vy: number;
            size: number;
            color: string;
            angle: number;

            constructor(x: number, y: number) {
                this.x = x;
                this.y = y;
                this.baseX = x;
                this.baseY = y;
                this.vx = 0;
                this.vy = 0;
                this.size = 2;
                this.angle = Math.random() * Math.PI * 2;

                const colors = ['#0ea5e9', '#6366f1', '#d946ef', '#f43f5e'];
                this.color = colors[Math.floor(Math.random() * colors.length)];
            }

            update() {
                // Repulsion from mouse
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const forceThreshold = 150;

                if (distance < forceThreshold) {
                    const force = (forceThreshold - distance) / forceThreshold;

                    // Move away from mouse
                    const dirX = dx / distance;
                    const dirY = dy / distance;

                    this.vx -= dirX * force * 5;
                    this.vy -= dirY * force * 5;
                }

                // Return to base position (Restoration force)
                const dxBase = this.baseX - this.x;
                const dyBase = this.baseY - this.y;
                this.vx += dxBase * 0.05;
                this.vy += dyBase * 0.05;

                // Friction
                this.vx *= 0.92;
                this.vy *= 0.92;

                this.x += this.vx;
                this.y += this.vy;

                // Update angle based on velocity or just slow rotation
                this.angle += (this.vx + this.vy) * 0.1 + 0.01;
            }

            draw() {
                if (!ctx) return;
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.angle);

                ctx.fillStyle = this.color;
                // Draw a tiny shard/dash
                ctx.fillRect(-this.size, -this.size / 4, this.size * 2, this.size / 2);

                // Subtle glow
                ctx.shadowBlur = 5;
                ctx.shadowColor = this.color;

                ctx.restore();
            }
        }

        // Initialize particles in a grid
        function init() {
            particles.length = 0;
            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    particles.push(new Particle(x * spacing, y * spacing));
                }
            }
        }

        init();

        const animate = () => {
            ctx.fillStyle = '#020617';
            ctx.fillRect(0, 0, width, height);

            // Mouse velocity
            mouse.vx = mouse.x - lastMouse.x;
            mouse.vy = mouse.y - lastMouse.y;
            lastMouse.x = mouse.x;
            lastMouse.y = mouse.y;

            particles.forEach((p, i) => {
                p.update();
                p.draw();

                // Connect to right and bottom neighbors in the grid
                // This is a bit complex since it's an array, but we can compute neighbors
                const xIdx = i % cols;
                const yIdx = Math.floor(i / cols);

                // Right neighbor
                if (xIdx < cols - 1) {
                    const next = particles[i + 1];
                    drawConnection(p, next);
                }
                // Bottom neighbor
                if (yIdx < rows - 1) {
                    const next = particles[i + cols];
                    drawConnection(p, next);
                }
            });

            requestAnimationFrame(animate);
        };

        function drawConnection(p1: Particle, p2: Particle | undefined) {
            if (!ctx || !p2) return;
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Connection breaks if stretched too far
            if (dist < spacing * 2.5) {
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.strokeStyle = `rgba(148, 163, 184, ${0.1 * (1 - dist / (spacing * 2.5))})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        }

        const handleMouseMove = (e: MouseEvent) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };

        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            init();
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('resize', handleResize);
        animate();

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                zIndex: -1,
                pointerEvents: 'none',
                background: '#020617'
            }}
        />
    );
};

export default AntigravityBackground;
