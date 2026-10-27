// APP CONFIGURATION
const API_BASE_URL = "https://tasanno-im7q.onrender.com";
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
        description: "Yuqori sifatli 100% paxtadan tayyorlangan zamonaviy va issiq xudi."
    },
    {
        id: "4",
        title: "AirPods Pro 2 Gen",
        price: 2800000,
        category: "Aksessuarlar",
        image: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&q=80",
        description: "Aktiv shovqinni so'ndirish (ANC) va shaffoflik rejimiga ega quloqchinlar."
    },
    {
        id: "5",
        title: "Smart Soat Apple Watch Series 9",
        price: 5200000,
        category: "Aksessuarlar",
        image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&q=80",
        description: "Salomatlik va sport ko'rsatkichlarini ancha aniq kuzatuvchi aqlli soat."
    },
    {
        id: "6",
        title: "Tabiiy Premium Asal (1 kg)",
        price: 120000,
        category: "Oziq-ovqat",
        image: "https://images.unsplash.com/photo-1587049352847-4a222e784d38?w=400&q=80",
        description: "Tog' giyohlaridan yig'ilgan 100% toza tabiiy va shifobaxsh asal."
    }
];

// STATE MANAGEMENT
let products = DEFAULT_PRODUCTS;
try {
    const savedProds = localStorage.getItem('products');
    if (savedProds) products = JSON.parse(savedProds);
} catch (e) {
    products = DEFAULT_PRODUCTS;
}

let currentUser = null;
try {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) currentUser = JSON.parse(savedUser);
} catch (e) {
    currentUser = null;
}

// USER-ISOLATED CART STORAGE KEY
function getCartStorageKey() {
    if (currentUser && currentUser.phone) {
        const cleanPhone = currentUser.phone.replace(/\D/g, '');
        return 'cart_' + (cleanPhone || currentUser.id);
    } else if (currentUser && currentUser.id) {
        return 'cart_' + currentUser.id;
    }
    return 'cart_guest';
}

let cart = [];
function loadCartForCurrentUser() {
    try {
        const key = getCartStorageKey();
        const savedCart = localStorage.getItem(key);
        cart = savedCart ? JSON.parse(savedCart) : [];
    } catch (e) {
        cart = [];
    }
    if (typeof updateCartUI === 'function') {
        updateCartUI();
    }
}
// loadCartForCurrentUser(); -- DOM tayyor bo'lganda initApp() ichida chaqiriladi

let orders = [];
try {
    const savedOrders = localStorage.getItem('orders');
    if (savedOrders) orders = JSON.parse(savedOrders);
} catch (e) {
    orders = [];
}

let selectedCategory = 'Barchasi';
let searchQuery = '';
let isAdminLoggedIn = false;
let selectedDetailProduct = null;
let selectedInstallmentMonths = 3;
let selectedAvatarUrl = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
let cartPaymentType = 'cash'; // 'cash' or 'installment'
let cartInstallmentMonths = 3; // 3, 6, 12

// TELEGRAM WEB APP INIT
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.expand();
    if (tg.colorScheme === 'dark') {
        document.body.classList.add('telegram-dark');
    }
}

// DOM ELEMENTS
let splashScreen, appContainer, productsGrid, categoriesContainer, searchInput,
    cartBtn, cartBadge, cartModal, closeCartBtn, cartItemsContainer,
    cartEmptyState, cartFooter, cartTotalPrice, submitOrderBtn, customerName,
    customerPhone, customerAddress, userProfileBadge, userHeaderAvatar, userHeaderName,
    userHeaderId, authModal, authNameInput, authPhoneInput, submitAuthBtn,
    userProfileModal, closeUserProfileBtn, profileModalAvatar, profileModalName,
    profileModalId, profileModalPhone, profileModalOrdersCount, logoutUserBtn,
    productDetailModal, closeDetailModalBtn, detailProdImg, detailProdCategory,
    detailProdTitle, detailProdPrice, detailProdDesc, instPrice3, instPrice6,
    instPrice12, selectedInstMonthText, selectedInstMonthlyPrice, addCartCashBtn,
    addCartInstallmentBtn, adminBtn, adminBanner, adminLoginModal, closeAdminLoginBtn,
    adminPinInput, loginAdminSubmitBtn, adminLoginError, openAddProductModalBtn,
    openOrdersBtn, logoutAdminBtn, productModal, closeProductModalBtn, saveProductBtn,
    ordersModal, closeOrdersBtn, ordersListContainer, ordersCountBadge, toast;

