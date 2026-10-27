// APP CONFIGURATION
const API_BASE_URL = window.location.origin.includes('http') ? window.location.origin : "https://tasanno-im7q.onrender.com";
const BOT_TOKEN = "8394907443:AAGOJEcA7SLdfG8MEMP_3fNPeWOD8wqPmHo";
const ADMIN_PIN = "7777";
const ADMIN_CHAT_ID = ""; // Buyurtmalar keladigan Admin Telegram ID (ixtiyoriy)

// INITIAL SAMPLE DATA
const DEFAULT_PRODUCTS = [
    {
        id: "1",
        title: "iPhone 15 Pro Max 256GB",
        price: 15400000,
        category: "Smartfonlar",
        image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&q=80",
        description: "Titan korpus, A17 Pro chip va Super Retina XDR ekran. Yuqori sifat va tezkor ishlash kafolati."
    },
    {
        id: "2",
        title: "Samsung Galaxy S24 Ultra",
        price: 14200000,
        category: "Smartfonlar",
        image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&q=80",
        description: "Galaxy AI imkoniyatlari, 200MP kamera va o'rnatilgan S-Pen stilus."
    },
    {
        id: "3",
        title: "Erkaklar uchun Zamonaviy Xudi (Hoodie)",
        price: 350000,
        category: "Kiyimlar",
        image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400&q=80",
        description: "Yuqori sifatli 100% paxtadan tayyorlangan issiq xudi. Har kungi kiyishga juda qulay."
    },
    {
        id: "4",
        title: "AirPods Pro 2 Gen (USB-C)",
        price: 2800000,
        category: "Aksessuarlar",
        image: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&q=80",
        description: "Aktiv shovqinni so'ndirish (ANC) va shaffoflik rejimi. MagSafe keysi bilan."
    }
];

// STATE MANAGEMENT
let products = [];
let cart = [];
let currentUser = null;
let currentCategory = 'Barchasi';
let searchQuery = '';
let selectedAvatar = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
let isAdminLoggedIn = false;
let currentDetailProduct = null;
let selectedInstallmentMonths = 3;
let cartPaymentType = 'cash'; // 'cash' or 'installment'
let cartInstallmentMonths = 3;

// DOM ELEMENTS
const splashScreen = document.getElementById('splashScreen');
const appContainer = document.getElementById('appContainer');
const productsGrid = document.getElementById('productsGrid');
const categoriesContainer = document.getElementById('categoriesContainer');
const searchInput = document.getElementById('searchInput');
const cartBtn = document.getElementById('cartBtn');
const cartBadge = document.getElementById('cartBadge');
const cartModal = document.getElementById('cartModal');
const closeCartBtn = document.getElementById('closeCartBtn');
const cartItemsContainer = document.getElementById('cartItemsContainer');
const cartEmptyState = document.getElementById('cartEmptyState');
const cartTotalPrice = document.getElementById('cartTotalPrice');
const submitOrderBtn = document.getElementById('submitOrderBtn');
const adminBtn = document.getElementById('adminBtn');
const adminBanner = document.getElementById('adminBanner');
const openAddProductModalBtn = document.getElementById('openAddProductModalBtn');
const logoutAdminBtn = document.getElementById('logoutAdminBtn');

// MODALS
const adminLoginModal = document.getElementById('adminLoginModal');
const closeAdminLoginBtn = document.getElementById('closeAdminLoginBtn');
const loginAdminSubmitBtn = document.getElementById('loginAdminSubmitBtn');
const adminPinInput = document.getElementById('adminPinInput');
const adminLoginError = document.getElementById('adminLoginError');

const productModal = document.getElementById('productModal');
const closeProductModalBtn = document.getElementById('closeProductModalBtn');
const saveProductBtn = document.getElementById('saveProductBtn');
const productModalTitle = document.getElementById('productModalTitle');
const editProductId = document.getElementById('editProductId');
const prodTitle = document.getElementById('prodTitle');
const prodPrice = document.getElementById('prodPrice');
const prodCategory = document.getElementById('prodCategory');
const prodImage = document.getElementById('prodImage');
const prodDesc = document.getElementById('prodDesc');

const authModal = document.getElementById('authModal');
const authNameInput = document.getElementById('authNameInput');
const authPhoneInput = document.getElementById('authPhoneInput');
const submitAuthBtn = document.getElementById('submitAuthBtn');

