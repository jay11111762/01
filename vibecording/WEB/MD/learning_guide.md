# 🎓 The Portfolio Shift — 학습 가이드

이 프로젝트는 **"문서에서 웹으로"**를 주제로 한 인터랙티브 프레젠테이션입니다.  
순수 HTML + CSS + JavaScript만으로 제작되었으며, AI를 활용한 바이브코딩으로 개발되었습니다.

---

## 📂 파일 구조

| 파일 | 역할 | 크기 |
|---|---|---|
| `index.html` | 25개 슬라이드 프레젠테이션 (메인) | 46KB |
| `style.css` | 전체 스타일 + 애니메이션 | 53KB |
| `main.js` | 인터랙션 + 파티클 시스템 | 39KB |
| `guide.html` | 스크롤 기반 읽기용 버전 | 75KB |
| `guide.css` / `guide.js` | 가이드 버전 전용 스타일/스크립트 | — |
| `img/` | 배경 비디오 + 포트폴리오 이미지 | 28개 |
| `MD/` | PRD 템플릿 마크다운 | 8개 |

---

## 🛠 사용 기술 상세

### HTML
| 기술 | 용도 |
|---|---|
| **Semantic HTML** | `<section>`, `<nav>`, `<main>`, `<footer>` 시멘틱 태그 |
| **Video Background** | `<video autoplay muted loop playsinline>` |
| **SVG Inline** | 원형 스트로크 애니메이션 |
| **Custom Data Attributes** | `data-slide`, `data-target` 등 |

### CSS
| 기술 | 용도 |
|---|---|
| **CSS Variables** | `--black`, `--yellow`, `--font-serif` 등 디자인 토큰 |
| **clamp()** | 반응형 타이포그래피 `clamp(80px, 15vw, 240px)` |
| **@keyframes** | 모핑, 펄스, 스트로크 드로잉 애니메이션 |
| **cubic-bezier** | 커스텀 이징 함수 |
| **CSS Grid** | 레퍼런스 카드 그리드 (4열 2행) |
| **mix-blend-mode** | 텍스트 블렌딩 효과 |

### JavaScript
| 기술 | 용도 |
|---|---|
| **Intersection Observer** | 슬라이드 가시성 감지 + 지연 로딩 |
| **Canvas 2D** | 파티클 시스템, 아이콘 낙하, 커서 플록 |
| **requestAnimationFrame** | 60fps 애니메이션 루프 |
| **Web Fonts API** | 폰트 로드 완료 감지 |

### 외부 리소스
| 리소스 | 용도 |
|---|---|
| **Google Fonts (DM Serif Display)** | 메가 타이포그래피 세리프 폰트 |
| **Pretendard** | 한글 산세리프 폰트 |
| **Veo3 영상** | AI 생성 배경 비디오 |

---

## 🎯 핵심 기법 해설

### 1. 📝 Split Text — 글자 단위 애니메이션
```
텍스트를 한 글자씩 <span>으로 분리
→ 각 글자에 delay를 줘서 순차 등장
```
이 기법으로 "한 글자씩 나타나는" 타이포 애니메이션이 가능합니다.

### 2. 🎰 Tick Text (Scramble)
```
"PORTFOLIO" 같은 텍스트가
→ "A&%$#XZ" 같은 랜덤 문자로 변하다가
→ 원래 텍스트로 고정
```
> Hugo Motion 스타일의 텍스트 스크램블 효과

### 3. 🎰 Slot Machine Numbers
```
숫자가 슬롯머신처럼 빠르게 돌다가
→ 목표 숫자에서 멈춤
→ 통계 수치 표시에 사용
```

### 4. 📄 Falling Icons (파일 아이콘 낙하)
```
Canvas에 PDF/Image/Video 아이콘을 코드로 그림
→ 위에서 아래로 중력 낙하
→ 폴더 슬라이드 배경으로 사용
```

### 5. 🐦 Cursor Flock (Boids 알고리즘)
```
마우스 커서 아이콘 30개가 떼처럼 움직임
→ 분리(Separation) + 정렬(Alignment) + 응집(Cohesion)
→ 마지막 "START" 슬라이드에서 사용
```
> 레이놀즈의 Boids 군집 알고리즘을 커서 아이콘에 적용