function bindDOMElements() {
    splashScreen = document.getElementById('splashScreen');
    appContainer = document.getElementById('appContainer');
    productsGrid = document.getElementById('productsGrid');
    categoriesContainer = document.getElementById('categoriesContainer');
    searchInput = document.getElementById('searchInput');
    cartBtn = document.getElementById('cartBtn');
    cartBadge = document.getElementById('cartBadge');
    cartModal = document.getElementById('cartModal');
    closeCartBtn = document.getElementById('closeCartBtn');
    cartItemsContainer = document.getElementById('cartItemsContainer');
    cartEmptyState = document.getElementById('cartEmptyState');
    cartFooter = document.getElementById('cartFooter');
    cartTotalPrice = document.getElementById('cartTotalPrice');
    submitOrderBtn = document.getElementById('submitOrderBtn');
    customerName = document.getElementById('customerName');
    customerPhone = document.getElementById('customerPhone');
    customerAddress = document.getElementById('customerAddress');

    userProfileBadge = document.getElementById('userProfileBadge');
    userHeaderAvatar = document.getElementById('userHeaderAvatar');
    userHeaderName = document.getElementById('userHeaderName');
    userHeaderId = document.getElementById('userHeaderId');
    authModal = document.getElementById('authModal');
    authNameInput = document.getElementById('authNameInput');
    authPhoneInput = document.getElementById('authPhoneInput');
    submitAuthBtn = document.getElementById('submitAuthBtn');
    userProfileModal = document.getElementById('userProfileModal');
    closeUserProfileBtn = document.getElementById('closeUserProfileBtn');
    profileModalAvatar = document.getElementById('profileModalAvatar');
    profileModalName = document.getElementById('profileModalName');
    profileModalId = document.getElementById('profileModalId');
    profileModalPhone = document.getElementById('profileModalPhone');
    profileModalOrdersCount = document.getElementById('profileModalOrdersCount');
    logoutUserBtn = document.getElementById('logoutUserBtn');

    productDetailModal = document.getElementById('productDetailModal');
    closeDetailModalBtn = document.getElementById('closeDetailModalBtn');
    detailProdImg = document.getElementById('detailProdImg');
    detailProdCategory = document.getElementById('detailProdCategory');
    detailProdTitle = document.getElementById('detailProdTitle');
    detailProdPrice = document.getElementById('detailProdPrice');
    detailProdDesc = document.getElementById('detailProdDesc');
    instPrice3 = document.getElementById('instPrice3');
    instPrice6 = document.getElementById('instPrice6');
    instPrice12 = document.getElementById('instPrice12');
    selectedInstMonthText = document.getElementById('selectedInstMonthText');
    selectedInstMonthlyPrice = document.getElementById('selectedInstMonthlyPrice');
    addCartCashBtn = document.getElementById('addCartCashBtn');
    addCartInstallmentBtn = document.getElementById('addCartInstallmentBtn');

    adminBtn = document.getElementById('adminBtn');
    adminBanner = document.getElementById('adminBanner');
    adminLoginModal = document.getElementById('adminLoginModal');
    closeAdminLoginBtn = document.getElementById('closeAdminLoginBtn');
    adminPinInput = document.getElementById('adminPinInput');
    loginAdminSubmitBtn = document.getElementById('loginAdminSubmitBtn');
    adminLoginError = document.getElementById('adminLoginError');
    openAddProductModalBtn = document.getElementById('openAddProductModalBtn');
    openOrdersBtn = document.getElementById('openOrdersBtn');
    logoutAdminBtn = document.getElementById('logoutAdminBtn');
    productModal = document.getElementById('productModal');
    closeProductModalBtn = document.getElementById('closeProductModalBtn');
    saveProductBtn = document.getElementById('saveProductBtn');
    ordersModal = document.getElementById('ordersModal');
    closeOrdersBtn = document.getElementById('closeOrdersBtn');
    ordersListContainer = document.getElementById('ordersListContainer');
    ordersCountBadge = document.getElementById('ordersCountBadge');
    toast = document.getElementById('toast');
}