const userProfileBadge = document.getElementById('userProfileBadge');
const userHeaderAvatar = document.getElementById('userHeaderAvatar');
const userHeaderName = document.getElementById('userHeaderName');
const userHeaderId = document.getElementById('userHeaderId');

const userProfileModal = document.getElementById('userProfileModal');
const closeUserProfileBtn = document.getElementById('closeUserProfileBtn');
const profileModalAvatar = document.getElementById('profileModalAvatar');
const profileModalName = document.getElementById('profileModalName');
const profileModalId = document.getElementById('profileModalId');
const profileModalPhone = document.getElementById('profileModalPhone');
const profileModalOrdersCount = document.getElementById('profileModalOrdersCount');
const logoutUserBtn = document.getElementById('logoutUserBtn');

const productDetailModal = document.getElementById('productDetailModal');
const closeDetailModalBtn = document.getElementById('closeDetailModalBtn');
const detailProdImg = document.getElementById('detailProdImg');
const detailProdCategory = document.getElementById('detailProdCategory');
const detailProdTitle = document.getElementById('detailProdTitle');
const detailProdPrice = document.getElementById('detailProdPrice');
const detailProdDesc = document.getElementById('detailProdDesc');
const instPrice3 = document.getElementById('instPrice3');
const instPrice6 = document.getElementById('instPrice6');
const instPrice12 = document.getElementById('instPrice12');
const selectedInstMonthText = document.getElementById('selectedInstMonthText');
const selectedInstMonthlyPrice = document.getElementById('selectedInstMonthlyPrice');
const addCartCashBtn = document.getElementById('addCartCashBtn');
const addCartInstallmentBtn = document.getElementById('addCartInstallmentBtn');
const detailAdminActions = document.getElementById('detailAdminActions');
const detailEditBtn = document.getElementById('detailEditBtn');
const detailDeleteBtn = document.getElementById('detailDeleteBtn');

const orderSuccessModal = document.getElementById('orderSuccessModal');
const closeOrderSuccessBtn = document.getElementById('closeOrderSuccessBtn');
const successOrderNumberBadge = document.getElementById('successOrderNumberBadge');

const toast = document.getElementById('toast');

// INIT APP
function initApp() {
    initTelegramWebApp();
    loadStoredData();
    setupEventListeners();

    setTimeout(() => {
        if (splashScreen) {
            splashScreen.style.opacity = '0';
            splashScreen.style.visibility = 'hidden';
        }
        if (appContainer) appContainer.classList.remove('hidden');

        checkUserAuth();
    }, 600);

    renderCategories();
    renderProducts();
    updateCartUI();
    startRealtimeProductSync();
}

function initTelegramWebApp() {
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();

        document.body.classList.add('telegram-dark');

        if (tg.initDataUnsafe && tg.initDataUnsafe.user && !currentUser) {
            const tgUser = tg.initDataUnsafe.user;
            currentUser = {
                id: tgUser.id ? ('#ID-' + String(tgUser.id).slice(-6)) : generateUserId(),
                name: (tgUser.first_name + ' ' + (tgUser.last_name || '')).trim(),
                phone: 'Telegram Orqali',
                avatar: tgUser.photo_url || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
            };
            saveUser();
        }
    }
}

function generateUserId() {
    return '#ID-' + Math.floor(100000 + Math.random() * 900000);
}

function loadStoredData() {
    try {
        const savedProducts = localStorage.getItem('tasanno_products');
        if (savedProducts) {
            products = JSON.parse(savedProducts);
        } else {
            products = [...DEFAULT_PRODUCTS];
            saveProducts();
        }
    } catch (e) {
        products = [...DEFAULT_PRODUCTS];
    }

    try {
        const savedCart = localStorage.getItem('tasanno_cart');
        if (savedCart) cart = JSON.parse(savedCart);
    } catch (e) { cart = []; }

    try {
        const savedUser = localStorage.getItem('tasanno_user');
        if (savedUser) currentUser = JSON.parse(savedUser);
    } catch (e) { currentUser = null; }

    try {
        const savedAdmin = localStorage.getItem('tasanno_admin_logged');
        if (savedAdmin === 'true') isAdminLoggedIn = true;
    } catch (e) { isAdminLoggedIn = false; }
}

function saveProducts() {
    localStorage.setItem('tasanno_products', JSON.stringify(products));
}

function saveCart() {
    localStorage.setItem('tasanno_cart', JSON.stringify(cart));
}

