// APP CONFIGURATION
const API_BASE_URL = window.location.origin.includes('http') ? window.location.origin : 'https://tasanno-im7q.onrender.com';
const BOT_TOKEN = "8394907443:AAGOJEcA7SLdfG8MEMP_3fNPeWOD8wqPmHo";
const ADMIN_PIN = "7777";

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

let orders = [];
let selectedCategory = 'Barchasi';
let searchQuery = '';
let isAdminLoggedIn = false;
let selectedDetailProduct = null;
let selectedInstallmentMonths = 3;
let selectedAvatarUrl = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
let cartPaymentType = 'cash';
let cartInstallmentMonths = 3;

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

    setTimeout(() => {
        if (splashScreen) {
            splashScreen.style.opacity = '0';
            splashScreen.style.display = 'none';
        }
        if (appContainer) appContainer.classList.remove('hidden');

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
    fetchBackendProducts();

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
    } catch (e) { console.warn("Backend products fetch failed:", e); }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

document.addEventListener('DOMContentLoaded', () => {
    searchInput?.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderProducts();
    });

    cartBtn?.addEventListener('click', () => cartModal?.classList.remove('hidden'));
    closeCartBtn?.addEventListener('click', () => cartModal?.classList.add('hidden'));

    userProfileBadge?.addEventListener('click', () => {
        if (currentUser) {
            openUserProfileModal();
        } else {
            authModal?.classList.remove('hidden');
        }
    });

    closeUserProfileBtn?.addEventListener('click', () => userProfileModal?.classList.add('hidden'));
    attachPhoneMask(authPhoneInput);
    attachPhoneMask(customerPhone);
    logoutUserBtn?.addEventListener('click', handleUserLogout);
    submitAuthBtn?.addEventListener('click', handleAuthSubmit);

    closeDetailModalBtn?.addEventListener('click', () => productDetailModal?.classList.add('hidden'));

    addCartCashBtn?.addEventListener('click', () => {
        if (!selectedDetailProduct) return;
        addToCart(selectedDetailProduct.id);
        productDetailModal?.classList.add('hidden');
    });

    closeAdminLoginBtn?.addEventListener('click', () => adminLoginModal?.classList.add('hidden'));
    loginAdminSubmitBtn?.addEventListener('click', handleAdminLogin);

    closeProductModalBtn?.addEventListener('click', () => productModal?.classList.add('hidden'));
    saveProductBtn?.addEventListener('click', handleSaveProduct);
    submitOrderBtn?.addEventListener('click', handleSubmitOrder);
});

function updateUserHeaderUI() {
    if (!currentUser) return;
    if (userHeaderAvatar) userHeaderAvatar.src = currentUser.avatar;
    if (userHeaderName) userHeaderName.textContent = currentUser.name;
    if (userHeaderId) userHeaderId.textContent = currentUser.id;

    if (customerName) customerName.value = currentUser.name;
    if (customerPhone) customerPhone.value = currentUser.phone;
}

const UZ_PHONE_PREFIXES = ['90', '91', '93', '94', '95', '97', '98', '99', '88', '33', '50', '55', '77', '71', '78'];

function cleanUzPhone(phoneStr) {
    if (!phoneStr) return '';
    let digits = phoneStr.replace(/\D/g, '');
    if (digits.startsWith('998')) digits = digits.slice(3);
    return digits.slice(0, 9);
}

function isValidUzPhone(phoneStr) {
    const digits = cleanUzPhone(phoneStr);
    if (digits.length !== 9) return false;
    return UZ_PHONE_PREFIXES.includes(digits.slice(0, 2));
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
}

function handleAuthSubmit() {
    const name = authNameInput.value.trim();
    const phone = authPhoneInput.value.trim();

    if (!name) {
        showToast("Iltimos, Ismingizni kiriting!");
        return;
    }

    if (!isValidUzPhone(phone)) {
        showToast("Faqat to'g'ri O'zbekiston raqami (+998...) qabul qilinadi!");
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
    authModal?.classList.add('hidden');
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
    } catch (e) { console.warn("User sync error:", e); }
}

function openUserProfileModal() {
    if (!currentUser) return;
    if (profileModalAvatar) profileModalAvatar.src = currentUser.avatar;
    if (profileModalName) profileModalName.textContent = currentUser.name;
    if (profileModalId) profileModalId.textContent = `Mijoz ID: ${currentUser.id}`;
    if (profileModalPhone) profileModalPhone.textContent = currentUser.phone;
    if (userProfileModal) userProfileModal.classList.remove('hidden');
}

function handleUserLogout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    if (userHeaderName) userHeaderName.textContent = 'Kiring';
    if (userHeaderId) userHeaderId.textContent = '#ID-...';
    if (userProfileModal) userProfileModal.classList.add('hidden');
    if (authModal) authModal.classList.remove('hidden');
    showToast("Profildan chiqildi");
}

