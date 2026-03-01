/* ===== Guide Version — Interactions ===== */

document.addEventListener('DOMContentLoaded', () => {

    // ===== Scroll Reveal =====
    const reveals = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    reveals.forEach(el => revealObserver.observe(el));

    // ===== Progress Bar =====
    const progressBar = document.querySelector('.g-progress-bar');
    function updateProgress() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        progressBar.style.width = progress + '%';
    }

    // ===== Header Hide/Show on Scroll =====
    const header = document.querySelector('.g-header');
    let lastScrollY = 0;
    let ticking = false;

    function handleScroll() {
        const scrollY = window.scrollY;

        // Hide header on scroll down, show on scroll up
        if (scrollY > 200) {
            if (scrollY > lastScrollY + 5) {
                header.classList.add('hidden');
            } else if (scrollY < lastScrollY - 5) {
                header.classList.remove('hidden');
            }
        } else {
            header.classList.remove('hidden');
        }

        lastScrollY = scrollY;
        updateProgress();
        updateActiveNav();
        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(handleScroll);
            ticking = true;
        }
    }, { passive: true });

    // ===== Active Nav Link =====
    const navLinks = document.querySelectorAll('.g-nav-link');
    const sections = document.querySelectorAll('.g-section, .g-hero');

    function updateActiveNav() {
        const scrollY = window.scrollY + 200;
        let currentSection = '';

        sections.forEach(section => {
            if (section.offsetTop <= scrollY) {
                currentSection = section.id;
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.dataset.section === currentSection) {
                link.classList.add('active');
            }
        });
    }

    // ===== Stat Counter Animation =====
    const stats = document.querySelectorAll('.g-stat-number');
    const statObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.dataset.counted) {
                entry.target.dataset.counted = 'true';
                animateCounter(entry.target);
            }
        });
    }, { threshold: 0.5 });

    stats.forEach(stat => statObserver.observe(stat));

    function animateCounter(el) {
        const target = parseFloat(el.dataset.target);
        const duration = 1500;
        const start = performance.now();
        const isFloat = target % 1 !== 0;

        function update(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = target * eased;

            if (isFloat) {
                el.textContent = current.toFixed(1);
            } else {
                el.textContent = Math.round(current);
            }

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);
    }

    // ===== Expandable Checklist =====
    document.querySelectorAll('[data-expandable]').forEach(item => {
        const header = item.querySelector('.g-check-header');

        header.addEventListener('click', () => {
            // Toggle expanded
            item.classList.toggle('expanded');

            // Toggle checked on checkbox click area
            const checkbox = item.querySelector('.g-checkbox');
            if (checkbox) {
                // Only toggle checked when clicking directly on checkbox
            }
        });

        // Checkbox toggle
        const checkbox = item.querySelector('.g-checkbox');
        if (checkbox) {
            checkbox.addEventListener('click', (e) => {
                e.stopPropagation();
                item.classList.toggle('checked');
            });
        }
    });

    // ===== Smooth Scroll for Anchor Links =====
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const offsetTop = target.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ===== Character Splitting for Typography Animation =====
    document.querySelectorAll('[data-chars]').forEach(el => {
        // Save original HTML to process
        const processNode = (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent;
                if (!text.trim()) return node;
                const frag = document.createDocumentFragment();
                let charIndex = 0;
                for (const char of text) {
                    if (char === ' ' || char === '\n') {
                        frag.appendChild(document.createTextNode(char));
                    } else {
                        const span = document.createElement('span');
                        span.className = 'g-char';
                        span.textContent = char;
                        span.style.setProperty('--i', charIndex);
                        charIndex++;
                        frag.appendChild(span);
                    }
                }
                return frag;
            }
            return node;
        };

        const walk = (parent) => {
            const children = Array.from(parent.childNodes);
            children.forEach(child => {
                if (child.nodeType === Node.TEXT_NODE) {
                    const frag = processNode(child);
                    parent.replaceChild(frag, child);
                } else if (child.nodeType === Node.ELEMENT_NODE) {
                    if (child.tagName === 'BR') return;
                    walk(child);
                }
            });
        };

        walk(el);

        // Activate animation when visible via IntersectionObserver
        const charObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('g-chars-animated');
                }
            });
        }, { threshold: 0.3 });
        charObserver.observe(el);
    });

    // ===== Mouse Brush Trail =====
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const trail = [];
    const maxTrail = 50;
    let mouseX = -100, mouseY = -100;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        trail.push({ x: mouseX, y: mouseY, life: 1 });
        if (trail.length > maxTrail) trail.shift();
    });

    function drawTrail() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < trail.length; i++) {
            trail[i].life -= 0.025;
        }

        // Remove dead points
        while (trail.length > 0 && trail[0].life <= 0) trail.shift();

        if (trail.length < 2) {
            requestAnimationFrame(drawTrail);
            return;
        }

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 1; i < trail.length; i++) {
            const p0 = trail[i - 1];
            const p1 = trail[i];
            const t = p1.life;

            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.strokeStyle = `rgba(255, 214, 0, ${t * 0.6})`;
            ctx.lineWidth = t * 3;
            ctx.stroke();
        }

        requestAnimationFrame(drawTrail);
    }
    requestAnimationFrame(drawTrail);

    // ===== Initial State =====
    updateProgress();
    updateActiveNav();

});

// ===== Copy Code Button =====
function copyCode(btn) {
    const codeBlock = btn.closest('.g-code-block');
    const code = codeBlock.querySelector('code');
    const text = code.textContent;

    navigator.clipboard.writeText(text).then(() => {
        btn.textContent = '복사됨!';
        btn.style.color = '#ffd600';
        setTimeout(() => {
            btn.textContent = '복사';
            btn.style.color = '';
        }, 2000);
    }).catch(() => {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        btn.textContent = '복사됨!';
        setTimeout(() => { btn.textContent = '복사'; }, 2000);
    });
}
