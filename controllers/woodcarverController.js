// server/controllers/woodCarverController.js

exports.getWoodCarverConfig = (req, res) => {
    // Simple response bhej rahe hain taaki error hat jaye
    res.json({
        success: true,
        message: "Wood Carver settings loaded",
        config: {
            tools: ["Chisel", "Gouge", "Detail"],
            defaultHealth: 100
        }
    });
};