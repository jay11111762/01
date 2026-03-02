// Initialize Lenis for smooth scrolling
const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    mouseMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
});

function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}

requestAnimationFrame(raf);

// Initialize GSAP
gsap.registerPlugin(ScrollTrigger);

// =============================================
// Kinetic Typography: GSAP Marquee Animation
// =============================================
const marqueeLeft = document.querySelectorAll('.marquee-left');
const marqueeRight = document.querySelectorAll('.marquee-right');

// 왼쪽으로 흐르는 행
marqueeLeft.forEach(row => {
    gsap.to(row, {
        x: '-50%',
        duration: 20,
        ease: 'none',
        repeat: -1,
    });
});

// 오른쪽으로 흐르는 행
marqueeRight.forEach(row => {
    gsap.fromTo(row,
        { x: '-50%' },
        {
            x: '0%',
            duration: 25,
            ease: 'none',
            repeat: -1,
        }
    );
});

// 스크롤 시 마퀴 속도 변화 (패럴랙스 효과)
ScrollTrigger.create({
    trigger: '.hero',
    start: 'top top',
    end: 'bottom top',
    scrub: true,
    onUpdate: (self) => {
        const velocity = self.getVelocity() / 1000;
        gsap.to(marqueeLeft, { timeScale: 1 + Math.abs(velocity) * 0.3, duration: 0.3 });
        gsap.to(marqueeRight, { timeScale: 1 + Math.abs(velocity) * 0.3, duration: 0.3 });
    }
});

// Header fade out on scroll
gsap.to('header', {
    opacity: 0,
    y: -20,
    duration: 0.3,
    scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: '40% top',
        scrub: true,
    }
});

// =============================================
// Scroll Animations: Bento Boxes + Work Cards
// =============================================
const sections = document.querySelectorAll('.content');

sections.forEach(section => {
    const elements = section.querySelectorAll('.section-title, .bento-box');

    gsap.from(elements, {
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power2.out',
        scrollTrigger: {
            trigger: section,
            start: 'top 80%',
        }
    });
});

// Selected Work Cards: 스크롤 시 슬라이드인
const workCards = document.querySelectorAll('.work-card');
workCards.forEach((card, i) => {
    gsap.from(card, {
        y: 80,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: card,
            start: 'top 85%',
        }
    });
});

// =============================================
// Archive Toggle (접기/펼치기)
// =============================================
const archiveToggle = document.getElementById('archiveToggle');
const archiveList = document.getElementById('archiveList');

if (archiveToggle && archiveList) {
    archiveToggle.addEventListener('click', () => {
        archiveToggle.classList.toggle('open');
        archiveList.classList.toggle('open');
    });

    // 터치 지원
    archiveToggle.addEventListener('touchend', (e) => {
        e.preventDefault();
        archiveToggle.click();
    }, { passive: false });
}

// =============================================
// Theme Toggle (다크/라이트 전환)
// =============================================
const themeToggleBtn = document.querySelector('.theme-toggle');
const body = document.body;

const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    body.setAttribute('data-theme', savedTheme);
}

if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        if (body.getAttribute('data-theme') === 'light') {
            body.removeAttribute('data-theme');
            localStorage.setItem('theme', 'dark');
        } else {
            body.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        }
    });
}

// =============================================
// Particle System — Canvas + Physics (모바일 최적화 포함)
// =============================================
const canvas = document.getElementById('particleCanvas');
const heroSection = document.querySelector('.hero');
const heroTexts = document.querySelectorAll('.hero-text');

