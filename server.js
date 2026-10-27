const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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

// Health check
app.get('/', (req, res) => {
    res.send('TASANNO Backend API Running on Render.com!');
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
        id: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
        ...orderData,
        date: new Date().toLocaleString('uz-UZ'),
        status: 'Yangi'
    };
    orders.unshift(newOrder);
    res.status(201).json(newOrder);
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
