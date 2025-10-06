import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useDrag } from '@use-gesture/react';

// Import icons so Vite bundles them correctly
import welcomeIcon from '../../../assets/onboarding/welcome.svg';
import securityIcon from '../../../assets/onboarding/security.svg';
import contextIcon from '../../../assets/onboarding/context.svg';
import customizeIcon from '../../../assets/onboarding/customize.svg';
import readyIcon from '../../../assets/onboarding/ready.svg';

const SLIDES = [
    {
        icon: welcomeIcon,
        title: 'Welcome to Cheating Daddy',
        content: "Your AI assistant that listens and watches, then provides intelligent suggestions automatically during interviews and meetings.",
    },
    {
        icon: securityIcon,
        title: 'Completely Private',
        content: 'Invisible to screen sharing apps and recording software. Your secret advantage stays completely hidden from others.',
    },
    {
        icon: contextIcon,
        title: 'Add Your Context',
        content: 'Share relevant information to help the AI provide better, more personalized assistance.',
        showTextarea: true,
    },
    {
        icon: customizeIcon,
        title: 'Additional Features',
        content: '',
        showFeatures: true,
    },
    {
        icon: readyIcon,
        title: 'Ready to Go',
        content: 'Add your Gemini API key in settings and start getting AI-powered assistance in real-time.',
    },
];