// INIT APP
function initApp() {
    if (window._appInitialized) return;
    window._appInitialized = true;

    bindDOMElements();

    // Splash screen delay
    setTimeout(() => {
        if (splashScreen) {
            splashScreen.style.opacity = '0';
            splashScreen.style.display = 'none';
        }
        if (appContainer) appContainer.classList.remove('hidden');

        // Check User Login and Auto Ping Server
        const guestId = localStorage.getItem('guestDeviceId') || ('#ID-' + Math.floor(100000 + Math.random() * 900000));
        localStorage.setItem('guestDeviceId', guestId);

        if (currentUser) {
            updateUserHeaderUI();
            syncUserWithBackend(currentUser);
        } else {
            if (authModal) authModal.classList.remove('hidden');
            syncUserWithBackend({
                id: guestId,
                name: 'Yangi Tashrif Buyuruvchi',
                phone: 'Ilovani ochdi (Ochiq)',
                avatar: selectedAvatarUrl
            });
        }
    }, 600);

    renderCategories();
    renderProducts();
    loadCartForCurrentUser();
    updateOrdersCount();
    fetchBackendProducts();

    // Auto poll products every 2 seconds for instant sync with Web Control Panel
    setInterval(() => {
        fetchBackendProducts();
    }, 2000);
}

let previousProductsHash = "";

async function fetchBackendProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/products`, { cache: 'no-cache' });
        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data)) {
                const currentHash = JSON.stringify(data);
                if (currentHash !== previousProductsHash) {
                    previousProductsHash = currentHash;
                    products = data;
                    localStorage.setItem('products', JSON.stringify(products));
                    renderProducts();
                }
            }
        }
    } catch (e) {
        console.warn("Backend products fetch failed, using local cache:", e);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

document.addEventListener('DOMContentLoaded', () => {
    // Event Listeners
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderProducts();
    });

    cartBtn.addEventListener('click', () => cartModal.classList.remove('hidden'));
    closeCartBtn.addEventListener('click', () => cartModal.classList.add('hidden'));

    // USER AUTH & PROFILE LISTENERS
    userProfileBadge.addEventListener('click', () => {
        if (currentUser) {
            openUserProfileModal();
        } else {
            authModal.classList.remove('hidden');
        }
    });

    closeUserProfileBtn.addEventListener('click', () => userProfileModal.classList.add('hidden'));
    attachPhoneMask(authPhoneInput);
    attachPhoneMask(customerPhone);
    logoutUserBtn.addEventListener('click', handleUserLogout);
    submitAuthBtn.addEventListener('click', handleAuthSubmit);

    document.querySelectorAll('.avatar-option').forEach(img => {
        img.addEventListener('click', () => {
            document.querySelectorAll('.avatar-option').forEach(a => a.classList.remove('selected'));
            img.classList.add('selected');
            selectedAvatarUrl = img.getAttribute('data-avatar');
        });
    });

    // PRODUCT DETAIL LISTENERS
    closeDetailModalBtn.addEventListener('click', () => productDetailModal.classList.add('hidden'));

    document.querySelectorAll('.installment-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.installment-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedInstallmentMonths = parseInt(btn.getAttribute('data-months'));
            updateInstallmentSummary();
        });
    });

    addCartCashBtn.addEventListener('click', () => {
        if (!selectedDetailProduct) return;
        addToCart(selectedDetailProduct.id);
        productDetailModal.classList.add('hidden');
    });

    addCartInstallmentBtn.addEventListener('click', handleAddCartInstallment);

    // ADMIN LISTENERS
    adminBtn.addEventListener('click', () => {
        if (isAdminLoggedIn) {
            showToast('Siz allaqachon Admin rejimidasiz!');
        } else {
            adminLoginModal.classList.remove('hidden');
        }
    });

    closeAdminLoginBtn.addEventListener('click', () => adminLoginModal.classList.add('hidden'));
    loginAdminSubmitBtn.addEventListener('click', handleAdminLogin);
    adminPinInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAdminLogin();
    });

    logoutAdminBtn.addEventListener('click', () => {
        isAdminLoggedIn = false;
        adminBanner.classList.add('hidden');
        renderProducts();
        showToast('Admin rejimidan chiqildi');
    });

    openAddProductModalBtn.addEventListener('click', () => {
        document.getElementById('productForm').reset();
        document.getElementById('editProductId').value = '';
        document.getElementById('productModalTitle').innerHTML = '<i class="fa-solid fa-plus-circle"></i> Yangi Mahsulot';
        productModal.classList.remove('hidden');
    });

    closeProductModalBtn.addEventListener('click', () => productModal.classList.add('hidden'));
    saveProductBtn.addEventListener('click', handleSaveProduct);

    if (openOrdersBtn && ordersModal) {
        openOrdersBtn.addEventListener('click', () => {
            fetchBackendOrders();
            renderOrders();
            ordersModal.classList.remove('hidden');
        });
    }
    if (closeOrdersBtn && ordersModal) {
        closeOrdersBtn.addEventListener('click', () => ordersModal.classList.add('hidden'));
    }
    submitOrderBtn.addEventListener('click', handleSubmitOrder);
});

// USER AUTH FUNCTIONS
function updateUserHeaderUI() {
    if (!currentUser) return;
    userHeaderAvatar.src = currentUser.avatar;
    userHeaderName.textContent = currentUser.name;
    userHeaderId.textContent = currentUser.id;

    if (customerName) customerName.value = currentUser.name;
    if (customerPhone) customerPhone.value = currentUser.phone;
}


// UZBEKISTAN PHONE NUMBER VALIDATION & MASKING
const UZ_PHONE_PREFIXES = ['90', '91', '93', '94', '95', '97', '98', '99', '88', '33', '50', '55', '77', '71', '78'];

function cleanUzPhone(phoneStr) {
    if (!phoneStr) return '';
    let digits = phoneStr.replace(/\D/g, '');
    if (digits.startsWith('998')) {
        digits = digits.slice(3);
    }
    return digits.slice(0, 9);
}

function isValidUzPhone(phoneStr) {
    const digits = cleanUzPhone(phoneStr);
    if (digits.length !== 9) return false;
    const prefix = digits.slice(0, 2);
    return UZ_PHONE_PREFIXES.includes(prefix);
}

function formatUzPhone(digits) {
    if (!digits) return '+998 ';
    let res = '+998';
    if (digits.length > 0) res += ' (' + digits.slice(0, 2);
    if (digits.length >= 2) res += ') ' + digits.slice(2, 5);
    if (digits.length >= 5) res += '-' + digits.slice(5, 7);
    if (digits.length >= 7) res += '-' + digits.slice(7, 9);
    return res;
}

function attachPhoneMask(inputElement) {
    if (!inputElement) return;
    inputElement.addEventListener('input', (e) => {
        const digits = cleanUzPhone(e.target.value);
        e.target.value = formatUzPhone(digits);
    });
    inputElement.addEventListener('focus', (e) => {
        if (!e.target.value || e.target.value === '+998 ') {
            e.target.value = '+998 ';
        }
    });
}

function handleAuthSubmit() {
    const name = authNameInput.value.trim();
    const phone = authPhoneInput.value.trim();

    if (!name) {
        showToast("Iltimos, Ismingizni kiriting!");
        authNameInput?.focus();
        return;
    }

    if (!isValidUzPhone(phone)) {
        showToast("Faqat to'g'ri O'zbekiston raqami (+998 XX YYY-YY-YY) qabul qilinadi!");
        authPhoneInput?.focus();
        return;
    }

    const cleanDigits = cleanUzPhone(phone);
    const formattedPhone = formatUzPhone(cleanDigits);

    currentUser = {
        id: '#ID-' + Math.floor(100000 + Math.random() * 900000),
        name: name,
        phone: formattedPhone,
        avatar: selectedAvatarUrl
    };

    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    updateUserHeaderUI();
    loadCartForCurrentUser();
    syncUserWithBackend(currentUser);
    authModal.classList.add('hidden');
    showToast(`Xush kelibsiz, ${name}!`);
}

async function syncUserWithBackend(userObj) {
    if (!userObj) return;
    try {
        fetch(`${API_BASE_URL}/api/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userObj)
        }).catch(err => console.warn("User sync error:", err));
    } catch (e) {
        console.warn("User sync error:", e);
    }
}

