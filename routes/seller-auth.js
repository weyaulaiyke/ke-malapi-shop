const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { rateLimit } = require('express-rate-limit');
const prisma = require('../prisma-client');

const router = express.Router();

const setupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
        error: 'Too many setup attempts. Please try again later.'
    }
});

function hashKey(value) {
    return crypto.createHash('sha256').update(value).digest();
}

router.post('/setup', setupLimiter, async(req, res) => {
    const configuredKey = process.env.SELLER_SETUP_KEY;

    if (!configuredKey) {
        return res.status(503).json({
            error: 'Seller setup is not enabled'
        });
    }

    const { setupKey, email, password } = req.body || {};

    if (
        typeof setupKey !== 'string' ||
        typeof email !== 'string' ||
        typeof password !== 'string'
    ) {
        return res.status(400).json({
            error: 'Setup key, email and password are required'
        });
    }

    if (!crypto.timingSafeEqual(hashKey(setupKey), hashKey(configuredKey))) {
        return res.status(403).json({
            error: 'Invalid setup key'
        });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (
        cleanEmail.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
        return res.status(400).json({
            error: 'Enter a valid email address'
        });
    }

    if (
        password.length < 12 ||
        Buffer.byteLength(password, 'utf8') > 72 ||
        !/[A-Z]/.test(password) ||
        !/[^A-Za-z0-9\s]/.test(password)
    ) {
        return res.status(400).json({
            error: 'Use at least 12 characters, one uppercase letter and one special character. Maximum password length is 72 bytes.'
        });
    }

    try {
        const existingSeller = await prisma.seller.findUnique({
            where: { accountKey: 'owner' },
            select: { id: true }
        });

        if (existingSeller) {
            return res.status(409).json({
                error: 'Seller registration is closed. Please log in.'
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const seller = await prisma.seller.create({
            data: {
                accountKey: 'owner',
                email: cleanEmail,
                passwordHash
            },
            select: {
                id: true,
                email: true
            }
        });

        return req.session.regenerate((error) => {
            if (error) {
                console.error('Seller session failed:', error.message);

                return res.status(500).json({
                    error: 'Your seller account was created. Please log in.'
                });
            }

            req.session.sellerId = seller.id;

            req.session.save((error) => {
                if (error) {
                    console.error('Seller session save failed:', error.message);

                    return res.status(500).json({
                        error: 'Your seller account was created. Please log in.'
                    });
                }

                return res.status(201).json({
                    message: 'Seller account created successfully',
                    seller
                });
            });
        });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({
                error: 'Seller registration is closed. Please log in.'
            });
        }

        console.error('Seller setup failed:', error.message);

        return res.status(500).json({
            error: 'Unable to complete seller setup'
        });
    }
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
        error: 'Too many login attempts. Please try again later.'
    }
});

router.post('/login', loginLimiter, async(req, res) => {
    const { email, password } = req.body || {};

    if (
        typeof email !== 'string' ||
        typeof password !== 'string'
    ) {
        return res.status(400).json({
            error: 'Email and password are required'
        });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail ||
        cleanEmail.length > 254 ||
        !password ||
        Buffer.byteLength(password, 'utf8') > 72
    ) {
        return res.status(400).json({
            error: 'Invalid email or password'
        });
    }

    try {
        const seller = await prisma.seller.findUnique({
            where: {
                accountKey: 'owner'
            }
        });

        const passwordMatches = seller ?
            await bcrypt.compare(password, seller.passwordHash) :
            false;

        if (!seller ||
            seller.email !== cleanEmail ||
            !passwordMatches
        ) {
            return res.status(401).json({
                error: 'Invalid email or password'
            });
        }

        req.session.regenerate((error) => {
            if (error) {
                console.error('Seller session failed:', error.message);

                return res.status(500).json({
                    error: 'Unable to log in'
                });
            }

            req.session.sellerId = seller.id;

            req.session.save((error) => {
                if (error) {
                    console.error('Seller session save failed:', error.message);

                    return res.status(500).json({
                        error: 'Unable to log in'
                    });
                }

                return res.json({
                    message: 'Logged in successfully',
                    seller: {
                        id: seller.id,
                        email: seller.email
                    }
                });
            });
        });
    } catch (error) {
        console.error('Seller login failed:', error.message);

        return res.status(500).json({
            error: 'Unable to log in'
        });
    }
});

module.exports = router;