export default function OnboardingView({ onComplete = () => { }, onClose = () => { } }) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [contextText, setContextText] = useState(localStorage.getItem('customPrompt') || '');

    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const previousSchemeRef = useRef(null);
    const transitioningRef = useRef(false);
    const transitionStartRef = useRef(0);
    const particlesRef = useRef([]);

    const colorSchemesRef = useRef([
        [[20, 25, 40], [15, 20, 35], [25, 30, 45], [10, 15, 30], [30, 35, 50], [5, 10, 25]],
        [[15, 30, 35], [10, 25, 30], [20, 35, 40], [5, 20, 25], [25, 40, 45], [0, 15, 20]],
        [[20, 20, 20], [15, 15, 15], [25, 25, 25], [10, 10, 10], [30, 30, 30], [5, 5, 5]],
        [[15, 35, 25], [10, 30, 20], [20, 40, 30], [5, 25, 15], [25, 45, 35], [0, 20, 10]],
        [[35, 25, 15], [30, 20, 10], [40, 30, 20], [25, 15, 5], [45, 35, 25], [20, 10, 0]],
    ]).current;

    const TRANSITION_DURATION = 1000;

    const wrapperRef = useRef(null);
    const pointerRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
    const { scrollYProgress } = useScroll({ container: wrapperRef });
    const y = useTransform(scrollYProgress, [0, 1], [0, -100 * (SLIDES.length - 1)]);

    useEffect(() => {
        let rafId = null;

        function onPointerMove(e) {
            const rect = wrapperRef.current?.getBoundingClientRect();
            if (!rect) return;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            const x = (clientX - rect.left) / rect.width - 0.5;
            const y = (clientY - rect.top) / rect.height - 0.5;
            pointerRef.current.x = x;
            pointerRef.current.y = y;
            if (!rafId) rafId = requestAnimationFrame(step);
        }

        function step() {
            rafId = null;
            pointerRef.current.tx += (pointerRef.current.x - pointerRef.current.tx) * 0.15;
            pointerRef.current.ty += (pointerRef.current.y - pointerRef.current.ty) * 0.15;
            const tx = pointerRef.current.tx;
            const ty = pointerRef.current.ty;
            if (wrapperRef.current) {
                wrapperRef.current.style.setProperty('--parallax-x', String(tx * 30));
                wrapperRef.current.style.setProperty('--parallax-y', String(ty * 30));
            }
        }

        const node = wrapperRef.current || window;
        node.addEventListener('mousemove', onPointerMove);
        node.addEventListener('touchmove', onPointerMove, { passive: true });

        return () => {
            node.removeEventListener('mousemove', onPointerMove);
            node.removeEventListener('touchmove', onPointerMove);
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        function resize() {
            const rect = canvas.getBoundingClientRect();
            const dpr = Math.max(1, window.devicePixelRatio || 1);
            canvas.style.width = `${Math.floor(rect.width)}px`;
            canvas.style.height = `${Math.floor(rect.height)}px`;
            canvas.width = Math.floor(rect.width * dpr);
            canvas.height = Math.floor(rect.height * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        function easeInOutCubic(t) {
            return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        }

        function interpolateScheme(s1, s2, progress) {
            return s1.map((c1, i) => {
                const c2 = s2[i];
                return [
                    c1[0] + (c2[0] - c1[0]) * progress,
                    c1[1] + (c2[1] - c1[1]) * progress,
                    c1[2] + (c2[2] - c1[2]) * progress,
                ];
            });
        }

        function initParticles() {
            particlesRef.current = Array.from({ length: 100 }, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 4 + 1,
                speedX: Math.random() * 0.6 - 0.3,
                speedY: Math.random() * 0.6 - 0.3,
                depth: Math.random() * 0.7 + 0.3,
                color: `rgba(255, 255, 255, ${Math.random() * 0.2 + 0.1})`,
            }));
        }

        function drawParticles(width, height, tx, ty) {
            particlesRef.current.forEach(p => {
                ctx.fillStyle = p.color;
                p.x += p.speedX * p.depth;
                p.y += p.speedY * p.depth;
                if (p.x < 0 || p.x > width) p.speedX *= -1;
                if (p.y < 0 || p.y > height) p.speedY *= -1;
                const dx = p.x / window.devicePixelRatio - (width / 2 + tx * 100);
                const dy = p.y / window.devicePixelRatio - (height / 2 + ty * 100);
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) {
                    p.x += (dx / dist) * (150 - dist) * 0.02 * p.depth;
                    p.y += (dy / dist) * (150 - dist) * 0.02 * p.depth;
                }
                ctx.beginPath();
                ctx.arc(p.x / window.devicePixelRatio, p.y / window.devicePixelRatio, p.size, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        function draw(timestamp) {
            if (!ctx || !canvas) return;
            const rect = canvas.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;
            let colors = colorSchemesRef[currentSlide] || colorSchemesRef[0];

            if (transitioningRef.current && previousSchemeRef.current) {
                const elapsed = timestamp - transitionStartRef.current;
                const progress = Math.min(elapsed / TRANSITION_DURATION, 1);
                const eased = easeInOutCubic(progress);
                colors = interpolateScheme(previousSchemeRef.current, colorSchemesRef[currentSlide], eased);
                if (progress >= 1) {
                    transitioningRef.current = false;
                    previousSchemeRef.current = null;
                }
            }

            const time = timestamp * 0.0004;
            const flowX = Math.sin(time * 0.8) * width * 0.4;
            const flowY = Math.cos(time * 0.6) * height * 0.3;

            const gradient = ctx.createLinearGradient(flowX, flowY, width + flowX * 0.6, height + flowY * 0.6);

            colors.forEach((color, index) => {
                const offset = index / (colors.length - 1);
                const wave = Math.sin(time + index * 0.4) * 0.08;
                const r = Math.round(Math.max(0, Math.min(255, color[0] + wave * 8)));
                const g = Math.round(Math.max(0, Math.min(255, color[1] + wave * 8)));
                const b = Math.round(Math.max(0, Math.min(255, color[2] + wave * 8)));
                gradient.addColorStop(offset, `rgb(${r}, ${g}, ${b})`);
            });

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            for (let i = 0; i < 2000; i++) {
                const nx = Math.random() * width;
                const ny = Math.random() * height;
                ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.02})`;
                ctx.fillRect(nx, ny, 1, 1);
            }

            const centerX = width * 0.5 + Math.sin(time * 0.4) * width * 0.2;
            const centerY = height * 0.5 + Math.cos(time * 0.5) * height * 0.15;
            const radius = Math.max(width, height) * 1.0;
            const radial = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
            radial.addColorStop(0, `rgba(${colors[0][0] + 15}, ${colors[0][1] + 15}, ${colors[0][2] + 15}, 0.15)`);
            radial.addColorStop(0.5, `rgba(${colors[2][0]}, ${colors[2][1]}, ${colors[2][2]}, 0.08)`);
            radial.addColorStop(1, `rgba(${colors[colors.length - 1][0]}, ${colors[colors.length - 1][1]}, ${colors[colors.length - 1][2]}, 0.05)`);
            ctx.globalCompositeOperation = 'overlay';
            ctx.fillStyle = radial;
            ctx.fillRect(0, 0, width, height);
            ctx.globalCompositeOperation = 'source-over';

            drawParticles(width * window.devicePixelRatio, height * window.devicePixelRatio, pointerRef.current.tx, pointerRef.current.ty);

            animationRef.current = requestAnimationFrame(draw);
        }

        resize();
        initParticles();
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        animationRef.current = requestAnimationFrame(draw);

        const onResize = () => {
            resize();
            initParticles();
        };
        window.addEventListener('resize', onResize);

        const onKey = (e) => {
            if (e.key === 'ArrowRight') nextSlide();
            else if (e.key === 'ArrowLeft') prevSlide();
            else if (e.key === 'Enter' && document.activeElement.tagName !== 'TEXTAREA') nextSlide();
            else if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            window.removeEventListener('resize', onResize);
            window.removeEventListener('keydown', onKey);
        };
    }, [currentSlide]);

    function startColorTransition(newSlide) {
        if (newSlide === currentSlide || newSlide < 0 || newSlide >= SLIDES.length) return;
        previousSchemeRef.current = JSON.parse(JSON.stringify(colorSchemesRef[currentSlide]));
        transitioningRef.current = true;
        transitionStartRef.current = performance.now();
        setCurrentSlide(newSlide);
    }

    function nextSlide() {
        startColorTransition(currentSlide + 1);
        if (currentSlide === SLIDES.length - 1) {
            if (contextText.trim()) localStorage.setItem('customPrompt', contextText.trim());
            localStorage.setItem('onboardingCompleted', 'true');
            onComplete();
        }
    }

    function prevSlide() {
        startColorTransition(currentSlide - 1);
    }

    const bind = useDrag(({ direction: [xDir], distance, down, cancel }) => {
        if (down && distance > 50) {
            cancel();
            if (xDir > 0) nextSlide();
            else prevSlide();
        }
    });

    return (
        <div className="fixed inset-0 w-full min-h-screen overflow-auto" ref={wrapperRef} style={{ perspective: '1200px' }} {...bind()}>
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full min-h-screen z-0" />

            <motion.div
                className="relative z-10 flex flex-col items-center justify-center w-full min-h-screen p-4 sm:p-6 md:p-8 lg:p-12 text-center"
                style={{ y }}
            >
                <style>{`
          .neumorphic { box-shadow: 8px 8px 16px rgba(0,0,0,0.25), -8px -8px 16px rgba(255,255,255,0.08); border-radius: 16px; }
          @media (max-width: 640px) {
            .neumorphic { box-shadow: 4px 4px 8px rgba(0,0,0,0.25), -4px -4px 8px rgba(255,255,255,0.08); border-radius: 12px; }
          }
          body { font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        `}</style>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg text-white mx-auto neumorphic bg-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 backdrop-blur-lg"
                    >
                        <img
                            src={SLIDES[currentSlide].icon}
                            alt="icon"
                            className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto mb-4 sm:mb-6"
                        />
                        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-3 sm:mb-4">
                            {SLIDES[currentSlide].title}
                        </h2>
                        <p className="text-base sm:text-lg md:text-xl text-gray-100 mb-4 sm:mb-6">
                            {SLIDES[currentSlide].content}
                        </p>

                        {SLIDES[currentSlide].showTextarea && (
                            <textarea
                                value={contextText}
                                onChange={(e) => setContextText(e.target.value)}
                                placeholder="Paste your resume, job description, or any relevant context here..."
                                className="w-full min-h-[100px] sm:min-h-[120px] md:min-h-[140px] p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/10 border border-white/20 text-gray-100 placeholder-gray-400 resize-y neumorphic focus:outline-none focus:border-white/30 transition-all"
                            />
                        )}

                        {SLIDES[currentSlide].showFeatures && (
                            <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/5 neumorphic">
                                    <div className="text-xl sm:text-2xl">🎨</div>
                                    <div className="text-gray-100 font-medium text-sm sm:text-base">Customize AI behavior and responses</div>
                                </div>
                                <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/5 neumorphic">
                                    <div className="text-xl sm:text-2xl">📚</div>
                                    <div className="text-gray-100 font-medium text-sm sm:text-base">Review conversation history</div>
                                </div>
                                <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/5 neumorphic">
                                    <div className="text-xl sm:text-2xl">🔧</div>
                                    <div className="text-gray-100 font-medium text-sm sm:text-base">Adjust capture settings and intervals</div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </motion.div>

            <div className="absolute bottom-0 left-0 right-0 z-20">
                <div className="backdrop-blur-xl bg-black/50 border-t border-white/15 px-4 sm:px-6 md:px-10 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between">
                    <button
                        onClick={prevSlide}
                        disabled={currentSlide === 0}
                        className={`px-3 sm:px-4 py-2 sm:py-3 rounded-full text-sm sm:text-base font-semibold ${currentSlide === 0 ? 'opacity-60 cursor-not-allowed' : 'bg-white/10 text-white'}`}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block mr-1 sm:mr-2">
                            <path d="M15 6L9 12L15 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Prev
                    </button>

                    <div className="flex items-center gap-4 sm:gap-6 mt-2 sm:mt-0">
                        <div className="relative flex items-center gap-2 sm:gap-3 bg-white/10 rounded-full px-2 sm:px-4 py-1 sm:py-2">
                            {SLIDES.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => startColorTransition(i)}
                                    className={`w-3 sm:w-4 h-3 sm:h-4 rounded-full ${i === currentSlide ? 'bg-white' : 'bg-white/30'}`}
                                    aria-label={`Go to slide ${i + 1}`}
                                />
                            ))}
                        </div>
                        <button
                            onClick={nextSlide}
                            className="px-3 sm:px-5 py-2 sm:py-3 bg-white text-black rounded-full text-sm sm:text-base font-semibold"
                        >
                            {currentSlide === SLIDES.length - 1 ? 'Get Started' : 'Next'}
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block ml-1 sm:ml-2">
                                <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}