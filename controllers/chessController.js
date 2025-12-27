exports.getChessConfig = (req, res) => {
    // Chess standard hota hai, bas turn info bhejenge
    res.json({
        mode: 'PvP',
        player1: 'Neon Cyan (White)',
        player2: 'Neon Red (Black)'
    });
};