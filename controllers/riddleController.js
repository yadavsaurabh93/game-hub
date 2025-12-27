const riddles = require('../data/riddles');

exports.getRiddle = (req, res) => {
    const level = parseInt(req.params.level) || 1;
    
    // --- RANDOM LOGIC ---
    // Math.random() se 0 se 100 ke beech koi bhi number ayega
    const randomIndex = Math.floor(Math.random() * riddles.length);
    
    const currentRiddle = riddles[randomIndex];

    // Hum Difficulty bhi Random set karenge taaki "Danger" feel aaye
    const difficulties = ["Easy", "Medium", "Hard", "🔥 DANGER 🔥"];
    // Danger aane ke chances thode kam rakhte hain, ya random hi rehne do
    const randomDiff = difficulties[Math.floor(Math.random() * difficulties.length)];

    res.json({
        level: level,
        question: currentRiddle.q,
        options: currentRiddle.opts,
        answer: currentRiddle.a,
        difficulty: randomDiff // Yeh naya feature hai
    });
};