const DB_NAME = 'RESBON_V5_STABLE';

const state = {
    tables: Array(6).fill(null).map((_, i) => ({ id: i + 1, type: 'tables', name: `منضدة ${i + 1} ⚡`, session: null })),
    ps: Array(8).fill(null).map((_, i) => ({ id: i + 1, type: 'ps', name: `بلايستيشن ${i + 1} ⚡`, session: null })),
    totalProfit: 0,
    activeDev: null,
    selMins: 60,
    selPrice: 4000
};

// نظام السيرفر والحفظ (مفحوص بدقة)
function syncStore() {
    const backup = {
        totalProfit: state.totalProfit,
        tables: state.tables,
        ps: state.ps,
        time: Date.now()
    };
    localStorage.setItem(DB_NAME, JSON.stringify(backup));
}

function loadStore() {
    const raw = localStorage.getItem(DB_NAME);
    if (!raw) return;
    const data = JSON.parse(raw);
    state.totalProfit = data.totalProfit || 0;
    
    const update = (oldList, newList) => {
        oldList.forEach((d, i) => {
            if (d.session) {
                const diff = Math.floor((Date.now() - data.time) / 1000);
                newList[i].session = d.session;
                newList[i].session.elapsed += diff;
            }
        });
    };
    update(data.tables, state.tables);
    update(data.ps, state.ps);
    document.getElementById('totalProfit').textContent = state.totalProfit.toLocaleString() + ' د.ع';
}

// العداد الرئيسي (بدون تعليق)
setInterval(() => {
    let hasActive = false;
    [...state.tables, ...state.ps].forEach(d => {
        if (!d.session) return;
        d.session.elapsed++;
        hasActive = true;
        
        let label = "";
        if (d.session.totalMins === 0) {
            label = "لعبة واحدة";
        } else {
            let remain = (d.session.totalMins * 60) - d.session.elapsed;
            let m = Math.floor(Math.abs(remain) / 60);
            let s = Math.abs(remain) % 60;
            label = (remain < 0 ? "-" : "") + `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
            if (remain < 0) document.getElementById(`t-${d.type}-${d.id}`)?.classList.add('text-red-500');
        }
        const el = document.getElementById(`t-${d.type}-${d.id}`);
        if (el) el.textContent = label;
    });
    if (hasActive) syncStore();
}, 1000);

function render() {
    ['tables', 'ps'].forEach(type => {
        const container = document.getElementById(`section-${type}`);
        container.innerHTML = state[type].map(d => `
            <div class="glass p-6 flex items-center justify-between bolt-bg transition-all ${d.session ? 'active-card border-yellow-500' : ''}">
                <div>
                    <h3 class="font-black text-sm text-slate-400 uppercase tracking-tighter">${d.name}</h3>
                    <p class="text-xs text-yellow-500 font-bold mb-1">${d.session ? '👤 ' + d.session.customer : 'متاح'}</p>
                    <div id="t-${d.type}-${d.id}" class="text-3xl font-black text-white tabular-nums tracking-tighter">
                        ${d.session ? '..' : '00:00'}
                    </div>
                </div>
                <button onclick="openAction('${d.type}', ${d.id})" class="px-8 py-4 rounded-2xl font-black transition-all shadow-lg ${d.session ? 'bg-green-600 text-white active:scale-90' : 'bg-slate-800 text-slate-500 hover:text-white'}">
                    ${d.session ? 'إدارة' : 'حجز'}
                </button>
            </div>
        `).join('');
    });
}

function openAction(type, id) {
    state.activeDev = state[type].find(d => d.id === id);
    if (state.activeDev.session) {
        document.getElementById('manageName').textContent = state.activeDev.name;
        document.getElementById('manageCustomer').textContent = "الزبون: " + state.activeDev.session.customer;
        document.getElementById('modal-manage').classList.remove('hidden');
    } else {
        document.getElementById('customerNameInput').value = "";
        document.getElementById('deviceLabel').textContent = state.activeDev.name;
        document.getElementById('modal-add').classList.remove('hidden');
    }
}

function startSession() {
    const name = document.getElementById('customerNameInput').value.trim() || "زبون مجهول";
    state.activeDev.session = { totalMins: state.selMins, price: state.selPrice, items: [], elapsed: 0, customer: name };
    syncStore(); render(); closeModal('modal-add');
}

function addTime(m, p) {
    state.activeDev.session.totalMins += m;
    state.activeDev.session.price += p;
    syncStore();
}

function addItem(name, price) {
    state.activeDev.session.price += price;
    state.activeDev.session.items.push({ name, price });
    syncStore();
}

function showInvoice() {
    const s = state.activeDev.session;
    document.getElementById('invoice-customer-name').textContent = s.customer;
    document.getElementById('invoice-date').textContent = new Date().toLocaleString('ar-IQ');
    let itemsHTML = `<div class="flex justify-between border-b-2 border-black pb-2 mb-2 italic"><span>حساب الوقت (${state.activeDev.name})</span><span>${s.totalMins === 0 ? s.price : (s.totalMins + ' د')}</span></div>`;
    s.items.forEach(item => {
        itemsHTML += `<div class="flex justify-between text-xs my-1"><span>+ ${item.name}</span><span>${item.price.toLocaleString()}</span></div>`;
    });
    document.getElementById('invoice-body').innerHTML = itemsHTML;
    document.getElementById('invoice-total').textContent = s.price.toLocaleString() + ' د.ع';
    document.getElementById('modal-invoice').classList.remove('hidden');
}

function confirmFinish() {
    state.totalProfit += state.activeDev.session.price;
    state.activeDev.session = null;
    document.getElementById('totalProfit').textContent = state.totalProfit.toLocaleString() + ' د.ع';
    syncStore(); render();
    closeModal('modal-invoice'); closeModal('modal-manage');
}

function resetProfit() {
    if (confirm("هل أنت متأكد من تصفير جميع الأرباح؟")) {
        state.totalProfit = 0;
        document.getElementById('totalProfit').textContent = "0 د.ع";
        syncStore();
    }
}

function pickPrice(m, p) { state.selMins = m; state.selPrice = p; }

function switchTab(t) {
    document.getElementById('section-tables').classList.toggle('hidden', t !== 'tables');
    document.getElementById('section-ps').classList.toggle('hidden', t !== 'ps');
    document.getElementById('btn-tables').className = t === 'tables' ? 'flex-1 py-4 glass bg-yellow-500 text-black font-black' : 'flex-1 py-4 glass text-slate-400 font-black';
    document.getElementById('btn-ps').className = t === 'ps' ? 'flex-1 py-4 glass bg-yellow-500 text-black font-black' : 'flex-1 py-4 glass text-slate-400 font-black';
}

function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

loadStore();
render();
