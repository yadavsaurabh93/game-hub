exports.getLaserConfig = (req, res) => {
    const level = parseInt(req.params.level) || 1;
    
    // Level badhne par Grid bada hoga aur Mirrors badhenge
    // Level 1: 5x5, Level 5: 8x8
    const size = Math.min(5 + Math.floor(level / 2), 8); 
    const mirrorCount = size + level + 2;
    
    res.json({ level, size, mirrorCount });
};