### 6. ✨ Particle System (슬라이드별 파티클)
```
각 슬라이드마다 다른 파티클 구성:
- 모양: circle, square, triangle, outline 변형
- 물리: float, gravity, rise, drift, orbit, pulse
- 색상: white, yellow, black
```
25개 슬라이드 각각에 맞춤 파티클이 자동 생성/소멸됩니다.

### 7. 🎥 Video Lazy Loading
```
슬라이드가 화면에 보일 때만 비디오 재생
→ Intersection Observer로 감지
→ 벗어나면 자동 정지 + 리셋
```
28개 비디오를 효율적으로 관리하는 성능 최적화 기법입니다.

### 8. 🔵 Morphing Shape (CSS)
```css
@keyframes heroMorph {
    0%   { border-radius: 50%; transform: rotate(0deg); }
    25%  { border-radius: 30% 70% 70% 30%; transform: rotate(90deg); }
    50%  { border-radius: 50% 20% 50% 20%; transform: rotate(180deg); }
    100% { border-radius: 50%; transform: rotate(360deg); }
}
```
타이틀 슬라이드의 유기적 도형 변형을 순수 CSS로 구현합니다.

---

## 💬 이런 프롬프트로 만들어보세요

### 기본 구조
```
검은 배경에 전체화면 슬라이드 프레젠테이션을 만들어줘.
키보드 좌우 화살표로 슬라이드를 전환할 수 있게 해줘.
오른쪽에 세로 네비게이션 도트를 추가해줘.
HTML + CSS + JavaScript만 사용해줘.
```

### 타이포그래피
```
슬라이드 중앙에 큰 타이틀을 넣어줘.
폰트 크기는 clamp(80px, 15vw, 240px)로 반응형으로 해줘.
글자가 한 글자씩 순차적으로 나타나는 애니메이션을 넣어줘.
```

### 비디오 배경
```
각 슬라이드에 배경 비디오를 넣을 수 있게 해줘.
비디오는 자동재생, 음소거, 반복으로 설정해줘.
슬라이드가 보일 때만 재생하고, 안 보이면 정지시켜줘.
Intersection Observer를 사용해줘.
```

### 파티클 시스템
```
각 슬라이드 배경에 작은 파티클을 떠다니게 해줘.
Canvas로 구현하고, 슬라이드마다 다른 모양과 움직임을 줘줘.
모양은 원, 사각형, 삼각형 중 선택할 수 있게 하고,
물리는 떠다니기, 중력, 상승, 드리프트 등을 지원해줘.
```

### 텍스트 스크램블
```
타이틀 텍스트에 유고 모션 스타일의 스크램블 효과를 넣어줘.
처음에 랜덤 문자로 변하다가 원래 글자로 고정되게 해줘.
```

---

## 📚 학습 포인트

| 카테고리 | 학습 내용 |
|---|---|
| **레이아웃** | CSS Grid, Flexbox, 100vh 풀스크린 슬라이드 |
| **타이포그래피** | clamp() 반응형, 웹폰트 로딩, 글자 단위 애니메이션 |
| **애니메이션** | CSS @keyframes, cubic-bezier, transform |
| **Canvas** | 파티클 시스템, drawIcon, Boids 알고리즘 |
| **성능** | Intersection Observer, 비디오 지연 로딩, 비트맵 캐싱 |
| **아키텍처** | 클래스 기반 시스템 설계 (ParticleSystem, FallingIconsSystem) |

---

## ▶️ 실행 방법

```bash
# 프로젝트 폴더에서 로컬 서버 실행
python3 -m http.server 8000

# 브라우저에서 열기
open http://localhost:8000/index.html
```

> 비디오 파일이 포함되어 있으므로 **반드시 로컬 서버**로 실행하세요.  
> `file://` 프로토콜로는 비디오가 재생되지 않을 수 있습니다.

---

## 🔗 참고 자료
- [라이브 프레젠테이션](https://sabum.github.io/sharex/)
- [가이드 버전](https://sabum.github.io/sharex/guide.html)
