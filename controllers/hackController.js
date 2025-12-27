exports.getHackConfig = (req, res) => {
    const level = parseInt(req.params.level) || 1;

    // Jitna bada level, utne zyada firewalls todne padenge
    const layersCount = Math.min(3 + Math.floor(level / 2), 8); 
    
    let layers = [];
    for(let i=0; i<layersCount; i++) {
        // Har layer pichli wali se tez hogi
        // Target area chhota hota jayega
        layers.push({
            speed: Math.max(10, 40 - (level * 2) - (i * 3)), // Lower is faster (ms per tick)
            width: Math.max(10, 30 - (level * 1)), // Target area width (%)
            position: Math.floor(Math.random() * 60) + 10 // Random position (10% to 70%)
        });
    }

    res.json({
        level: level,
        layers: layers
    });
};