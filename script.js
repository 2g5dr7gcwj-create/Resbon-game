// الكود الأصلي مالتك مع إضافة ميزة الحفظ التلقائي للوقت
const state = {
    tables: Array(6).fill(null).map((_, i) => ({ id: i + 1, type: 'tables', name: `منضدة ${i + 1}`, currentSession: null })),
    playstations: Array(4).fill(null).map((_, i) => ({ id: i + 1, type: 'playstation', name: `بلايستيشن ${i + 1}`, currentSession: null })),
    totalProfit: 0
};

// وظيفة الحفظ - تحل مشكلة الريفرش
function saveState() {
    const dataToSave = {
        totalProfit: state.totalProfit,
        sessions: [...state.tables, ...state.playstations].map(d => ({
            id: d.id,
            type: d.type,
            session: d.currentSession ? {
                ...d.currentSession,
                saveTime: Date.now() // نحفظ لحظة الخروج
            } : null
        }))
    };
    localStorage.setItem('resbon_backup', JSON.stringify(dataToSave));
}

// وظيفة الاسترجاع عند فتح التطبيق
function loadState() {
    const saved = localStorage.getItem('resbon_backup');
    if (!saved) return;
    const data = JSON.parse(saved);
    state.totalProfit = data.totalProfit || 0;
    document.getElementById('totalProfit').textContent = state.totalProfit.toLocaleString() + ' د.ع';

    data.sessions.forEach(savedItem => {
        const list = savedItem.type === 'tables' ? state.tables : state.playstations;
        const dev = list.find(d => d.id === savedItem.id);
        if (dev && savedItem.session) {
            const s = savedItem.session;
            // حساب الوقت الضائع أثناء إغلاق الموقع
            const passedSeconds = Math.floor((Date.now() - s.saveTime) / 1000);
            if (s.isOpen) {
                s.remaining += passedSeconds;
            } else {
                s.remaining = Math.max(0, s.remaining - passedSeconds);
            }
            dev.currentSession = s;
            startTimer(dev);
        }
    });
}

function renderDevices() {
    const render = (type, list, target) => {
        document.getElementById(target).innerHTML = list.map(d => {
            const s = d.currentSession;
            return `
            <div class="glass-panel p-4 rounded-xl border ${s ? 'border-red-600' : 'border-gray-800'}">
                <div class="flex justify-between mb-2"><span>${d.name}</span><span>${s ? '🔴' : '⚪'}</span></div>
                <div class="text-2xl font-bold text-center mb-4" id="timer-${type}-${d.id}">${s ? s.displayTime : '--:--'}</div>
                <button onclick="${s ? 'openManage' : 'openAdd'}('${type}', ${d.id})" class="w-full py-2 ${s ? 'bg-blue-600' : 'bg-red-600'} rounded-lg text-sm">
                    ${s ? 'إدارة' : 'حجز'}
                </button>
            </div>`;
        }).join('');
    };
    render('tables', state.tables, 'section-tables');
    render('playstation', state.playstations, 'section-playstation');
}

function startTimer(dev) {
    if (dev.interval) clearInterval(dev.interval);
    dev.interval = setInterval(() => {
        const s = dev.currentSession;
        if (!s) { clearInterval(dev.interval); return; }
        
        if (s.isOpen) s.remaining++;
        else if (s.remaining > 0) s.remaining--;

        const m = Math.floor(Math.abs(s.remaining) / 60);
        const sec = Math.abs(s.remaining) % 60;
        s.displayTime = `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
        
        const el = document.getElementById(`timer-${dev.type}-${dev.id}`);
        if (el) el.textContent = s.displayTime;
        
        saveState(); // حفظ كل ثانية لضمان الدقة
    }, 1000);
}

function handleAddSession(e) {
    e.preventDefault();
    const { type, id } = state.active;
    const dev = (type === 'tables' ? state.tables : state.playstations)[id - 1];
    const isOpen = document.getElementById('duration-selector').classList.contains('hidden');
    
    dev.currentSession = {
        playerName: document.getElementById('playerName').value || 'لاعب',
        remaining: isOpen ? 0 : (state.selMins * 60),
        isOpen: isOpen,
        price: state.selPrice || 4000,
        displayTime: '00:00'
    };
    
    startTimer(dev);
    renderDevices();
    closeModal('modal-add');
}

// باقي الدوال مالتك بدون أي تغيير
function openAdd(type, id) { state.active = { type, id }; document.getElementById('modal-add').classList.remove('hidden'); }
function openManage(type, id) {
    state.active = { type, id };
    const s = (type === 'tables' ? state.tables : state.playstations)[id - 1].currentSession;
    document.getElementById('session-info').innerHTML = `<p class="text-center font-bold">الحساب: ${s.price} د.ع</p>`;
    document.getElementById('modal-manage').classList.remove('hidden');
}
function addTime(m, p) {
    const { type, id } = state.active;
    const s = (type === 'tables' ? state.tables : state.playstations)[id - 1].currentSession;
    s.remaining += (m * 60);
    s.price += p;
    s.isOpen = false;
    saveState(); renderDevices(); closeModal('modal-manage');
}
function endSession() {
    const { type, id } = state.active;
    const devs = (type === 'tables' ? state.tables : state.playstations);
    state.totalProfit += devs[id-1].currentSession.price;
    clearInterval(devs[id-1].interval);
    devs[id-1].interval = null;
    devs[id-1].currentSession = null;
    document.getElementById('totalProfit').textContent = state.totalProfit.toLocaleString() + ' د.ع';
    saveState(); renderDevices(); closeModal('modal-manage');
}
function setDuration(m, p) { state.selMins = m; state.selPrice = p; document.getElementById('totalPrice').textContent = p + ' د.ع'; }
function setDurationType(t) { document.getElementById('duration-selector').classList.toggle('hidden', t === 'open'); state.selPrice = t === 'open' ? 0 : 4000; }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function switchTab(t) {
    document.getElementById('section-tables').classList.toggle('hidden', t !== 'tables');
    document.getElementById('section-playstation').classList.toggle('hidden', t !== 'playstation');
}

// تشغيل النظام
loadState();
renderDevices();
