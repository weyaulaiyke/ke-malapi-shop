const prisma = require('../prisma-client');

async function requireSeller(req, res, next) {
    const sellerId = req.session && req.session.sellerId;

    if (!sellerId) {
        if (req.originalUrl.startsWith('/api/')) {
            return res.status(401).json({
                error: 'Please log in as the seller'
            });
        }

        return res.redirect('/seller/login');
    }

    try {
        const seller = await prisma.seller.findUnique({
            where: {
                id: sellerId
            },
            select: {
                id: true,
                email: true,
                accountKey: true
            }
        });

        if (!seller || seller.accountKey !== 'owner') {
            delete req.session.sellerId;

            if (req.originalUrl.startsWith('/api/')) {
                return res.status(401).json({
                    error: 'Please log in as the seller'
                });
            }

            return res.redirect('/seller/login');
        }

        req.seller = seller;
        return next();
    } catch (error) {
        console.error('Seller access check failed:', error.message);

        return res.status(500).send(
            'Unable to verify seller access. Please try again shortly.'
        );
    }
}

module.exports = requireSeller;