/* ========================================
   12컷 — Landing Page Interactions
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {

    // ===== NAV SCROLL EFFECT =====
    const nav = document.getElementById('nav');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 80) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
        lastScroll = currentScroll;
    }, { passive: true });

    // ===== SMOOTH SCROLL FOR NAV LINKS =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offset = 80;
                const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });

    // ===== SCROLL REVEAL (Intersection Observer) =====
    const revealElements = document.querySelectorAll('.how__step, .testimonial-card, .pricing-card, .product__image-col, .product__text-col, .examples__header, .how__header, .testimonials__header, .pricing__header, .footer__quote');

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Stagger animation for grid items
                const siblings = entry.target.parentElement.children;
                const siblingIndex = Array.from(siblings).indexOf(entry.target);

                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, siblingIndex * 100);

                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(40px)';
        el.style.transition = 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
        revealObserver.observe(el);
    });

    // Make visible class work
    const style = document.createElement('style');
    style.textContent = `
    .how__step.visible, .testimonial-card.visible, .pricing-card.visible,
    .product__image-col.visible, .product__text-col.visible,
    .examples__header.visible, .how__header.visible,
    .testimonials__header.visible, .pricing__header.visible,
    .footer__quote.visible {
      opacity: 1 !important;
      transform: translateY(0) !important;
    }
  `;
    document.head.appendChild(style);

    // ===== FILM STRIP — Generate placeholder images with canvas =====
    const filmImages = document.querySelectorAll('.filmstrip__image');

    filmImages.forEach((el, i) => {
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');

        // Create unique gradient for each frame
        const hue = getComputedStyle(el).getPropertyValue('--hue') || (i * 40);
        const gradient = ctx.createLinearGradient(0, 0, 300, 200);
        gradient.addColorStop(0, `hsl(${hue}, 35%, 25%)`);
        gradient.addColorStop(0.5, `hsl(${hue}, 45%, 40%)`);
        gradient.addColorStop(1, `hsl(${parseInt(hue) + 30}, 30%, 50%)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 300, 200);

        // Add vignette
        const vignetteGradient = ctx.createRadialGradient(150, 100, 50, 150, 100, 200);
        vignetteGradient.addColorStop(0, 'rgba(0,0,0,0)');
        vignetteGradient.addColorStop(1, 'rgba(0,0,0,0.4)');
        ctx.fillStyle = vignetteGradient;
        ctx.fillRect(0, 0, 300, 200);

        // Add film grain noise
        const imageData = ctx.getImageData(0, 0, 300, 200);
        const data = imageData.data;
        for (let j = 0; j < data.length; j += 4) {
            const noise = (Math.random() - 0.5) * 30;
            data[j] += noise;
            data[j + 1] += noise;
            data[j + 2] += noise;
        }
        ctx.putImageData(imageData, 0, 0);

        // Add light leak
        const leakGradient = ctx.createLinearGradient(0, 0, 300, 0);
        leakGradient.addColorStop(0, `hsla(${parseInt(hue) + 20}, 60%, 60%, 0.15)`);
        leakGradient.addColorStop(0.5, 'rgba(0,0,0,0)');
        leakGradient.addColorStop(1, `hsla(${parseInt(hue) - 20}, 50%, 50%, 0.1)`);
        ctx.fillStyle = leakGradient;
        ctx.fillRect(0, 0, 300, 200);

        el.style.backgroundImage = `url(${canvas.toDataURL()})`;
        el.style.backgroundSize = 'cover';
        el.style.background = `url(${canvas.toDataURL()}) center/cover`;
    });

    // ===== PARALLAX HERO IMAGE =====
    const heroImage = document.querySelector('.hero__image-wrapper');
    if (heroImage) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            if (scrolled < window.innerHeight) {
                heroImage.style.transform = `rotate(-5deg) translateY(${scrolled * 0.15}px)`;
            }
        }, { passive: true });
    }

    // ===== COUNTER ANIMATION FOR PRICING =====
    const priceElements = document.querySelectorAll('.pricing-card__amount');
    const priceObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.textContent.replace(/,/g, ''));
                animateCount(entry.target, 0, target, 1200);
                priceObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    priceElements.forEach(el => priceObserver.observe(el));

    function animateCount(el, start, end, duration) {
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(start + (end - start) * eased);

            el.textContent = current.toLocaleString('ko-KR');

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);
    }

    // ===== MAGNETIC HOVER FOR CTA BUTTONS =====
    const ctaButtons = document.querySelectorAll('.hero__cta, .nav__cta');

    ctaButtons.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translate(0, 0)';
        });
    });

    // ===== THEME TAGS CLICK TO FILTER (visual only) =====
    const tags = document.querySelectorAll('.examples__tag');
    tags.forEach(tag => {
        tag.addEventListener('click', () => {
            tags.forEach(t => t.classList.remove('active'));
            tag.classList.add('active');
            tag.style.background = 'rgba(212, 168, 83, 0.15)';
            tag.style.borderColor = '#D4A853';
            tag.style.color = '#D4A853';

            setTimeout(() => {
                tag.style.background = '';
                tag.style.borderColor = '';
                tag.style.color = '';
                tag.classList.remove('active');
            }, 2000);
        });
    });

});
