const path = require('path');
const express = require('express');
const prisma = require('./prisma-client');
const customerAuthRoutes = require('./routes/customer-auth');
const sessionMiddleware = require('./session');
const requireCustomer = require('./middleware/require-customer');
const bagRoutes = require('./routes/bag');
const formatMoney = require('./utils/money');
const { Prisma } = require('@prisma/client');
const sellerAuthRoutes = require('./routes/seller-auth');
const requireSeller = require('./middleware/require-seller');

const app = express();

app.locals.formatMoney = formatMoney;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(sessionMiddleware);
app.use((req, res, next) => {
    res.locals.isSeller = Boolean(req.session.sellerId);
    res.locals.isCustomer = Boolean(req.session.customerId);
    next();
});
app.use('/api/seller', sellerAuthRoutes);
app.use('/api/bag', bagRoutes);

app.use('/api/customers', customerAuthRoutes);

app.get('/', async(req, res) => {
    try {
        const featuredProducts = await prisma.products.findMany({
            where: {
                is_featured: true,
                is_available: true
            },
            select: {
                id: true,
                name: true,
                price: true,
                image_url: true
            },
            orderBy: [
                { created_at: 'desc' },
                { id: 'desc' }
            ],
            take: 4
        });

        res.render('shop', {
            featuredProducts,
            collectionError: false
        });
    } catch (error) {
        console.error('Homepage products failed:', error.message);

        res.render('shop', {
            featuredProducts: [],
            collectionError: true
        });
    }
});

app.get('/api/products/featured', async(req, res) => {
    try {
        const products = await prisma.products.findMany({
            where: {
                is_featured: true,
                is_available: true
            },
            select: {
                id: true,
                name: true,
                description: true,
                price: true,
                category: true,
                image_url: true
            },
            orderBy: [
                { created_at: 'desc' },
                { id: 'desc' }
            ],
            take: 4
        });

        res.json(products);
    } catch (error) {
        console.error('Failed to fetch featured products:', error.message);

        res.status(500).json({
            error: 'Unable to load featured products'
        });
    }
});

