// Resbon Iraq - Gaming Arena Management System (Fix: Persistent Timer)

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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    renderDevices();
    updateStats();
    setInterval(updateTimers, 1000);
    
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(err => console.log('SW registration failed'));
    }
});

// Persistence
function saveData() {
    localStorage.setItem('resbonData', JSON.stringify({
        stats: state.stats,
        tables: state.tables,
        playstations: state.playstations
    }));
}

function loadData() {
    const saved = localStorage.getItem('resbonData');
    if (saved) {
        const data = JSON.parse(saved);
        state.stats = data.stats || state.stats;
        
        const restoreSessions = (source, target) => {
            source.forEach((d, i) => {
                if (target[i] && d.currentSession) {
                    target[i].currentSession = d.currentSession;
                    // تحويل startTime إلى كائن تاريخ حقيقي
                    target[i].currentSession.startTime = new Date(d.currentSession.startTime);
                }
            });
        };

        if (data.tables) restoreSessions(data.tables, state.tables);
        if (data.playstations) restoreSessions(data.playstations, state.playstations);
    }
}

// Timer Logic - حساب الفرق الحقيقي بين الآن ووقت البدء
function updateTimers() {
    const allDevices = [...state.tables, ...state.playstations];
    allDevices.forEach(device => {
        if (device.currentSession && !device.currentSession.paused) {
            const session = device.currentSession;
            const now = new Date();
            // حساب الثواني المنقضية فعلياً
            session.elapsed = Math.floor((now - session.startTime) / 1000);
            
            const timerId = `timer-${device.type === 'table' ? 'tables' : 'playstation'}-${device.id}`;
            const timerEl = document.getElementById(timerId);
            
            if (timerEl) {
                if (session.isOpen) {
                    timerEl.textContent = formatTime(session.elapsed);
                } else {
                    const totalSec = session.duration * 60;
                    const remaining = Math.max(0, totalSec - session.elapsed);
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

// Utilities
function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Rendering
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
        
        let timerContent = session ? 
            (session.isOpen ? formatTime(session.elapsed) : formatTime(Math.max(0, (session.duration * 60) - session.elapsed))) 
            : '--:--';

        return `
            <div class="device-card glass-panel rounded-xl p-5 border ${isActive ? 'border-resbon-red pulse-active' : 'border-resbon-gray'}">
                <div class="flex justify-between mb-4">
                    <h3 class="text-lg font-bold text-white">${device.name}</h3>
                    <span class="status-dot ${session ? (session.paused ? 'status-paused' : 'status-active') : 'status-empty'}"></span>
                </div>
                <div class="text-center py-3 bg-black/30 rounded-lg mb-4">
                    <div id="timer-${type}-${device.id}" class="text-3xl font-bold ${isActive ? 'text-resbon-blue' : 'text-gray-600'} digital-timer">
                        ${timerContent}
                    </div>
                </div>
                ${session ? 
                    `<button onclick="openManageModal('${type}', ${device.id})" class="w-full py-2 bg-resbon-blue text-white rounded-lg">إدارة</button>` : 
                    `<button onclick="openAddModal('${type}', ${device.id})" class="w-full py-2 bg-resbon-red text-white rounded-lg">حجز</button>`
                }
            </div>
        `;
    }).join('');
}

// Modal & Forms (Keep simple for mobile)
function openAddModal(type, id) {
    state.selectedDevice = { type, id };
    document.getElementById('modal-add').classList.remove('hidden');
}

function handleAddSession(e) {
    if(e) e.preventDefault();
    const { type, id } = state.selectedDevice;
    const devices = type === 'tables' ? state.tables : state.playstations;
    
    devices[id - 1].currentSession = {
        playerName: document.getElementById('playerName').value || 'لاعب الجديد',
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

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}

// Stats & Other Functions
function updateStats() {
    document.getElementById('totalProfit').textContent = state.stats.totalProfit.toLocaleString() + ' د.ع';
}

function setDurationType(type) {
    state.durationType = type;
    state.selectedPrice = (type === 'open') ? 0 : 4000;
    document.getElementById('totalPrice').textContent = state.selectedPrice + ' د.ع';
}

function endSession() {
    const { type, id } = state.selectedDevice;
    const devices = type === 'tables' ? state.tables : state.playstations;
    const session = devices[id - 1].currentSession;
    
    if (session.isOpen) {
        const hours = Math.ceil(session.elapsed / 3600);
        session.totalPrice = Math.max(1000, hours * 4000);
    }

    state.stats.totalProfit += session.totalPrice;
    state.stats.totalSessions++;
    
    devices[id - 1].currentSession = null;
    saveData();
    updateStats();
    renderDevices();
    closeModal('modal-manage');
}
