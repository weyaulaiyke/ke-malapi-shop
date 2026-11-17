const express = require('express');
const prisma = require('./prisma-client-client');

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Ke. MALAPI shop backend is running');
});

app.get('/api/products', async(req, res) => {
    try {
        const products = await prisma.products.findMany({
            where: {
                is_available: true
            },
            include: {
                sizes: true
            },
            orderBy: [
                { created_at: 'desc' },
                { id: 'desc' }
            ]
        });

        res.json(products);
    } catch (error) {
        console.error('Failed to fetch products:', error.message);

        res.status(500).json({
            error: 'Unable to load products'
        });
    }
});

app.get('/api/products/:id', async(req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0 || id > 2147483647) {
        return res.status(400).json({
            error: 'Invalid product ID'
        });
    }

    try {
        const product = await prisma.products.findFirst({
            where: {
                id,
                is_available: true
            },
            include: {
                sizes: true
            }
        });

        if (!product) {
            return res.status(404).json({
                error: 'Product not found'
            });
        }

        res.json(product);
    } catch (error) {
        console.error('Failed to fetch product:', error.message);

        res.status(500).json({
            error: 'Unable to load product'
        });
    }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Open http://localhost:${port}`);
});