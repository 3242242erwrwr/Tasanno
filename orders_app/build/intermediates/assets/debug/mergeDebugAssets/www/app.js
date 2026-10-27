// TASANNO ZAKAZLAR - REAL-TIME ORDER RECEIVER
const API_BASE_URL = "https://tasanno-im7q.onrender.com";

let orders = [];
let currentFilter = 'all';
let isSoundEnabled = true;

let currentCourier = null;
try {
    const savedC = localStorage.getItem('currentCourier');
    if (savedC) currentCourier = JSON.parse(savedC);
} catch (e) { currentCourier = null; }

let courierPollInterval = null;

// Load deleted order IDs
let deletedOrderIds = new Set();
try {
    const savedDeleted = localStorage.getItem('tasanno_deleted_orders');
    if (savedDeleted) {
        deletedOrderIds = new Set(JSON.parse(savedDeleted));
    }
} catch (e) {
    deletedOrderIds = new Set();
}

// Load stored orders
try {
    const saved = localStorage.getItem('tasanno_orders');
    if (saved) {
        orders = JSON.parse(saved).filter(o => !deletedOrderIds.has(String(o.id)));
    }
} catch (e) {
    orders = [];
}

// AUDIO CHIME
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
    } catch (e) {
        console.error('Audio chime error:', e);
    }
}

// DOM ELEMENTS
const splashScreen = document.getElementById('splashScreen');
const appContainer = document.getElementById('appContainer');
const ordersContainer = document.getElementById('ordersContainer');
const soundToggleBtn = document.getElementById('soundToggleBtn');
const refreshBtn = document.getElementById('refreshBtn');
const statNewCount = document.getElementById('statNewCount');
const statTotalCount = document.getElementById('statTotalCount');
const statTotalSum = document.getElementById('statTotalSum');
const toast = document.getElementById('toast');

// INIT
function initApp() {
    setTimeout(() => {
        if (splashScreen) {
            splashScreen.style.opacity = '0';
            splashScreen.style.display = 'none';
        }
        if (appContainer) appContainer.classList.remove('hidden');

        checkCourierAuth();
    }, 600);

    renderOrders();
    updateStats();
    startRealtimeSync();
    setupListeners();
}

function checkCourierAuth() {
    const courierAuthModal = document.getElementById('courierAuthModal');
    const courierWaitingModal = document.getElementById('courierWaitingModal');

    if (!currentCourier) {
        if (courierAuthModal) courierAuthModal.classList.remove('hidden');
        return false;
    }

    if (currentCourier.status !== 'Approved') {
        if (courierAuthModal) courierAuthModal.classList.add('hidden');
        if (courierWaitingModal) {
            const nameElem = document.getElementById('waitCourierName');
            const phoneElem = document.getElementById('waitCourierPhone');
            if (nameElem) nameElem.textContent = currentCourier.name;
            if (phoneElem) phoneElem.textContent = currentCourier.phone;
            courierWaitingModal.classList.remove('hidden');
        }
        startCourierStatusPolling();
        return false;
    }

    if (courierAuthModal) courierAuthModal.classList.add('hidden');
    if (courierWaitingModal) courierWaitingModal.classList.add('hidden');
    if (courierPollInterval) clearInterval(courierPollInterval);
    return true;
}

