/**
 * WBS Schedule Editor Logic
 * Supports: Timeline generation, Gantt chart rendering, Drag & Drop, Persistence, PDF Export
 */

// === DOM Elements ===
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const els = {
    scheduleContainer: $('#scheduleContainer'),
    btnSettings: $('#btnSettings'),
    btnAddCategory: $('#btnAddCategory'),
    btnAddMilestone: $('#btnAddMilestone'),
    btnReset: $('#btnReset'),
    btnSave: $('#btnSave'),
    btnPDF: $('#btnPDF'),
    settingsModal: $('#settingsModal'),
    milestoneModal: $('#milestoneModal'),
    toast: $('#toast'),
    // Settings logic
    inputStartDate: $('#inputStartDate'),
    inputNumWeeks: $('#inputNumWeeks'),
    btnModalCancel: $('#btnModalCancel'),
    btnModalApply: $('#btnModalApply'),
    // Milestone logic
    inputMsWeek: $('#inputMsWeek'),
    inputMsLabel: $('#inputMsLabel'),
    inputMsSublabel: $('#inputMsSublabel'),
    btnMsCancel: $('#btnMsCancel'),
    btnMsDelete: $('#btnMsDelete'),
    btnMsApply: $('#btnMsApply'),
};

// === State & Constants ===
const WEEK_WIDTH = 55; // Must match CSS --week-col-width
const STORAGE_KEY = 'wbs_schedule_data_v1';

// Default State
const defaultState = {
    projectTitle: 'Global Rebranding',
    documentTitle: 'Schedule',
    startDate: '2025-06-16', // Starts on a Monday
    numWeeks: 23,
    footerNote: '* 위 내용은 2025년 6월 4일에 작성한 일정 초안입니다. 향후 계약서에 명시된 업무 영역과 실제 프로젝트 착수 시점에 따라 세부 내용이 변경될 수 있습니다.',
    categories: [
        {
            id: 'c1',
            name: '전략 기획',
            tasks: [
                { id: 't1', name: '- 내부 이해관계자 인터뷰', start: 0, duration: 2 },
                { id: 't2', name: '- 브랜드 환경/현황 분석', start: 0, duration: 3 },
                { id: 't3', name: '- 브랜드 네이밍', start: 2, duration: 4 },
                { id: 't4', name: '- 브랜드 비전/미션/핵심가치 정립', start: 3, duration: 4 }
            ]
        },
        {
            id: 'c2',
            name: '브랜드 디자인',
            tasks: [
                { id: 't5', name: '- 컨셉 도출 및 원칙 수립', start: 6, duration: 4 },
                { id: 't6', name: '- 브랜드마크 디자인', start: 7, duration: 5 },
                { id: 't7', name: '- 키 비주얼 개발', start: 9, duration: 4 },
                { id: 't8', name: '- 컬러 시스템 개발', start: 10, duration: 3 },
                { id: 't9', name: '- 타이포그래피 시스템 개발', start: 10, duration: 3 }
            ]
        },
        {
            id: 'c3',
            name: '어플리케이션 디자인',
            tasks: [
                { id: 't10', name: '- 명함, 사원증, 대/소봉투, 쇼핑백', start: 13, duration: 5 },
                { id: 't11', name: '- 앱아이콘, 스플래시, 모바일 룩앤필', start: 14, duration: 5 },
                { id: 't12', name: '- 웹사이트 톤앤매너', start: 15, duration: 4 },
                { id: 't13', name: '- 기업 굿즈 (5종)', start: 16, duration: 4 }
            ]
        },
        {
            id: 'c4',
            name: '가이드라인 개발',
            tasks: [
                { id: 't14', name: '- 브랜드 가이드라인 (PDF/AI)', start: 18, duration: 4 }
            ]
        }
    ],
    milestones: [
        { id: 'm1', week: 2, label: '인터뷰/설문 진행', sublabel: '' },
        { id: 'm2', week: 5, label: '1st Review', sublabel: '전략 방향성 및\n네이밍 제안' },
        { id: 'm3', week: 9, label: '2nd Review', sublabel: '브랜드 슬로건 및\nBIS 고도화' },
        { id: 'm4', week: 13, label: '3rd Review', sublabel: '디자인 컨셉 제안' },
        { id: 'm5', week: 16, label: '4th Review', sublabel: '디자인 시안 제안' },
        { id: 'm6', week: 19, label: 'Application Design', sublabel: '어플리케이션 디자인 완료' },
        { id: 'm7', week: 22, label: 'Project End', sublabel: '최종 가이드라인 전달' }
    ]
};

