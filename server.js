const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
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

// POST user
app.post('/api/users', (req, res) => {
    const { id, name, phone, avatar } = req.body;
    if (!name || !phone) {
        return res.status(400).json({ error: 'Name and phone required' });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    let existingUser = users.find(u => u.phone.replace(/\D/g, '') === cleanPhone);

    if (existingUser) {
        existingUser.name = name;
        existingUser.avatar = avatar || existingUser.avatar;
        existingUser.lastActive = new Date().toLocaleString('uz-UZ');
        return res.json({ message: 'User activity updated', user: existingUser });
    }

    const newUser = {
        id: id || ('#ID-' + Math.floor(100000 + Math.random() * 900000)),
        name,
        phone,
        avatar: avatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
        registeredAt: new Date().toLocaleString('uz-UZ'),
        lastActive: new Date().toLocaleString('uz-UZ')
    };

    users.unshift(newUser);
    res.status(201).json(newUser);
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
        image: image || 'https://via.placeholder.com/300',
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
    let user = users.find(u => u.phone.replace(/\D/g, '') === cleanPhone);
    if (!user) {
        users.unshift({
            id: orderData.userId || ('#ID-' + Math.floor(100000 + Math.random() * 900000)),
            name: orderData.name,
            phone: orderData.phone,
            avatar: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
            registeredAt: newOrder.date,
            lastActive: newOrder.date
        });
    } else {
        user.lastActive = newOrder.date;
    }

    res.status(201).json(newOrder);
});

// PUT update order status
app.put('/api/orders/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const order = orders.find(o => String(o.id) === String(id));
    if (order) {
        order.status = status;
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