function saveUser() {
    localStorage.setItem('tasanno_user', JSON.stringify(currentUser));
    if (currentUser) {
        fetch(`${API_BASE_URL}/api/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentUser)
        }).catch(e => console.warn("Backend user registration error:", e));
    }
}

let previousProductsHash = "";

async function syncProductsFromBackend() {
    try {
        const resp = await fetch(`${API_BASE_URL}/api/products`, { cache: 'no-cache' });
        if (!resp.ok) return;
        const backendProducts = await resp.json();
        if (Array.isArray(backendProducts) && backendProducts.length > 0) {
            const currentHash = JSON.stringify(backendProducts);
            if (currentHash !== previousProductsHash) {
                previousProductsHash = currentHash;
                products = backendProducts;
                saveProducts();
                renderCategories();
                renderProducts();
            }
        }
    } catch (e) {}
}

function startRealtimeProductSync() {
    syncProductsFromBackend();
    setInterval(syncProductsFromBackend, 2000);
}

function checkUserAuth() {
    if (!currentUser) {
        if (authModal) authModal.classList.remove('hidden');
        if (userHeaderName) userHeaderName.textContent = 'Kiring';
        if (userHeaderId) userHeaderId.textContent = '#ID-...';
        if (userHeaderAvatar) userHeaderAvatar.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
    } else {
        if (authModal) authModal.classList.add('hidden');
        if (userHeaderName) userHeaderName.textContent = currentUser.name || 'Mijoz';
        if (userHeaderId) userHeaderId.textContent = currentUser.id || '#ID-000000';
        if (userHeaderAvatar) userHeaderAvatar.src = currentUser.avatar || selectedAvatar;

        const custName = document.getElementById('customerName');
        const custPhone = document.getElementById('customerPhone');
        if (custName) custName.value = currentUser.name || '';
        if (custPhone && currentUser.phone && !currentUser.phone.includes('Telegram')) {
            custPhone.value = currentUser.phone;
        }

        saveUser();
    }
}

function setupEventListeners() {
    searchInput?.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderProducts();
    });

    cartBtn?.addEventListener('click', () => {
        if (cartModal) cartModal.classList.remove('hidden');
    });

    closeCartBtn?.addEventListener('click', () => {
        if (cartModal) cartModal.classList.add('hidden');
    });

    adminBtn?.addEventListener('click', () => {
        if (isAdminLoggedIn) {
            showToast("Siz allaqachon Adminsiz!");
        } else if (adminLoginModal) {
            adminLoginModal.classList.remove('hidden');
            if (adminPinInput) adminPinInput.value = '';
            if (adminLoginError) adminLoginError.classList.add('hidden');
        }
    });

    closeAdminLoginBtn?.addEventListener('click', () => {
        if (adminLoginModal) adminLoginModal.classList.add('hidden');
    });

    loginAdminSubmitBtn?.addEventListener('click', handleAdminLogin);
    adminPinInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAdminLogin();
    });

    logoutAdminBtn?.addEventListener('click', () => {
        isAdminLoggedIn = false;
        localStorage.removeItem('tasanno_admin_logged');
        updateAdminUI();
        showToast("Admin rejimidan chiqildi");
    });

    openAddProductModalBtn?.addEventListener('click', () => {
        openProductModalForAdd();
    });

    closeProductModalBtn?.addEventListener('click', () => {
        if (productModal) productModal.classList.add('hidden');
    });

    saveProductBtn?.addEventListener('click', handleSaveProduct);

    document.querySelectorAll('.avatar-option').forEach(img => {
        img.addEventListener('click', () => {
            document.querySelectorAll('.avatar-option').forEach(a => a.classList.remove('selected'));
            img.classList.add('selected');
            selectedAvatar = img.getAttribute('data-avatar');
        });
    });

    submitAuthBtn?.addEventListener('click', handleUserSubmitAuth);

    userProfileBadge?.addEventListener('click', () => {
        if (!currentUser) {
            checkUserAuth();
        } else {
            openUserProfileModal();
        }
    });

    closeUserProfileBtn?.addEventListener('click', () => {
        if (userProfileModal) userProfileModal.classList.add('hidden');
    });

    logoutUserBtn?.addEventListener('click', () => {
        if (confirm("Rostdan ham profildan chiqib, boshqa telefon raqami bilan kirmoqchisiz?")) {
            currentUser = null;
            localStorage.removeItem('tasanno_user');
            if (userProfileModal) userProfileModal.classList.add('hidden');
            checkUserAuth();
            showToast("Profildan chiqildi");
        }
    });

    closeDetailModalBtn?.addEventListener('click', () => {
        if (productDetailModal) productDetailModal.classList.add('hidden');
    });

    document.querySelectorAll('.installment-options .installment-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.installment-options .installment-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedInstallmentMonths = parseInt(btn.getAttribute('data-months'));
            updateInstallmentCalculator();
        });
    });

    addCartCashBtn?.addEventListener('click', () => {
        if (currentDetailProduct) {
            addToCart(currentDetailProduct.id, 1, 'cash');
            if (productDetailModal) productDetailModal.classList.add('hidden');
            if (cartModal) cartModal.classList.remove('hidden');
        }
    });

    addCartInstallmentBtn?.addEventListener('click', () => {
        if (currentDetailProduct) {
            addToCart(currentDetailProduct.id, 1, 'installment', selectedInstallmentMonths);
            if (productDetailModal) productDetailModal.classList.add('hidden');
            if (cartModal) cartModal.classList.remove('hidden');
        }
    });

    detailEditBtn?.addEventListener('click', () => {
        if (currentDetailProduct) {
            if (productDetailModal) productDetailModal.classList.add('hidden');
            openProductModalForEdit(currentDetailProduct.id);
        }
    });

    detailDeleteBtn?.addEventListener('click', () => {
        if (currentDetailProduct && confirm("Rostdan ham ushbu mahsulotni o'chirmoqchisiz?")) {
            deleteProduct(currentDetailProduct.id);
            if (productDetailModal) productDetailModal.classList.add('hidden');
        }
    });

    submitOrderBtn?.addEventListener('click', handleOrderSubmission);

    closeOrderSuccessBtn?.addEventListener('click', () => {
        if (orderSuccessModal) orderSuccessModal.classList.add('hidden');
    });

    updateAdminUI();
}

function handleUserSubmitAuth() {
    const name = authNameInput ? authNameInput.value.trim() : '';
    const phone = authPhoneInput ? authPhoneInput.value.trim() : '';

    if (!name) {
        showToast("Iltimos, ismingizni kiriting!");
        return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 9) {
        showToast("Iltimos, to'liq telefon raqamingizni kiriting!");
        return;
    }

    const formattedPhone = phone.startsWith('+') ? phone : ('+998 ' + phone);

    currentUser = {
        id: generateUserId(),
        name: name,
        phone: formattedPhone,
        avatar: selectedAvatar
    };

    saveUser();
    checkUserAuth();
    showToast(`Xush kelibsiz, ${name}!`);
}

function openUserProfileModal() {
    if (!currentUser || !userProfileModal) return;

    if (profileModalAvatar) profileModalAvatar.src = currentUser.avatar || selectedAvatar;
    if (profileModalName) profileModalName.textContent = currentUser.name || 'Mijoz';
    if (profileModalId) profileModalId.textContent = `Mijoz ID: ${currentUser.id || '#ID-000000'}`;
    if (profileModalPhone) profileModalPhone.textContent = currentUser.phone || 'Kiritilmagan';

    let ordersCount = 0;
    try {
        const savedOrders = localStorage.getItem('tasanno_orders');
        if (savedOrders) {
            const ords = JSON.parse(savedOrders);
            ordersCount = ords.filter(o => o.phone === currentUser.phone || o.userId === currentUser.id).length;
        }
    } catch(e){}

    if (profileModalOrdersCount) profileModalOrdersCount.textContent = `${ordersCount} ta buyurtma`;

    userProfileModal.classList.remove('hidden');
}

function handleAdminLogin() {
    const pin = adminPinInput ? adminPinInput.value : '';
    if (pin === ADMIN_PIN) {
        isAdminLoggedIn = true;
        localStorage.setItem('tasanno_admin_logged', 'true');
        if (adminLoginModal) adminLoginModal.classList.add('hidden');
        updateAdminUI();
        showToast("Admin bo'lib tizimga kirdingiz!");
    } else {
        if (adminLoginError) adminLoginError.classList.remove('hidden');
    }
}

function updateAdminUI() {
    if (isAdminLoggedIn) {
        if (adminBanner) adminBanner.classList.remove('hidden');
    } else {
        if (adminBanner) adminBanner.classList.add('hidden');
    }
    renderProducts();
}

function renderCategories() {
    if (!categoriesContainer) return;
    categoriesContainer.innerHTML = '';

    const categoriesList = ['Barchasi', 'Smartfonlar', 'Kiyimlar', 'Aksessuarlar', 'Oziq-ovqat'];

    categoriesList.forEach(cat => {
        const chip = document.createElement('div');
        chip.className = `category-chip ${currentCategory === cat ? 'active' : ''}`;
        chip.textContent = cat;
        chip.addEventListener('click', () => {
            currentCategory = cat;
            renderCategories();
            renderProducts();
        });
        categoriesContainer.appendChild(chip);
    });
}

function renderProducts() {
    if (!productsGrid) return;
    productsGrid.innerHTML = '';

    const filtered = products.filter(prod => {
        const matchesCategory = (currentCategory === 'Barchasi') || (prod.category === currentCategory);
        const matchesSearch = prod.title.toLowerCase().includes(searchQuery) ||
                              (prod.description && prod.description.toLowerCase().includes(searchQuery));
        return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
        productsGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="fa-solid fa-box-open empty-icon"></i>
                <p>Mahsulotlar topilmadi</p>
            </div>
        `;
        return;
    }

    filtered.forEach(prod => {
        const card = document.createElement('div');
        card.className = 'product-card';

        card.innerHTML = `
            <div class="product-img-wrapper" onclick="openProductDetailModal('${prod.id}')" style="cursor:pointer;">
                <img src="${prod.image}" class="product-img" alt="${prod.title}" onerror="this.src='https://via.placeholder.com/300'">
                <span class="product-category-tag">${prod.category || 'Barchasi'}</span>
            </div>
            <div class="product-info">
                <h3 class="product-title" onclick="openProductDetailModal('${prod.id}')" style="cursor:pointer;">${prod.title}</h3>
                <div class="product-price">${formatPrice(prod.price)} so'm</div>
                <div class="product-actions">
                    <button class="btn-add-cart" onclick="openProductDetailModal('${prod.id}')">
                        <i class="fa-solid fa-eye"></i> Ko'rish / Olish
                    </button>
                    ${isAdminLoggedIn ? `
                        <button class="btn-admin-edit" onclick="openProductModalForEdit('${prod.id}')" title="Tahrirlash">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="btn-admin-del" onclick="deleteProduct('${prod.id}')" title="O'chirish">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;

        productsGrid.appendChild(card);
    });
}

function openProductDetailModal(id) {
    const prod = products.find(p => p.id === id);
    if (!prod) return;

    currentDetailProduct = prod;
    selectedInstallmentMonths = 3;

    if (detailProdImg) detailProdImg.src = prod.image;
    if (detailProdCategory) detailProdCategory.textContent = prod.category || 'Barchasi';
    if (detailProdTitle) detailProdTitle.textContent = prod.title;
    if (detailProdPrice) detailProdPrice.textContent = `${formatPrice(prod.price)} so'm`;
    if (detailProdDesc) detailProdDesc.textContent = prod.description || "Ushbu mahsulot do'konimizda mavjud. Qulay shartlarda xarid qilishingiz mumkin.";

    if (isAdminLoggedIn && detailAdminActions) {
        detailAdminActions.classList.remove('hidden');
    } else if (detailAdminActions) {
        detailAdminActions.classList.add('hidden');
    }

    document.querySelectorAll('.installment-options .installment-btn').forEach(b => {
        if (b.getAttribute('data-months') === '3') b.classList.add('active');
        else b.classList.remove('active');
    });

    updateInstallmentCalculator();

    if (productDetailModal) productDetailModal.classList.remove('hidden');
}

function updateInstallmentCalculator() {
    if (!currentDetailProduct) return;

    const price = currentDetailProduct.price;

    const monthly3 = Math.round(price / 3);
    const monthly6 = Math.round((price * 1.05) / 6);
    const monthly12 = Math.round((price * 1.12) / 12);

    if (instPrice3) instPrice3.textContent = `${formatPrice(monthly3)} so'm/oy`;
    if (instPrice6) instPrice6.textContent = `${formatPrice(monthly6)} so'm/oy`;
    if (instPrice12) instPrice12.textContent = `${formatPrice(monthly12)} so'm/oy`;

    let activeMonthly = monthly3;
    if (selectedInstallmentMonths === 6) activeMonthly = monthly6;
    if (selectedInstallmentMonths === 12) activeMonthly = monthly12;

    if (selectedInstMonthText) selectedInstMonthText.textContent = `${selectedInstallmentMonths} Oy`;
    if (selectedInstMonthlyPrice) selectedInstMonthlyPrice.textContent = `${formatPrice(activeMonthly)} so'm/oy`;
}

function addToCart(productId, quantity = 1, paymentType = 'cash', installmentMonths = 3) {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    const existingIndex = cart.findIndex(item => item.id === productId && item.paymentType === paymentType && item.installmentMonths === installmentMonths);

    if (existingIndex > -1) {
        cart[existingIndex].quantity += quantity;
    } else {
        cart.push({
            id: prod.id,
            title: prod.title,
            price: prod.price,
            image: prod.image,
            quantity: quantity,
            paymentType: paymentType,
            installmentMonths: installmentMonths
        });
    }

    saveCart();
    updateCartUI();
    showToast("Savatchaga qo'shildi!");
}

function updateCartUI() {
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartBadge) cartBadge.textContent = totalCount;

    if (!cartItemsContainer) return;
    cartItemsContainer.innerHTML = '';

    if (cart.length === 0) {
        if (cartEmptyState) cartEmptyState.classList.remove('hidden');
        if (cartTotalPrice) cartTotalPrice.textContent = "0 so'm";
        return;
    }

    if (cartEmptyState) cartEmptyState.classList.add('hidden');

    let totalSum = 0;

    cart.forEach(item => {
        let itemTotal = item.price * item.quantity;
        if (item.paymentType === 'installment') {
            if (item.installmentMonths === 6) itemTotal = Math.round((item.price * 1.05) * item.quantity);
            if (item.installmentMonths === 12) itemTotal = Math.round((item.price * 1.12) * item.quantity);
        }

        totalSum += itemTotal;

        const cartRow = document.createElement('div');
        cartRow.className = 'cart-item';

        const paymentTag = item.paymentType === 'installment'
            ? `<span style="font-size:10px; background:rgba(0,168,255,0.15); color:var(--primary-color); padding:2px 6px; border-radius:6px; font-weight:bold;">${item.installmentMonths} Oy Bo'lib to'lash</span>`
            : `<span style="font-size:10px; background:rgba(16,185,129,0.15); color:var(--success-color); padding:2px 6px; border-radius:6px; font-weight:bold;">Naqd</span>`;

        cartRow.innerHTML = `
            <img src="${item.image}" class="cart-item-img" alt="${item.title}">
            <div class="cart-item-details">
                <div class="cart-item-title">${item.title}</div>
                <div>${paymentTag}</div>
                <div class="cart-item-price">${formatPrice(item.price)} so'm</div>
            </div>
            <div class="cart-quantity-controls">
                <button class="qty-btn" onclick="changeCartQty('${item.id}', '${item.paymentType}', ${item.installmentMonths}, -1)">-</button>
                <span>${item.quantity}</span>
                <button class="qty-btn" onclick="changeCartQty('${item.id}', '${item.paymentType}', ${item.installmentMonths}, 1)">+</button>
            </div>
        `;

        cartItemsContainer.appendChild(cartRow);
    });

    if (cartTotalPrice) cartTotalPrice.textContent = `${formatPrice(totalSum)} so'm`;
    updateCartInstallmentCalculator();
}