function openUserProfileModal() {
    if (!currentUser) return;
    profileModalAvatar.src = currentUser.avatar;
    profileModalName.textContent = currentUser.name;
    profileModalId.textContent = `Mijoz ID: ${currentUser.id}`;
    profileModalPhone.textContent = currentUser.phone;
    profileModalOrdersCount.textContent = `${orders.filter(o => o.phone === currentUser.phone || o.userId === currentUser.id).length} ta`;
    userProfileModal.classList.remove('hidden');
}

function handleUserLogout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    userHeaderName.textContent = 'Kiring';
    userHeaderId.textContent = '#ID-...';
    userHeaderAvatar.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
    loadCartForCurrentUser();
    userProfileModal.classList.add('hidden');
    authModal.classList.remove('hidden');
    showToast("Profildan chiqildi");
}

// CATEGORIES RENDER
function renderCategories() {
    const categories = ['Barchasi', 'Smartfonlar', 'Kiyimlar', 'Aksessuarlar', 'Oziq-ovqat'];
    categoriesContainer.innerHTML = '';
    categories.forEach(cat => {
        const chip = document.createElement('button');
        chip.className = `category-chip ${cat === selectedCategory ? 'active' : ''}`;
        chip.textContent = cat;
        chip.onclick = () => {
            selectedCategory = cat;
            document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            renderProducts();
        };
        categoriesContainer.appendChild(chip);
    });
}