let state = JSON.parse(JSON.stringify(defaultState));
let dragInfo = null;
let currentEditingMilestoneId = null;

// === Initialization ===
function init() {
    loadData();
    renderApp();
    setupEventListeners();
}

// === Data Management ===
function loadData() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            state = JSON.parse(stored);
        } catch (e) {
            console.error('Data load failed', e);
        }
    }
}

function saveData() {
    // Update editable fields
    state.projectTitle = $('[data-field="projectTitle"]').innerText;
    state.documentTitle = $('[data-field="documentTitle"]').innerText;
    state.footerNote = $('[data-field="footerNote"]').innerText;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    showToast('저장되었습니다.');
}

function resetData() {
    if (confirm('모든 내용을 초기화하시겠습니까?')) {
        state = JSON.parse(JSON.stringify(defaultState));
        renderApp();
        showToast('초기화되었습니다.');
    }
}

// === Rendering ===
function renderApp() {
    // Top headers
    $('[data-field="projectTitle"]').innerText = state.projectTitle;
    $('[data-field="documentTitle"]').innerText = state.documentTitle;
    $('[data-field="footerNote"]').innerText = state.footerNote;

    renderSchedule();
}

function renderSchedule() {
    els.scheduleContainer.innerHTML = '';

    // 1. Render Timeline Header
    const headerRow = document.createElement('div');
    headerRow.className = 'schedule-row header-row';

    // Empty corner cell
    const cornerCell = document.createElement('div');
    cornerCell.className = 'cell-task';
    headerRow.appendChild(cornerCell);

    // Timeline cell
    const timelineCell = document.createElement('div');
    timelineCell.className = 'cell-timeline';

    // Month Row
    const monthRow = document.createElement('div');
    monthRow.className = 'month-row';

    // Week Row
    const weekRow = document.createElement('div');
    weekRow.className = 'week-row';

    // Calculate dates
    let currentDate = new Date(state.startDate);
    const monthsMap = new Map(); // key: 'YYYY-MM', value: count

    for (let i = 0; i < state.numWeeks; i++) {
        // Week cell
        const weekDiv = document.createElement('div');
        weekDiv.className = 'week-cell';
        const m = currentDate.getMonth() + 1;
        const d = currentDate.getDate();
        weekDiv.innerText = `${m}/${d}`;
        weekRow.appendChild(weekDiv);

        // Track months
        const monthKey = `${currentDate.getFullYear()}-${m}`;
        monthsMap.set(monthKey, (monthsMap.get(monthKey) || 0) + 1);

        // Next week
        currentDate.setDate(currentDate.getDate() + 7);
    }

    // Render Months
    for (const [key, count] of monthsMap) {
        const [year, month] = key.split('-');
        const monthDiv = document.createElement('div');
        monthDiv.className = 'month-cell';
        monthDiv.innerText = `${month}월`;
        monthDiv.style.width = `${count * WEEK_WIDTH}px`;
        monthDiv.style.flexGrow = count;
        monthRow.appendChild(monthDiv);
    }

    timelineCell.appendChild(monthRow);
    timelineCell.appendChild(weekRow);
    headerRow.appendChild(timelineCell);
    els.scheduleContainer.appendChild(headerRow);

    // 2. Render Categories & Tasks & Gantt
    state.categories.forEach(cat => {
        const row = document.createElement('div');
        row.className = 'schedule-row category-row';

        // Left: Task Info
        const taskCell = document.createElement('div');
        taskCell.className = 'cell-task';

        // Category Name
        const catName = document.createElement('div');
        catName.className = 'category-name editable';
        catName.contentEditable = true;
        catName.innerText = cat.name;
        catName.onblur = (e) => { cat.name = e.target.innerText; };

        // Task List
        const taskList = document.createElement('div');
        taskList.className = 'task-list';

        // Render tasks text
        cat.tasks.forEach(task => {
            const tItem = document.createElement('div');
            tItem.className = 'task-item editable';
            tItem.contentEditable = true;
            tItem.innerText = task.name;
            tItem.dataset.id = task.id;
            tItem.onblur = (e) => { task.name = e.target.innerText; };
            // Allow focus to highlight bar?
            taskList.appendChild(tItem);
        });

        // Add Task/Delete Cat buttons
        const actions = document.createElement('div');
        actions.className = 'category-actions no-print';

        const btnAddTask = document.createElement('button');
        btnAddTask.className = 'btn-cat-action';
        btnAddTask.innerText = '+ 업무 추가';
        btnAddTask.onclick = () => addTask(cat.id);

        const btnDelCat = document.createElement('button');
        btnDelCat.className = 'btn-cat-action danger';
        btnDelCat.innerText = '삭제';
        btnDelCat.onclick = () => deleteCategory(cat.id);

        actions.appendChild(btnAddTask);
        actions.appendChild(btnDelCat);

        taskCell.appendChild(catName);
        taskCell.appendChild(taskList);
        taskCell.appendChild(actions);
        row.appendChild(taskCell);

        // Right: Gantt Area
        const ganttCell = document.createElement('div');
        ganttCell.className = 'cell-gantt';
        ganttCell.style.width = `${state.numWeeks * WEEK_WIDTH}px`;

        // Grid lines
        for (let i = 1; i < state.numWeeks; i++) {
            const line = document.createElement('div');
            line.className = 'gantt-grid-line';
            line.style.left = `${i * WEEK_WIDTH}px`;
            ganttCell.appendChild(line);
        }

        // Render Bars
        // We need to vertically align bars with the text items.
        // Simple approach: fixed height per task item or calculate offset.
        // Assuming task-list gap is consistent.
        // Better: render bars relative to task index.
        const taskHeight = 24; // approximate height including margin
        const headerOffset = 30; // space for category name

        cat.tasks.forEach((task, index) => {
            const bar = document.createElement('div');
            bar.className = 'gantt-bar';
            bar.dataset.id = task.id;
            bar.dataset.catId = cat.id;

            // Position
            updateBarPosition(bar, task.start, task.duration);

            // Vertical pos (simple approximation)
            bar.style.top = `${headerOffset + (index * 20)}px`; // 20px per item approx
            // Let's refine alignment later if needed, or make bars draggable vertically too?
            // For now, let's keep it simple: row index matches.
            // Actually, to perfect alignment, we might want to put text and bar in the same "row" container conceptually,
            // but the PDF design splits columns.
            // We'll stick to manual or auto vertical layout.
            // Let's just stack them with fixed spacing for now.
            bar.style.top = `${34 + (index * 19)}px`;

            // Handles
            const handleL = document.createElement('div');
            handleL.className = 'bar-handle left';

            const handleR = document.createElement('div');
            handleR.className = 'bar-handle right';

            const label = document.createElement('div');
            label.className = 'bar-label';
            label.innerText = task.name.replace(/^- /, ''); // remove leading dash for bar label

            // Listeners
            bar.addEventListener('mousedown', onBarMouseDown);
            handleL.addEventListener('mousedown', (e) => onHandleMouseDown(e, 'left', task, bar));
            handleR.addEventListener('mousedown', (e) => onHandleMouseDown(e, 'right', task, bar));

            bar.appendChild(handleL);
            bar.appendChild(label);
            bar.appendChild(handleR);
            ganttCell.appendChild(bar);
        });

        // Render Global Milestones (Overlay on every row? No, usually on a specific row or all spanning)
        // PDF shows milestones spanning vertically across rows or fixed at top.
        // The PDF has milestones as vertical lines going through ALL rows.
        // So we should render milestones in a separate overlay container or append to each row?
        // Appending to each row is inefficient.
        // Let's put milestones in the container absolute.

        row.appendChild(ganttCell);
        els.scheduleContainer.appendChild(row);
    });

    renderMilestones();
}

