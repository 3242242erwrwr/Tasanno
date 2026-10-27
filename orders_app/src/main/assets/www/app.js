// TASANNO ZAKAZLAR - REAL-TIME ORDER RECEIVER & CHAT
const API_BASE_URL = "https://tasanno-im7q.onrender.com";

let orders = [];
let chatMessages = [];
let currentFilter = 'all';
let isSoundEnabled = true;
let isChatModalOpen = false;
let expandedOrderIds = new Set();

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
    const courierBlockedModal = document.getElementById('courierBlockedModal');
    const appContainer = document.getElementById('appContainer');

    if (!currentCourier) {
        if (courierAuthModal) courierAuthModal.classList.remove('hidden');
        if (courierWaitingModal) courierWaitingModal.classList.add('hidden');
        if (courierBlockedModal) courierBlockedModal.classList.add('hidden');
        if (appContainer) appContainer.classList.add('hidden');
        return false;
    }

    // Always Ping Courier to Server so Courier Count updates live!
    fetch(`${API_BASE_URL}/api/couriers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentCourier)
    }).catch(e => {});

    if (currentCourier.status === 'Blocked') {
        if (courierAuthModal) courierAuthModal.classList.add('hidden');
        if (courierWaitingModal) courierWaitingModal.classList.add('hidden');
        if (appContainer) appContainer.classList.add('hidden');
        if (courierBlockedModal) courierBlockedModal.classList.remove('hidden');
        startCourierStatusPolling();
        return false;
    }

    if (currentCourier.status !== 'Approved') {
        if (courierAuthModal) courierAuthModal.classList.add('hidden');
        if (courierBlockedModal) courierBlockedModal.classList.add('hidden');
        if (appContainer) appContainer.classList.add('hidden');
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

    // Fully Approved!
    if (courierAuthModal) courierAuthModal.classList.add('hidden');
    if (courierWaitingModal) courierWaitingModal.classList.add('hidden');
    if (courierBlockedModal) courierBlockedModal.classList.add('hidden');
    if (appContainer) appContainer.classList.remove('hidden');
    if (courierPollInterval) {
        clearInterval(courierPollInterval);
        courierPollInterval = null;
    }
    return true;
}

function startCourierStatusPolling() {
    if (courierPollInterval) clearInterval(courierPollInterval);
    courierPollInterval = setInterval(async () => {
        if (!currentCourier) return;
        try {
            const cleanPhone = currentCourier.phone ? currentCourier.phone.replace(/\D/g, '') : '';
            const searchId = cleanPhone || currentCourier.id;
            const res = await fetch(`${API_BASE_URL}/api/couriers/${encodeURIComponent(searchId)}/status`);
            if (res.ok) {
                const data = await res.json();
                if (data.status === 'Approved') {
                    currentCourier.status = 'Approved';
                    localStorage.setItem('currentCourier', JSON.stringify(currentCourier));
                    if (courierPollInterval) {
                        clearInterval(courierPollInterval);
                        courierPollInterval = null;
                    }
                    checkCourierAuth();
                    showToast("✅ Admin ruxsat berdi! Xush kelibsiz!");
                    renderOrders();
                } else if (data.status === 'Blocked') {
                    currentCourier.status = 'Blocked';
                    localStorage.setItem('currentCourier', JSON.stringify(currentCourier));
                    checkCourierAuth();
                } else if (data.status === 'Rejected') {
                    alert("Admin sizning ruxsat so'rovingizni rad etdi.");
                    localStorage.removeItem('currentCourier');
                    currentCourier = null;
                    if (courierPollInterval) {
                        clearInterval(courierPollInterval);
                        courierPollInterval = null;
                    }
                    checkCourierAuth();
                }
            }
        } catch(e){}
    }, 1000);
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

    const courierId = 'COUR-' + Math.floor(100000 + Math.random() * 900000);
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
        syncChatMessages();
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

    const logoutCourierBtn = document.getElementById('logoutCourierBtn');
    if (logoutCourierBtn) {
        logoutCourierBtn.addEventListener('click', handleCourierLogout);
    }

    document.getElementById('openChatBtn')?.addEventListener('click', openChatModal);
    document.getElementById('closeChatModalBtn')?.addEventListener('click', closeChatModal);
    document.getElementById('sendChatBtn')?.addEventListener('click', sendChatMessage);
    document.getElementById('chatInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });
}

function handleCourierLogout() {
    if (confirm("Rostdan ham kuryer profildan chiqmoqchisiz?")) {
        localStorage.removeItem('currentCourier');
        currentCourier = null;
        if (courierPollInterval) clearInterval(courierPollInterval);
        document.getElementById('courierWaitingModal')?.classList.add('hidden');
        document.getElementById('courierAuthModal')?.classList.remove('hidden');
        const nameIn = document.getElementById('courierNameInput');
        const phoneIn = document.getElementById('courierPhoneInput');
        if (nameIn) nameIn.value = '';
        if (phoneIn) phoneIn.value = '';
        showToast("Kuryer profildan chiqildi");
    }
}

function openChatModal() {
    isChatModalOpen = true;
    const modal = document.getElementById('courierChatModal');
    const badge = document.getElementById('unreadChatBadge');
    if (modal) modal.classList.remove('hidden');
    if (badge) badge.style.display = 'none';
    syncChatMessages();
}

function closeChatModal() {
    isChatModalOpen = false;
    const modal = document.getElementById('courierChatModal');
    if (modal) modal.classList.add('hidden');
}

async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const text = input ? input.value.trim() : '';
    if (!text) return;

    if (!currentCourier) {
        showToast("Avval kuryer profili kiritilmagan!");
        return;
    }

    input.value = '';

    try {
        const res = await fetch(`${API_BASE_URL}/api/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sender: 'Courier',
                courierName: currentCourier.name,
                courierPhone: currentCourier.phone,
                text: text
            })
        });

        if (res.ok) {
            syncChatMessages();
        }
    } catch (e) {
        console.warn("Chat message send error:", e);
    }
}

