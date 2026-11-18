require('dotenv').config();

const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const db = require('./db');

if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET is missing from .env');
}

module.exports = session({
    store: new PgSession({
        pool: db,
        tableName: 'user_sessions',
        createTableIfMissing: true
    }),
    name: 'malapi.sid',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
});