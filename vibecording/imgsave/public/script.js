/**
 * Image Extractor Bookmarklet v6
 * Aggressive deduplication - extracts image fingerprint and keeps largest version
 * 
 * @description 북마크릿으로 웹페이지에서 이미지를 추출하는 도구
 * @version 6.0.0
 */

// ============================================================================
// BOOKMARKLET SOURCE CODE (Readable Version)
// ============================================================================

/**
 * 북마크릿 코드 템플릿
 * - MIN: 최소 이미지 크기 (300px)
 * - getFingerprint: URL에서 크기 정보 제거하여 고유 식별자 생성
 * - getSizeHint: URL에서 이미지 크기 힌트 추출
 * - scan: 페이지에서 모든 이미지 소스 스캔
 */

const BOOKMARKLET_CONFIG = {
    MIN_SIZE: 300,
    VERSION: 'v6',
    ARIA_LABELS: {
        selectAll: '모든 이미지 선택',
        autoScroll: '자동 스크롤 및 스캔',
        rescan: '다시 스캔',
        clear: '선택 초기화',
        downloadSelected: '선택한 이미지 다운로드',
        downloadAll: '모든 이미지 다운로드',
        close: '닫기',
        prevImage: '이전 이미지',
        nextImage: '다음 이미지',
        downloadImage: '이미지 다운로드'
    },
    ERROR_MESSAGES: {
        noImages: '이미지를 찾을 수 없습니다.\n\n페이지를 스크롤하여 이미지를 로드한 후 다시 시도해주세요.',
        corsError: 'CORS 오류가 발생했습니다.\n일부 이미지는 직접 저장이 필요합니다.',
        downloadFailed: '다운로드 실패: 새 탭에서 이미지를 열었습니다.',
        zipLoadFailed: 'ZIP 라이브러리 로드 실패. 개별 다운로드를 시작합니다.',
        allFailed: '모든 이미지 다운로드 실패. 사이트 보안 정책(CORS)으로 인해 직접 다운로드가 불가능합니다.'
    }
};

