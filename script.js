// Resbon Arena - Ultimate Version (Full Features + Anti-Freeze)
const state = {
    tables: Array(6).fill(null).map((_, i) => ({ id: i + 1, type: 'tables', name: `منضدة ${i + 1}`, currentSession: null })),
    playstations: Array(4).fill(null).map((_, i) => ({ id: i + 1, type: 'playstation', name: `بلايستيشن ${i + 1}`, currentSession: null })),
    stats: { totalProfit: 0, totalSessions: 0, completedSessions: [] },
    selectedDevice: null,
    durationType: 'fixed',
    selectedDuration: 60,
    selectedPrice: 4000
};

// تشغيل النظام
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    renderDevices();
    updateStats();
    setInterval(updateTimers, 1000); // تحديث الوقت فقط بدون إعادة رسم البطاقات
});

function loadData() {
    const saved = localStorage.getItem('resbonData');
    if (saved) {
        const data = JSON.parse(saved);
        state.stats = data.stats || state.stats;
        const restore = (source, target) => {
            source.forEach((d, i) => {
                if (target[i] && d.currentSession) {
                    target[i].currentSession = d.currentSession;
                    target[i].currentSession.startTime = new Date(d.currentSession.startTime);
                    if(d.currentSession.pauseStart) d.currentSession.pauseStart = new Date(d.currentSession.pauseStart);
                }
            });
        };
        if(data.tables) restore(data.tables, state.tables);
        if(data.playstations) restore(data.playstations, state.playstations);
    }
}

function updateTimers() {
    [...state.tables, ...state.playstations].forEach(d => {
        if (d.currentSession && !d.currentSession.paused) {
            const s = d.currentSession;
            s.elapsed = Math.floor((new Date() - s.startTime) / 1000);
            const el = document.getElementById(`timer-${d.type}-${d.id}`);
            if (el) {
                if (s.isOpen) { el.textContent = formatTime(s.elapsed); } 
                else { 
                    const rem = Math.max(0, (s.duration * 60) - s.elapsed);
                    el.textContent = formatTime(rem);
                    if(rem === 0) el.classList.add('text-red-500', 'animate-pulse');
                }
            }
        }
    });
}

function renderDevices() {
    const fn = (type, list, target) => {
        const cont = document.getElementById(target);
        if (!cont) return;
        cont.innerHTML = list.map(d => {
            const s = d.currentSession;
            return `
            <div class="glass-panel p-5 rounded-xl border ${s && !s.paused ? 'border-red-600 pulse-active' : 'border-gray-800'}">
                <div class="flex justify-between mb-4"><h3 class="font-bold">${d.name}</h3><span class="status-dot ${s ? (s.paused ? 'status-paused' : 'status-active') : 'status-empty'}"></span></div>
                <div class="text-3xl font-bold text-center mb-4 digital-timer" id="timer-${type}-${d.id}">
                    ${s ? (s.isOpen ? formatTime(s.elapsed) : formatTime(Math.max(0, (s.duration*60)-s.elapsed))) : '--:--'}
                </div>
                <button onclick="${s ? 'openManageModal' : 'openAddModal'}('${type}', ${d.id})" class="w-full py-3 ${s ? 'bg-blue-600' : 'bg-red-600'} rounded-lg font-bold transition-all active:scale-95">
                    ${s ? 'إدارة الجلسة' : 'حجز الآن'}
                </button>
            </div>`;
        }).join('');
    };
    fn('tables', state.tables, 'section-tables');
    fn('playstation', state.playstations, 'section-playstation');
}

function openAddModal(type, id) {
    state.selectedDevice = { type, id };
    const dev = (type === 'tables' ? state.tables : state.playstations)[id-1];
    document.getElementById('deviceLabel').textContent = dev.name;
    document.getElementById('modal-add').classList.remove('hidden');
}

function handleAddSession(e) {
    e.preventDefault();
    const { type, id } = state.selectedDevice;
    const dev = (type === 'tables' ? state.tables : state.playstations)[id-1];
    dev.currentSession = {
        playerName: document.getElementById('playerName').value || 'لاعب',
        startTime: new Date(),
        duration: state.durationType === 'open' ? 0 : state.selectedDuration,
        isOpen: state.durationType === 'open',
        totalPrice: state.selectedPrice,
        elapsed: 0, paused: false
    };
    save(); renderDevices(); closeModal('modal-add');
}

function openManageModal(type, id) {
    state.selectedDevice = { type, id };
    const s = (type === 'tables' ? state.tables : state.playstations)[id-1].currentSession;
    document.getElementById('session-info').innerHTML = `
        <div class="bg-black/30 p-4 rounded-xl text-center">
            <p class="text-gray-400">اللاعب: <span class="text-white font-bold">${s.playerName}</span></p>
            <p class="text-2xl font-bold text-resbon-red mt-2">${s.totalPrice.toLocaleString()} د.ع</p>
        </div>`;
    document.getElementById('modal-manage').classList.remove('hidden');
}

function togglePause() {
    const { type, id } = state.selectedDevice;
    const s = (type === 'tables' ? state.tables : state.playstations)[id-1].currentSession;
    if (!s.paused) { s.paused = true; s.pauseStart = new Date(); } 
    else {
        const pDur = new Date() - new Date(s.pauseStart);
        s.startTime = new Date(new Date(s.startTime).getTime() + pDur);
        s.paused = false;
    }
    save(); renderDevices(); closeModal('modal-manage');
}

function addTime(m, p) {
    const { type, id } = state.selectedDevice;
    const s = (type === 'tables' ? state.tables : state.playstations)[id-1].currentSession;
    if (s.isOpen) { s.isOpen = false; s.duration = m; } else { s.duration += m; }
    s.totalPrice += p;
    save(); renderDevices(); closeModal('modal-manage');
}

function endSession() {
    const { type, id } = state.selectedDevice;
    const devs = (type === 'tables' ? state.tables : state.playstations);
    const s = devs[id-1].currentSession;
    if (s.isOpen) s.totalPrice = Math.max(1000, Math.ceil(s.elapsed/3600)*4000);
    state.stats.totalProfit += parseInt(s.totalPrice);
    state.stats.totalSessions++;
    state.stats.completedSessions.push({ player: s.playerName, price: s.totalPrice, device: devs[id-1].name });
    devs[id-1].currentSession = null;
    save(); updateStats(); renderDevices(); closeModal('modal-manage');
}

function formatTime(s) {
    const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sc = s%60;
    return h>0 ? `${h}:${String(m).padStart(2,'0')}:${String(sc).padStart(2,'0')}` : `${String(m).padStart(2,'0')}:${String(sc).padStart(2,'0')}`;
}
function save() { localStorage.setItem('resbonData', JSON.stringify(state)); }
function updateStats() { document.getElementById('totalProfit').textContent = state.stats.totalProfit.toLocaleString() + ' د.ع'; }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function setDuration(m, p) { state.selectedDuration = m; state.selectedPrice = p; document.getElementById('totalPrice').textContent = p.toLocaleString() + ' د.ع'; }
function setDurationType(t) {
    state.durationType = t;
    document.getElementById('duration-selector').classList.toggle('hidden', t === 'open');
    state.selectedPrice = t === 'open' ? 0 : 4000;
    document.getElementById('totalPrice').textContent = state.selectedPrice.toLocaleString() + ' د.ع';
}
function switchTab(t) {
    document.getElementById('section-tables').classList.toggle('hidden', t !== 'tables');
    document.getElementById('section-playstation').classList.toggle('hidden', t !== 'playstation');
}
