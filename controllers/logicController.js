// --- GAME 9: RUBIK'S CUBE (Backend Config) ---
exports.getCubeConfig = (req, res) => {
    // Backend bas colors aur size batayega, button/UI ka kaam frontend ka hai
    const size = 3; 
    const faceColors = {
        front: '#ff4757',  // Red
        back: '#ffa502',   // Orange
        left: '#2ed573',   // Green
        right: '#1e90ff',  // Blue
        top: '#ffffff',    // White
        bottom: '#eccc68'  // Yellow
    };

    res.json({ size, faceColors });
};

// --- GAME 8: HOT PURSUIT (Backend Config) ---
exports.getChaseConfig = (req, res) => {
    const level = parseInt(req.params.level) || 1;
    
    // Level badhne par police ki speed aur sankhya badhegi
    const enemyCount = Math.min(2 + Math.floor(level / 2), 10);
    const speed = Math.min(2 + (level * 0.2), 6); 
    
    res.json({ level, enemyCount, speed });
};