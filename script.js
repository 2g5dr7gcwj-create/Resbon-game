// Resbon Iraq - Gaming Arena Management System (Stable Version)

const state = {
    tables: Array(6).fill(null).map((_, i) => ({
        id: i + 1,
        type: 'table',
        name: `منضدة ${i + 1}`,
        currentSession: null,
        history: []
    })),
    playstations: Array(4).fill(null).map((_, i) => ({
        id: i + 1,
        type: 'playstation',
        name: `بلايستيشن ${i + 1}`,
        currentSession: null,
        history: []
    })),
    stats: {
        totalProfit: 0,
        totalSessions: 0,
        completedSessions: []
    },
    currentModal: null,
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
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(err => console.log('SW registration failed'));
    }
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
        if (data.tables) restore(data.tables, state.tables);
        if (data.playstations) restore(data.playstations, state.playstations);
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
                    if (remaining === 0 && !session.notified) {
                        session.notified = true;
                        timerEl.classList.add('text-red-500', 'animate-pulse');
                    }
                }
            }
        }
    });
}

function renderDevices() {
    renderSection('tables', state.tables, 'section-tables');
    renderSection('playstation', state.playstations, 'section-playstation');
}

function renderSection(type, devices, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = devices.map(device => {
        const session = device.currentSession;
        const isActive = session && !session.paused;
        const timerId = `timer-${type === 'table' ? 'tables' : 'playstation'}-${device.id}`;
        
        return `
            <div class="device-card glass-panel rounded-xl p-5 border ${isActive ? 'border-resbon-red pulse-active' : 'border-resbon-gray'}">
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-lg font-bold text-white">${device.name}</h3>
                    <span class="status-dot ${session ? (session.paused ? 'status-paused' : 'status-active') : 'status-empty'}"></span>
                </div>
                <div class="mb-4 text-center py-3 bg-black/30 rounded-lg">
                    <div id="${timerId}" class="text-3xl font-bold ${isActive ? 'text-resbon-blue' : 'text-gray-600'} digital-timer">
                        ${session ? (session.isOpen ? formatTime(session.elapsed) : formatTime(Math.max(0, (session.duration * 60) - session.elapsed))) : '--:--'}
                    </div>
                </div>
                <button onclick="${session ? `openManageModal` : `openAddModal`}('${type === 'table' ? 'tables' : 'playstation'}', ${device.id})" 
                        class="w-full py-2 ${session ? 'bg-resbon-blue' : 'bg-resbon-red'} text-white rounded-lg hover:opacity-90 transition">
                    ${session ? 'إدارة الجلسة' : 'حجز الآن'}
                </button>
            </div>
        `;
    }).join('');
    if(window.feather) feather.replace();
}

function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

// الدوال المطلوبة من الـ HTML (Buttons)
function openAddModal(type, id) {
    state.selectedDevice = { type, id };
    document.getElementById('deviceType').value = type;
    document.getElementById('deviceId').value = id;
    document.getElementById('modal-add').classList.remove('hidden');
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}

function setDurationType(type) {
    state.durationType = type;
    document.getElementById('duration-selector').classList.toggle('hidden', type === 'open');
}

function handleAddSession(e) {
    if(e) e.preventDefault();
    const { type, id } = state.selectedDevice;
    const devices = type === 'tables' ? state.tables : state.playstations;
    devices[id - 1].currentSession = {
        playerName: document.getElementById('playerName').value || 'لاعب جديد',
        startTime: new Date(),
        duration: state.durationType === 'open' ? 0 : state.selectedDuration,
        isOpen: state.durationType === 'open',
        elapsed: 0,
        totalPrice: state.selectedPrice,
        paused: false
    };
    saveData();
    renderDevices();
    closeModal('modal-add');
}

function updateStats() {
    const el = document.getElementById('totalProfit');
    if(el) el.textContent = state.stats.totalProfit.toLocaleString() + ' د.ع';
}

// أضف أي دوال مفقودة هنا لتجنب الأخطاء
function openManageModal(type, id) {
    state.selectedDevice = { type, id };
    const devices = type === 'tables' ? state.tables : state.playstations;
    const session = devices[id-1].currentSession;
    document.getElementById('session-info').innerHTML = `
        <div class="text-white">اللاعب: ${session.playerName}</div>
        <div class="text-resbon-blue">السعر: ${session.totalPrice} د.ع</div>
    `;
    document.getElementById('modal-manage').classList.remove('hidden');
}

function endSession() {
    const { type, id } = state.selectedDevice;
    const devices = type === 'tables' ? state.tables : state.playstations;
    const session = devices[id-1].currentSession;
    state.stats.totalProfit += session.totalPrice;
    devices[id-1].currentSession = null;
    saveData();
    updateStats();
    renderDevices();
    closeModal('modal-manage');
}