// Minified bookmarklet code with improved error handling and ARIA support
const bookmarkletCode = `javascript:(function(){
var MIN=300,imgs=[],selected={};
var ERRORS={noImages:'이미지를 찾을 수 없습니다.\\n\\n페이지를 스크롤하여 이미지를 로드한 후 다시 시도해주세요.',cors:'CORS 오류로 일부 이미지를 다운로드할 수 없습니다.',zipFail:'ZIP 라이브러리 로드 실패',allFail:'모든 다운로드 실패: 사이트 보안 정책으로 직접 다운로드가 불가능합니다.'};
/* Extract fingerprint from URL by removing size-related parts */
function getFingerprint(u){
try{
var url=new URL(u,location.href);
var path=url.pathname;
/* Remove common size patterns from filename */
path=path.replace(/[_-]?\\d{2,4}x\\d{2,4}/gi,''); /* 100x100, 1920x1080 */
path=path.replace(/[_-]?(small|medium|large|thumb|thumbnail|preview|xx?l|xs|sm|md|lg)/gi,'');
path=path.replace(/[_-]?w\\d{2,4}/gi,''); /* w100, w1920 */
path=path.replace(/[_-]?h\\d{2,4}/gi,''); /* h100, h1920 */
path=path.replace(/[_-]?s\\d{2,4}/gi,''); /* s100 */
path=path.replace(/[_-]?q\\d{1,3}/gi,''); /* q80 quality */
path=path.replace(/@\\d+x/gi,''); /* @2x, @3x retina */
path=path.replace(/[_-]?\\d{2,4}w/gi,''); /* 100w */
/* Get just filename without extension */
var parts=path.split('/');
var filename=parts[parts.length-1].split('.')[0];
/* Remove trailing numbers that might be size */
filename=filename.replace(/[_-]?\\d+$/,'');
return url.hostname+'/'+filename;
}catch(e){return u}
}
/* Get size hint from URL (higher = likely bigger) */
function getSizeHint(u){
var score=0;
/* Check for size in URL */
var m=u.match(/(\\d{2,4})x(\\d{2,4})/i);
if(m)score=parseInt(m[1])*parseInt(m[2]);
m=u.match(/[wh][_=-]?(\\d{2,4})/i);
if(m)score=Math.max(score,parseInt(m[1])*parseInt(m[1]));
m=u.match(/s[_=-]?(\\d{2,4})/i);
if(m)score=Math.max(score,parseInt(m[1])*parseInt(m[1]));
/* original, full, large = high score */
if(/original|full|large|master|source|raw|hd|hi-?res/i.test(u))score=Math.max(score,9999999);
/* small, thumb = low score */
if(/small|thumb|preview|icon|avatar/i.test(u))score=Math.min(score,100);
/* Longer URL often has more params = higher quality */
if(score===0)score=u.length;
return score;
}
function scan(){
var found={};
function addImg(u){
if(!u||u.indexOf('data:')===0||u.indexOf('blob:')===0)return;
try{u=new URL(u,location.href).href}catch(e){return}
/* Skip tiny images, icons, tracking pixels */
if(/spacer|pixel|tracking|beacon|1x1|blank\\.gif/i.test(u))return;
var fp=getFingerprint(u);
var hint=getSizeHint(u);
if(!found[fp]||hint>found[fp].hint){
found[fp]={url:u,hint:hint};
}
}
/* 1. Performance API */
try{performance.getEntriesByType('resource').forEach(function(r){
if(r.initiatorType==='img'||r.initiatorType==='css'||/\\.(jpg|jpeg|png|gif|webp|svg|avif|bmp)/i.test(r.name)){
addImg(r.name);
}
})}catch(e){}
/* 2. IMG tags */
document.querySelectorAll('img').forEach(function(i){
addImg(i.currentSrc);addImg(i.src);
['data-src','data-lazy','data-original','data-lazy-src','data-hi-res-src','data-image','data-url','data-large','data-full'].forEach(function(a){
var v=i.getAttribute(a);if(v)addImg(v);
});
var ss=i.srcset||i.getAttribute('data-srcset');
if(ss){
var best='',bestW=0;
ss.split(',').forEach(function(p){
var parts=p.trim().split(/\\s+/);
var url=parts[0];
var w=1;
if(parts[1]){var m=parts[1].match(/(\\d+)/);if(m)w=parseInt(m[1])}
if(w>bestW){bestW=w;best=url}
});
if(best)addImg(best);
}
});
/* 3. Picture/source */
document.querySelectorAll('source[srcset]').forEach(function(src){
var ss=src.srcset;
var best='',bestW=0;
ss.split(',').forEach(function(p){
var parts=p.trim().split(/\\s+/);
var url=parts[0];
var w=1;
if(parts[1]){var m=parts[1].match(/(\\d+)/);if(m)w=parseInt(m[1])}
if(w>bestW){bestW=w;best=url}
});
if(best)addImg(best);
});
/* 4. Background images */
document.querySelectorAll('*').forEach(function(e){
try{var bg=getComputedStyle(e).backgroundImage;
if(bg&&bg!=='none'){var matches=bg.match(/url\\(['"]?([^'"\\)]+)['"]?\\)/g);
if(matches)matches.forEach(function(m){var p=m.match(/url\\(['"]?([^'"\\)]+)['"]?\\)/);if(p)addImg(p[1])})}}catch(e){}
});
/* 5. Inline backgrounds */
document.querySelectorAll('[style*="url"]').forEach(function(e){
var st=e.getAttribute('style');
var matches=st.match(/url\\(['"]?([^'"\\)]+)['"]?\\)/g);
if(matches)matches.forEach(function(m){var p=m.match(/url\\(['"]?([^'"\\)]+)['"]?\\)/);if(p)addImg(p[1])});
});
/* 6. Video poster */
document.querySelectorAll('video[poster]').forEach(function(v){addImg(v.poster)});
/* 7. Links to images */
document.querySelectorAll('a[href]').forEach(function(a){if(/\\.(jpg|jpeg|png|gif|webp|avif)(\\?|$)/i.test(a.href))addImg(a.href)});
/* 8. SVG images */
document.querySelectorAll('image').forEach(function(i){
addImg(i.getAttribute('href'));addImg(i.getAttribute('xlink:href'));
});
var results=[];
for(var k in found)results.push(found[k].url);
return results;
}
imgs=scan();
if(!imgs.length){alert(ERRORS.noImages);return}
var old=document.getElementById('imgext');if(old)old.remove();
var st=document.createElement('style');
st.id='imgext-style';
st.textContent='#imgext{position:fixed;inset:0;background:#000;z-index:2147483647;overflow-y:auto;font:14px -apple-system,sans-serif}#imgext *{box-sizing:border-box}.imgext-hdr{position:sticky;top:0;z-index:100;background:#111;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid #333;flex-wrap:wrap}.imgext-hdr h2{color:#fff;margin:0;font-size:16px;font-weight:500}.imgext-btns{display:flex;gap:8px;flex-wrap:wrap}.imgext-btn{background:#222;color:#fff;border:1px solid #444;padding:8px 16px;cursor:pointer;font-size:12px;border-radius:4px;transition:background .2s,border-color .2s}.imgext-btn:hover{background:#333;border-color:#666}.imgext-btn:disabled{opacity:.4;cursor:default}.imgext-btn:focus{outline:2px solid #0066ff;outline-offset:2px}.imgext-btn.sel{background:#0066ff;border-color:#0066ff}.imgext-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;padding:16px}.imgext-card{background:#1a1a1a;border-radius:6px;overflow:hidden;position:relative;border:2px solid transparent;transition:border-color .2s}.imgext-card.on{border-color:#0066ff}.imgext-card:focus-within{outline:2px solid #0066ff;outline-offset:2px}.imgext-thumb{width:100%;aspect-ratio:1;object-fit:cover;display:block;cursor:pointer}.imgext-chk{position:absolute;top:8px;left:8px;width:24px;height:24px;background:rgba(0,0,0,.7);border:2px solid #fff;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;color:transparent;transition:.15s}.imgext-chk:hover,.imgext-chk:focus{background:rgba(255,255,255,.2);outline:none}.imgext-card.on .imgext-chk{background:#0066ff;border-color:#0066ff;color:#fff}.imgext-sz{position:absolute;bottom:6px;left:6px;color:rgba(255,255,255,.5);font-size:10px;text-shadow:0 1px 2px rgba(0,0,0,.5)}.imgext-dl{position:absolute;top:8px;right:8px;width:28px;height:28px;background:rgba(0,0,0,.5);border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:.15s}.imgext-dl:hover,.imgext-dl:focus{background:rgba(0,0,0,.8);outline:2px solid #fff}.imgext-dl svg{width:14px;height:14px;stroke:rgba(255,255,255,.8);stroke-width:2;fill:none}#imgext-toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:12px 24px;border-radius:8px;font-size:14px;z-index:2147483648;opacity:0;transition:opacity .3s;pointer-events:none}#imgext-toast.show{opacity:1}#imgext-lb{position:fixed;inset:0;background:rgba(0,0,0,.95);z-index:2147483648;display:flex;align-items:center;justify-content:center}#imgext-lb img{max-width:80%;max-height:90%;border-radius:4px}#imgext-lb .nav{position:absolute;top:50%;transform:translateY(-50%);width:50px;height:50px;background:rgba(255,255,255,.1);border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:.2s}#imgext-lb .nav:hover,#imgext-lb .nav:focus{background:rgba(255,255,255,.25);outline:2px solid #fff}#imgext-lb .nav svg{width:24px;height:24px;stroke:#fff;stroke-width:2;fill:none}#imgext-lb .prev{left:20px}#imgext-lb .next{right:20px}#imgext-lb .close{position:absolute;top:20px;right:20px;width:40px;height:40px;background:rgba(255,255,255,.1);border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center}#imgext-lb .close:hover,#imgext-lb .close:focus{background:rgba(255,255,255,.25);outline:2px solid #fff}#imgext-lb .close svg{width:20px;height:20px;stroke:#fff;stroke-width:2;fill:none}#imgext-lb .lbdl{position:absolute;top:20px;right:70px;width:40px;height:40px;background:rgba(255,255,255,.1);border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center}#imgext-lb .lbdl:hover,#imgext-lb .lbdl:focus{background:rgba(255,255,255,.25);outline:2px solid #fff}#imgext-lb .lbdl svg{width:20px;height:20px;stroke:#fff;stroke-width:2;fill:none}';
document.head.appendChild(st);
var ov=document.createElement('div');
ov.id='imgext';
ov.setAttribute('role','dialog');
ov.setAttribute('aria-label','Image Extractor');
ov.innerHTML='<div class="imgext-hdr"><h2 id="imgext-cnt" aria-live="polite">'+imgs.length+' Images</h2><div class="imgext-btns" role="toolbar" aria-label="이미지 관리 도구"><button class="imgext-btn" data-act="selall" aria-label="모든 이미지 선택">Select All</button><button class="imgext-btn" data-act="scroll" aria-label="자동 스크롤 및 스캔">Auto Scroll & Scan</button><button class="imgext-btn" data-act="rescan" aria-label="다시 스캔">Re-Scan</button><button class="imgext-btn" data-act="clear" aria-label="선택 초기화">Clear</button><button class="imgext-btn sel" data-act="dlsel" style="display:none" aria-label="선택한 이미지 다운로드">Download Selected</button><button class="imgext-btn" data-act="dlall" aria-label="모든 이미지 다운로드">Download All</button><button class="imgext-btn" data-act="close" aria-label="닫기">Close</button></div></div><div class="imgext-grid" id="imgext-grid" role="grid" aria-label="추출된 이미지 목록"></div><div id="imgext-toast" role="alert" aria-live="assertive"></div>';
document.body.appendChild(ov);
var grid=document.getElementById('imgext-grid');
var toast=document.getElementById('imgext-toast');
function showToast(msg,duration){
duration=duration||3000;
toast.textContent=msg;
toast.classList.add('show');
setTimeout(function(){toast.classList.remove('show')},duration);
}
function buildGrid(list){
grid.innerHTML='';
list.forEach(function(src,i){
var card=document.createElement('div');
card.className='imgext-card';
card.dataset.url=src;
card.setAttribute('role','gridcell');
if(selected[src])card.className+=' on';
card.innerHTML='<button class="imgext-chk" aria-label="이미지 '+(i+1)+' 선택" tabindex="0">✓</button><img class="imgext-thumb" src="'+src+'" alt="추출된 이미지 '+(i+1)+'" loading="lazy"><span class="imgext-sz" aria-hidden="true">...</span><button class="imgext-dl" aria-label="이미지 '+(i+1)+' 다운로드"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0l-4-4m4 4l4-4M5 17v2a2 2 0 002 2h10a2 2 0 002-2v-2"/></svg></button>';
var img=card.querySelector('.imgext-thumb');
img.onload=function(){
if(this.naturalWidth<MIN&&this.naturalHeight<MIN){card.style.display='none'}
else{card.querySelector('.imgext-sz').textContent=this.naturalWidth+'x'+this.naturalHeight}
updCount();
};
img.onerror=function(){card.style.display='none';updCount()};
grid.appendChild(card);
});
}
function updCount(){
var cnt=Object.keys(selected).length;
var total=grid.querySelectorAll('.imgext-card:not([style*="display: none"])').length;
document.getElementById('imgext-cnt').textContent=cnt?cnt+' Selected':total+' Images';
ov.querySelector('[data-act=dlsel]').style.display=cnt?'inline-block':'none';
}
buildGrid(imgs);
function dl(url,name){
fetch(url,{mode:'cors',credentials:'omit'}).then(function(r){
if(!r.ok)throw new Error('HTTP '+r.status);
return r.blob();
}).then(function(b){
var u=URL.createObjectURL(b);var a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(u);
showToast('다운로드 완료: '+name);
}).catch(function(e){
console.warn('Download failed:',e);
showToast('CORS 오류: 새 탭에서 이미지를 열었습니다',4000);
window.open(url,'_blank');
});
}
function dlZip(list,btn){
var orig=btn.textContent;btn.disabled=true;btn.textContent='Loading JSZip...';
function loadZipLib(cb){
if(window.JSZip){cb(true);return}
var cdns=['https://unpkg.com/jszip@3.10.1/dist/jszip.min.js','https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js','https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js'];
var idx=0;
function tryNext(){if(idx>=cdns.length){cb(false);return}fetch(cdns[idx++]).then(function(r){if(!r.ok)throw 0;return r.text()}).then(function(c){try{(new Function(c))();if(window.JSZip){cb(true);return}}catch(e){}tryNext()}).catch(tryNext)}
tryNext();
}
function doZip(){
var zip=new JSZip(),done=0,fail=0;btn.textContent='0/'+list.length;
Promise.all(list.map(function(url,i){
return fetch(url,{mode:'cors',credentials:'omit'}).then(function(r){
if(!r.ok)throw new Error('HTTP '+r.status);
return r.blob();
}).then(function(b){
var ext=b.type.split('/')[1]||'jpg';ext=ext.split(';')[0];if(ext==='jpeg')ext='jpg';
zip.folder('images').file('img_'+(i+1)+'.'+ext,b);done++;btn.textContent=done+'/'+list.length;
}).catch(function(e){
console.warn('Failed to fetch:',url,e);
fail++;done++;btn.textContent=done+'/'+list.length;
});
})).then(function(){
if(done===fail){
showToast(ERRORS.allFail,5000);
btn.textContent='Download Failed';
setTimeout(function(){btn.textContent=orig;btn.disabled=false},3000);
return;
}
if(fail>0){
showToast(fail+'개 이미지 CORS 오류로 제외됨',4000);
}
btn.textContent='Zipping...';
zip.generateAsync({type:'blob'}).then(function(c){
var u=URL.createObjectURL(c),a=document.createElement('a');a.href=u;a.download='images_'+Date.now()+'.zip';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(u);
btn.textContent='완료!';
showToast((done-fail)+'개 이미지 다운로드 완료');
setTimeout(function(){btn.textContent=orig;btn.disabled=false},2000);
});
});
}
loadZipLib(function(ok){
if(ok){doZip()}
else{
showToast('ZIP 라이브러리 로드 실패. 개별 다운로드 시작...',4000);
btn.textContent='Downloading...';
list.forEach(function(u,i){setTimeout(function(){dl(u,'img_'+(i+1)+'.jpg')},i*500)});
setTimeout(function(){btn.textContent=orig;btn.disabled=false},list.length*500+1000);
}
});
}
var lbIdx=0,lbImgs=[];
function showLb(url){
var old=document.getElementById('imgext-lb');if(old)old.remove();
lbImgs=[];grid.querySelectorAll('.imgext-card:not([style*="display: none"])').forEach(function(c){lbImgs.push(c.dataset.url)});
lbIdx=lbImgs.indexOf(url);if(lbIdx<0)lbIdx=0;
var lb=document.createElement('div');lb.id='imgext-lb';
lb.setAttribute('role','dialog');
lb.setAttribute('aria-label','이미지 상세 보기');
lb.innerHTML='<button class="nav prev" aria-label="이전 이미지"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg></button><img src="'+lbImgs[lbIdx]+'" alt="상세 이미지"><button class="nav next" aria-label="다음 이미지"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button><button class="lbdl" aria-label="이미지 다운로드"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0l-4-4m4 4l4-4M5 17v2a2 2 0 002 2h10a2 2 0 002-2v-2"/></svg></button><button class="close" aria-label="닫기"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg></button>';
lb.querySelector('.prev').onclick=function(e){e.stopPropagation();lbIdx=(lbIdx-1+lbImgs.length)%lbImgs.length;lb.querySelector('img').src=lbImgs[lbIdx]};
lb.querySelector('.next').onclick=function(e){e.stopPropagation();lbIdx=(lbIdx+1)%lbImgs.length;lb.querySelector('img').src=lbImgs[lbIdx]};
lb.querySelector('.lbdl').onclick=function(e){e.stopPropagation();dl(lbImgs[lbIdx],'image.jpg')};
lb.querySelector('.close').onclick=function(){lb.remove()};
lb.onclick=function(e){if(e.target===lb)lb.remove()};
/* Keyboard navigation */
lb.addEventListener('keydown',function(e){
if(e.key==='Escape'){lb.remove();e.preventDefault()}
else if(e.key==='ArrowLeft'){lb.querySelector('.prev').click();e.preventDefault()}
else if(e.key==='ArrowRight'){lb.querySelector('.next').click();e.preventDefault()}
});
document.body.appendChild(lb);
lb.querySelector('.close').focus();
}
ov.onclick=function(e){
var t=e.target,act=t.dataset.act;
if(act==='close'){ov.remove();st.remove();return}
if(act==='selall'){grid.querySelectorAll('.imgext-card:not([style*="display: none"])').forEach(function(c){selected[c.dataset.url]=c.dataset.url;c.classList.add('on')});updCount();showToast('모든 이미지가 선택되었습니다');return}
if(act==='clear'){grid.querySelectorAll('.imgext-card').forEach(function(c){c.classList.remove('on')});selected={};updCount();showToast('선택이 초기화되었습니다');return}
if(act==='dlall'){var visible=[];grid.querySelectorAll('.imgext-card:not([style*="display: none"])').forEach(function(c){visible.push(c.dataset.url)});dlZip(visible,t);return}
if(act==='dlsel'){dlZip(Object.values(selected),t);return}
if(act==='rescan'||act==='scroll'){
if(act==='scroll'){
t.textContent='Scrolling...';
showToast('자동 스크롤 중...');
var h=0,step=window.innerHeight,passes=0;
var tm=setInterval(function(){
var max=document.body.scrollHeight;
h+=step;window.scrollTo(0,h);
if(h>=max){passes++;if(passes<3){var newMax=document.body.scrollHeight;if(newMax>max)return}clearInterval(tm);doRescan(t,'Auto Scroll & Scan')}
},200);
}else{doRescan(t,'Re-Scan')}
return;
}
function doRescan(btn,label){
btn.textContent='Scanning...';
showToast('이미지를 스캔하는 중...');
setTimeout(function(){
var newImgs=scan();
var fps={};imgs.forEach(function(u){fps[getFingerprint(u)]=1});
var addedCount=0;
newImgs.forEach(function(u){var fp=getFingerprint(u);if(!fps[fp]){imgs.push(u);fps[fp]=1;addedCount++}});
buildGrid(imgs);
btn.textContent=label;
showToast(addedCount>0?addedCount+'개의 새 이미지를 발견했습니다':'새로운 이미지가 없습니다');
},500);
}
var card=t.closest('.imgext-card');
if(card){
var u=card.dataset.url;
if(t.classList.contains('imgext-chk')||t.closest('.imgext-chk')){if(selected[u]){delete selected[u];card.classList.remove('on')}else{selected[u]=u;card.classList.add('on')}updCount();return}
if(t.classList.contains('imgext-thumb')){showLb(u);return}
if(t.classList.contains('imgext-dl')||t.closest('.imgext-dl')){dl(u,'image.jpg');return}
}
};
/* Keyboard accessibility for main overlay */
ov.addEventListener('keydown',function(e){
if(e.key==='Escape'){ov.remove();st.remove();e.preventDefault()}
});
ov.querySelector('[data-act=close]').focus();
})()`;