function changeCartQty(id, paymentType, installmentMonths, delta) {
    const index = cart.findIndex(i => i.id === id && i.paymentType === paymentType && i.installmentMonths === installmentMonths);
    if (index === -1) return;

    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }

    saveCart();
    updateCartUI();
}

function selectCartPaymentType(type) {
    cartPaymentType = type;
    const cashBtn = document.getElementById('payCashTabBtn');
    const instBtn = document.getElementById('payInstallmentTabBtn');
    const instOptions = document.getElementById('cartInstallmentOptions');

    if (type === 'cash') {
        if (cashBtn) cashBtn.classList.add('active');
        if (instBtn) instBtn.classList.remove('active');
        if (instOptions) instOptions.classList.add('hidden');
    } else {
        if (cashBtn) cashBtn.classList.remove('active');
        if (instBtn) instBtn.classList.add('active');
        if (instOptions) instOptions.classList.remove('hidden');
        updateCartInstallmentCalculator();
    }
}

function selectCartInstallmentMonths(months) {
    cartInstallmentMonths = months;
    [3, 6, 12].forEach(m => {
        const btn = document.getElementById(`cartInstBtn${m}`);
        if (btn) {
            if (m === months) btn.classList.add('active');
            else btn.classList.remove('active');
        }
    });
    updateCartInstallmentCalculator();
}

