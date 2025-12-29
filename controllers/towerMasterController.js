// server/controllers/towerMasterController.js

// Game ki settings bhejne ke liye
exports.getTowerConfig = (req, res) => {
    try {
        res.status(200).json({
            success: true,
            message: "Tower Master config loaded",
            config: {
                initialSpeed: 4,
                baseBlockSize: 200,
                blockHeight: 40,
                colors: {
                    skyTop: '#87CEEB',
                    skyBottom: '#E0F7FA'
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// High Score save karne ke liye (Future use)
exports.saveHighScore = (req, res) => {
    const { score } = req.body;
    // Yahan database logic aa sakti hai
    console.log(`New High Score Received: ${score}`);
    
    res.json({
        success: true,
        message: "Score saved successfully"
    });
};