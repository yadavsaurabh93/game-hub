// File: server/controllers/reflexController.js

exports.getReflexConfig = (req, res) => {
    res.json({ 
        status: 'ready', 
        message: 'Reflex Game Loaded' 
    });
};