// ============================================================================
// SCRIPT INITIALIZATION
// ============================================================================

/**
 * 페이지 로드 시 북마크릿 버튼 초기화
 */
function initBookmarklet() {
    const bookmarkletEl = document.getElementById('bookmarklet');

    if (!bookmarkletEl) {
        console.warn('Bookmarklet element not found');
        return;
    }

    // 북마크릿 href 설정
    bookmarkletEl.href = bookmarkletCode;

    // 클릭 시 안내 메시지 표시
    bookmarkletEl.addEventListener('click', function (e) {
        e.preventDefault();

        const message = `이 버튼을 북마크 바로 드래그해주세요!

📌 북마크 바가 보이지 않으면:
• Chrome/Edge: Ctrl+Shift+B (Mac: Cmd+Shift+B)
• Firefox: Ctrl+B

드래그한 후 원하는 웹페이지에서 클릭하세요.`;

        alert(message);
    });

    // 드래그 시각적 피드백
    bookmarkletEl.addEventListener('dragstart', function () {
        this.style.opacity = '0.7';
    });

    bookmarkletEl.addEventListener('dragend', function () {
        this.style.opacity = '1';
    });

    console.log('✅ Image Extractor bookmarklet initialized');
}

// DOM 로드 완료 시 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBookmarklet);
} else {
    initBookmarklet();
}
