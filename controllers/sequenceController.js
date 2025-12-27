exports.getSequence = (req, res) => {
    const level = parseInt(req.params.level) || 1;
    
    // Level 1 mein 3 steps, Level badhne par steps badhenge
    const length = 2 + level; 
    let sequence = [];
    
    // CHANGE: 4 ki jagah 9 karo taaki saare 9 buttons (0-8) use ho sakein
    for(let i=0; i<length; i++) {
        sequence.push(Math.floor(Math.random() * 9)); 
    }
    
    res.json({ 
        level: level, 
        sequence: sequence 
    });
};