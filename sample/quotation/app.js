/* ============================================
   QUOTATION WEB APP — APP.JS
   Core logic: editing, calculation, persistence, PDF
   ============================================ */

(function () {
    'use strict';

    // ─── DATA ───────────────────────────
    const DEFAULT_PERSONNEL = [
        {
            role: 'Creative Director',
            position: 'CD / PM',
            grade: '특급기술자',
            rate: 15000000,
            months: 5.0,
            desc: '크리에이티브 디렉팅 / 프로젝트 매니징'
        },
        {
            role: 'UI Designer',
            position: 'UI Designer',
            grade: '고급기술자',
            rate: 7000000,
            months: 1.0,
            desc: '디자인 트렌드 리서치 / 브랜드 아이덴티티 분석 / UI 디자인 키워드 도출 / 그래픽 모티브 도출 / 디자인 요소 정의 / 디자인 시안 2종 / 전체 페이지 디자인 / 개발 팔로업 / 디자인 QA 진행'
        },
        {
            role: 'UI Designer',
            position: 'UI Designer',
            grade: '중급기술자',
            rate: 6000000,
            months: 8.0,
            desc: ''
        },
        {
            role: 'UI Designer',
            position: 'UI Designer',
            grade: '초급기술자',
            rate: 5000000,
            months: 4.0,
            desc: ''
        },
        {
            role: 'Motion Designer',
            position: 'Motion Designer',
            grade: '초급기술자',
            rate: 5000000,
            months: 0.0,
            desc: ''
        }
    ];

    const STORAGE_KEY = 'quotation_app_data';

    // ─── SELECTORS ──────────────────────
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const personnelBody = $('#personnelBody');
    const totalMonthsEl = $('#totalMonths');
    const totalDirectCostEl = $('#totalDirectCost');
    const overheadBaseEl = $('#overheadBase');
    const overheadRateEl = $('#overheadRate');
    const overheadCostEl = $('#overheadCost');
    const techBaseEl = $('#techBase');
    const techRateEl = $('#techRate');
    const techCostEl = $('#techCost');
    const summaryDirectEl = $('#summaryDirect');
    const summaryOverheadEl = $('#summaryOverhead');
    const summaryTechEl = $('#summaryTech');
    const summaryTotalEl = $('#summaryTotal');
    const grandTotalDisplayEl = $('#grandTotalDisplay');
    const toastEl = $('#toast');

    // ─── HELPERS ────────────────────────
    function formatNumber(n) {
        if (n === 0) return '0';
        return Math.round(n).toLocaleString('ko-KR');
    }

    function parseNumber(str) {
        if (!str) return 0;
        return parseFloat(String(str).replace(/[^\d.-]/g, '')) || 0;
    }

    function truncateToHundredThousand(n) {
        return Math.floor(n / 100000) * 100000;
    }

    function showToast(msg) {
        toastEl.textContent = msg;
        toastEl.classList.add('show');
        setTimeout(() => toastEl.classList.remove('show'), 2000);
    }

    function flashElement(el) {
        el.classList.remove('flash');
        void el.offsetWidth; // trigger reflow
        el.classList.add('flash');
    }

    // ─── PERSONNEL TABLE ───────────────
    let personnelData = [];

    function createRow(data, index) {
        const tr = document.createElement('tr');
        tr.classList.add('row-enter');
        tr.dataset.index = index;

        const subtotal = data.rate * data.months;

        tr.innerHTML = `
      <td class="text-center" style="color:var(--text-muted); font-size:12px;">${index + 1}</td>
      <td>
        <span class="cell-editable" contenteditable="true" data-col="role">${data.role}</span>
      </td>
      <td>
        <span class="cell-editable" contenteditable="true" data-col="position">${data.position}</span>
      </td>
      <td>
        <span class="cell-editable" contenteditable="true" data-col="grade">${data.grade}</span>
      </td>
      <td class="text-right">
        <input type="text" class="cell-input rate-field" data-col="rate" value="${formatNumber(data.rate)}" />
      </td>
      <td class="text-center">
        <input type="number" class="cell-input months-input" data-col="months" value="${data.months}" step="0.5" min="0" />
      </td>
      <td class="text-right">
        <span class="cell-subtotal" data-col="subtotal">${formatNumber(subtotal)}</span>
      </td>
      <td>
        <span class="cell-editable cell-desc" contenteditable="true" data-col="desc" data-placeholder="업무내역 입력">${data.desc}</span>
      </td>
      <td class="no-print text-center">
        <button class="btn-delete-row" data-action="delete" title="삭제">×</button>
      </td>
    `;

        return tr;
    }

    function renderTable() {
        personnelBody.innerHTML = '';
        personnelData.forEach((item, i) => {
            personnelBody.appendChild(createRow(item, i));
        });
        recalculate();
    }

    function addRow() {
        personnelData.push({
            role: '직무',
            position: '역할',
            grade: '등급',
            rate: 5000000,
            months: 1.0,
            desc: ''
        });
        renderTable();
        saveData();
        // Focus the role cell in the new row
        const lastRow = personnelBody.lastElementChild;
        if (lastRow) {
            const firstEditable = lastRow.querySelector('[data-col="role"]');
            if (firstEditable) {
                firstEditable.focus();
                // Select all text
                const range = document.createRange();
                range.selectNodeContents(firstEditable);
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }
    }

    function deleteRow(index) {
        if (personnelData.length <= 1) {
            showToast('최소 1개의 인력 항목이 필요합니다');
            return;
        }
        personnelData.splice(index, 1);
        renderTable();
        saveData();
    }

    // ─── CALCULATION ENGINE ─────────────
    function recalculate() {
        let totalDirect = 0;
        let totalMonths = 0;

        personnelData.forEach((item, i) => {
            const sub = item.rate * item.months;
            totalDirect += sub;
            totalMonths += item.months;

            // Update subtotal in DOM
            const row = personnelBody.children[i];
            if (row) {
                const subtotalEl = row.querySelector('[data-col="subtotal"]');
                if (subtotalEl) {
                    subtotalEl.textContent = formatNumber(sub);
                    flashElement(subtotalEl);
                }
            }
        });

        // Totals in personnel table
        totalMonthsEl.textContent = totalMonths.toFixed(1);
        totalDirectCostEl.textContent = formatNumber(totalDirect);

        // Overhead
        const overheadRate = parseFloat(overheadRateEl.value) || 0;
        const overheadCost = totalDirect * (overheadRate / 100);

        overheadBaseEl.textContent = formatNumber(totalDirect);
        overheadCostEl.textContent = formatNumber(overheadCost);

        // Tech fee
        const techRate = parseFloat(techRateEl.value) || 0;
        const techBase = totalDirect + overheadCost;
        const techCost = techBase * (techRate / 100);

        techBaseEl.textContent = formatNumber(techBase);
        techCostEl.textContent = formatNumber(techCost);

        // Summary
        const grandTotal = totalDirect + overheadCost + techCost;
        summaryDirectEl.textContent = formatNumber(totalDirect);
        summaryOverheadEl.textContent = formatNumber(overheadCost);
        summaryTechEl.textContent = formatNumber(techCost);
        summaryTotalEl.textContent = formatNumber(grandTotal);

        // Grand total display (truncated)
        const truncated = truncateToHundredThousand(grandTotal);
        grandTotalDisplayEl.textContent = formatNumber(truncated) + ' 원';

        // Flash summary
        flashElement(summaryTotalEl);
    }

    // ─── EVENT HANDLERS ─────────────────

    // Personnel table events (delegation)
    personnelBody.addEventListener('input', (e) => {
        const target = e.target;
        const row = target.closest('tr');
        if (!row) return;
        const index = parseInt(row.dataset.index, 10);

        const col = target.dataset.col;
        if (!col) return;

        if (col === 'rate') {
            personnelData[index].rate = parseNumber(target.value);
            recalculate();
        } else if (col === 'months') {
            personnelData[index].months = parseFloat(target.value) || 0;
            recalculate();
        } else if (col === 'role') {
            personnelData[index].role = target.textContent.trim();
        } else if (col === 'position') {
            personnelData[index].position = target.textContent.trim();
        } else if (col === 'grade') {
            personnelData[index].grade = target.textContent.trim();
        } else if (col === 'desc') {
            personnelData[index].desc = target.textContent.trim();
        }

        saveData();
    });

    // Format rate field on blur
    personnelBody.addEventListener('blur', (e) => {
        if (e.target.dataset.col === 'rate') {
            const row = e.target.closest('tr');
            const index = parseInt(row.dataset.index, 10);
            e.target.value = formatNumber(personnelData[index].rate);
        }
    }, true);

    // Clear rate field on focus for easy editing
    personnelBody.addEventListener('focus', (e) => {
        if (e.target.dataset.col === 'rate') {
            const row = e.target.closest('tr');
            const index = parseInt(row.dataset.index, 10);
            e.target.value = personnelData[index].rate;
            e.target.select();
        }
    }, true);

    // Delete row button
    personnelBody.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action="delete"]');
        if (!btn) return;
        const row = btn.closest('tr');
        const index = parseInt(row.dataset.index, 10);
        deleteRow(index);
    });

    // Add row button
    $('#btnAddRow').addEventListener('click', addRow);

    // Rate inputs (overhead, tech)
    overheadRateEl.addEventListener('input', () => { recalculate(); saveData(); });
    techRateEl.addEventListener('input', () => { recalculate(); saveData(); });

    // All editable fields auto-save
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('editable')) {
            saveData();
        }
    });

    // ─── LOGO UPLOAD ────────────────────
    const logoArea = $('#logoArea');
    const logoInput = $('#logoInput');
    const logoPlaceholder = $('#logoPlaceholder');
    const logoImage = $('#logoImage');

    logoArea.addEventListener('click', () => logoInput.click());

    logoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            logoImage.src = ev.target.result;
            logoImage.style.display = 'block';
            logoPlaceholder.style.display = 'none';
            saveData();
        };
        reader.readAsDataURL(file);
    });

    // ─── DATA PERSISTENCE ──────────────
    function collectData() {
        const data = {
            companyName: $('[data-field="companyName"]')?.textContent || '',
            companySubtitle: $('[data-field="companySubtitle"]')?.textContent || '',
            projectName: $('[data-field="projectName"]')?.textContent || '',
            projectPeriod: $('[data-field="projectPeriod"]')?.textContent || '',
            createdDate: $('[data-field="createdDate"]')?.textContent || '',
            clientInfo: $('[data-field="clientInfo"]')?.textContent || '',
            personnel: personnelData,
            overheadRate: parseFloat(overheadRateEl.value) || 110,
            techRate: parseFloat(techRateEl.value) || 15,
            note1: $('[data-field="note1"]')?.textContent || '',
            note2: $('[data-field="note2"]')?.textContent || '',
            footerInfo: $('[data-field="footerInfo"]')?.innerHTML || '',
            logo: logoImage.src || ''
        };
        return data;
    }

    function saveData() {
        try {
            const data = collectData();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('Save failed:', e);
        }
    }

    function loadData() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) {
            console.warn('Load failed:', e);
            return null;
        }
    }

    function applyData(data) {
        if (data.companyName) $('[data-field="companyName"]').textContent = data.companyName;
        if (data.companySubtitle) $('[data-field="companySubtitle"]').textContent = data.companySubtitle;
        if (data.projectName) $('[data-field="projectName"]').textContent = data.projectName;
        if (data.projectPeriod) $('[data-field="projectPeriod"]').textContent = data.projectPeriod;
        if (data.createdDate) $('[data-field="createdDate"]').textContent = data.createdDate;
        if (data.clientInfo) $('[data-field="clientInfo"]').textContent = data.clientInfo;
        if (data.note1) $('[data-field="note1"]').textContent = data.note1;
        if (data.note2) $('[data-field="note2"]').textContent = data.note2;
        if (data.footerInfo) $('[data-field="footerInfo"]').innerHTML = data.footerInfo;
        if (data.overheadRate !== undefined) overheadRateEl.value = data.overheadRate;
        if (data.techRate !== undefined) techRateEl.value = data.techRate;
        if (data.personnel) personnelData = data.personnel;
        if (data.logo && data.logo.startsWith('data:')) {
            logoImage.src = data.logo;
            logoImage.style.display = 'block';
            logoPlaceholder.style.display = 'none';
        }
    }

    // ─── RESET ──────────────────────────
    $('#btnReset').addEventListener('click', () => {
        if (!confirm('견적서를 초기 상태로 되돌리시겠습니까?\n저장되지 않은 데이터는 사라집니다.')) return;

        localStorage.removeItem(STORAGE_KEY);
        personnelData = JSON.parse(JSON.stringify(DEFAULT_PERSONNEL));

        // Reset editable fields
        $('[data-field="companyName"]').textContent = 'PlusX';
        $('[data-field="companySubtitle"]').textContent = 'Creative Partner';
        $('[data-field="projectName"]').textContent = '프로젝트명';
        $('[data-field="projectPeriod"]').textContent = '0개월 (0월-0월)';
        $('[data-field="createdDate"]').textContent = '2023. 01. 01.';
        $('[data-field="clientInfo"]').textContent = '회사명 / 대표자명 / 회사주소 등';
        $('[data-field="note1"]').textContent = '협의된 프로젝트 범위와 일정 외의 작업이 추가되는 경우 추가 개발 비용이 발생합니다.';
        $('[data-field="note2"]').textContent = '폰트, 이미지, 영상, 일러스트 등 외부 소스 구매 시 추가 라이센스 비용이 발생합니다.';
        overheadRateEl.value = 110;
        techRateEl.value = 15;

        // Reset logo
        logoImage.src = '';
        logoImage.style.display = 'none';
        logoPlaceholder.style.display = 'flex';

        renderTable();
        showToast('초기화되었습니다');
    });

    // ─── MANUAL SAVE ────────────────────
    $('#btnSave').addEventListener('click', () => {
        saveData();
        showToast('✅ 저장되었습니다');
    });

    // ─── PDF EXPORT ─────────────────────
    $('#btnPDF').addEventListener('click', async () => {
        const docEl = $('#document');
        const actionBar = $('#actionBar');

        // Hide non-print elements
        actionBar.style.display = 'none';
        const noPrintEls = $$('.no-print, .btn-add, .btn-delete-row');
        noPrintEls.forEach(el => el.style.display = 'none');

        // Remove hover/focus styles temporarily
        docEl.classList.add('pdf-rendering');

        // Get project name for filename
        const projectName = $('[data-field="projectName"]')?.textContent?.trim() || '견적서';
        const date = $('[data-field="createdDate"]')?.textContent?.trim()?.replace(/\./g, '').replace(/\s+/g, '') || '';
        const filename = `${projectName}_견적서${date ? '_' + date : ''}.pdf`;

        const opt = {
            margin: [8, 8, 8, 8],
            filename: filename,
            image: { type: 'png' },
            html2canvas: {
                scale: 3,
                useCORS: true,
                letterRendering: true,
                logging: false,
                backgroundColor: '#ffffff',
                onclone: function (clonedDoc) {
                    // Force all text to pure black in the cloned DOM
                    const allEls = clonedDoc.querySelectorAll('*');
                    allEls.forEach(el => {
                        const style = el.style;
                        const computed = clonedDoc.defaultView.getComputedStyle(el);
                        const currentColor = computed.color;

                        // Force text colors to be darker
                        if (currentColor && currentColor !== 'rgb(0, 0, 0)') {
                            // Parse rgb values
                            const match = currentColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
                            if (match) {
                                const r = parseInt(match[1]);
                                const g = parseInt(match[2]);
                                const b = parseInt(match[3]);
                                const brightness = (r + g + b) / 3;

                                // Darken light-gray text (make muted text readable but darker)
                                if (brightness < 200 && brightness > 0) {
                                    const factor = 0.65; // darken by 35%
                                    style.color = `rgb(${Math.round(r * factor)}, ${Math.round(g * factor)}, ${Math.round(b * factor)})`;
                                }
                            }
                        }

                        // Remove opacity
                        if (computed.opacity !== '1') {
                            style.opacity = '1';
                        }

                        // Disable animations and transitions
                        style.animation = 'none';
                        style.transition = 'none';
                    });

                    // Force document background
                    const doc = clonedDoc.querySelector('.document');
                    if (doc) {
                        doc.style.boxShadow = 'none';
                        doc.style.background = '#ffffff';
                    }
                }
            },
            jsPDF: {
                unit: 'mm',
                format: 'a4',
                orientation: 'portrait',
                compress: false
            },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        showToast('PDF 생성 중...');

        try {
            await html2pdf().set(opt).from(docEl).save();
            showToast('✅ PDF 다운로드 완료');
        } catch (err) {
            console.error('PDF generation failed:', err);
            showToast('❌ PDF 생성 실패');
        } finally {
            // Restore UI
            actionBar.style.display = '';
            noPrintEls.forEach(el => el.style.display = '');
            docEl.classList.remove('pdf-rendering');
        }
    });

    // ─── INIT ───────────────────────────
    function init() {
        const savedData = loadData();
        if (savedData && savedData.personnel && savedData.personnel.length > 0) {
            applyData(savedData);
        } else {
            personnelData = JSON.parse(JSON.stringify(DEFAULT_PERSONNEL));
        }
        renderTable();
    }

    init();

})();
