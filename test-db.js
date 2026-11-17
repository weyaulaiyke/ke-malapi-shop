const db = require('./db');

async function testConnection() {
    try {
        await db.query('SELECT NOW()');
        console.log('Connected');
    } catch (error) {
        console.error('Connection failed:', error.message);
    } finally {
        await db.end();
    }
}

testConnection();