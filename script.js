// Resbon Iraq - Gaming Arena Management System (Full Professional Version)

const state = {
    tables: Array(6).fill(null).map((_, i) => ({
        id: i + 1, type: 'table', name: `منضدة ${i + 1}`, currentSession: null
    })),
    playstations: Array(4).fill(null).map((_, i) => ({
        id: i + 1, type: 'playstation', name: `بلايستيشن ${i + 1}`, currentSession: null
    })),
    stats: { totalProfit: 0, totalSessions: 0, completedSessions: [] },
    selectedDevice: null,
    durationType: 'fixed',
    selectedDuration: 60,
    selectedPrice: 4000
};

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    renderDevices();
    updateStats();
    setInterval(updateTimers, 1000);
});

function saveData() {
    localStorage.setItem('resbonData', JSON.stringify(state));
}

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
                }
            });
        };
        restore(data.tables, state.tables);
        restore(data.playstations, state.playstations);
    }
}

function updateTimers() {
    [...state.tables, ...state.playstations].forEach(device => {
        if (device.currentSession && !device.currentSession.paused) {
            const session = device.currentSession;
            const now = new Date();
            session.elapsed = Math.floor((now - session.startTime) / 1000);
            
            const timerEl = document.getElementById(`timer-${device.type === 'table' ? 'tables' : 'playstation'}-${device.id}`);
            if (timerEl) {
                if (session.isOpen) {
                    timerEl.textContent = formatTime(session.elapsed);
                } else {
                    const remaining = Math.max(0, (session.duration * 60) - session.elapsed);
                    timerEl.textContent = formatTime(remaining);
                    if (remaining === 0) timerEl.classList.add('text-red-500', 'animate-pulse');
                }
            }
        }
    });
}

function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function renderDevices() {
    const render = (type, devices, containerId) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = devices.map(device => {
            const session = device.currentSession;
            const isActive = session && !session.paused;
            const isPaused = session && session.paused;
            return `
                <div class="glass-panel rounded-xl p-5 border ${isActive ? 'border-resbon-red pulse-active' : 'border-resbon-gray'}">
                    <div class="flex justify-between mb-4">
                        <h3 class="text-white font-bold">${device.name}</h3>
                        <span class="status-dot ${session ? (isPaused ? 'status-paused' : 'status-active') : 'status-empty'}"></span>
                    </div>
                    <div class="text-center py-3 bg-black/30 rounded-lg mb-4">
                        <div id="timer-${type}-${device.id}" class="text-3xl font-bold ${isActive ? 'text-resbon-blue' : 'text-gray-500'}">
                            ${session ? (session.isOpen ? formatTime(session.elapsed) : formatTime(Math.max(0, (session.duration * 60) - session.elapsed))) : '--:--'}
                        </div>
                    </div>
                    <button onclick="${session ? 'openManageModal' : 'openAddModal'}('${type}', ${device.id})" class="w-full py-2 ${session ? 'bg-resbon-blue' : 'bg-resbon-red'} text-white rounded-lg">
                        ${session ? 'إدارة' : 'حجز'}
                    </button>
                </div>`;
        }).join('');
    };
    render('tables', state.tables, 'section-tables');
    render('playstation', state.playstations, 'section-playstation');
}

function openAddModal(type, id) {
    state.selectedDevice = { type, id };
    const device = (type === 'tables' ? state.tables : state.playstations)[id-1];
    document.getElementById('deviceLabel').textContent = device.name;
    document.getElementById('modal-add').classList.remove('hidden');
}

function handleAddSession(e) {
    e.preventDefault();
    const { type, id } = state.selectedDevice;
    const device = (type === 'tables' ? state.tables : state.playstations)[id-1];
    device.currentSession = {
        playerName: document.getElementById('playerName').value || 'لاعب',
        startTime: new Date(),
        duration: state.durationType === 'open' ? 0 : state.selectedDuration,
        isOpen: state.durationType === 'open',
        elapsed: 0,
        totalPrice: state.selectedPrice,
        paused: false
    };
    saveData(); renderDevices(); closeModal('modal-add');
}