function renderMilestones() {
    // Milestones need to be superimposed over the entire chart height
    // or we can put them in the first row or valid container.
    // Let's create a 'milestone-overlay' in the scheduleContainer

    // Remove existing if any
    $('.milestone-container')?.remove();

    const container = document.createElement('div');
    container.className = 'milestone-container';
    container.style.position = 'absolute';
    container.style.top = '51px'; // header height
    container.style.left = `${els.scheduleContainer.querySelector('.cell-task').offsetWidth}px`;
    container.style.bottom = '0';
    container.style.pointerEvents = 'none';
    container.style.width = `${state.numWeeks * WEEK_WIDTH}px`;

    state.milestones.forEach(ms => {
        const line = document.createElement('div');
        line.className = 'milestone-line';
        line.style.left = `${ms.week * WEEK_WIDTH}px`;

        const group = document.createElement('div');
        group.className = 'milestone-label-group';
        group.style.left = `${ms.week * WEEK_WIDTH}px`;
        group.onclick = () => openMilestoneModal(ms.id);

        const title = document.createElement('div');
        title.className = 'milestone-title';
        title.innerText = ms.label;

        const sub = document.createElement('div');
        sub.className = 'milestone-sublabel';
        sub.innerText = ms.sublabel;

        group.appendChild(title);
        group.appendChild(sub);

        container.appendChild(line);
        container.appendChild(group);
    });

    els.scheduleContainer.appendChild(container);
}

