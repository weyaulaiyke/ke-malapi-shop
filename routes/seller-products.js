const express = require('express');
const prisma = require('../prisma-client');
const cloudinary = require('../config/cloudinary');
const requireSeller = require('../middleware/require-seller');
const productPhoto = require('../middleware/product-photo');
const uploadProductPhoto = require('../services/upload-product-photo');

const router = express.Router();

router.use(requireSeller);

router.post('/', productPhoto, async(req, res) => {
    const {
        name,
        description = '',
        price,
        category,
        sizes,
        isFeatured = 'false'
    } = req.body;

    if (
        typeof name !== 'string' ||
        typeof description !== 'string' ||
        typeof price !== 'string' ||
        typeof category !== 'string' ||
        typeof sizes !== 'string' ||
        typeof isFeatured !== 'string'
    ) {
        return res.status(400).json({
            error: 'Please complete all product fields'
        });
    }

    const cleanName = name.trim();
    const cleanDescription = description.trim();
    const cleanPrice = price.trim();

    const categories = ['Tops', 'Dresses', 'Bottoms', 'Accessories'];

    const sizeOptions = [
        ...new Set(
            sizes.split(',').map((size) => size.trim()).filter(Boolean)
        )
    ];

    if (!cleanName || cleanName.length > 150) {
        return res.status(400).json({
            error: 'Product name must be between 1 and 150 characters'
        });
    }

    if (cleanDescription.length > 5000) {
        return res.status(400).json({
            error: 'Description must be 5,000 characters or fewer'
        });
    }

    if (!/^(0|[1-9]\d{0,9})(\.\d{1,2})?$/.test(cleanPrice) ||
        Number(cleanPrice) <= 0
    ) {
        return res.status(400).json({
            error: 'Enter a price greater than zero with up to two decimal places'
        });
    }

    if (!categories.includes(category)) {
        return res.status(400).json({
            error: 'Choose a valid category'
        });
    }

    if (
        sizeOptions.length === 0 ||
        sizeOptions.length > 20 ||
        sizeOptions.some((size) => size.length > 30)
    ) {
        return res.status(400).json({
            error: 'Add between 1 and 20 sizes, each no longer than 30 characters'
        });
    }

    if (!['true', 'false'].includes(isFeatured)) {
        return res.status(400).json({
            error: 'Invalid featured-product setting'
        });
    }

    let uploadedPhoto;

    try {
        uploadedPhoto = await uploadProductPhoto(req.file.buffer);

        const product = await prisma.products.create({
            data: {
                name: cleanName,
                description: cleanDescription || null,
                price: cleanPrice,
                category,
                image_url: uploadedPhoto.url,
                image_public_id: uploadedPhoto.publicId,
                is_available: true,
                is_featured: isFeatured === 'true',
                sizes: {
                    create: sizeOptions.map((size) => ({ size }))
                }
            },
            include: {
                sizes: true
            }
        });

        return res.status(201).json({
            message: 'Your piece has been added',
            product
        });
    } catch (error) {
        if (uploadedPhoto) {
            try {
                await cloudinary.uploader.destroy(uploadedPhoto.publicId);
            } catch (cleanupError) {
                console.error(
                    'Uploaded photo cleanup failed:',
                    cleanupError.message
                );
            }
        }

        if (error.code === 'INVALID_IMAGE') {
            return res.status(400).json({
                error: error.message
            });
        }

        console.error('Product creation failed:', error.message);

        return res.status(500).json({
            error: 'Unable to add this piece. Please check your dashboard before trying again.'
        });
    }
});

module.exports = router;