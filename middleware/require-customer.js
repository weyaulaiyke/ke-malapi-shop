const prisma = require('../prisma-client');

async function requireCustomer(req, res, next) {
    if (!req.session || !req.session.customerId) {
        return res.status(401).json({
            error: 'Please log in to continue'
        });
    }

    try {
        const customer = await prisma.customer.findUnique({
            where: {
                id: req.session.customerId
            },
            select: {
                id: true,
                name: true,
                email: true
            }
        });

        if (!customer) {
            return res.status(401).json({
                error: 'Please log in again'
            });
        }

        req.customer = customer;
        next();
    } catch (error) {
        console.error('Customer access check failed:', error.message);

        return res.status(500).json({
            error: 'Unable to verify your account'
        });
    }
}

module.exports = requireCustomer;