function renderCategories() {
    const categories = ['Barchasi', 'Smartfonlar', 'Kiyimlar', 'Aksessuarlar', 'Oziq-ovqat'];
    if (!categoriesContainer) return;
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

function renderProducts() {
    if (!productsGrid) return;
    productsGrid.innerHTML = '';

    const filtered = products.filter(p => {
        const matchesCategory = selectedCategory === 'Barchasi' || p.category === selectedCategory;
        const matchesSearch = p.title.toLowerCase().includes(searchQuery) || (p.description || '').toLowerCase().includes(searchQuery);
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

function openProductDetail(productId) {
    const p = products.find(prod => prod.id === productId);
    if (!p) return;

    selectedDetailProduct = p;
    if (detailProdImg) detailProdImg.src = p.image;
    if (detailProdCategory) detailProdCategory.textContent = p.category;
    if (detailProdTitle) detailProdTitle.textContent = p.title;
    if (detailProdPrice) detailProdPrice.textContent = `${formatPrice(p.price)} so'm`;
    if (detailProdDesc) detailProdDesc.textContent = p.description;

    const p3 = Math.ceil(p.price / 3);
    const p6 = Math.ceil(p.price / 6);
    const p12 = Math.ceil(p.price / 12);

    if (instPrice3) instPrice3.textContent = `${formatPrice(p3)} so'm/oy`;
    if (instPrice6) instPrice6.textContent = `${formatPrice(p6)} so'm/oy`;
    if (instPrice12) instPrice12.textContent = `${formatPrice(p12)} so'm/oy`;

    updateInstallmentSummary();
    if (productDetailModal) productDetailModal.classList.remove('hidden');
}

function updateInstallmentSummary() {
    if (!selectedDetailProduct) return;
    const price = selectedDetailProduct.price;
    const monthly = Math.ceil(price / selectedInstallmentMonths);

    if (selectedInstMonthText) selectedInstMonthText.textContent = `${selectedInstallmentMonths} Oy`;
    if (selectedInstMonthlyPrice) selectedInstMonthlyPrice.textContent = `${formatPrice(monthly)} so'm/oy`;
}

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
    if (!cartBadge) return;
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartBadge.textContent = totalCount;

    if (cart.length === 0) {
        if (cartItemsContainer) cartItemsContainer.innerHTML = '';
        if (cartEmptyState) cartEmptyState.classList.remove('hidden');
        if (cartFooter) cartFooter.classList.add('hidden');
    } else {
        if (cartEmptyState) cartEmptyState.classList.add('hidden');
        if (cartFooter) cartFooter.classList.remove('hidden');
        if (cartItemsContainer) {
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

            if (cartTotalPrice) cartTotalPrice.textContent = `${formatPrice(totalPrice)} so'm`;
        }
    }
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
    } catch (e) {}
}

function handleAdminLogin() {
    const pin = adminPinInput.value.trim();
    if (pin === ADMIN_PIN) {
        isAdminLoggedIn = true;
        adminLoginModal?.classList.add('hidden');
        adminBanner?.classList.remove('hidden');
        renderProducts();
        showToast('Admin rejimiga muvaffaqiyatli kirildi!');
    }
}

function handleSaveProduct() {
    const title = document.getElementById('prodTitle').value.trim();
    const price = parseFloat(document.getElementById('prodPrice').value);
    const category = document.getElementById('prodCategory').value;
    const image = document.getElementById('prodImage').value.trim() || 'https://via.placeholder.com/300';
    const description = document.getElementById('prodDesc').value.trim();

    if (!title || isNaN(price)) return;

    const newProd = { id: Date.now().toString(), title, price, category, image, description };
    products.unshift(newProd);

    try {
        fetch(`${API_BASE_URL}/api/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProd)
        });
    } catch (e) {}

    localStorage.setItem('products', JSON.stringify(products));
    renderProducts();
    productModal?.classList.add('hidden');
}

async function handleSubmitOrder() {
    const name = customerName?.value.trim();
    const phone = customerPhone?.value.trim();
    const address = customerAddress?.value.trim();

    if (!name || !phone) {
        showToast("Iltimos, Ismingiz va Telefon raqamingizni kiriting!");
        return;
    }

    const total = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);

    const newOrder = {
        id: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
        userId: currentUser ? currentUser.id : 'Mehmon',
        name,
        phone,
        address: address || 'Kiritilmagan',
        items: [...cart],
        total,
        paymentType: cartPaymentType === 'installment' ? `Muddatli to'lov (${cartInstallmentMonths} oy)` : "Naqd / To'liq to'lov",
        date: new Date().toLocaleString('uz-UZ'),
        status: 'Yangi'
    };

    try {
        fetch(`${API_BASE_URL}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newOrder)
        });
    } catch (e) {}

    cart = [];
    saveCart();
    updateCartUI();
    cartModal?.classList.add('hidden');
    showToast(`Buyurtma #${newOrder.id} muvaffaqiyatli qabul qilindi!`);
}

function formatPrice(price) {
    return (price || 0).toLocaleString('fr-FR');
}

function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 2500);
}