function updateBarPosition(bar, start, duration) {
    bar.style.left = `${start * WEEK_WIDTH}px`;
    bar.style.width = `${duration * WEEK_WIDTH}px`;
}

// === Actions ===
function addTask(catId) {
    const cat = state.categories.find(c => c.id === catId);
    if (!cat) return;
    cat.tasks.push({
        id: 't' + Date.now(),
        name: '- 새로운 업무',
        start: 0,
        duration: 4
    });
    renderSchedule();
}

function deleteCategory(catId) {
    if (!confirm('카테고리를 삭제하시겠습니까?')) return;
    state.categories = state.categories.filter(c => c.id !== catId);
    renderSchedule();
}

// === Drag & Drop Logic ===
function onBarMouseDown(e) {
    if (e.target.classList.contains('bar-handle')) return;
    e.preventDefault();

    const bar = e.target.closest('.gantt-bar');
    const taskId = bar.dataset.id;
    const catId = bar.dataset.catId;
    const cat = state.categories.find(c => c.id === catId);
    const task = cat.tasks.find(t => t.id === taskId);

    dragInfo = {
        type: 'move',
        task: task,
        bar: bar,
        startX: e.clientX,
        initialStart: task.start
    };

    bar.classList.add('dragging');
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

function onHandleMouseDown(e, type, task, bar) {
    e.preventDefault();
    e.stopPropagation();

    dragInfo = {
        type: type, // 'left' or 'right'
        task: task,
        bar: bar,
        startX: e.clientX,
        initialStart: task.start,
        initialDuration: task.duration
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

function onMouseMove(e) {
    if (!dragInfo) return;

    const dx = e.clientX - dragInfo.startX;
    // dx in pixels -> convert to weeks
    const weeksDelta = dx / WEEK_WIDTH;

    if (dragInfo.type === 'move') {
        let newStart = dragInfo.initialStart + weeksDelta;
        // Snap to grid (0.5 granularity?)
        newStart = Math.round(newStart * 2) / 2;
        if (newStart < 0) newStart = 0;

        dragInfo.task.start = newStart;

    } else if (dragInfo.type === 'right') {
        let newDuration = dragInfo.initialDuration + weeksDelta;
        newDuration = Math.round(newDuration * 2) / 2;
        if (newDuration < 0.5) newDuration = 0.5;

        dragInfo.task.duration = newDuration;

    } else if (dragInfo.type === 'left') {
        let newStart = dragInfo.initialStart + weeksDelta;
        let newDuration = dragInfo.initialDuration - weeksDelta;

        // constraint
        if (newDuration < 0.5) {
            // limit start
            newStart = dragInfo.initialStart + (dragInfo.initialDuration - 0.5);
            newDuration = 0.5;
        } else {
            newStart = Math.round(newStart * 2) / 2;
            newDuration = Math.round(newDuration * 2) / 2;
        }

        if (newStart < 0) newStart = 0;

        dragInfo.task.start = newStart;
        dragInfo.task.duration = newDuration;
    }

    updateBarPosition(dragInfo.bar, dragInfo.task.start, dragInfo.task.duration);
}

function onMouseUp() {
    if (dragInfo) {
        dragInfo.bar.classList.remove('dragging');
        dragInfo = null;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        // Re-render to clean up (optional, but good for syncing text/bars if connected)
    }
}

// === Modal & Settings ===
function setupEventListeners() {
    // Action Bar
    els.btnSave.onclick = saveData;
    els.btnReset.onclick = resetData;
    els.btnPDF.onclick = exportPDF;

    els.btnAddCategory.onclick = () => {
        state.categories.push({
            id: 'c' + Date.now(),
            name: '새로운 카테고리',
            tasks: []
        });
        renderSchedule();
    };

    // Settings Modal
    els.btnSettings.onclick = () => {
        els.inputStartDate.value = state.startDate;
        els.inputNumWeeks.value = state.numWeeks;
        els.settingsModal.classList.add('active');
    };
    els.btnModalCancel.onclick = () => els.settingsModal.classList.remove('active');
    els.btnModalApply.onclick = () => {
        state.startDate = els.inputStartDate.value;
        state.numWeeks = parseInt(els.inputNumWeeks.value) || 20;
        els.settingsModal.classList.remove('active');
        renderSchedule();
    };

    // Milestone Modal
    els.btnAddMilestone.onclick = () => openMilestoneModal(null);
    els.btnMsCancel.onclick = () => els.milestoneModal.classList.remove('active');

    els.btnMsDelete.onclick = () => {
        if (!currentEditingMilestoneId) return;
        state.milestones = state.milestones.filter(m => m.id !== currentEditingMilestoneId);
        els.milestoneModal.classList.remove('active');
        renderSchedule();
    };

    els.btnMsApply.onclick = () => {
        const week = parseFloat(els.inputMsWeek.value);
        const label = els.inputMsLabel.value;
        const sublabel = els.inputMsSublabel.value;

        if (currentEditingMilestoneId) {
            const ms = state.milestones.find(m => m.id === currentEditingMilestoneId);
            if (ms) {
                ms.week = week;
                ms.label = label;
                ms.sublabel = sublabel;
            }
        } else {
            state.milestones.push({
                id: 'm' + Date.now(),
                week: week,
                label: label,
                sublabel: sublabel
            });
        }
        els.milestoneModal.classList.remove('active');
        renderSchedule();
    };
}

function openMilestoneModal(msId) {
    currentEditingMilestoneId = msId;
    if (msId) {
        const ms = state.milestones.find(m => m.id === msId);
        $('#msModalTitle').innerText = '마일스톤 수정';
        els.inputMsWeek.value = ms.week;
        els.inputMsLabel.value = ms.label;
        els.inputMsSublabel.value = ms.sublabel;
        els.btnMsDelete.style.display = 'block';
    } else {
        $('#msModalTitle').innerText = '마일스톤 추가';
        els.inputMsWeek.value = 0;
        els.inputMsLabel.value = '';
        els.inputMsSublabel.value = '';
        els.btnMsDelete.style.display = 'none';
    }
    els.milestoneModal.classList.add('active');
}

// === Utilities ===
function showToast(msg) {
    els.toast.innerText = msg;
    els.toast.classList.add('show');
    setTimeout(() => els.toast.classList.remove('show'), 3000);
}

// === PDF Export ===
async function exportPDF() {
    const docEl = $('#document');
    const actionBar = $('#actionBar');

    // Hide UI elements
    actionBar.style.display = 'none';
    document.body.classList.add('pdf-rendering'); // Global no-print styles too

    // Force container width adjustment for PDF
    // We need to make sure the scroll area is fully visible
    const scrollEl = $('#scheduleScroll');
    const orgOverflow = scrollEl.style.overflow;
    scrollEl.style.overflow = 'visible';

    showToast('PDF 생성 중...');

    const opt = {
        margin: [10, 10, 10, 10],
        filename: 'Schedule_PlusX.pdf',
        image: { type: 'png' }, // Use PNG for sharpness
        html2canvas: {
            scale: 2, // sufficient quality
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            onclone: (clonedDoc) => {
                // Ensure black text
                clonedDoc.body.style.color = '#000000';
                const all = clonedDoc.querySelectorAll('*');
                all.forEach(el => {
                    if (el.style) {
                        el.style.color = '#000000';
                        el.style.boxShadow = 'none';
                    }
                });
            }
        },
        jsPDF: {
            unit: 'mm',
            format: 'a3', // Use A3 for wide schedule
            orientation: 'landscape',
            compress: false
        }
    };

    try {
        await html2pdf().set(opt).from(docEl).save();
        showToast('✅ PDF 다운로드 완료');
    } catch (err) {
        console.error(err);
        showToast('❌ PDF 생성 실패');
    } finally {
        actionBar.style.display = '';
        document.body.classList.remove('pdf-rendering');
        scrollEl.style.overflow = orgOverflow;
    }
}

// Start
init();