app.get('/api/products', requireCustomer, async(req, res) => {
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

app.get('/api/products/:id', requireCustomer, async(req, res) => {
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

app.get('/signup', (req, res) => {
    res.render('signup');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get(
    '/shop',
    (req, res, next) => {
        if (!req.session.customerId) {
            return res.redirect('/login');
        }

        next();
    },
    requireCustomer,
    async(req, res) => {
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

            res.render('store', {
                customer: req.customer,
                products,
                collectionError: false
            });
        } catch (error) {
            console.error('Store failed to load:', error.message);

            res.status(500).render('store', {
                customer: req.customer,
                products: [],
                collectionError: true
            });
        }
    }
);

app.get(
    '/shop/products/:id',
    (req, res, next) => {
        if (!req.session.customerId) {
            return res.redirect('/login');
        }

        next();
    },
    requireCustomer,
    async(req, res) => {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0 || id > 2147483647) {
            return res.status(400).send('Invalid product ID');
        }

        try {
            const product = await prisma.products.findFirst({
                where: {
                    id,
                    is_available: true
                },
                include: {
                    sizes: {
                        orderBy: { id: 'asc' }
                    }
                }
            });

            if (!product) {
                return res.status(404).send('This piece is no longer available');
            }

            res.render('product', {
                customer: req.customer,
                product
            });
        } catch (error) {
            console.error('Product page failed:', error.message);

            res.status(500).send(
                'Unable to load this piece. Please try again shortly.'
            );
        }
    }
);

app.get(
    '/cart',
    (req, res, next) => {
        if (!req.session.customerId) {
            return res.redirect('/login');
        }

        next();
    },
    requireCustomer,
    async(req, res) => {
        try {
            const items = await prisma.bagItem.findMany({
                where: {
                    customerId: req.customer.id
                },
                include: {
                    productSize: {
                        include: {
                            product: true
                        }
                    }
                },
                orderBy: [
                    { createdAt: 'desc' },
                    { id: 'desc' }
                ]
            });

            const cartItems = items.map((item) => ({
                ...item,
                lineTotal: item.productSize.product.price.mul(item.quantity)
            }));

            const subtotal = cartItems.reduce(
                (total, item) => {
                    if (!item.productSize.product.is_available) {
                        return total;
                    }

                    return total.plus(item.lineTotal);
                },
                new Prisma.Decimal(0)
            );

            const hasUnavailableItems = cartItems.some(
                (item) => !item.productSize.product.is_available
            );

            return res.render('cart', {
                customer: req.customer,
                items: cartItems,
                subtotal,
                hasUnavailableItems,
                bagError: false
            });
        } catch (error) {
            console.error('Cart page failed:', error.message);

            return res.status(500).render('cart', {
                customer: req.customer,
                items: [],
                subtotal: new Prisma.Decimal(0),
                hasUnavailableItems: false,
                bagError: true
            });
        }
    }
);

app.get(
    '/checkout',
    (req, res, next) => {
        if (!req.session.customerId) {
            return res.redirect('/login');
        }

        next();
    },
    requireCustomer,
    async(req, res) => {
        try {
            const items = await prisma.bagItem.findMany({
                where: {
                    customerId: req.customer.id
                },
                include: {
                    productSize: {
                        include: {
                            product: true
                        }
                    }
                },
                orderBy: [
                    { createdAt: 'desc' },
                    { id: 'desc' }
                ]
            });

            if (items.length === 0) {
                return res.redirect('/bag');
            }

            const hasUnavailableItems = items.some(
                (item) => !item.productSize.product.is_available
            );

            if (hasUnavailableItems) {
                return res.redirect('/bag');
            }

            const cartItems = items.map((item) => ({
                ...item,
                lineTotal: item.productSize.product.price.mul(item.quantity)
            }));

            const subtotal = cartItems.reduce(
                (total, item) => total.plus(item.lineTotal),
                new Prisma.Decimal(0)
            );

            return res.render('checkout', {
                customer: req.customer,
                items: cartItems,
                subtotal
            });
        } catch (error) {
            console.error('Checkout page failed:', error.message);

            return res.status(500).send(
                'Unable to load checkout. Please return to your cart and try again.'
            );
        }
    }
);

app.get('/seller/setup', async(req, res) => {
    try {
        const seller = await prisma.seller.findUnique({
            where: {
                accountKey: 'owner'
            },
            select: {
                id: true
            }
        });

        if (seller) {
            return res.redirect('/seller/login');
        }

        if (!process.env.SELLER_SETUP_KEY) {
            return res.status(503).send(
                'Seller setup is not enabled. Please contact the site developer.'
            );
        }

        return res.render('seller-auth', {
            mode: 'setup'
        });
    } catch (error) {
        console.error('Seller setup page failed:', error.message);

        return res.status(500).send(
            'Unable to load seller setup. Please try again shortly.'
        );
    }
});

app.get('/seller/login', (req, res) => {
    res.render('seller-auth', {
        mode: 'login'
    });
});

app.get('/seller', requireSeller, async(req, res) => {
    try {
        const products = await prisma.products.findMany({
            include: {
                sizes: true
            },
            orderBy: [
                { created_at: 'desc' },
                { id: 'desc' }
            ]
        });

        res.render('seller-dashboard', {
            seller: req.seller,
            products
        });
    } catch (error) {
        console.error('Seller dashboard failed:', error.message);

        res.status(500).send(
            'Unable to load your dashboard. Please try again shortly.'
        );
    }
});

app.get('/seller/products/new', requireSeller, (req, res) => {
    res.render('seller-product-new', {
        seller: req.seller
    });
});

app.listen(port, () => {
    console.log(`Open http://localhost:${port}`);
});