// Resbon Iraq - Gaming Arena Management System

// Data Structure
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
    selectedDuration: null,
    selectedPrice: 0
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    renderDevices();
    updateStats();
    setInterval(updateTimers, 1000);
    
    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(err => console.log('SW registration failed'));
    }
});

// Persistence
function saveData() {
    localStorage.setItem('resbonData', JSON.stringify({
        stats: state.stats,
        tables: state.tables.map(t => ({...t, currentSession: t.currentSession})),
        playstations: state.playstations.map(p => ({...p, currentSession: p.currentSession}))
    }));
}

function loadData() {
    const saved = localStorage.getItem('resbonData');
    if (saved) {
        const data = JSON.parse(saved);
        state.stats = data.stats || state.stats;
        if (data.tables) {
            data.tables.forEach((t, i) => {
                if (state.tables[i]) {
                    state.tables[i].currentSession = t.currentSession;
                    if (t.currentSession) {
                        state.tables[i].currentSession.startTime = new Date(t.currentSession.startTime);
                        if (t.currentSession.endTime) {
                            state.tables[i].currentSession.endTime = new Date(t.currentSession.endTime);
                        }
                    }
                }
            });
        }
        if (data.playstations) {
            data.playstations.forEach((p, i) => {
                if (state.playstations[i]) {
                    state.playstations[i].currentSession = p.currentSession;
                    if (p.currentSession) {
                        state.playstations[i].currentSession.startTime = new Date(p.currentSession.startTime);
                        if (p.currentSession.endTime) {
                            state.playstations[i].currentSession.endTime = new Date(p.currentSession.endTime);
                        }
                    }
                }
            });
        }
    }
}

// Rendering
function renderDevices() {
    renderSection('tables', state.tables, 'section-tables');
    renderSection('playstation', state.playstations, 'section-playstation');
}

function renderSection(type, devices, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = devices.map(device => {
        const session = device.currentSession;
        const isActive = session && !session.paused;
        const isPaused = session && session.paused;
        
        let statusHtml = '';
        let timerHtml = '';
        let actionHtml = '';
        
        if (!session) {
            statusHtml = `<span class="status-dot status-empty"></span><span class="text-gray-400 text-sm">متاح</span>`;
            timerHtml = `<div class="text-3xl font-bold text-gray-600 digital-timer">--:--</div>`;
            actionHtml = `<button onclick="openAddModal('${type}', ${device.id})" class="w-full py-2 bg-resbon-red text-white rounded-lg hover:bg-red-700 transition btn-gaming">حجز الآن</button>`;
        } else {
            const statusClass = isPaused ? 'status-paused' : 'status-active';
            const statusText = isPaused ? 'متوقف' : (session.isOpen ? 'مفتوح' : 'نشط');
            statusHtml = `<span class="status-dot ${statusClass}"></span><span class="text-sm ${isPaused ? 'text-yellow-500' : 'text-green-400'}">${statusText}</span>`;
            
            if (session.isOpen) {
                timerHtml = `<div class="text-3xl font-bold text-resbon-blue digital-timer timer-glow" id="timer-${type}-${device.id}">00:00</div>
                            <div class="text-xs text-gray-400 mt-1">وقت مفتوح</div>`;
            } else {
                const totalSec = session.duration * 60;
                const remaining = Math.max(0, totalSec - session.elapsed);
                const mins = Math.floor(remaining / 60);
                const secs = remaining % 60;
                const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                const percent = (remaining / totalSec) * 100;
                
                timerHtml = `<div class="text-3xl font-bold ${remaining < 300 ? 'text-red-500' : 'text-resbon-red'} digital-timer" id="timer-${type}-${device.id}">${timeStr}</div>
                            <div class="w-full bg-gray-700 h-2 rounded-full mt-2 overflow-hidden">
                                <div class="h-full bg-gradient-to-r from-resbon-red to-resbon-blue transition-all duration-1000" style="width: ${percent}%"></div>
                            </div>`;
            }
            
            actionHtml = `<button onclick="openManageModal('${type}', ${device.id})" class="w-full py-2 ${isPaused ? 'bg-yellow-600' : 'bg-resbon-blue'} text-white rounded-lg hover:opacity-90 transition btn-gaming">
                ${isPaused ? 'استئناف / إدارة' : 'إدارة الجلسة'}
            </button>`;
        }
        
        return `
            <div class="device-card glass-panel rounded-xl p-5 ${isActive ? 'active pulse-active' : ''} ${isPaused ? 'paused' : ''} border ${isActive ? 'border-resbon-red' : 'border-resbon-gray'}">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-lg font-bold text-white mb-1">${device.name}</h3>
                        <div class="flex items-center gap-1">${statusHtml}</div>
                    </div>
                    <div class="w-10 h-10 rounded-full bg-resbon-dark border border-resbon-red/30 flex items-center justify-center">
                        <i data-feather="${type === 'tables' ? 'grid' : 'monitor'}" class="w-5 h-5 text-resbon-red"></i>
                    </div>
                </div>
                
                <div class="mb-4 text-center py-3 bg-black/30 rounded-lg border border-resbon-gray/30">
                    ${timerHtml}
                </div>
                
                ${session ? `
                <div class="mb-3 text-sm">
                    <div class="flex justify-between text-gray-400 mb-1">
                        <span>اللاعب:</span>
                        <span class="text-white font-bold">${session.playerName}</span>
                    </div>
                    <div class="flex justify-between text-gray-400">
                        <span>السعر:</span>
                        <span class="text-resbon-blue font-bold">${session.totalPrice.toLocaleString()} د.ع</span>
                    </div>
                </div>
                ` : ''}
                
                ${actionHtml}
            </div>
        `;
    }).join('');
    
    feather.replace();
}