function startCourierStatusPolling() {
    if (courierPollInterval) clearInterval(courierPollInterval);
    courierPollInterval = setInterval(async () => {
        if (!currentCourier || !currentCourier.id) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/couriers/${currentCourier.id}/status`);
            if (res.ok) {
                const data = await res.json();
                if (data.status === 'Approved') {
                    currentCourier.status = 'Approved';
                    localStorage.setItem('currentCourier', JSON.stringify(currentCourier));
                    clearInterval(courierPollInterval);
                    document.getElementById('courierWaitingModal')?.classList.add('hidden');
                    showToast("✅ Admin ruxsat berdi! Xush kelibsiz!");
                    renderOrders();
                } else if (data.status === 'Rejected') {
                    alert("Admin sizning ruxsat so'rovingizni rad etdi.");
                    localStorage.removeItem('currentCourier');
                    currentCourier = null;
                    clearInterval(courierPollInterval);
                    document.getElementById('courierWaitingModal')?.classList.add('hidden');
                    document.getElementById('courierAuthModal')?.classList.remove('hidden');
                }
            }
        } catch(e){}
    }, 1500);
}

async function handleCourierSubmit() {
    const nameInput = document.getElementById('courierNameInput');
    const phoneInput = document.getElementById('courierPhoneInput');

    const name = nameInput ? nameInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';

    if (!name || !phone) {
        showToast("Iltimos, Ismingiz va Telefoningizni kiriting!");
        return;
    }

    const courierId = '#COUR-' + Math.floor(100000 + Math.random() * 900000);
    currentCourier = {
        id: courierId,
        name: name,
        phone: phone,
        status: 'Pending'
    };

    localStorage.setItem('currentCourier', JSON.stringify(currentCourier));

    try {
        await fetch(`${API_BASE_URL}/api/couriers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentCourier)
        });
    } catch(e){}

    checkCourierAuth();
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
        syncOrdersFromBackend(true);
    });

    const submitAuthBtn = document.getElementById('submitCourierAuthBtn');
    if (submitAuthBtn) {
        submitAuthBtn.addEventListener('click', handleCourierSubmit);
    }

    const adminPinUnlockBtn = document.getElementById('adminPinUnlockBtn');
    if (adminPinUnlockBtn) {
        adminPinUnlockBtn.addEventListener('click', () => {
            const pin = prompt("Admin PIN-kodini kiriting (Masalan: 7777):");
            if (pin === '7777') {
                if (currentCourier) {
                    currentCourier.status = 'Approved';
                    localStorage.setItem('currentCourier', JSON.stringify(currentCourier));
                    fetch(`${API_BASE_URL}/api/couriers`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(currentCourier)
                    }).catch(e => {});
                    const encodedId = encodeURIComponent(currentCourier.id || currentCourier.phone);
                    fetch(`${API_BASE_URL}/api/couriers/${encodedId}/approve`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'Approved' })
                    }).catch(e => {});
                } else {
                    currentCourier = {
                        id: 'COUR-7777',
                        name: 'Admin Kuryer',
                        phone: '+998 90 000 00 00',
                        status: 'Approved'
                    };
                    localStorage.setItem('currentCourier', JSON.stringify(currentCourier));
                }
                showToast("✅ Admin PIN orqali tasdiqlandi!");
                checkCourierAuth();
                renderOrders();
            } else if (pin) {
                alert("Xato PIN-kod!");
            }
        });
    }
}

let previousOrdersHash = "";

async function syncOrdersFromBackend(showToastMsg = false) {
    try {
        const resp = await fetch(`${API_BASE_URL}/api/orders`, { cache: 'no-cache' });
        if (!resp.ok) return;
        const backendOrders = await resp.json();
        if (Array.isArray(backendOrders)) {
            const activeOrders = backendOrders.filter(o => !deletedOrderIds.has(String(o.id)));
            const currentHash = JSON.stringify(activeOrders);

            if (currentHash !== previousOrdersHash) {
                if (previousOrdersHash !== "" && activeOrders.length > orders.length) {
                    playOrderChime();
                    showToast("🔔 Yangi buyurtma keldi!");
                }
                previousOrdersHash = currentHash;
                orders = activeOrders;
                saveOrders();
                renderOrders();
                updateStats();
                if (showToastMsg) {
                    showToast("Buyurtmalar yangilandi!");
                }
            } else if (showToastMsg) {
                showToast("Buyurtmalar ro'yxati yangi");
            }
        }
    } catch (e) {
        console.warn("Backend orders sync error:", e);
    }
}

function startRealtimeSync() {
    syncOrdersFromBackend(false);
    setInterval(() => {
        syncOrdersFromBackend(false);
    }, 2000);
}

function updateOrderStatus(orderId, newStatus) {
    const ord = orders.find(o => String(o.id) === String(orderId));
    if (!ord) return;

    if (!currentCourier || currentCourier.status !== 'Approved') {
        showToast("Ruxsatingiz tasdiqlanmagan!");
        checkCourierAuth();
        return;
    }

    ord.status = newStatus;
    ord.courierName = currentCourier.name;
    ord.courierPhone = currentCourier.phone;
    delete ord.isNewHighlight;
    saveOrders();
    renderOrders();
    updateStats();

    fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            status: newStatus,
            courierName: currentCourier.name,
            courierPhone: currentCourier.phone
        })
    }).catch(e => console.warn("Backend status update error:", e));

    showToast(`Buyurtma #${orderId} holati: ${newStatus}`);
}

function cancelAndRemoveOrder(orderId) {
    updateOrderStatus(orderId, 'Bekor qilindi');
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
                <p>Hozircha ${currentFilter === 'all' ? '' : currentFilter.toLowerCase()} buyurtmalar yo'q</p>
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
            ${ord.courierName ? `<div style="font-size:12px;color:#60a5fa;font-weight:700;margin-top:4px;"><i class="fa-solid fa-motorcycle"></i> Kuryer: ${ord.courierName} (${ord.courierPhone || ''})</div>` : ''}

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

                ${ord.status === 'Bekor qilindi' ? `
                    <div style="font-size:12px;color:var(--danger-color);font-weight:700;width:100%;text-align:center;padding:4px;">
                        <i class="fa-solid fa-circle-xmark"></i> Buyurtma bekor qilingan (Qabul qilinmadi)
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