let previousMessagesHash = "";

async function syncChatMessages() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/messages`, { cache: 'no-cache' });
        if (!res.ok) return;
        const allMsgs = await res.json();
        if (!Array.isArray(allMsgs)) return;

        const cPhone = currentCourier ? (currentCourier.phone || '').replace(/\D/g, '') : '';
        const myMsgs = allMsgs.filter(m => {
            if (!m.courierPhone) return true;
            return m.courierPhone.replace(/\D/g, '') === cPhone || m.courierName === (currentCourier ? currentCourier.name : '');
        });

        const currentHash = JSON.stringify(myMsgs);
        if (currentHash !== previousMessagesHash) {
            if (previousMessagesHash !== "" && myMsgs.length > chatMessages.length) {
                const lastMsg = myMsgs[myMsgs.length - 1];
                if (lastMsg.sender === 'Admin') {
                    playOrderChime();
                    showToast("💬 Admindan yangi xabar!");
                    if (!isChatModalOpen) {
                        const badge = document.getElementById('unreadChatBadge');
                        if (badge) {
                            badge.textContent = '!';
                            badge.style.display = 'flex';
                        }
                    }
                }
            }
            previousMessagesHash = currentHash;
            chatMessages = myMsgs;
            renderChatMessages();
        }
    } catch (e) {}
}

function renderChatMessages() {
    const box = document.getElementById('chatMessagesBox');
    if (!box) return;
    box.innerHTML = '';

    if (chatMessages.length === 0) {
        box.innerHTML = `
            <div style="text-align:center; padding:40px 20px; color:#94a3b8; font-size:13px;">
                <i class="fa-solid fa-comments" style="font-size:36px; margin-bottom:10px; color:#3b82f6;"></i>
                <p>Adminga biror savol yoki xabaringiz bo'lsa, bu yerga yozing!</p>
            </div>
        `;
        return;
    }

    chatMessages.forEach(m => {
        const isMe = m.sender === 'Courier';
        const msgDiv = document.createElement('div');
        msgDiv.style.display = 'flex';
        msgDiv.style.flexDirection = 'column';
        msgDiv.style.alignItems = isMe ? 'flex-end' : 'flex-start';

        msgDiv.innerHTML = `
            <div style="font-size:10px; color:#94a3b8; margin-bottom:2px; font-weight:600;">
                ${isMe ? 'Siz' : '🛡 Bosh Admin'} • ${m.timestamp || ''}
            </div>
            <div style="max-width:80%; padding:10px 14px; border-radius:${isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px'}; background:${isMe ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : '#1e293b'}; color:white; font-size:14px; line-height:1.4; border:1px solid ${isMe ? '#3b82f6' : '#334155'}; box-shadow:0 2px 8px rgba(0,0,0,0.2);">
                ${m.text}
            </div>
        `;
        box.appendChild(msgDiv);
    });

    box.scrollTop = box.scrollHeight;
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
    syncChatMessages();
    setInterval(() => {
        syncOrdersFromBackend(false);
        syncChatMessages();
    }, 1000);
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

function toggleOrderDetails(ordId, event) {
    if (event) event.stopPropagation();
    const idStr = String(ordId);
    if (expandedOrderIds.has(idStr)) {
        expandedOrderIds.delete(idStr);
    } else {
        expandedOrderIds.add(idStr);
    }
    renderOrders();
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
        const isExpanded = expandedOrderIds.has(String(ord.id));
        const card = document.createElement('div');
        const statusClass = (ord.status || 'Yangi').replace(/\s+/g, '-');
        card.className = `order-card ${ord.isNewHighlight ? 'new-order-highlight' : ''}`;
        card.style.cursor = 'pointer';
        card.onclick = (e) => toggleOrderDetails(ord.id, e);

        const itemsSummaryList = (ord.items || []).map(i => `• ${i.title} (${i.quantity}x)`).join(', ');
        const cleanPhone = (ord.phone || '').replace(/\s+/g, '').replace(/[^\d+]/g, '');

        const itemsHtml = (ord.items || []).map(item => `
            <div class="order-item-row">
                <span>• ${item.title} <strong>(${item.quantity} dona)</strong></span>
                <span>${formatPrice(item.price * item.quantity)} so'm</span>
            </div>
        `).join('');

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span class="status-badge status-${statusClass}">${ord.status || 'Yangi'}</span>
                <span style="font-size:11px; color:#94a3b8;"><i class="fa-regular fa-clock"></i> ${ord.date || ''}</span>
            </div>

            <!-- 1. MANZIL -->
            <div style="font-size:15px; font-weight:800; color:white; margin-bottom:6px; display:flex; align-items:flex-start; gap:8px;">
                <i class="fa-solid fa-location-dot" style="color:#3b82f6; margin-top:3px; font-size:16px;"></i>
                <span>${ord.address || 'Manzil ko\'rsatilmadi'}</span>
            </div>

            <!-- 2. NIMALIGI (Mahsulotlar nomlari) -->
            <div style="font-size:13px; color:#60a5fa; font-weight:600; margin-bottom:10px; display:flex; align-items:center; gap:8px;">
                <i class="fa-solid fa-box" style="color:#60a5fa;"></i>
                <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${itemsSummaryList || 'Mahsulotlar'}</span>
            </div>

            <div style="text-align:center; font-size:11px; color:#94a3b8; font-weight:700; padding-top:6px; border-top:1px dashed #334155;">
                <i class="fa-solid ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}"></i> ${isExpanded ? 'Yopish' : 'Tafsilotlar va Tugmalarni Ko\'rish'}
            </div>

            ${isExpanded ? `
                <div style="margin-top:12px; padding-top:12px; border-top:1px solid #334155;" onclick="event.stopPropagation()">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; font-size:13px;">
                        <span style="color:#60a5fa; font-weight:800;">#${ord.id}</span>
                        <span style="color:#34d399; font-weight:800; font-size:16px;">${formatPrice(ord.total || 0)} so'm</span>
                    </div>

                    <div class="customer-box" style="margin-bottom:10px;">
                        <div class="customer-details">
                            <span class="customer-name"><i class="fa-solid fa-user"></i> ${ord.name || 'Mijoz'}</span>
                            <span class="customer-phone"><i class="fa-solid fa-phone"></i> ${ord.phone || 'Kiritilmagan'}</span>
                        </div>
                        ${cleanPhone ? `<a href="tel:${cleanPhone}" class="call-btn"><i class="fa-solid fa-phone"></i> Qo'ng'iroq</a>` : ''}
                    </div>

                    <div class="order-items-list" style="margin-bottom:10px;">
                        ${itemsHtml}
                    </div>

                    <div style="font-size:12px; color:#fbbf24; font-weight:700; margin-bottom:10px;">
                        <i class="fa-solid fa-credit-card"></i> ${ord.paymentType || "Naqd to'lov"}
                    </div>

                    ${ord.courierName ? `<div style="font-size:12px;color:#60a5fa;font-weight:700;margin-bottom:10px;"><i class="fa-solid fa-motorcycle"></i> Kuryer: ${ord.courierName} (${ord.courierPhone || ''})</div>` : ''}

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
                                <i class="fa-solid fa-circle-xmark"></i> Buyurtma bekor qilingan
                            </div>
                        ` : ''}
                    </div>
                </div>
            ` : ''}
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
