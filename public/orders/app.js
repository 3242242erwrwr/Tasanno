// TASANNO ZAKAZLAR - REAL-TIME ORDER RECEIVER
const API_BASE_URL = window.location.origin.includes('http') ? window.location.origin : "https://tasanno-im7q.onrender.com";
const SYNC_CHANNEL = "tasanno_orders_channel_998";
const SYNC_URL = `https://ntfy.sh/${SYNC_CHANNEL}`;

let orders = [];
let currentFilter = 'all';
let isSoundEnabled = true;

let deletedOrderIds = new Set();
try {
    const savedDeleted = localStorage.getItem('tasanno_deleted_orders');
    if (savedDeleted) {
        deletedOrderIds = new Set(JSON.parse(savedDeleted));
    }
} catch (e) {
    deletedOrderIds = new Set();
}

try {
    const saved = localStorage.getItem('tasanno_orders');
    if (saved) {
        orders = JSON.parse(saved).filter(o => !deletedOrderIds.has(String(o.id)) && o.status !== 'Bekor qilindi');
    }
} catch (e) {
    orders = [];
}

function playOrderChime() {
    if (!isSoundEnabled) return;
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();

        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
        gain1.gain.setValueAtTime(0.4, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.4);
    } catch (e) {}
}

const splashScreen = document.getElementById('splashScreen');
const appContainer = document.getElementById('appContainer');
const ordersContainer = document.getElementById('ordersContainer');
const soundToggleBtn = document.getElementById('soundToggleBtn');
const refreshBtn = document.getElementById('refreshBtn');
const statNewCount = document.getElementById('statNewCount');
const statTotalCount = document.getElementById('statTotalCount');
const statTotalSum = document.getElementById('statTotalSum');
const toast = document.getElementById('toast');

function initApp() {
    setTimeout(() => {
        if (splashScreen) {
            splashScreen.style.opacity = '0';
            splashScreen.style.display = 'none';
        }
        if (appContainer) appContainer.classList.remove('hidden');
    }, 600);

    renderOrders();
    updateStats();
    startRealtimeSync();
    setupListeners();
}

function setupListeners() {
    document.querySelectorAll('.filter-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            renderOrders();
        });
    });

    soundToggleBtn?.addEventListener('click', () => {
        isSoundEnabled = !isSoundEnabled;
        if (isSoundEnabled) {
            soundToggleBtn.classList.add('active');
            soundToggleBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
            showToast("Ovoz yoqildi");
            playOrderChime();
        } else {
            soundToggleBtn.classList.remove('active');
            soundToggleBtn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
            showToast("Ovoz o'chirildi");
        }
    });

    refreshBtn?.addEventListener('click', () => {
        pollLatestOrders(true);
        pollRenderBackendOrders(true);
    });
}

function startRealtimeSync() {
    pollLatestOrders(false);
    pollRenderBackendOrders(false);

    try {
        const sse = new EventSource(`${SYNC_URL}/sse`);
        sse.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.event === 'message' && data.message) {
                    const newOrder = JSON.parse(data.message);
                    processIncomingOrder(newOrder);
                }
            } catch (e) {}
        };
    } catch (e) {}

    setInterval(() => {
        pollLatestOrders(false);
        pollRenderBackendOrders(false);
    }, 1000);
}

async function pollRenderBackendOrders(showToastMsg = false) {
    try {
        const resp = await fetch(`${API_BASE_URL}/api/orders`, { cache: 'no-cache' });
        if (!resp.ok) return;
        const backendOrders = await resp.json();
        if (Array.isArray(backendOrders)) {
            const filteredBackend = backendOrders.filter(o => !deletedOrderIds.has(String(o.id)));
            const isDifferent = JSON.stringify(orders.map(o => ({id: String(o.id), status: o.status}))) !==
                                JSON.stringify(filteredBackend.map(o => ({id: String(o.id), status: o.status})));

            if (isDifferent) {
                if (filteredBackend.length > orders.length && orders.length >= 0) {
                    playOrderChime();
                }
                orders = filteredBackend;
                saveOrders();
                renderOrders();
                updateStats();
                if (showToastMsg) {
                    showToast("Buyurtmalar serverdan yangilandi!");
                }
            }
        }
    } catch (e) {}
}

