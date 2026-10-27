const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// In-memory products store
let products = [
    {
        id: "1",
        title: "iPhone 15 Pro Max 256GB",
        price: 15400000,
        category: "Smartfonlar",
        image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&q=80",
        description: "Titan korpus, A17 Pro chip va Super Retina XDR ekran."
    },
    {
        id: "2",
        title: "Samsung Galaxy S24 Ultra",
        price: 14200000,
        category: "Smartfonlar",
        image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&q=80",
        description: "Galaxy AI imkoniyatlari, 200MP kamera va S-Pen."
    },
    {
        id: "3",
        title: "Erkaklar uchun Zamonaviy Xudi",
        price: 350000,
        category: "Kiyimlar",
        image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400&q=80",
        description: "Yuqori sifatli 100% paxtadan tayyorlangan issiq xudi."
    },
    {
        id: "4",
        title: "AirPods Pro 2 Gen",
        price: 2800000,
        category: "Aksessuarlar",
        image: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&q=80",
        description: "Aktiv shovqinni so'ndirish (ANC) va shaffoflik rejimi."
    }
];

let orders = [];
let users = [];
let couriers = [];
let messages = [];

// Admin web route
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// GET users
app.get('/api/users', (req, res) => {
    res.json(users);
});

// POST user (register or update)
app.post('/api/users', (req, res) => {
    const { id, name, phone, avatar } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Name required' });
    }

    const cleanPhone = phone ? phone.replace(/\D/g, '') : '';

    let existingUser = users.find(u => {
        if (id && String(u.id) === String(id)) return true;
        if (cleanPhone.length >= 7) {
            const uClean = u.phone ? u.phone.replace(/\D/g, '') : '';
            return uClean.length >= 7 && uClean === cleanPhone;
        }
        return false;
    });

    if (existingUser) {
        existingUser.name = name;
        if (phone && !phone.includes('Ilovani ochdi')) existingUser.phone = phone;
        if (avatar) existingUser.avatar = avatar;
        existingUser.lastActive = new Date().toLocaleString('uz-UZ');
        return res.json({ message: 'User activity updated', user: existingUser });
    }

    const newUser = {
        id: id || ('ID-' + Math.floor(100000 + Math.random() * 900000)),
        name: name || 'Yangi Tashrif Buyuruvchi',
        phone: phone || 'Kiritilmagan',
        avatar: avatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
        registeredAt: new Date().toLocaleString('uz-UZ'),
        lastActive: new Date().toLocaleString('uz-UZ')
    };

    users.unshift(newUser);
    res.status(201).json(newUser);
});

// ================= COURIERS MANAGEMENT API =================
app.get('/api/couriers', (req, res) => {
    res.json(couriers);
});

app.post('/api/couriers', (req, res) => {
    const { id, name, phone } = req.body;
    if (!name || !phone) {
        return res.status(400).json({ error: 'Name and phone required' });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    let existingCourier = couriers.find(c => (id && String(c.id) === String(id)) || (c.phone && c.phone.replace(/\D/g, '') === cleanPhone));

    if (existingCourier) {
        existingCourier.name = name;
        existingCourier.phone = phone;
        existingCourier.lastActive = new Date().toLocaleString('uz-UZ');
        return res.json({ message: 'Courier updated', courier: existingCourier });
    }

    const newCourier = {
        id: id || ('COUR-' + Math.floor(100000 + Math.random() * 900000)),
        name,
        phone,
        status: 'Pending',
        registeredAt: new Date().toLocaleString('uz-UZ'),
        lastActive: new Date().toLocaleString('uz-UZ')
    };

    couriers.unshift(newCourier);
    res.status(201).json(newCourier);
});

app.get('/api/couriers/:id/status', (req, res) => {
    const { id } = req.params;
    const cleanId = id.replace(/\D/g, '');
    const courier = couriers.find(c => {
        if (String(c.id) === String(id)) return true;
        if (c.id && c.id.replace(/\D/g, '') === cleanId) return true;
        if (c.phone && c.phone.replace(/\D/g, '') === cleanId) return true;
        return false;
    });

    if (courier) {
        return res.json({ status: courier.status, courier });
    }
    res.json({ status: 'Pending' });
});

app.put('/api/couriers/:id/approve', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const cleanId = id.replace(/\D/g, '');

    const courier = couriers.find(c => {
        if (String(c.id) === String(id)) return true;
        if (c.id && c.id.replace(/\D/g, '') === cleanId) return true;
        if (c.phone && c.phone.replace(/\D/g, '') === cleanId) return true;
        return false;
    });

    if (courier) {
        courier.status = status;
        courier.lastActive = new Date().toLocaleString('uz-UZ');
        return res.json({ message: `Courier ${status}`, courier });
    }
    res.status(404).json({ error: 'Courier not found' });
});

