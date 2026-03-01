/* ===== DEEPONDÉ — YEOBAEK Brand Website ===== */

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
    const progressBar = document.getElementById('progressBar');
    function updateProgress() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        progressBar.style.width = progress + '%';
    }

    // ===== Header Hide/Show on Scroll =====
    const nav = document.getElementById('nav');
    let lastScrollY = 0;
    let ticking = false;

    function handleScroll() {
        const scrollY = window.scrollY;

        if (scrollY > 200) {
            if (scrollY > lastScrollY + 5) {
                nav.classList.add('hidden');
            } else if (scrollY < lastScrollY - 5) {
                nav.classList.remove('hidden');
            }
        } else {
            nav.classList.remove('hidden');
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
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');

    function updateActiveNav() {
        const scrollY = window.scrollY + 300;
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

    // ===== Mobile Hamburger Menu =====
    const hamburger = document.getElementById('navHamburger');
    const navLinksWrap = document.getElementById('navLinks');

    if (hamburger && navLinksWrap) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinksWrap.classList.toggle('active');
            document.body.style.overflow = navLinksWrap.classList.contains('active') ? 'hidden' : '';
        });

        // Close menu on link click
        navLinksWrap.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinksWrap.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }

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

    // ===== Lazy Video Loading =====
    const lazyVideos = document.querySelectorAll('video[data-lazy]');
    const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            if (entry.isIntersecting) {
                // Load and play
                if (!video.dataset.loaded) {
                    const source = video.querySelector('source[data-src]');
                    if (source) {
                        source.src = source.dataset.src;
                        source.removeAttribute('data-src');
                        video.load();
                    }
                    video.dataset.loaded = 'true';
                }
                video.play().catch(() => { });
            } else {
                video.pause();
            }
        });
    }, { threshold: 0.1, rootMargin: '200px 0px' });

    lazyVideos.forEach(v => videoObserver.observe(v));

    // ===== Character Splitting for Typography Animation =====
    document.querySelectorAll('[data-chars]').forEach(el => {
        const walk = (parent) => {
            const children = Array.from(parent.childNodes);
            let charIndex = 0;
            children.forEach(child => {
                if (child.nodeType === Node.TEXT_NODE) {
                    const text = child.textContent;
                    if (!text.trim()) return;
                    const frag = document.createDocumentFragment();
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
                    parent.replaceChild(frag, child);
                } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') {
                    walk(child);
                }
            });
        };

        walk(el);

        const charObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('g-chars-animated');
                }
            });
        }, { threshold: 0.3 });
        charObserver.observe(el);
    });

    // ===== Hero Title: 글자별 순차 디졸브 =====
    const heroTitle = document.querySelector('.hero-title[data-chars]');
    if (heroTitle) {
        const text = heroTitle.textContent.trim();
        heroTitle.textContent = '';
        [...text].forEach((ch, i) => {
            const span = document.createElement('span');
            span.className = 'hero-char';
            span.textContent = ch;
            span.style.setProperty('--i', i);
            heroTitle.appendChild(span);
        });
        setTimeout(() => heroTitle.classList.add('hero-chars-in'), 800);
    }

    // ===== Initial State =====
    updateProgress();
    updateActiveNav();

});
