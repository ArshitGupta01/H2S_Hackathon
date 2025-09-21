
import React, { useRef, useEffect, memo } from 'react';

interface StarfieldBackgroundProps {
    theme: 'light' | 'dark';
}

class Star {
    x: number;
    y: number;
    radius: number;
    alpha: number;
    twinkleSpeed: number;
    twinkleDirection: number;
    ctx: CanvasRenderingContext2D;
    starColor: string;
    width: number;
    height: number;

    constructor(ctx: CanvasRenderingContext2D, width: number, height: number, starColor: string) {
        this.ctx = ctx;
        this.width = width;
        this.height = height;
        this.starColor = starColor;
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.radius = Math.random() * 1.2 + 0.5;
        this.alpha = Math.random() * 0.5 + 0.5;
        this.twinkleSpeed = Math.random() * 0.015;
        this.twinkleDirection = 1;
    }

    draw() {
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = `${this.starColor} ${this.alpha})`;
        this.ctx.fill();
    }

    update() {
        this.alpha += this.twinkleSpeed * this.twinkleDirection;

        if (this.alpha > 1) {
            this.alpha = 1;
            this.twinkleDirection = -1;
        } else if (this.alpha < 0.1) {
            this.alpha = 0.1;
            this.twinkleDirection = 1;
        }
    }
}

class ShootingStar {
    x: number;
    y: number;
    len: number;
    angle: number;
    speed: number;
    opacity: number;
    ctx: CanvasRenderingContext2D;

    constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
        this.ctx = ctx;
        this.angle = Math.random() * 0.4 + Math.PI * 0.25; // Random angle between ~45 and 90 deg
        this.speed = Math.random() * 5 + 3;
        this.len = Math.random() * 80 + 10;
        this.opacity = 1;

        // Random start position from top or left edge
        if (Math.random() > 0.5) {
            this.x = Math.random() * width;
            this.y = 0;
        } else {
            this.x = 0;
            this.y = Math.random() * height * 0.5; // Only top half
        }
    }

    update() {
        this.x += this.speed * Math.cos(this.angle);
        this.y += this.speed * Math.sin(this.angle);
        this.opacity -= 0.01;
    }

    draw() {
        const gradient = this.ctx.createLinearGradient(
            this.x, this.y, 
            this.x - this.len * Math.cos(this.angle), 
            this.y - this.len * Math.sin(this.angle)
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${this.opacity})`);
        gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.x, this.y);
        this.ctx.lineTo(this.x - this.len * Math.cos(this.angle), this.y - this.len * Math.sin(this.angle));
        this.ctx.strokeStyle = gradient;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }
}


const StarfieldBackgroundComponent: React.FC<StarfieldBackgroundProps> = ({ theme }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;
        let stars: Star[] = [];
        let shootingStars: ShootingStar[] = [];
        const starCount = Math.floor((width + height) / 8);

        const starColor = theme === 'dark' ? 'rgba(255, 255, 255,' : 'rgba(0, 0, 0,';

        const init = () => {
            stars = [];
            for (let i = 0; i < starCount; i++) {
                stars.push(new Star(ctx, width, height, starColor));
            }
        };

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            init();
        };

        const animate = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, width, height);
            
            stars.forEach(s => {
                s.update();
                s.draw();
            });

            shootingStars.forEach((ss, index) => {
                ss.update();
                ss.draw();
                if (ss.opacity <= 0) {
                    shootingStars.splice(index, 1);
                }
            });

            animationFrameId.current = requestAnimationFrame(animate);
        };
        
        const stopAnimation = () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
                animationFrameId.current = null;
            }
        }

        const handleVisibilityChange = () => {
            if (document.hidden) {
                stopAnimation();
            } else {
                if (!animationFrameId.current) {
                    animate();
                }
            }
        };

        const shootingStarInterval = setInterval(() => {
            if (shootingStars.length < 3) { // Limit number of concurrent shooting stars
                shootingStars.push(new ShootingStar(ctx, width, height));
            }
        }, 3000);

        window.addEventListener('resize', resize);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        resize();
        animate();

        return () => {
            stopAnimation();
            clearInterval(shootingStarInterval);
            window.removeEventListener('resize', resize);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [theme]);

    return <canvas id="starfield" ref={canvasRef} className="opacity-70 dark:opacity-100 transition-opacity duration-500" />;
};

export const StarfieldBackground = memo(StarfieldBackgroundComponent);
