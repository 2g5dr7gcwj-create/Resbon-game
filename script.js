const state = {
    tables: Array(6).fill(null).map((_, i) => ({ id: i + 1, type: 'tables', name: `منضدة ${i + 1}`, session: null })),
    ps: Array(4).fill(null).map((_, i) => ({ id: i + 1, type: 'ps', name: `بلايستيشن ${i + 1}`, session: null })),
    profit: 0,
    debts: [],
    inventory: { 'بيبسي': 500, 'ماء': 250, 'أركيلة': 3000, 'كابتشينو': 1000 },
    activeDev: null,
    selMins: 60,
    selPrice: 4000,
    mode: 'fixed'
};

// العداد الذكي
setInterval(() => {
    [...state.tables, ...state.ps].forEach(d => {
        if (!d.session) return;
        const s = d.session;
        if (s.isOpen) s.rem++; else if (s.rem > 0) s.rem--;
        
        const m = Math.floor(Math.abs(s.rem) / 60);
        const sec = Math.abs(s.rem) % 60;
        s.display = `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
        
        const el = document.getElementById(`t-${d.type}-${d.id}`);
        if (el) el.textContent = s.display;
    });
}, 1000);

function render() {
    ['tables', 'ps'].forEach(type => {
        const container = document.getElementById(`section-${type}`);
        container.innerHTML = state[type === 'ps' ? 'ps' : 'tables'].map(d => {
            const s = d.session;
            return `
            <div class="card-glass p-6 flex items-center justify-between ${s ? 'card-active' : ''}">
                <div>
                    <h3 class="font-bold text-slate-200">${d.name}</h3>
                    <div class="text-2xl font-black timer-glow mt-1 ${s ? 'text-blue-400' : 'text-slate-600'}" id="t-${type}-${d.id}">
                        ${s ? s.display : '00:00'}
                    </div>
                </div>
                <button onclick="openAction('${type}', ${d.id})" class="px-6 py-3 rounded-xl font-bold btn-action ${s ? 'bg-green-600/20 text-green-400' : 'bg-slate-800 text-slate-300'}">
                    ${s ? 'إدارة / طلب' : 'حجز'}
                </button>
            </div>`;
        }).join('');
    });
    updateStats();
}

function openAction(type, id) {
    const list = type === 'ps' ? state.ps : state.tables;
    state.activeDev = list.find(d => d.id === id);
    if (state.activeDev.session) {
        document.getElementById('manageName').textContent = state.activeDev.name;
        document.getElementById('managePrice').textContent = state.activeDev.session.price.toLocaleString() + ' د.ع';
        document.getElementById('modal-manage').classList.remove('hidden');
    } else {
        document.getElementById('deviceLabel').textContent = state.activeDev.name;
        document.getElementById('modal-add').classList.remove('hidden');
    }
}

function addItem(name) {
    const price = state.inventory[name];
    state.activeDev.session.price += price;
    document.getElementById('managePrice').textContent = state.activeDev.session.price.toLocaleString() + ' د.ع';
}

function startSession() {
    state.activeDev.session = { 
        rem: state.mode === 'open' ? 0 : (state.selMins * 60), 
        price: state.selPrice, 
        isOpen: state.mode === 'open', 
        display: '00:00' 
    };
    render();
    closeModal('modal-add');
}

function finishSession(isDebt) {
    const s = state.activeDev.session;
    if (isDebt) {
        const name = prompt("اسم اللاعب المطلوب:");
        if (name) state.debts.push({ name, amount: s.price, date: new Date().toLocaleTimeString() });
    } else {
        state.profit += s.price;
    }
    state.activeDev.session = null;
    render();
    closeModal('modal-manage');
}

function payDebt(index) {
    state.profit += state.debts[index].amount;
    state.debts.splice(index, 1);
    updateStats();
}

function updateStats() {
    document.getElementById('totalProfit').textContent = state.profit.toLocaleString() + ' د.ع';
    document.getElementById('debt-list').innerHTML = state.debts.map((d, i) => `
        <div class="flex justify-between items-center p-3 bg-red-900/20 border border-red-900/30 rounded-xl mb-2">
            <div><p class="font-bold text-sm">${d.name}</p><p class="text-[10px] text-slate-500">${d.date}</p></div>
            <div class="flex items-center gap-4">
                <span class="font-black text-red-400">${d.amount.toLocaleString()}</span>
                <button onclick="payDebt(${i})" class="bg-green-600 p-2 rounded-lg text-[10px] font-bold">تسديد</button>
            </div>
        </div>
    `).join('');
}

function pickPrice(m, p) { 
    state.selMins = m; state.selPrice = p; 
    document.getElementById('displayPrice').textContent = p.toLocaleString() + ' د.ع'; 
}

function setMode(m) {
    state.mode = m;
    document.getElementById('prices-grid').classList.toggle('hidden', m === 'open');
    document.getElementById('mode-fixed').className = m === 'fixed' ? 'flex-1 py-2 rounded-lg bg-blue-600 text-sm font-bold border border-blue-400' : 'flex-1 py-2 rounded-lg bg-slate-800 text-sm font-bold text-slate-400';
    document.getElementById('mode-open').className = m === 'open' ? 'flex-1 py-2 rounded-lg bg-blue-600 text-sm font-bold border border-blue-400' : 'flex-1 py-2 rounded-lg bg-slate-800 text-sm font-bold text-slate-400';
    state.selPrice = m === 'open' ? 0 : 4000;
    document.getElementById('displayPrice').textContent = state.selPrice.toLocaleString() + ' د.ع';
}

function switchTab(t) {
    document.getElementById('section-tables').classList.toggle('hidden', t !== 'tables');
    document.getElementById('section-ps').classList.toggle('hidden', t !== 'ps');
    document.getElementById('tab-tables').className = t === 'tables' ? 'flex-1 py-3 rounded-xl font-bold bg-blue-600 text-white shadow-lg' : 'flex-1 py-3 rounded-xl font-bold text-slate-400';
    document.getElementById('tab-ps').className = t === 'ps' ? 'flex-1 py-3 rounded-xl font-bold bg-blue-600 text-white shadow-lg' : 'flex-1 py-3 rounded-xl font-bold text-slate-400';
}

function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

// تشغيل الواجهة
render();
