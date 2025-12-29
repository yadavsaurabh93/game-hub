// server/controllers/highwayRacerController.js

// 1. GET CONFIG (Game start hone par settings bhejna)
exports.getRacerConfig = (req, res) => {
    try {
        res.status(200).json({
            success: true,
            message: "Highway Racer config loaded",
            config: {
                initialSpeed: 5,
                lanes: 3,
                playerColor: '#2979FF',
                enemyColors: ['#D32F2F', '#FFFFFF', '#FFEB3B', '#4CAF50']
            }
        });
    } catch (error) {
        console.error("Error loading config:", error);
        res.status(500).json({ 
            success: false, 
            message: "Server Error" 
        });
    }
};

// 2. SAVE SCORE (High Score save karna)
exports.saveHighScore = (req, res) => {
    try {
        const { score } = req.body;
        
        // Yahan database logic aayegi future mein
        console.log(`🏎️ Highway Racer New Score: ${score}`);
        
        res.status(200).json({
            success: true,
            message: "Score saved successfully",
            savedScore: score
        });
    } catch (error) {
        console.error("Error saving score:", error);
        res.status(500).json({ 
            success: false, 
            message: "Could not save score" 
        });
    }
};