const bcrypt = require('bcryptjs');
const prisma = require('../prisma-client');

async function main() {
    try {
        const email = (process.env.SELLER_EMAIL || '')
            .trim()
            .toLowerCase();

        const password = process.env.SELLER_PASSWORD || '';

        if (
            email.length > 254 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ) {
            throw new Error('A valid seller email is required');
        }

        if (
            password.length < 12 ||
            Buffer.byteLength(password, 'utf8') > 72
        ) {
            throw new Error(
                'Password must have at least 12 characters and at most 72 bytes'
            );
        }

        const existingSeller = await prisma.seller.findFirst({
            select: { id: true }
        });

        if (existingSeller) {
            throw new Error(
                'A seller account already exists. No account was changed.'
            );
        }

        const passwordHash = await bcrypt.hash(password, 12);

        await prisma.seller.create({
            data: {
                email,
                passwordHash
            }
        });

        console.log('Seller account created successfully');
    } catch (error) {
        console.error('Seller setup failed:', error.message);
        process.exitCode = 1;
    } finally {
        await prisma.$disconnect();
    }
}

main();