if (canvas && heroSection) {
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    // 모바일 최적화: 화면 크기에 따라 파티클 수 조절
    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 600 : 1920;

    let mouseX = -9999, mouseY = -9999;
    const repulsionRadius = isMobile ? 120 : 180;
    const repulsionRadiusSq = repulsionRadius * repulsionRadius;
    const repulsionStrength = 0.8;

    let heroW = 0, heroH = 0;
    let textColliders = [];
    let circleCx = 0, circleCy = 0;
    let baseCircleR = 0;
    let circleR = 0;
    const circlePulseAmp = 0.15;
    const circlePulseSpeed = 0.0008;
    let circleTime = 0;

    // Particle data (struct-of-arrays for cache performance)
    const px = new Float32Array(particleCount);
    const py = new Float32Array(particleCount);
    const pvx = new Float32Array(particleCount);
    const pvy = new Float32Array(particleCount);
    const pSize = new Float32Array(particleCount);
    const pAlpha = new Float32Array(particleCount);

    function getAccentColor() {
        const style = getComputedStyle(document.body);
        return style.getPropertyValue('--hero-accent-color').trim() || '#FEE500';
    }
    let accentColor = getAccentColor();

    function resizeCanvas() {
        heroW = heroSection.offsetWidth;
        heroH = heroSection.offsetHeight;
        canvas.width = heroW * dpr;
        canvas.height = heroH * dpr;
        canvas.style.width = heroW + 'px';
        canvas.style.height = heroH + 'px';
        ctx.scale(dpr, dpr);

        circleCx = heroW / 2;
        circleCy = heroH / 2;
        baseCircleR = heroW * 0.275;

        const heroRect = heroSection.getBoundingClientRect();
        textColliders = [];
        heroTexts.forEach(t => {
            const r = t.getBoundingClientRect();
            textColliders.push({
                x: r.left - heroRect.left,
                y: r.top - heroRect.top,
                w: r.width,
                h: r.height
            });
        });
    }

    function initParticles() {
        const w = heroW || 1400;
        const h = heroH || 800;
        const cx = w / 2;
        const cy = h / 2;
        const r = w * 0.275;
        const rSq = r * r;

        for (let i = 0; i < particleCount; i++) {
            let x, y;
            do {
                x = Math.random() * w;
                y = Math.random() * h;
            } while ((x - cx) * (x - cx) + (y - cy) * (y - cy) < rSq);

            px[i] = x;
            py[i] = y;
            const speed = 0.2 + Math.random() * 0.6;
            const angle = Math.random() * Math.PI * 2;
            pvx[i] = Math.cos(angle) * speed;
            pvy[i] = Math.sin(angle) * speed;
            pSize[i] = [0.5, 1, 1.5, 2, 2.5][Math.floor(Math.random() * 5)];
            pAlpha[i] = Math.random() * 0.5 + 0.1;
        }
    }

    resizeCanvas();
    initParticles();

    window.addEventListener('resize', () => {
        resizeCanvas();
        accentColor = getAccentColor();
    });
    window.addEventListener('load', () => setTimeout(resizeCanvas, 200));

    // 마우스 이벤트
    heroSection.addEventListener('mousemove', (e) => {
        const rect = heroSection.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    });
    heroSection.addEventListener('mouseleave', () => {
        mouseX = -9999;
        mouseY = -9999;
    });

    // 터치 이벤트 (모바일 대응 — 규칙 준수)
    heroSection.addEventListener('touchstart', (e) => {
        if (e.touches.length) {
            const rect = heroSection.getBoundingClientRect();
            mouseX = e.touches[0].clientX - rect.left;
            mouseY = e.touches[0].clientY - rect.top;
        }
    }, { passive: true });

    heroSection.addEventListener('touchmove', (e) => {
        if (e.touches.length) {
            const rect = heroSection.getBoundingClientRect();
            mouseX = e.touches[0].clientX - rect.left;
            mouseY = e.touches[0].clientY - rect.top;
        }
    }, { passive: true });

    heroSection.addEventListener('touchend', () => {
        mouseX = -9999;
        mouseY = -9999;
    }, { passive: true });

    // Theme observer
    const themeObserver = new MutationObserver(() => {
        accentColor = getAccentColor();
    });
    themeObserver.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });

    // --- Main loop ---
    function simulate() {
        const damping = 0.997;
        const bounce = 0.5;
        const pad = 3;
        const tcLen = textColliders.length;

        circleTime += circlePulseSpeed;
        circleR = baseCircleR * (1 + Math.sin(circleTime * Math.PI * 2) * circlePulseAmp);

        for (let i = 0; i < particleCount; i++) {
            let x = px[i], y = py[i], vx = pvx[i], vy = pvy[i];

            const mdx = x - mouseX;
            const mdy = y - mouseY;
            const mDistSq = mdx * mdx + mdy * mdy;
            if (mDistSq < repulsionRadiusSq && mDistSq > 1) {
                const mDist = Math.sqrt(mDistSq);
                const t = 1 - mDist / repulsionRadius;
                const force = t * t * t * repulsionStrength;
                const invD = 1 / mDist;
                vx += mdx * invD * force;
                vy += mdy * invD * force;
            }

            vx += (Math.random() - 0.5) * 0.03;
            vy += (Math.random() - 0.5) * 0.03;

            x += vx;
            y += vy;

            vx *= damping;
            vy *= damping;

            if (x < 0) { x = 0; vx = Math.abs(vx) * bounce; }
            if (x > heroW) { x = heroW; vx = -Math.abs(vx) * bounce; }
            if (y < 0) { y = 0; vy = Math.abs(vy) * bounce; }
            if (y > heroH) { y = heroH; vy = -Math.abs(vy) * bounce; }

            const cdx = x - circleCx;
            const cdy = y - circleCy;
            const cDistSq = cdx * cdx + cdy * cdy;
            const circleRSq = circleR * circleR;
            if (cDistSq < circleRSq && cDistSq > 0) {
                const cDist = Math.sqrt(cDistSq);
                const invC = 1 / cDist;
                const nx = cdx * invC;
                const ny = cdy * invC;
                const dot = vx * nx + vy * ny;
                if (dot < 0) {
                    vx -= 2 * dot * nx * bounce;
                    vy -= 2 * dot * ny * bounce;
                }
                x = circleCx + nx * (circleR + 1);
                y = circleCy + ny * (circleR + 1);
            }

            for (let j = 0; j < tcLen; j++) {
                const tc = textColliders[j];
                if (x > tc.x - pad && x < tc.x + tc.w + pad &&
                    y > tc.y - pad && y < tc.y + tc.h + pad) {
                    const oL = (x + pad) - tc.x;
                    const oR = (tc.x + tc.w) - (x - pad);
                    const oT = (y + pad) - tc.y;
                    const oB = (tc.y + tc.h) - (y - pad);
                    const min = Math.min(oL, oR, oT, oB);
                    if (min === oL) { x = tc.x - pad; vx = -Math.abs(vx) * bounce; }
                    else if (min === oR) { x = tc.x + tc.w + pad; vx = Math.abs(vx) * bounce; }
                    else if (min === oT) { y = tc.y - pad; vy = -Math.abs(vy) * bounce; }
                    else { y = tc.y + tc.h + pad; vy = Math.abs(vy) * bounce; }
                }
            }

            px[i] = x; py[i] = y; pvx[i] = vx; pvy[i] = vy;
        }

        ctx.clearRect(0, 0, heroW, heroH);

        ctx.beginPath();
        ctx.arc(circleCx, circleCy, circleR, 0, Math.PI * 2);
        ctx.strokeStyle = accentColor;
        ctx.globalAlpha = 0.4;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = accentColor;
        for (let i = 0; i < particleCount; i++) {
            ctx.globalAlpha = pAlpha[i];
            ctx.beginPath();
            ctx.arc(px[i], py[i], pSize[i], 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        requestAnimationFrame(simulate);
    }

    simulate();
}
