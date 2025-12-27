exports.getSpeedLevel = (req, res) => {
    // URL se level nikalo (agar kuch nahi aaya to 1 maano)
    const level = parseInt(req.params.level) || 1;
    
    // --- TIME CALCULATION LOGIC ---
    // Base Time: 45 seconds start mein
    let baseTime = 45;
    
    // Har level par 0.35 seconds kam honge
    let timeDeduction = level * 0.35;
    
    // Math.max use kiya taaki time kabhi 10 seconds se kam na ho
    // Warna game impossible ho jayega
    let timeAllowed = Math.max(10, Math.floor(baseTime - timeDeduction));

    // --- DYNAMIC MESSAGE ---
    let msg = "Start clicking!";
    if (level > 20) msg = "Speed badhao! ⚡";
    if (level > 50) msg = "Super Fast Mode! 🔥";
    if (level > 80) msg = "GOD MODE ON! 🚀";

    res.json({
        level: level,
        timeLimit: timeAllowed,
        gridSize: 20, // Hum 1 se 20 tak numbers dhoondh rahe hain
        message: msg
    });
};