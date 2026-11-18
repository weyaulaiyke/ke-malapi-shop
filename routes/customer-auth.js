const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../prisma-client');
const { rateLimit } = require('express-rate-limit');
const requireCustomer = require('../middleware/require-customer');

const router = express.Router();

router.post('/signup', async(req, res) => {
    const { name, email, password } = req.body || {};

    if (
        typeof name !== 'string' ||
        typeof email !== 'string' ||
        typeof password !== 'string'
    ) {
        return res.status(400).json({
            error: 'Name, email and password are required'
        });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 1 || cleanName.length > 150) {
        return res.status(400).json({
            error: 'Name must be between 1 and 150 characters'
        });
    }

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
            error: 'Password must have at least 12 characters, one uppercase letter and one special character, and be no longer than 72 bytes.'
        });
    }

    try {
        const passwordHash = await bcrypt.hash(password, 12);

        const customer = await prisma.customer.create({
            data: {
                name: cleanName,
                email: cleanEmail,
                passwordHash
            },
            select: {
                id: true,
                name: true,
                email: true
            }
        });

        return req.session.regenerate((error) => {
            if (error) {
                console.error('Signup session failed:', error.message);

                return res.status(500).json({
                    error: 'Your account was created, but automatic login failed. Please log in.'
                });
            }

            req.session.customerId = customer.id;

            req.session.save((error) => {
                if (error) {
                    console.error('Signup session save failed:', error.message);

                    return res.status(500).json({
                        error: 'Your account was created, but automatic login failed. Please log in.'
                    });
                }

                return res.status(201).json({
                    message: 'Account created successfully',
                    customer
                });
            });
        });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({
                error: 'An account with this email already exists'
            });
        }

        console.error('Customer signup failed:', error.message);

        return res.status(500).json({
            error: 'Unable to create account'
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
        const customer = await prisma.customer.findUnique({
            where: { email: cleanEmail }
        });

        const passwordMatches = customer ?
            await bcrypt.compare(password, customer.passwordHash) :
            false;

        if (!passwordMatches) {
            return res.status(401).json({
                error: 'Invalid email or password'
            });
        }

        req.session.regenerate((error) => {
            if (error) {
                console.error('Session creation failed:', error.message);

                return res.status(500).json({
                    error: 'Unable to log in'
                });
            }

            req.session.customerId = customer.id;

            req.session.save((error) => {
                if (error) {
                    console.error('Session save failed:', error.message);

                    return res.status(500).json({
                        error: 'Unable to log in'
                    });
                }

                return res.json({
                    message: 'Logged in successfully',
                    customer: {
                        id: customer.id,
                        name: customer.name,
                        email: customer.email
                    }
                });
            });
        });
    } catch (error) {
        console.error('Customer login failed:', error.message);

        return res.status(500).json({
            error: 'Unable to log in'
        });
    }
});

router.get('/me', requireCustomer, (req, res) => {
    res.json({
        customer: req.customer
    });
});

router.post('/logout', (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            console.error('Logout failed:', error.message);

            return res.status(500).json({
                error: 'Unable to log out'
            });
        }

        res.clearCookie('malapi.sid', {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });

        return res.json({
            message: 'Logged out successfully'
        });
    });
});

module.exports = router;