// ================= CHAT MESSAGES API =================
app.get('/api/messages', (req, res) => {
    res.json(messages);
});

app.post('/api/messages', (req, res) => {
    const { sender, courierName, courierPhone, text } = req.body;
    if (!text || !text.trim()) {
        return res.status(400).json({ error: 'Message text is required' });
    }

    const newMessage = {
        id: 'MSG-' + Date.now(),
        sender: sender || 'Courier',
        courierName: courierName || 'Kuryer',
        courierPhone: courierPhone || 'Kiritilmagan',
        text: text.trim(),
        timestamp: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString('uz-UZ')
    };

    messages.push(newMessage);
    res.status(201).json(newMessage);
});

app.delete('/api/messages', (req, res) => {
    messages = [];
    res.json({ message: 'All messages cleared' });
});

// GET products
app.get('/api/products', (req, res) => {
    res.json(products);
});

// POST product
app.post('/api/products', (req, res) => {
    const { title, price, category, image, description } = req.body;
    if (!title || !price) {
        return res.status(400).json({ error: 'Title and price are required' });
    }
    const newProduct = {
        id: Date.now().toString(),
        title,
        price: parseFloat(price),
        category: category || 'Barchasi',
        image: image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80',
        description: description || ''
    };
    products.unshift(newProduct);
    res.status(201).json(newProduct);
});

// DELETE product
app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;
    products = products.filter(p => p.id !== id);
    res.json({ message: 'Product deleted', id });
});

// GET orders
app.get('/api/orders', (req, res) => {
    res.json(orders);
});

// POST order
app.post('/api/orders', (req, res) => {
    const orderData = req.body;
    if (!orderData || !orderData.name || !orderData.phone) {
        return res.status(400).json({ error: 'Name and phone required' });
    }
    const newOrder = {
        id: orderData.id || ('ORD-' + Math.floor(100000 + Math.random() * 900000)),
        ...orderData,
        date: orderData.date || new Date().toLocaleString('uz-UZ'),
        status: orderData.status || 'Yangi'
    };
    orders.unshift(newOrder);

    // Auto register user if not existing
    const cleanPhone = orderData.phone.replace(/\D/g, '');
    let user = users.find(u => {
        const uClean = u.phone ? u.phone.replace(/\D/g, '') : '';
        return uClean.length >= 7 && uClean === cleanPhone;
    });

    if (!user) {
        users.unshift({
            id: orderData.userId || ('ID-' + Math.floor(100000 + Math.random() * 900000)),
            name: orderData.name,
            phone: orderData.phone,
            avatar: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
            registeredAt: newOrder.date,
            lastActive: newOrder.date
        });
    } else {
        user.name = orderData.name;
        user.phone = orderData.phone;
        user.lastActive = newOrder.date;
    }

    res.status(201).json(newOrder);
});

// PUT update order status & courier info
app.put('/api/orders/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, courierName, courierPhone } = req.body;
    const order = orders.find(o => String(o.id) === String(id));
    if (order) {
        order.status = status;
        if (courierName) order.courierName = courierName;
        if (courierPhone) order.courierPhone = courierPhone;
        return res.json({ message: 'Status updated', order });
    }
    res.status(404).json({ error: 'Order not found' });
});

// DELETE single order
app.delete('/api/orders/:id', (req, res) => {
    const { id } = req.params;
    orders = orders.filter(o => String(o.id) !== String(id));
    res.json({ message: 'Order deleted', id });
});

// DELETE all orders (Clear all)
app.delete('/api/orders', (req, res) => {
    orders = [];
    res.json({ message: 'All orders cleared' });
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