// PRODUCTS RENDER
function renderProducts() {
    productsGrid.innerHTML = '';

    const filtered = products.filter(p => {
        const matchesCategory = selectedCategory === 'Barchasi' || p.category === selectedCategory;
        const matchesSearch = p.title.toLowerCase().includes(searchQuery) || p.description.toLowerCase().includes(searchQuery);
        return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
        productsGrid.innerHTML = `
            <div style="grid-column: 1 / -1;" class="empty-state">
                <i class="fa-solid fa-box-open empty-icon"></i>
                <p>Mahsulotlar topilmadi</p>
            </div>
        `;
        return;
    }

    filtered.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-img-wrapper" onclick="openProductDetail('${p.id}')">
                <img src="${p.image}" class="product-img" alt="${p.title}" onerror="this.src='https://via.placeholder.com/300x300?text=Rasm+Mavjud+Emas'">
                <span class="product-category-tag">${p.category}</span>
            </div>
            <div class="product-info" onclick="openProductDetail('${p.id}')">
                <h4 class="product-title">${p.title}</h4>
                <div class="product-price">${formatPrice(p.price)} so'm</div>
                <div class="product-actions" onclick="event.stopPropagation()">
                    <button class="btn-add-cart" onclick="addToCart('${p.id}')">
                        <i class="fa-solid fa-cart-plus"></i> Savatchaga
                    </button>
                </div>
            </div>
        `;

        productsGrid.appendChild(card);
    });
}

// PRODUCT DETAIL & INSTALLMENT CALCULATOR
function openProductDetail(productId) {
    const p = products.find(prod => prod.id === productId);
    if (!p) return;

    selectedDetailProduct = p;
    detailProdImg.src = p.image;
    detailProdCategory.textContent = p.category;
    detailProdTitle.textContent = p.title;
    detailProdPrice.textContent = `${formatPrice(p.price)} so'm`;
    detailProdDesc.textContent = p.description;

    // Calculate installments
    const p3 = Math.ceil(p.price / 3);
    const p6 = Math.ceil(p.price / 6);
    const p12 = Math.ceil(p.price / 12);

    instPrice3.textContent = `${formatPrice(p3)} so'm/oy`;
    instPrice6.textContent = `${formatPrice(p6)} so'm/oy`;
    instPrice12.textContent = `${formatPrice(p12)} so'm/oy`;

    // Show or hide admin actions inside detail modal
    const adminActions = document.getElementById('detailAdminActions');
    if (adminActions) {
        if (isAdminLoggedIn) {
            adminActions.classList.remove('hidden');
            const editBtn = document.getElementById('detailEditBtn');
            const delBtn = document.getElementById('detailDeleteBtn');
            if (editBtn) {
                editBtn.onclick = () => {
                    productDetailModal.classList.add('hidden');
                    openEditProductModal(p.id);
                };
            }
            if (delBtn) {
                delBtn.onclick = () => {
                    productDetailModal.classList.add('hidden');
                    deleteProduct(p.id);
                };
            }
        } else {
            adminActions.classList.add('hidden');
        }
    }

    updateInstallmentSummary();
    productDetailModal.classList.remove('hidden');
}

function updateInstallmentSummary() {
    if (!selectedDetailProduct) return;
    const price = selectedDetailProduct.price;
    const monthly = Math.ceil(price / selectedInstallmentMonths);

    selectedInstMonthText.textContent = `${selectedInstallmentMonths} Oy`;
    selectedInstMonthlyPrice.textContent = `${formatPrice(monthly)} so'm/oy`;
}

function handleAddCartInstallment() {
    if (!selectedDetailProduct) return;
    const monthly = Math.ceil(selectedDetailProduct.price / selectedInstallmentMonths);
    const titleWithInst = `${selectedDetailProduct.title} (${selectedInstallmentMonths} oy - ${formatPrice(monthly)} so'm/oy)`;

    const existingItem = cart.find(item => item.title === titleWithInst);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: selectedDetailProduct.id + '-inst-' + selectedInstallmentMonths,
            title: titleWithInst,
            price: monthly * selectedInstallmentMonths,
            image: selectedDetailProduct.image,
            quantity: 1
        });
    }

    saveCart();
    updateCartUI();
    productDetailModal.classList.add('hidden');
    showToast(`${selectedInstallmentMonths} oylik bo'lib to'lov savatchaga qo'shildi!`);
}

