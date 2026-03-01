/* ===== YEOBAEK V2 — 실제 가로스크롤 인터랙션 ===== */

document.addEventListener('DOMContentLoaded', () => {

    const container = document.getElementById('scrollContainer');
    const progressBar = document.getElementById('progressBar');
    const indicatorCurrent = document.querySelector('.indicator-current');
    const navLinks = document.querySelectorAll('.nav-link');
    const panels = container.querySelectorAll('.panel');

    // 모바일 감지
    function isMobile() {
        return window.innerWidth <= 768;
    }

    // ===== 마우스 휠 → 가로 스크롤 변환 =====
    const SCROLL_SPEED = 2.5; // 스크롤 속도 배수

    container.addEventListener('wheel', (e) => {
        if (isMobile()) return;

        e.preventDefault();
        // deltaY(세로 휠)를 가로 스크롤로 변환 + 속도 배수 적용
        const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
        container.scrollLeft += delta * SCROLL_SPEED;
    }, { passive: false });

    // ===== 스크롤 이벤트 처리 =====
    function handleScroll() {
        const scrollLeft = container.scrollLeft;
        const maxScroll = container.scrollWidth - container.clientWidth;

        // 프로그레스 바
        const progress = maxScroll > 0 ? (scrollLeft / maxScroll) * 100 : 0;
        progressBar.style.width = progress + '%';

        // 현재 패널 감지
        let accWidth = 0;
        let currentIndex = 0;
        for (let i = 0; i < panels.length; i++) {
            accWidth += panels[i].offsetWidth;
            if (scrollLeft < accWidth - panels[i].offsetWidth / 2) {
                currentIndex = i;
                break;
            }
            currentIndex = i;
        }

        // 섹션 인디케이터
        indicatorCurrent.textContent = String(currentIndex + 1).padStart(2, '0');

        // 네비게이션 활성화
        const sectionIds = ['hero', 'philosophy', 'collection', 'craft', 'space', 'contact'];
        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href').replace('#', '');
            if (href === sectionIds[currentIndex]) {
                link.classList.add('active');
            }
        });

        // Reveal 애니메이션
        checkReveals();
    }

    // ===== Reveal 애니메이션 =====
    const reveals = document.querySelectorAll('.reveal');

    function checkReveals() {
        const containerRect = container.getBoundingClientRect();

        reveals.forEach(el => {
            const rect = el.getBoundingClientRect();
            // 요소가 뷰포트 내에 보이면 reveal
            if (rect.left < containerRect.right + 100 && rect.right > containerRect.left - 100) {
                el.classList.add('visible');
            }
        });
    }

    // ===== 네비게이션 클릭 → 해당 패널로 스크롤 =====
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').replace('#', '');
            const targetPanel = document.getElementById(targetId);

            if (!targetPanel) return;

            if (isMobile()) {
                targetPanel.scrollIntoView({ behavior: 'smooth' });
                return;
            }

            // 해당 패널의 가로 위치 계산
            let offsetX = 0;
            for (let i = 0; i < panels.length; i++) {
                if (panels[i] === targetPanel) break;
                offsetX += panels[i].offsetWidth;
            }

            container.scrollTo({
                left: offsetX,
                behavior: 'smooth'
            });
        });
    });

    // 로고 클릭 → 맨 처음으로
    document.querySelector('.nav-logo').addEventListener('click', (e) => {
        e.preventDefault();
        container.scrollTo({ left: 0, behavior: 'smooth' });
    });

    // ===== 스크롤 이벤트 =====
    let ticking = false;
    container.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                handleScroll();
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    // ===== 키보드 화살표 지원 =====
    document.addEventListener('keydown', (e) => {
        if (isMobile()) return;

        if (e.key === 'ArrowRight') {
            container.scrollLeft += 400;
        } else if (e.key === 'ArrowLeft') {
            container.scrollLeft -= 400;
        }
    });

    // ===== 초기 상태 =====
    setTimeout(() => {
        const heroReveals = document.querySelectorAll('.panel-hero .reveal');
        heroReveals.forEach((el, i) => {
            setTimeout(() => el.classList.add('visible'), 300 + i * 200);
        });
    }, 100);

    handleScroll();

});