function updateCartInstallmentCalculator() {
    let rawTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const m3 = Math.round(rawTotal / 3);
    const m6 = Math.round((rawTotal * 1.05) / 6);
    const m12 = Math.round((rawTotal * 1.12) / 12);

    const p3 = document.getElementById('cartInstPrice3');
    const p6 = document.getElementById('cartInstPrice6');
    const p12 = document.getElementById('cartInstPrice12');

    if (p3) p3.textContent = `${formatPrice(m3)} so'm/oy`;
    if (p6) p6.textContent = `${formatPrice(m6)} so'm/oy`;
    if (p12) p12.textContent = `${formatPrice(m12)} so'm/oy`;

    let activeMonthly = m3;
    if (cartInstallmentMonths === 6) activeMonthly = m6;
    if (cartInstallmentMonths === 12) activeMonthly = m12;

    const monthlyText = document.getElementById('cartMonthlyPaymentText');
    if (monthlyText) monthlyText.textContent = `${formatPrice(activeMonthly)} so'm / oy`;
}

function handleOrderSubmission() {
    if (!currentUser) {
        showToast("Iltimos, avval tizimga kiring!");
        checkUserAuth();
        return;
    }

    if (cart.length === 0) {
        showToast("Savatchangiz bo'sh!");
        return;
    }

    const nameInput = document.getElementById('customerName');
    const phoneInput = document.getElementById('customerPhone');
    const addressInput = document.getElementById('customerAddress');

    const name = nameInput ? nameInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const address = addressInput ? addressInput.value.trim() : '';

    if (!name || !phone) {
        showToast("Iltimos, Ismingiz va Telefoningizni kiriting!");
        return;
    }

    const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
    const orderDate = new Date().toLocaleString('uz-UZ');

    let calculatedTotal = 0;
    cart.forEach(item => {
        let itemTotal = item.price * item.quantity;
        if (item.paymentType === 'installment') {
            if (item.installmentMonths === 6) itemTotal = Math.round((item.price * 1.05) * item.quantity);
            if (item.installmentMonths === 12) itemTotal = Math.round((item.price * 1.12) * item.quantity);
        }
        calculatedTotal += itemTotal;
    });

    const paymentLabel = cartPaymentType === 'installment'
        ? `Bo'lib to'lash (${cartInstallmentMonths} Oy - 0% Boshlang'ich)`
        : "Naqd to'lov";

    const orderPayload = {
        id: orderId,
        userId: currentUser.id,
        name: name,
        phone: phone,
        address: address || "Manzil ko'rsatilmadi",
        items: cart,
        total: calculatedTotal,
        paymentType: paymentLabel,
        date: orderDate,
        status: 'Yangi'
    };

    saveOrderLocally(orderPayload);
    sendOrderToBackend(orderPayload);
    sendOrderToTelegramBot(orderPayload);

    cart = [];
    saveCart();
    updateCartUI();

    if (cartModal) cartModal.classList.add('hidden');

    if (successOrderNumberBadge) successOrderNumberBadge.textContent = `#${orderId}`;
    if (orderSuccessModal) orderSuccessModal.classList.remove('hidden');

    showToast("Buyurtmangiz muvaffaqiyatli qabul qilindi!");
}