// CART FUNCTIONS
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    saveCart();
    updateCartUI();
    showToast(`${product.title} savatchaga qo'shildi!`);
}

function updateCartUI() {
    if (!cartBadge) return; // DOM hali tayyor bo'lmasa xavfsiz chiqish
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartBadge.textContent = totalCount;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '';
        cartEmptyState.classList.remove('hidden');
        cartFooter.classList.add('hidden');
    } else {
        cartEmptyState.classList.add('hidden');
        cartFooter.classList.remove('hidden');
        cartItemsContainer.innerHTML = '';

        let totalPrice = 0;
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            totalPrice += itemTotal;

            const div = document.createElement('div');
            div.className = 'cart-item';
            div.innerHTML = `
                <img src="${item.image}" class="cart-item-img" alt="${item.title}">
                <div class="cart-item-details">
                    <div class="cart-item-title">${item.title}</div>
                    <div class="cart-item-price">${formatPrice(item.price)} so'm</div>
                </div>
                <div class="cart-quantity-controls">
                    <button class="qty-btn" onclick="changeQty('${item.id}', -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="qty-btn" onclick="changeQty('${item.id}', 1)">+</button>
                </div>
            `;
            cartItemsContainer.appendChild(div);
        });

        const p3 = Math.round(totalPrice / 3);
        const p6 = Math.round(totalPrice / 6);
        const p12 = Math.round(totalPrice / 12);

        const instPrice3Elem = document.getElementById('cartInstPrice3');
        const instPrice6Elem = document.getElementById('cartInstPrice6');
        const instPrice12Elem = document.getElementById('cartInstPrice12');
        const monthlyElem = document.getElementById('cartMonthlyPaymentText');

        if (instPrice3Elem) instPrice3Elem.textContent = `${formatPrice(p3)} so'm/oy`;
        if (instPrice6Elem) instPrice6Elem.textContent = `${formatPrice(p6)} so'm/oy`;
        if (instPrice12Elem) instPrice12Elem.textContent = `${formatPrice(p12)} so'm/oy`;

        const curMonthly = cartInstallmentMonths === 12 ? p12 : (cartInstallmentMonths === 6 ? p6 : p3);
        if (monthlyElem) monthlyElem.textContent = `${formatPrice(curMonthly)} so'm / oy`;

        if (cartPaymentType === 'installment') {
            cartTotalPrice.innerHTML = `${formatPrice(totalPrice)} so'm <span style="display:block;font-size:12px;color:var(--primary-color);font-weight:600;margin-top:2px;">(Oyiga: ${formatPrice(curMonthly)} so'm x ${cartInstallmentMonths} oy)</span>`;
        } else {
            cartTotalPrice.textContent = `${formatPrice(totalPrice)} so'm`;
        }
    }
}

function selectCartPaymentType(type) {
    cartPaymentType = type;
    const cashBtn = document.getElementById('payCashTabBtn');
    const instBtn = document.getElementById('payInstallmentTabBtn');
    const instOptions = document.getElementById('cartInstallmentOptions');

    if (type === 'installment') {
        cashBtn?.classList.remove('active');
        instBtn?.classList.add('active');
        instOptions?.classList.remove('hidden');
    } else {
        cashBtn?.classList.add('active');
        instBtn?.classList.remove('active');
        instOptions?.classList.add('hidden');
    }
    updateCartUI();
}

function selectCartInstallmentMonths(months) {
    cartInstallmentMonths = months;
    [3, 6, 12].forEach(m => {
        const btn = document.getElementById(`cartInstBtn${m}`);
        if (btn) {
            if (m === months) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        }
    });
    updateCartUI();
}


function changeQty(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
        cart = cart.filter(i => i.id !== productId);
    }
    saveCart();
    updateCartUI();
}

function saveCart() {
    try {
        const key = getCartStorageKey();
        localStorage.setItem(key, JSON.stringify(cart));
    } catch (e) {
        console.error("Error saving cart", e);
    }
}

