const express = require('express');
const prisma = require('../prisma-client');
const requireCustomer = require('../middleware/require-customer');

const router = express.Router();

router.use(requireCustomer);

router.get('/', async(req, res) => {
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
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json({
            items,
            itemCount: items.reduce(
                (count, item) => count + item.quantity,
                0
            )
        });
    } catch (error) {
        console.error('Failed to load bag:', error.message);

        res.status(500).json({
            error: 'Unable to load your bag'
        });
    }
});

router.post('/', async(req, res) => {
    const { productSizeId, quantity = 1 } = req.body || {};

    if (!Number.isInteger(productSizeId) ||
        productSizeId <= 0 ||
        productSizeId > 2147483647 ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 10
    ) {
        return res.status(400).json({
            error: 'Choose a valid size and a quantity between 1 and 10'
        });
    }

    try {
        const result = await prisma.$transaction(async(tx) => {
            const size = await tx.product_sizes.findUnique({
                where: { id: productSizeId },
                include: {
                    product: {
                        select: { is_available: true }
                    }
                }
            });

            if (!size || !size.product.is_available) {
                return {
                    status: 404,
                    error: 'This piece or size is no longer available'
                };
            }

            const currentQuantity = existingItem ? existingItem.quantity : 0;

            if (currentQuantity + quantity > 10) {
                return {
                    status: 400,
                    error: 'You can add up to 10 of the same piece and size'
                };
            }

            const item = await tx.bagItem.upsert({
                where: {
                    customerId_productSizeId: {
                        customerId: req.customer.id,
                        productSizeId
                    }
                },
                create: {
                    customerId: req.customer.id,
                    productSizeId,
                    quantity
                },
                update: {
                    quantity: {
                        increment: quantity
                    }
                }
            });

            return { status: 200, item };
        }, {
            isolationLevel: 'Serializable'
        });

        if (result.error) {
            return res.status(result.status).json({
                error: result.error
            });
        }

        res.status(200).json({
            message: 'Added to your bag',
            item: result.item
        });
    } catch (error) {
        if (error.code === 'P2034' || error.code === 'P2002') {
            return res.status(409).json({
                error: 'Your bag changed during this request. Please try again.'
            });
        }

        console.error('Failed to add bag item:', error.message);

        res.status(500).json({
            error: 'Unable to add this piece to your bag'
        });
    }
});

router.delete('/:id', async(req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0 || id > 2147483647) {
        return res.status(400).json({
            error: 'Invalid bag item ID'
        });
    }

    try {
        const result = await prisma.bagItem.deleteMany({
            where: {
                id,
                customerId: req.customer.id
            }
        });

        if (result.count === 0) {
            return res.status(404).json({
                error: 'Bag item not found'
            });
        }

        res.json({
            message: 'Item removed from your bag'
        });
    } catch (error) {
        console.error('Failed to remove bag item:', error.message);

        res.status(500).json({
            error: 'Unable to remove this item'
        });
    }
});

router.patch('/:id', async(req, res) => {
    const id = Number(req.params.id);
    const { quantity } = req.body || {};

    if (!Number.isInteger(id) || id <= 0 || id > 2147483647) {
        return res.status(400).json({
            error: 'Invalid bag item ID'
        });
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
        return res.status(400).json({
            error: 'Quantity must be between 1 and 10'
        });
    }

    try {
        const result = await prisma.bagItem.updateMany({
            where: {
                id,
                customerId: req.customer.id
            },
            data: {
                quantity
            }
        });

        if (result.count === 0) {
            return res.status(404).json({
                error: 'Bag item not found'
            });
        }

        res.json({
            message: 'Bag quantity updated',
            quantity
        });
    } catch (error) {
        console.error('Failed to update bag quantity:', error.message);

        res.status(500).json({
            error: 'Unable to update quantity'
        });
    }
});

module.exports = router;