function saveOrderLocally(newOrder) {
    try {
        let ordersList = [];
        const saved = localStorage.getItem('tasanno_orders');
        if (saved) ordersList = JSON.parse(saved);
        ordersList.unshift(newOrder);
        localStorage.setItem('tasanno_orders', JSON.stringify(ordersList));
    } catch (e) {
        console.error("Local order save error", e);
    }
}

function sendOrderToBackend(orderData) {
    fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
    })
    .then(res => res.json())
    .then(data => {
        console.log("Order synced to backend server:", data);
    })
    .catch(err => {
        console.warn("Backend server order sync failed (offline or network error):", err);
    });
}

function sendOrderToTelegramBot(orderData) {
    if (!BOT_TOKEN || BOT_TOKEN === "YOUR_BOT_TOKEN_HERE") return;

    let itemsText = (orderData.items || []).map(i => `• ${i.title} (${i.quantity}x) = ${formatPrice(i.price * i.quantity)} so'm`).join('\n');

    let text = `🛒 <b>YANGI BUYURTMA #${orderData.id}</b>\n\n`;
    text += `👤 <b>Mijoz:</b> ${orderData.name}\n`;
    text += `📞 <b>Tel:</b> ${orderData.phone}\n`;
    text += `📍 <b>Manzil/Izoh:</b> ${orderData.address}\n`;
    text += `💳 <b>To'lov turi:</b> ${orderData.paymentType}\n\n`;
    text += `📦 <b>Mahsulotlar:</b>\n${itemsText}\n\n`;
    text += `💰 <b>Jami summa:</b> ${formatPrice(orderData.total)} so'm\n`;
    text += `📅 <b>Vaqti:</b> ${orderData.date}`;

    if (ADMIN_CHAT_ID) {
        fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: ADMIN_CHAT_ID,
                text: text,
                parse_mode: 'HTML'
            })
        }).catch(e => console.warn("Telegram bot notify error", e));
    }
}

