exports.getReactionConfig = (req, res) => {
    // Random delay: 2 seconds se 5 seconds ke beech
    const randomDelay = Math.floor(Math.random() * 3000) + 2000;
    
    res.json({ 
        delay: randomDelay 
    });
};