async function pollLatestOrders(showToastMsg) {
    try {
        const resp = await fetch(`${SYNC_URL}/json?poll=1`, { cache: 'no-cache' });
        if (!resp.ok) return;
        const text = await resp.text();
        const lines = text.trim().split('\n');

        let newFound = false;
        lines.forEach(line => {
            try {
                if (!line) return;
                const item = JSON.parse(line);
                if (item.event === 'message' && item.message) {
                    const orderObj = JSON.parse(item.message);
                    if (processIncomingOrder(orderObj)) {
                        newFound = true;
                    }
                }
            } catch (e) {}
        });

        if (showToastMsg && newFound) {
            showToast("Yangi buyurtmalar keldi!");
        }
    } catch (e) {}
}

function processIncomingOrder(orderObj) {
    if (!orderObj || !orderObj.id) return false;
    if (deletedOrderIds.has(String(orderObj.id))) return false;

    const exists = orders.some(o => String(o.id) === String(orderObj.id));
    if (!exists) {
        orderObj.status = orderObj.status || 'Yangi';
        orderObj.isNewHighlight = true;
        orders.unshift(orderObj);
        saveOrders();
        renderOrders();
        updateStats();
        playOrderChime();
        showToast(`🔔 Yangi buyurtma keldi: #${orderObj.id}`);
        return true;
    }
    return false;
}

function updateOrderStatus(orderId, newStatus) {
    const ord = orders.find(o => String(o.id) === String(orderId));
    if (!ord) return;

    ord.status = newStatus;
    delete ord.isNewHighlight;
    saveOrders();
    renderOrders();
    updateStats();

    fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
    }).catch(e => {});

    showToast(`Buyurtma #${orderId} holati: ${newStatus}`);
}

function cancelAndRemoveOrder(orderId) {
    deletedOrderIds.add(String(orderId));
    try {
        localStorage.setItem('tasanno_deleted_orders', JSON.stringify(Array.from(deletedOrderIds)));
    } catch (e) {}

    orders = orders.filter(o => String(o.id) !== String(orderId));
    saveOrders();
    renderOrders();
    updateStats();

    fetch(`${API_BASE_URL}/api/orders/${orderId}`, { method: 'DELETE' })
        .catch(e => {});

    showToast(`Buyurtma #${orderId} o'chirildi`);
}

function saveOrders() {
    localStorage.setItem('tasanno_orders', JSON.stringify(orders));
}