// Timer Updates
function updateTimers() {
    [...state.tables, ...state.playstations].forEach(device => {
        if (device.currentSession && !device.currentSession.paused) {
            const session = device.currentSession;
            session.elapsed++;
            
            const timerEl = document.getElementById(`timer-${device.type === 'table' ? 'tables' : 'playstation'}-${device.id}`);
            if (timerEl) {
                if (session.isOpen) {
                    const hours = Math.floor(session.elapsed / 3600);
                    const mins = Math.floor((session.elapsed % 3600) / 60);
                    const secs = session.elapsed % 60;
                    if (hours > 0) {
                        timerEl.textContent = `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                    } else {
                        timerEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                    }
                } else {
                    const totalSec = session.duration * 60;
                    const remaining = Math.max(0, totalSec - session.elapsed);
                    const mins = Math.floor(remaining / 60);
                    const secs = remaining % 60;
                    timerEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                    
                    if (remaining === 0 && !session.notified) {
                        session.notified = true;
                        // Visual notification could be added here
                        timerEl.classList.add('text-red-600', 'animate-pulse');
                    }
                }
            }
            
            // Auto-save every minute
            if (session.elapsed % 60 === 0) {
                saveData();
            }
        }
    });
}

// Modal Functions
function openAddModal(type, id) {
    state.selectedDevice = { type, id };
    const device = type === 'tables' ? state.tables[id - 1] : state.playstations[id - 1];
    
    document.getElementById('deviceType').value = type;
    document.getElementById('deviceId').value = id;
    document.getElementById('deviceLabel').textContent = device.name;
    
    // Reset form
    document.getElementById('playerName').value = '';
    setDurationType('fixed');
    setDuration(60, 4000);
    
    showModal('modal-add');
}

function openManageModal(type, id) {
    state.selectedDevice = { type, id };
    const device = type === 'tables' ? state.tables[id - 1] : state.playstations[id - 1];
    const session = device.currentSession;
    
    const infoHtml = `
        <div class="bg-resbon-dark p-4 rounded-lg border border-resbon-gray">
            <div class="flex justify-between mb-2">
                <span class="text-gray-400">اللاعب:</span>
                <span class="text-white font-bold text-lg">${session.playerName}</span>
            </div>
            <div class="flex justify-between mb-2">
                <span class="text-gray-400">الحالة:</span>
                <span class="${session.paused ? 'text-yellow-500' : 'text-green-400'} font-bold">
                    ${session.paused ? 'متوقف مؤقتاً' : (session.isOpen ? 'وقت مفتوح' : 'وقت محدد')}
                </span>
            </div>
            <div class="flex justify-between mb-2">
                <span class="text-gray-400">الوقت المنقضي:</span>
                <span class="text-resbon-blue font-mono">${formatTime(session.elapsed)}</span>
            </div>
            <div class="flex justify-between border-t border-resbon-gray pt-2 mt-2">
                <span class="text-gray-400">السعر الحالي:</span>
                <span class="text-resbon-red font-bold text-xl">${session.totalPrice.toLocaleString()} د.ع</span>
            </div>
        </div>
    `;
    
    document.getElementById('session-info').innerHTML = infoHtml;
    document.getElementById('btn-pause').innerHTML = session.paused ? 
        '<i data-feather="play" class="text-green-500"></i><span class="text-sm text-green-500">استئناف</span>' : 
        '<i data-feather="pause" class="text-yellow-600"></i><span class="text-sm">إيقاف مؤقت</span>';
    
    document.getElementById('extend-options').classList.add('hidden');
    
    showModal('modal-manage');
    feather.replace();
}

function showModal(id) {
    document.getElementById(id).classList.remove('hidden');
    state.currentModal = id;
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
    if (state.currentModal === id) {
        state.currentModal = null;
    }
}

// Form Handling
function setDurationType(type) {
    state.durationType = type;
    const fixedBtn = document.getElementById('btn-fixed');
    const openBtn = document.getElementById('btn-open');
    const durationSelector = document.getElementById('duration-selector');
    
    if (type === 'fixed') {
        fixedBtn.classList.add('bg-resbon-red', 'border-resbon-red', 'text-white');
        fixedBtn.classList.remove('bg-resbon-dark', 'text-gray-400', 'border-resbon-gray');
        openBtn.classList.remove('bg-resbon-blue', 'border-resbon-blue', 'text-white');
        openBtn.classList.add('bg-resbon-dark', 'text-gray-400', 'border-resbon-gray');
        durationSelector.classList.remove('hidden');
        setDuration(60, 4000);
    } else {
        openBtn.classList.add('bg-resbon-blue', 'border-resbon-blue', 'text-white');
        openBtn.classList.remove('bg-resbon-dark', 'text-gray-400', 'border-resbon-gray');
        fixedBtn.classList.remove('bg-resbon-red', 'border-resbon-red', 'text-white');
        fixedBtn.classList.add('bg-resbon-dark', 'text-gray-400', 'border-resbon-gray');
        durationSelector.classList.add('hidden');
        state.selectedDuration = 0;
        state.selectedPrice = 0;
        updatePriceDisplay();
    }
}

function setDuration(minutes, price) {
    state.selectedDuration = minutes;
    state.selectedPrice = price;
    
    document.querySelectorAll('.duration-btn').forEach(btn => {
        const btnMin = parseInt(btn.dataset.min);
        if (btnMin === minutes) {
            btn.classList.add('border-resbon-red', 'bg-resbon-red/20');
            btn.classList.remove('border-resbon-gray');
        } else {
            btn.classList.remove('border-resbon-red', 'bg-resbon-red/20');
            btn.classList.add('border-resbon-gray');
        }
    });
    
    updatePriceDisplay();
}

function updatePriceDisplay() {
    const price = state.durationType === 'open' ? 0 : state.selectedPrice;
    document.getElementById('totalPrice').textContent = price.toLocaleString() + ' د.ع';
}

function handleAddSession(e) {
    e.preventDefault();
    
    const playerName = document.getElementById('playerName').value;
    const type = document.getElementById('deviceType').value;
    const id = parseInt(document.getElementById('deviceId').value);
    
    const device = type === 'tables' ? state.tables[id - 1] : state.playstations[id - 1];
    
    const session = {
        playerName,
        startTime: new Date(),
        duration: state.durationType === 'open' ? 0 : state.selectedDuration,
        isOpen: state.durationType === 'open',
        elapsed: 0,
        totalPrice: state.durationType === 'open' ? 0 : state.selectedPrice,
        paused: false,
        extensions: []
    };
    
    device.currentSession = session;
    saveData();
    renderDevices();
    closeModal('modal-add');
}

// Session Management
function togglePause() {
    const { type, id } = state.selectedDevice;
    const device = type === 'tables' ? state.tables[id - 1] : state.playstations[id - 1];
    
    device.currentSession.paused = !device.currentSession.paused;
    saveData();
    openManageModal(type, id); // Refresh modal
    renderDevices();
}

function extendSession() {
    const extendDiv = document.getElementById('extend-options');
    extendDiv.classList.toggle('hidden');
}

function addTime(minutes, price) {
    const { type, id } = state.selectedDevice;
    const device = type === 'tables' ? state.tables[id - 1] : state.playstations[id - 1];
    const session = device.currentSession;
    
    if (session.isOpen) {
        // If open, convert to fixed with the selected time starting now
        session.isOpen = false;
        session.duration = minutes;
        session.elapsed = 0;
        session.totalPrice += price;
    } else {
        // Add to existing fixed time
        session.duration += minutes;
        session.totalPrice += price;
    }
    
    session.extensions.push({ minutes, price, time: new Date() });
    saveData();
    openManageModal(type, id);
    renderDevices();
}

function convertToFixed() {
    const { type, id } = state.selectedDevice;
    const device = type === 'tables' ? state.tables[id - 1] : state.playstations[id - 1];
    const session = device.currentSession;
    
    if (!session.isOpen) return;
    
    // Calculate elapsed time and convert to appropriate package or custom
    const elapsedMins = Math.ceil(session.elapsed / 60);
    let newDuration, additionalPrice;
    
    if (elapsedMins <= 15) {
        newDuration = 15;
        additionalPrice = 1000;
    } else if (elapsedMins <= 30) {
        newDuration = 30;
        additionalPrice = 2000;
    } else {
        newDuration = 60;
        additionalPrice = 4000;
    }
    
    session.isOpen = false;
    session.duration = newDuration;
    session.elapsed = 0; // Reset to give full time, or keep elapsed if you want to count from already played
    // Actually, better to give them the full package they paid for
    session.totalPrice += additionalPrice;
    
    saveData();
    openManageModal(type, id);
    renderDevices();
}

function endSession() {
    const { type, id } = state.selectedDevice;
    const device = type === 'tables' ? state.tables[id - 1] : state.playstations[id - 1];
    const session = device.currentSession;
    
    if (session.isOpen) {
        // Calculate price for open session based on elapsed time
        const hours = Math.ceil(session.elapsed / 3600);
        const halfHours = Math.ceil(session.elapsed / 1800);
        
        // Pricing logic for open time conversion
        if (session.elapsed <= 900) { // 15 min
            session.totalPrice = 1000;
        } else if (session.elapsed <= 1800) { // 30 min
            session.totalPrice = 2000;
        } else if (session.elapsed <= 3600) { // 60 min
            session.totalPrice = 4000;
        } else {
            // More than hour, charge hourly rate
            session.totalPrice = hours * 4000;
        }
    }
    
    // Add to stats
    state.stats.totalProfit += session.totalPrice;
    state.stats.totalSessions++;
    state.stats.completedSessions.push({
        device: device.name,
        player: session.playerName,
        duration: session.isOpen ? Math.ceil(session.elapsed / 60) : session.duration,
        price: session.totalPrice,
        endTime: new Date()
    });
    
    // Clear session
    device.currentSession = null;
    
    saveData();
    updateStats();
    closeModal('modal-manage');
    renderDevices();
}

// Stats
function updateStats() {
    document.getElementById('totalProfit').textContent = state.stats.totalProfit.toLocaleString() + ' د.ع';
    document.getElementById('stats-total').textContent = state.stats.totalProfit.toLocaleString() + ' د.ع';
    document.getElementById('stats-count').textContent = state.stats.totalSessions;
    
    const list = document.getElementById('completed-sessions');
    list.innerHTML = state.stats.completedSessions.slice().reverse().map(s => `
        <div class="flex justify-between items-center p-3 bg-black/30 rounded border border-resbon-gray/30 text-sm">
            <div>
                <div class="font-bold text-white">${s.player}</div>
                <div class="text-gray-400 text-xs">${s.device} • ${s.duration} دقيقة</div>
            </div>
            <div class="text-resbon-red font-bold">${s.price.toLocaleString()} د.ع</div>
        </div>
    `).join('');
}

function showStats() {
    showModal('modal-stats');
}

function resetStats() {
    if (confirm('هل أنت متأكد من تصفير الإحصائيات؟')) {
        state.stats = {
            totalProfit: 0,
            totalSessions: 0,
            completedSessions: []
        };
        saveData();
        updateStats();
        closeModal('modal-stats');
    }
}

// Utilities
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function switchTab(tab) {
    const tablesSection = document.getElementById('section-tables');
    const psSection = document.getElementById('section-playstation');
    const tablesBtn = document.getElementById('tab-tables');
    const psBtn = document.getElementById('tab-playstation');
    
    if (tab === 'tables') {
        tablesSection.classList.remove('hidden');
        psSection.classList.add('hidden');
        tablesBtn.classList.add('bg-resbon-red', 'shadow-lg');
        tablesBtn.classList.remove('bg-resbon-dark', 'border', 'border-resbon-blue');
        psBtn.classList.remove('bg-resbon-red', 'shadow-lg');
        psBtn.classList.add('bg-resbon-dark', 'border', 'border-resbon-blue');
    } else {
        tablesSection.classList.add('hidden');
        psSection.classList.remove('hidden');
        psBtn.classList.add('bg-resbon-red', 'shadow-lg');
        psBtn.classList.remove('bg-resbon-dark', 'border', 'border-resbon-blue');
        tablesBtn.classList.remove('bg-resbon-red', 'shadow-lg');
        tablesBtn.classList.add('bg-resbon-dark', 'border', 'border-resbon-blue');
    }
}

// Close modals on outside click
window.onclick = function(event) {
    if (event.target.classList.contains('fixed')) {
        closeModal(event.target.id);
    }
}