function openManageModal(type, id) {
    state.selectedDevice = { type, id };
    const session = (type === 'tables' ? state.tables : state.playstations)[id-1].currentSession;
    document.getElementById('session-info').innerHTML = `
        <div class="text-lg font-bold text-white mb-2">اللاعب: ${session.playerName}</div>
        <div class="text-resbon-red">السعر الحالي: ${session.totalPrice} د.ع</div>
        <div class="text-gray-400 text-sm">الحالة: ${session.paused ? 'متوقف' : 'نشط'}</div>
    `;
    document.getElementById('modal-manage').classList.remove('hidden');
}

function togglePause() {
    const { type, id } = state.selectedDevice;
    const session = (type === 'tables' ? state.tables : state.playstations)[id-1].currentSession;
    if (!session.paused) {
        session.paused = true;
        session.pauseStart = new Date();
    } else {
        const pauseDuration = new Date() - new Date(session.pauseStart);
        session.startTime = new Date(new Date(session.startTime).getTime() + pauseDuration);
        session.paused = false;
    }
    saveData(); renderDevices(); closeModal('modal-manage');
}

function addTime(mins, price) {
    const { type, id } = state.selectedDevice;
    const session = (type === 'tables' ? state.tables : state.playstations)[id-1].currentSession;
    if (session.isOpen) { session.isOpen = false; session.duration = mins; } 
    else { session.duration += mins; }
    session.totalPrice += price;
    saveData(); renderDevices(); closeModal('modal-manage');
}

function convertToFixed() {
    addTime(60, 4000);
}

function endSession() {
    const { type, id } = state.selectedDevice;
    const device = (type === 'tables' ? state.tables : state.playstations)[id-1];
    const session = device.currentSession;
    if (session.isOpen) {
        const hours = Math.ceil(session.elapsed / 3600);
        session.totalPrice = Math.max(1000, hours * 4000);
    }
    state.stats.totalProfit += session.totalPrice;
    state.stats.totalSessions++;
    state.stats.completedSessions.push({
        player: session.playerName, device: device.name, price: session.totalPrice, time: new Date().toLocaleTimeString()
    });
    device.currentSession = null;
    saveData(); updateStats(); renderDevices(); closeModal('modal-manage');
}

function updateStats() {
    document.getElementById('totalProfit').textContent = state.stats.totalProfit.toLocaleString() + ' د.ع';
    document.getElementById('stats-total').textContent = state.stats.totalProfit.toLocaleString() + ' د.ع';
    document.getElementById('stats-count').textContent = state.stats.totalSessions;
    document.getElementById('completed-sessions').innerHTML = state.stats.completedSessions.map(s => `
        <div class="flex justify-between border-b border-gray-800 py-2 text-sm">
            <span>${s.player} (${s.device})</span>
            <span class="text-resbon-red">${s.price} د.ع</span>
        </div>`).join('');
}

function setDurationType(t) {
    state.durationType = t;
    document.getElementById('duration-selector').classList.toggle('hidden', t === 'open');
    state.selectedPrice = t === 'open' ? 0 : 4000;
    updatePriceDisplay();
}

function setDuration(m, p) {
    state.selectedDuration = m; state.selectedPrice = p;
    updatePriceDisplay();
}

function updatePriceDisplay() {
    document.getElementById('totalPrice').textContent = state.selectedPrice.toLocaleString() + ' د.ع';
}

function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function showStats() { document.getElementById('modal-stats').classList.remove('hidden'); }
function resetStats() { if(confirm('تصفير؟')) { state.stats = {totalProfit:0, totalSessions:0, completedSessions:[]}; saveData(); updateStats(); } }

function switchTab(tab) {
    document.getElementById('section-tables').classList.toggle('hidden', tab !== 'tables');
    document.getElementById('section-playstation').classList.toggle('hidden', tab !== 'playstation');
    document.getElementById('tab-tables').classList.toggle('bg-resbon-red', tab === 'tables');
    document.getElementById('tab-playstation').classList.toggle('bg-resbon-red', tab === 'playstation');
}