function openProductModalForAdd() {
    if (!productModal) return;

    currentAppUploadedImageBase64 = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80";
    const preview = document.getElementById('appUploadedImagePreview');
    if (preview) preview.style.display = 'none';

    if (editProductId) editProductId.value = '';
    if (prodTitle) prodTitle.value = '';
    if (prodPrice) prodPrice.value = '';
    if (prodCategory) prodCategory.value = 'Smartfonlar';
    if (prodDesc) prodDesc.value = '';
    if (productModalTitle) productModalTitle.innerHTML = '<i class="fa-solid fa-plus-circle"></i> Yangi Mahsulot Qo\'shish';

    productModal.classList.remove('hidden');
}

let currentAppUploadedImageBase64 = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80";

function previewAppUploadedImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 600;
                const MAX_HEIGHT = 600;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                currentAppUploadedImageBase64 = canvas.toDataURL('image/jpeg', 0.8);

                const previewImg = document.getElementById('appUploadedImagePreview');
                if (previewImg) {
                    previewImg.src = currentAppUploadedImageBase64;
                    previewImg.style.display = 'block';
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function openProductModalForEdit(id) {
    openEditProductModal(id);
}

function openEditProductModal(productId) {
    const p = products.find(item => item.id === productId);
    if (!p) return;

    document.getElementById('editProductId').value = p.id;
    document.getElementById('prodTitle').value = p.title;
    document.getElementById('prodPrice').value = p.price;
    document.getElementById('prodCategory').value = p.category;
    document.getElementById('prodDesc').value = p.description || '';
    currentAppUploadedImageBase64 = p.image;
    const previewImg = document.getElementById('appUploadedImagePreview');
    if (previewImg) {
        previewImg.src = currentAppUploadedImageBase64;
        previewImg.style.display = 'block';
    }

    const titleElem = document.getElementById('productModalTitle');
    if (titleElem) {
        titleElem.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Mahsulotni Tahrirlash';
    }

    productModal.classList.remove('hidden');
}

function handleSaveProduct() {
    const editId = document.getElementById('editProductId').value.trim();
    const title = document.getElementById('prodTitle').value.trim();
    const price = parseFloat(document.getElementById('prodPrice').value);
    const category = document.getElementById('prodCategory').value;
    const image = currentAppUploadedImageBase64 || 'https://via.placeholder.com/300';
    const description = document.getElementById('prodDesc').value.trim();

    if (!title || isNaN(price)) {
        showToast("Iltimos, barcha zarur maydonlarni to'ldiring!");
        return;
    }

    if (editId) {
        const idx = products.findIndex(p => p.id === editId);
        if (idx !== -1) {
            products[idx] = {
                ...products[idx],
                title,
                price,
                category,
                image,
                description
            };
            saveProducts();
            showToast("Mahsulot ma'lumotlari yangilandi!");

            fetch(`${API_BASE_URL}/api/products/${editId}`, { method: 'DELETE' }).catch(e => {});
            fetch(`${API_BASE_URL}/api/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(products[idx])
            }).catch(e => {});
        }
    } else {
        const newProd = {
            id: Date.now().toString(),
            title,
            price,
            category,
            image,
            description
        };
        products.unshift(newProd);
        saveProducts();
        showToast("Yangi mahsulot rasm bilan qo'shildi!");

        fetch(`${API_BASE_URL}/api/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProd)
        }).catch(e => {});
    }

    if (productModal) productModal.classList.add('hidden');
    renderCategories();
    renderProducts();
}

function deleteProduct(id) {
    if (confirm("Rostdan ham ushbu mahsulotni o'chirmoqchisiz?")) {
        products = products.filter(p => p.id !== id);
        saveProducts();
        renderCategories();
        renderProducts();
        showToast("Mahsulot o'chirildi");

        fetch(`${API_BASE_URL}/api/products/${id}`, {
            method: 'DELETE'
        }).catch(e => console.warn("Backend product delete error", e));
    }
}

function formatPrice(p) {
    return (parseFloat(p) || 0).toLocaleString('fr-FR');
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
