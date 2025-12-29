exports.getJungleConfig = (req, res) => {
    // Jungle Flip ki initial settings
    res.json({
        gravity: 0.6,
        jumpForce: 12,
        speedStart: 6,
        theme: "nature",
        message: "Welcome to the Jungle! Run & Flip! 🌳"
    });
};