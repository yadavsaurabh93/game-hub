const express = require('express');
const cors = require('cors');
const gameRoutes = require('./routes/gameRoutes'); // Yeh nayi line important hai

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Logger: Terminal mein dikhega jab game request karega
app.use((req, res, next) => {
    console.log(`➡️  [HIT] ${req.method} ${req.url}`);
    next();
});

// MAIN ROUTE: Saare games ab yahan se connect honge
app.use('/api', gameRoutes);

// Test Route
app.get('/', (req, res) => {
    res.send("🚀 SUPER GAME SERVER IS RUNNING!");
});

app.listen(PORT, () => {
    console.log(`
    =========================================
    🚀  SERVER RESTARTED & READY!
    📡  Port: ${PORT}
    🎮  Mode: Advanced
    =========================================
    `);
});