// ADMIN LOGIN & MANAGEMENT
function handleAdminLogin() {
    const pin = adminPinInput.value.trim();
    if (pin === ADMIN_PIN) {
        isAdminLoggedIn = true;
        adminLoginModal.classList.add('hidden');
        adminPinInput.value = '';
        adminLoginError.classList.add('hidden');
        adminBanner.classList.remove('hidden');
        renderProducts();
        showToast('Admin rejimiga muvaffaqiyatli kirildi!');
    } else {
        adminLoginError.classList.remove('hidden');
    }
}


function openEditProductModal(productId) {
    const p = products.find(item => item.id === productId);
    if (!p) return;

    document.getElementById('editProductId').value = p.id;
    document.getElementById('prodTitle').value = p.title;
    document.getElementById('prodPrice').value = p.price;
    document.getElementById('prodCategory').value = p.category;
    document.getElementById('prodImage').value = p.image;
    document.getElementById('prodDesc').value = p.description || '';

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
    const image = document.getElementById('prodImage').value.trim() || 'https://via.placeholder.com/300';
    const description = document.getElementById('prodDesc').value.trim();

    if (!title || isNaN(price)) {
        showToast("Iltimos, barcha zarur maydonlarni to'ldiring!");
        return;
    }

    if (editId) {
        // UPDATE EXISTING PRODUCT
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
            showToast("Mahsulot ma'lumotlari yangilandi!");
        }
    } else {
        // CREATE NEW PRODUCT
        const newProd = {
            id: Date.now().toString(),
            title,
            price,
            category,
            image,
            description
        };
        products.unshift(newProd);

        // Sync with Render Backend
        try {
            fetch(`${API_BASE_URL}/api/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProd)
            }).catch(e => console.warn("Backend save product error:", e));
        } catch (e) {
            console.warn("Backend save product error:", e);
        }

        showToast("Yangi mahsulot do'konga joylandi!");
    }

    localStorage.setItem('products', JSON.stringify(products));
    renderProducts();
    productModal.classList.add('hidden');
}


function deleteProduct(id) {
    if (confirm("Rostdan ham ushbu mahsulotni o'chirmoqchisiz?")) {
        products = products.filter(p => p.id !== id);
        localStorage.setItem('products', JSON.stringify(products));
        renderProducts();

        try {
            fetch(`${API_BASE_URL}/api/products/${id}`, { method: 'DELETE' })
                .catch(e => console.warn("Backend delete product error:", e));
        } catch (e) {
            console.warn("Backend delete product error:", e);
        }

        showToast("Mahsulot o'chirildi");
    }
}

// SUBMIT ORDER TO TELEGRAM BOT
async function handleSubmitOrder() {
    const name = customerName.value.trim();
    const phone = customerPhone.value.trim();
    const address = customerAddress.value.trim();

    if (!name || !phone) {
        showToast("Iltimos, Ismingiz va Telefon raqamingizni kiriting!");
        return;
    }

    if (!isValidUzPhone(phone)) {
        showToast("Faqat to'g'ri O'zbekiston raqami (+998...) qabul qilinadi!");
        customerPhone?.focus();
        return;
    }

    const total = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    const orderItemsText = cart.map(i => `• ${i.title} (${i.quantity} dona) - ${formatPrice(i.price * i.quantity)} so'm`).join('\n');

    const userTag = currentUser ? `\n👤 <b>Mijoz ID:</b> <code>${currentUser.id}</code>` : '';

    const newOrder = {
        id: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
        userId: currentUser ? currentUser.id : 'Mehmon',
        name,
        phone,
        address: address || 'Kiritilmagan',
        items: [...cart],
        total,
        paymentType: cartPaymentType === 'installment' ? `Muddatli to'lov (${cartInstallmentMonths} oy)` : "Naqd / To'liq to'lov",
        installmentMonths: cartPaymentType === 'installment' ? cartInstallmentMonths : 1,
        monthlyPayment: cartPaymentType === 'installment' ? Math.round(total / cartInstallmentMonths) : 0,
        date: new Date().toLocaleString('uz-UZ'),
        status: 'Yangi'
    };

    // Save to Admin Orders
    orders.unshift(newOrder);
    localStorage.setItem('orders', JSON.stringify(orders));
    updateOrdersCount();

    // Send to Render Backend Server
    try {
        fetch(`${API_BASE_URL}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newOrder)
        }).catch(err => console.warn("Render orders API error:", err));
    } catch (e) {
        console.warn("Render order POST error:", e);
    }

    // Prepare Telegram Bot Message
    const message = `🛍 <b>TASANNO - YANGI BUYURTMA #${newOrder.id}</b>${userTag}\n\n` +
        `👤 <b>Mijoz:</b> ${name}\n` +
        `📞 <b>Tel:</b> <code>${phone}</code>\n` +
        `📍 <b>Manzil/Izoh:</b> ${newOrder.address}\n\n` +
        `📦 <b>Mahsulotlar:</b>\n${orderItemsText}\n\n` +
        `💰 <b>Jami summa:</b> <b>${formatPrice(total)} so'm</b>\n` +
        `💳 <b>To'lov usuli:</b> <b>${newOrder.paymentType}</b>\n` +
        (newOrder.monthlyPayment ? `🗓 <b>Oylik to'lov:</b> <b>${formatPrice(newOrder.monthlyPayment)} so'm / oy</b> (${newOrder.installmentMonths} oy davomida)\n` : '') +
        `⏰ <b>Sana:</b> ${newOrder.date}`;

    // Send directly to 2nd App (TASANNO ZAKAZLAR)
    sendOrderToOrdersApp(newOrder);

    // Clear user cart
    cart = [];
    saveCart();
    updateCartUI();
    cartModal.classList.add('hidden');

    showOrderSuccessModal(newOrder.id);
}

async function sendTelegramMessage(chatId, text) {
    try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'HTML'
            })
        });
    } catch (e) {
        console.error('Telegram API error:', e);
    }
}

