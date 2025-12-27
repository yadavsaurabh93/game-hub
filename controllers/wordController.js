// Words ka Data (Tum isme aur bhi words add kar sakte ho)
const wordsList = [
    "COMPUTER", "PROGRAM", "GAMING", "SERVER", "REACT", "NODEJS", "LAPTOP", 
    "INTERNET", "SCREEN", "KEYBOARD", "MOUSE", "BOTTLE", "PHONE", "CHARGER",
    "SCHOOL", "MARKET", "DOCTOR", "POLICE", "FRIEND", "FAMILY", "PYTHON",
    "JAVA", "SCRIPT", "HACKER", "SYSTEM", "MEMORY", "OUTPUT", "INPUT"
];

exports.getScrambleWord = (req, res) => {
    const level = parseInt(req.params.level) || 1;

    // Random Word Pick karo
    const originalWord = wordsList[Math.floor(Math.random() * wordsList.length)];

    // Word ko Scramble (Ulta-Pulta) karne ka logic
    let scrambled = originalWord.split('').sort(() => Math.random() - 0.5).join('');

    // Make sure scrambled word original jaisa na ho
    while (scrambled === originalWord) {
        scrambled = originalWord.split('').sort(() => Math.random() - 0.5).join('');
    }

    res.json({
        level: level,
        scrambled: scrambled,   // UI pe ye dikhega (e.g., "TPALOP")
        answer: originalWord    // Check karne ke liye (e.g., "LAPTOP")
    });
};