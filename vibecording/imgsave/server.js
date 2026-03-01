const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const PORT = 3000;

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// URL 유효성 검사 함수
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// 상대 URL을 절대 URL로 변환
function resolveUrl(base, relative) {
    try {
        return new URL(relative, base).href;
    } catch (_) {
        return null;
    }
}

// 이미지 URL 필터링 (아이콘, 트래킹 픽셀 제외)
function isValidImageUrl(url) {
    if (!url) return false;

    // 데이터 URL은 제외 (매우 작은 인라인 이미지일 가능성 높음)
    if (url.startsWith('data:')) return false;

    // 1x1 트래킹 픽셀 패턴 필터링
    const trackingPatterns = [
        /pixel/i,
        /tracking/i,
        /beacon/i,
        /analytics/i,
        /1x1/i,
        /spacer/i,
        /blank/i,
        /transparent/i
    ];

    for (const pattern of trackingPatterns) {
        if (pattern.test(url)) return false;
    }

    // 파비콘/아이콘 패턴 필터링
    const iconPatterns = [
        /favicon/i,
        /icon-\d/i,
        /icons?\//i,
        /\.ico$/i
    ];

    for (const pattern of iconPatterns) {
        if (pattern.test(url)) return false;
    }

    return true;
}

// 이미지 확장자 체크
function hasImageExtension(url) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.avif'];
    const urlLower = url.toLowerCase();
    return imageExtensions.some(ext => urlLower.includes(ext));
}

// 이미지 추출 API
app.post('/api/extract', async (req, res) => {
    try {
        const { url } = req.body;

        if (!url || !isValidUrl(url)) {
            return res.status(400).json({
                success: false,
                error: '유효한 URL을 입력해주세요.'
            });
        }

        console.log(`🔍 이미지 추출 시작: ${url}`);

        // 웹페이지 HTML 가져오기
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
            },
            timeout: 15000
        });

        const html = response.data;
        const $ = cheerio.load(html);
        const images = new Set();

        // 1. <img> 태그에서 이미지 추출
        $('img').each((_, element) => {
            const src = $(element).attr('src');
            const dataSrc = $(element).attr('data-src');
            const dataSrcset = $(element).attr('data-srcset');
            const srcset = $(element).attr('srcset');

            [src, dataSrc].forEach(s => {
                if (s) {
                    const resolved = resolveUrl(url, s);
                    if (resolved && isValidImageUrl(resolved)) {
                        images.add(resolved);
                    }
                }
            });

            // srcset 처리
            [srcset, dataSrcset].forEach(ss => {
                if (ss) {
                    const srcsetUrls = ss.split(',').map(item => item.trim().split(' ')[0]);
                    srcsetUrls.forEach(s => {
                        const resolved = resolveUrl(url, s);
                        if (resolved && isValidImageUrl(resolved)) {
                            images.add(resolved);
                        }
                    });
                }
            });
        });

        // 2. <picture> 태그 내 <source> 처리
        $('picture source').each((_, element) => {
            const srcset = $(element).attr('srcset');
            if (srcset) {
                const srcsetUrls = srcset.split(',').map(item => item.trim().split(' ')[0]);
                srcsetUrls.forEach(s => {
                    const resolved = resolveUrl(url, s);
                    if (resolved && isValidImageUrl(resolved)) {
                        images.add(resolved);
                    }
                });
            }
        });

        // 3. 배경 이미지 추출 (인라인 스타일)
        $('[style*="background"]').each((_, element) => {
            const style = $(element).attr('style');
            const bgUrlMatch = style.match(/url\(['"]?([^'")\s]+)['"]?\)/i);
            if (bgUrlMatch && bgUrlMatch[1]) {
                const resolved = resolveUrl(url, bgUrlMatch[1]);
                if (resolved && isValidImageUrl(resolved) && hasImageExtension(resolved)) {
                    images.add(resolved);
                }
            }
        });

        // 4. <a> 태그 내 이미지 링크 (고해상도 이미지)
        $('a[href]').each((_, element) => {
            const href = $(element).attr('href');
            if (href && hasImageExtension(href)) {
                const resolved = resolveUrl(url, href);
                if (resolved && isValidImageUrl(resolved)) {
                    images.add(resolved);
                }
            }
        });

        // 5. figure 태그 내 이미지
        $('figure img').each((_, element) => {
            const src = $(element).attr('src');
            if (src) {
                const resolved = resolveUrl(url, src);
                if (resolved && isValidImageUrl(resolved)) {
                    images.add(resolved);
                }
            }
        });

        const imageList = Array.from(images);
        console.log(`✅ ${imageList.length}개의 이미지를 찾았습니다.`);

        res.json({
            success: true,
            url: url,
            count: imageList.length,
            images: imageList
        });

    } catch (error) {
        console.error('❌ 에러 발생:', error.message);

        let errorMessage = '이미지 추출 중 오류가 발생했습니다.';
        if (error.code === 'ECONNREFUSED') {
            errorMessage = '해당 웹사이트에 연결할 수 없습니다.';
        } else if (error.response?.status === 403) {
            errorMessage = '해당 웹사이트에서 접근을 거부했습니다.';
        } else if (error.response?.status === 404) {
            errorMessage = '페이지를 찾을 수 없습니다.';
        } else if (error.code === 'ENOTFOUND') {
            errorMessage = '해당 도메인을 찾을 수 없습니다.';
        }

        res.status(500).json({
            success: false,
            error: errorMessage
        });
    }
});

// 메인 페이지
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🖼️  Image Extractor Service                         ║
║   서버가 시작되었습니다                               ║
║                                                       ║
║   🌐 http://localhost:${PORT}                          ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
    `);
});
