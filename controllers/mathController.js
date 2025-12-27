// Random number helper function
const getRandom = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

exports.getMathQuestion = (req, res) => {
    const level = parseInt(req.params.level) || 1;
    let n1, n2, operator, ans, questionStr;

    // --- DIFFICULTY LEVELS ---
    
    // Level 1-20: Easy (Sirf Plus + aur Minus -)
    if (level <= 20) {
        operator = Math.random() > 0.5 ? '+' : '-';
        n1 = getRandom(5, 50);
        n2 = getRandom(1, 20);
        
        // Minus mein answer negative na aaye, isliye bada number pehle
        if (operator === '-') {
            if (n1 < n2) [n1, n2] = [n2, n1]; 
        }
    } 
    // Level 21-50: Medium (Multiplication * aa jayega)
    else if (level <= 50) {
        const ops = ['+', '-', '*'];
        operator = ops[getRandom(0, 2)];
        
        if (operator === '*') {
            n1 = getRandom(2, 12);
            n2 = getRandom(2, 9);
        } else {
            n1 = getRandom(20, 100);
            n2 = getRandom(5, 30);
        }
    } 
    // Level 51-100: Hard (Division / aur bade numbers)
    else {
        const ops = ['+', '-', '*', '/'];
        operator = ops[getRandom(0, 3)];
        
        if (operator === '/') {
            // Division logic: Aisa number jo poora divide ho (Point mein na aaye)
            n2 = getRandom(2, 10); // Divisor
            n1 = n2 * getRandom(2, 15); // Dividend
        } else if (operator === '*') {
            n1 = getRandom(5, 20);
            n2 = getRandom(5, 15);
        } else {
            n1 = getRandom(50, 500);
            n2 = getRandom(20, 100);
        }
    }

    // --- ANSWER CALCULATION ---
    switch(operator) {
        case '+': ans = n1 + n2; break;
        case '-': ans = n1 - n2; break;
        case '*': ans = n1 * n2; break;
        case '/': ans = n1 / n2; break;
    }

    questionStr = `${n1} ${operator} ${n2}`;

    // --- OPTIONS GENERATION (1 Sahi + 3 Galat) ---
    let options = new Set();
    options.add(ans); // Sahi jawab sabse pehle add karo

    while (options.size < 4) {
        // Galat options sahi jawab ke aas-paas hone chahiye
        // Jaise agar answer 50 hai, toh options 48, 52, 55 ho sakte hain
        let wrong = ans + getRandom(-10, 10);
        
        // Negative options avoid karein (agar answer positive hai)
        if (wrong !== ans && wrong >= 0) {
            options.add(wrong);
        }
    }

    // Options ko shuffle karke bhejenge taaki answer hamesha pehla na ho
    res.json({
        level: level,
        q: questionStr,
        opts: Array.from(options).sort(() => Math.random() - 0.5),
        ans: ans
    });
};