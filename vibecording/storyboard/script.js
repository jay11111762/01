const storyboardData = [
    {
        shot: 1,
        time: "00:00 ~ 00:08",
        title: "Intro: The Cold Machine",
        visual: "칠흑 같은 어둠(Carbon Black). 차가운 조명 아래 분해된 F1 머신의 부품들이 정적으로 놓여 있다. 8만 개의 부품, 차가운 금속 질감 클로즈업.",
        audio: "(SFX) 미세한 기계음, 백색 소음. 심장 박동 소리가 작게 시작.\n(Narration) '80,000 parts. Cold metal. Carbon fiber.'",
        strategy: "Defining the Machine: 머신은 부품의 집합일 뿐이라는 전제"
    },
    {
        shot: 2,
        time: "00:08 ~ 00:15",
        title: "The Core",
        visual: "헬멧을 착용하는 마이클 신의 눈빛 클로즈업. 눈동자에 데이터(숫자, 그래프)가 비친다. 흰색 라인들이 머신을 스캔하듯 분석한다.",
        audio: "(SFX) 데이터 처리음(Glitch), RPM 고조.\n(Narration) 'Without a core, it is just a machine.'",
        strategy: "The Human in the Machine: 드라이버는 기계의 심장(Core)"
    },
    {
        shot: 3,
        time: "00:15 ~ 00:25",
        title: "Condensed Growth",
        visual: "Fast Cut Montage: 카트 시절부터 F3까지 주행 장면 교차 편집. 타이포그래피 애니메이션: '10 YEARS' -> (압축) -> '5 YEARS'",
        audio: "(SFX) F1 엔진 굉음 폭발, 타격음.\n(Text) Moving from Karting to F3 in just 5 years.",
        strategy: "Diagnosis: 10년의 과정을 5년으로 압축한 성장 속도"
    },
    {
        shot: 4,
        time: "00:25 ~ 00:35",
        title: "The Feedback (Risk)",
        visual: "머신이 코너를 돌다 미끄러지는(Spin/Crash) 초고속 슬로우 모션. 붉은색 노이즈 화면. 마이클 신의 냉철한 표정.",
        audio: "(SFX) 타이어 스킬음 -> 정적.\n(Narration) 'They call it risk. I call it feedback.'",
        strategy: "Manifesto: 실패를 피드백으로 정의"
    },
    {
        shot: 5,
        time: "00:35 ~ 00:45",
        title: "The Seal: PUSH",
        visual: "엔지니어 무전과 함께 'PUSH' 타이포 패턴 붉게 점멸. 엑셀 밟는 발, 핸들 조작. 서킷 코너 모양이 붉은색 프레임(The Seal)으로 변함.",
        audio: "(SFX) 'Push now! Push!' 심장 박동과 엔진 소리 Sync.",
        strategy: "Graphic Motif: 'PUSH' 무전의 시각화 및 로고 상징성"
    },
    {
        shot: 6,
        time: "00:45 ~ 00:55",
        title: "Signature",
        visual: "결승선 통과. 아스팔트 위에 붉은색 타이어 자국(Skid mark)이 서명처럼 남음. 헬멧을 벗고 카메라 응시.",
        audio: "(SFX) 웅장한 비트 마무리.\n(Narration) 'I imprint my name on the velocity.'",
        strategy: "Brand Essence: 속도를 각인하다(Imprinting Velocity)"
    },
    {
        shot: 7,
        time: "00:55 ~ 01:00",
        title: "Outro",
        visual: "검은 배경 위 붉은색 로고(Michael Shin Logo) 등장. 슬로건 페이드 인.",
        audio: "(SFX) 도장 찍는 묵직한 소리(Boom).\n(Text) MARK YOUR SPEED. MICHAEL SHIN",
        strategy: "Closing: 브랜드 슬로건 각인"
    }
];

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('storyboard-container');

    // Render Cards
    storyboardData.forEach(item => {
        const card = document.createElement('article');
        card.className = 'story-card';

        // Local Image URL
        // Using assets/images/shot*.jpg as found in the directory
        const imageUrl = `assets/images/shot${item.shot}.jpg`;

        card.innerHTML = `
            <div class="visual-area">
                <span class="time-badge">${item.time}</span>
                <img src="${imageUrl}" alt="${item.title}" id="shot-${item.shot}-img">
            </div>
            <div class="content-area">
                <div class="shot-number">SHOT ${item.shot.toString().padStart(2, '0')}</div>
                <h2 class="card-title">${item.title}</h2>
                
                <div class="info-group">
                    <span class="info-label">Visual</span>
                    <p class="info-text">${item.visual}</p>
                </div>
                
                <div class="info-group">
                    <span class="info-label">Audio</span>
                    <p class="info-text">${item.audio}</p>
                </div>

                <div class="strategy-box">
                    <span class="info-label" style="margin-bottom:0;">Strategy</span>
                    <p class="strategy-text">${item.strategy}</p>
                </div>
            </div>
        `;

        container.appendChild(card);
    });

    // Lightbox Logic
    const modal = document.getElementById("image-modal");
    const modalImg = document.getElementById("modal-image");
    const captionText = document.getElementById("caption");
    const closeBtn = document.getElementsByClassName("close-modal")[0];

    // Open Modal
    // We need to wait for images to be added to the DOM, which happens in the loop above.
    // Since the loop is synchronous, the elements exist here.
    const images = document.querySelectorAll('.visual-area img');
    images.forEach(img => {
        img.addEventListener('click', function () {
            modal.style.display = "block";
            // Small delay to allow display:block to apply before adding opacity class for transition
            setTimeout(() => {
                modal.classList.add('show');
            }, 10);
            modalImg.src = this.src;
            captionText.innerHTML = this.alt;
        });
    });

    // Close Modal Function
    function closeModal() {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = "none";
        }, 300); // Match transition duration
    }

    // Close on X click
    if (closeBtn) {
        closeBtn.onclick = function () {
            closeModal();
        }
    }

    // Close on outside click
    window.onclick = function (event) {
        if (event.target == modal) {
            closeModal();
        }
    }
});