function renderOrders() {
    if (!ordersContainer) return;
    ordersContainer.innerHTML = '';

    const filtered = orders.filter(o => {
        if (currentFilter === 'all') return true;
        return o.status === currentFilter;
    });

    if (filtered.length === 0) {
        ordersContainer.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-box-open empty-icon"></i>
                <p>Hozircha buyurtmalar yo'q</p>
            </div>
        `;
        return;
    }

    filtered.forEach(ord => {
        const card = document.createElement('div');
        const statusClass = (ord.status || 'Yangi').replace(/\s+/g, '-');
        card.className = `order-card ${ord.isNewHighlight ? 'new-order-highlight' : ''}`;

        const itemsHtml = (ord.items || []).map(item => `
            <div class="order-item-row">
                <span>• ${item.title} <strong>(${item.quantity} dona)</strong></span>
                <span>${formatPrice(item.price * item.quantity)} so'm</span>
            </div>
        `).join('');

        const cleanPhone = (ord.phone || '').replace(/\s+/g, '').replace(/[^\d+]/g, '');

        card.innerHTML = `
            <div class="order-card-header">
                <div class="order-id-date">
                    <span class="order-id">#${ord.id}</span>
                    <span class="order-date"><i class="fa-regular fa-clock"></i> ${ord.date || ''}</span>
                </div>
                <span class="status-badge status-${statusClass}">${ord.status || 'Yangi'}</span>
            </div>

            <div class="customer-box">
                <div class="customer-details">
                    <span class="customer-name"><i class="fa-solid fa-user"></i> ${ord.name || 'Mijoz'}</span>
                    <span class="customer-phone"><i class="fa-solid fa-phone"></i> ${ord.phone || 'Kiritilmagan'}</span>
                </div>
                ${cleanPhone ? `<a href="tel:${cleanPhone}" class="call-btn"><i class="fa-solid fa-phone"></i> Qo'ng'iroq</a>` : ''}
            </div>

            <div class="address-box">
                <i class="fa-solid fa-location-dot" style="color:var(--primary-color);margin-top:2px;"></i>
                <span><strong>Manzil/Izoh:</strong> ${ord.address || 'Kiritilmagan'}</span>
            </div>

            <div class="order-items-list">
                ${itemsHtml}
            </div>

            <div class="order-total-bar">
                <span class="payment-plan-tag">${ord.paymentType || "Naqd to'lov"}</span>
                <span class="order-total-amount">${formatPrice(ord.total || 0)} so'm</span>
            </div>

            <div class="order-actions">
                ${ord.status === 'Yangi' ? `
                    <button class="action-btn btn-accept" onclick="updateOrderStatus('${ord.id}', 'Qabul qilindi')">
                        <i class="fa-solid fa-check"></i> Qabul qilish
                    </button>
                    <button class="action-btn btn-cancel" onclick="cancelAndRemoveOrder('${ord.id}')">
                        <i class="fa-solid fa-xmark"></i> Bekor qilish
                    </button>
                ` : ''}

                ${ord.status === 'Qabul qilindi' ? `
                    <button class="action-btn btn-deliver" onclick="updateOrderStatus('${ord.id}', 'Yetkazilmoqda')">
                        <i class="fa-solid fa-truck-fast"></i> Yetkazilmoqda
                    </button>
                    <button class="action-btn btn-cancel" onclick="cancelAndRemoveOrder('${ord.id}')">
                        <i class="fa-solid fa-xmark"></i> Bekor qilish
                    </button>
                ` : ''}

                ${ord.status === 'Yetkazilmoqda' ? `
                    <button class="action-btn btn-complete" onclick="updateOrderStatus('${ord.id}', 'Yetkazildi')">
                        <i class="fa-solid fa-circle-check"></i> Yetkazildi
                    </button>
                    <button class="action-btn btn-cancel" onclick="cancelAndRemoveOrder('${ord.id}')">
                        <i class="fa-solid fa-xmark"></i> Bekor qilish
                    </button>
                ` : ''}

                ${ord.status === 'Yetkazildi' ? `
                    <div style="font-size:12px;color:var(--success-color);font-weight:700;width:100%;text-align:center;padding:4px;">
                        <i class="fa-solid fa-circle-check"></i> Buyurtma muvaffaqiyatli yetkazilgan
                    </div>
                ` : ''}
            </div>
        `;

        ordersContainer.appendChild(card);
    });
}

function updateStats() {
    const newCount = orders.filter(o => o.status === 'Yangi').length;
    const acceptedCount = orders.filter(o => o.status === 'Qabul qilindi').length;
    const deliveringCount = orders.filter(o => o.status === 'Yetkazilmoqda').length;
    const deliveredCount = orders.filter(o => o.status === 'Yetkazildi').length;
    const totalCount = orders.length;

    const totalSum = orders
        .filter(o => o.status !== 'Bekor qilindi')
        .reduce((sum, o) => sum + (o.total || 0), 0);

    if (statNewCount) statNewCount.textContent = newCount;
    if (statTotalCount) statTotalCount.textContent = totalCount;
    if (statTotalSum) statTotalSum.textContent = `${formatPrice(totalSum)} so'm`;

    const cAll = document.getElementById('countAll');
    const cNew = document.getElementById('countNew');
    const cAcc = document.getElementById('countAccepted');
    const cDel = document.getElementById('countDelivering');
    const cDone = document.getElementById('countDelivered');

    if (cAll) cAll.textContent = totalCount;
    if (cNew) cNew.textContent = newCount;
    if (cAcc) cAcc.textContent = acceptedCount;
    if (cDel) cDel.textContent = deliveringCount;
    if (cDone) cDone.textContent = deliveredCount;
}

function formatPrice(p) {
    return (p || 0).toLocaleString('fr-FR');
}

function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 2500);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