async function fetchBackendOrders() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/orders`);
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                const existingIds = new Set(orders.map(o => String(o.id)));
                data.forEach(bo => {
                    if (!existingIds.has(String(bo.id))) {
                        orders.unshift(bo);
                    }
                });
                localStorage.setItem('orders', JSON.stringify(orders));
                updateOrdersCount();
                renderOrders();
            }
        }
    } catch (e) {
        console.warn("Backend orders fetch error:", e);
    }
}

// RENDER ORDERS (ADMIN)
function renderOrders() {
    ordersListContainer.innerHTML = '';
    if (orders.length === 0) {
        ordersListContainer.innerHTML = '<div class="empty-state"><p>Hozircha buyurtmalar yo\'q</p></div>';
        return;
    }

    orders.forEach(ord => {
        const card = document.createElement('div');
        card.className = 'order-card';
        card.innerHTML = `
            <div class="order-header">
                <span>#${ord.id} - ${ord.name} (${ord.userId || 'Mehmon'})</span>
                <span style="color: var(--primary-color);">${formatPrice(ord.total)} so'm</span>
            </div>
            <div class="order-details">
                <div>📞 Tel: ${ord.phone}</div>
                <div>📍 Manzil: ${ord.address}</div>
                <div>💳 To'lov: <b>${ord.paymentType || "Naqd"}</b> ${ord.monthlyPayment ? `(${formatPrice(ord.monthlyPayment)} so'm/oy)` : ""}</div>
                <div>⏰ Sana: ${ord.date}</div>
                <div style="margin-top: 4px;"><strong>Mahsulotlar:</strong></div>
                ${ord.items.map(i => `<div>• ${i.title} (${i.quantity} dona)</div>`).join('')}
            </div>
        `;
        ordersListContainer.appendChild(card);
    });
}

function updateOrdersCount() {
    if (ordersCountBadge) {
        ordersCountBadge.textContent = orders.length;
    }
}

// UTILS
function formatPrice(price) {
    return price.toLocaleString('fr-FR');
}

function showToast(msg) {
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 2500);
}


async function sendOrderToOrdersApp(orderObj) {
    try {
        await fetch('https://ntfy.sh/tasanno_orders_channel_998', {
            method: 'POST',
            headers: {
                'Title': `Yangi Buyurtma #${orderObj.id}`,
                'Priority': 'high',
                'Tags': 'shopping_bags,bell'
            },
            body: JSON.stringify(orderObj)
        });
        console.log("Order successfully dispatched to TASANNO ZAKAZLAR App!");
    } catch (e) {
        console.error("Orders dispatch error:", e);
    }
}


function showOrderSuccessModal(orderId) {
    const successModal = document.getElementById('orderSuccessModal');
    const badge = document.getElementById('successOrderNumberBadge');
    if (badge) badge.textContent = `#${orderId}`;
    if (successModal) {
        successModal.classList.remove('hidden');
    }
    showToast(`Buyurtma #${orderId} muvaffaqiyatli qabul qilindi!`);

    const closeBtn = document.getElementById('closeOrderSuccessBtn');
    if (closeBtn) {
        closeBtn.onclick = () => {
            if (successModal) successModal.classList.add('hidden');
        };
    }
}
