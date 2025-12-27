exports.getAngleConfig = (req, res) => {
    // Backend bas success status bhejega, logic frontend par hai
    res.json({ status: 'ready', difficulty: 'normal' });
};