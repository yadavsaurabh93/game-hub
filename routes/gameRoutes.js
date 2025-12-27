const express = require('express');
const router = express.Router();

// Controllers
const speedController = require('../controllers/speedController');
const mathController = require('../controllers/mathController');
const riddleController = require('../controllers/riddleController');
const wordController = require('../controllers/wordController');
const sequenceController = require('../controllers/sequenceController');
const reactionController = require('../controllers/reactionController');
const hackController = require('../controllers/hackController'); 
const logicController = require('../controllers/logicController');
const chessController = require('../controllers/chessController');
const laserController = require('../controllers/laserController');
const angleController = require('../controllers/angleController');
const reflexController = require('../controllers/reflexController');
// Routes
router.get('/speed/:level', speedController.getSpeedLevel);
router.get('/math/:level', mathController.getMathQuestion);
router.get('/riddle/:level', riddleController.getRiddle);
router.get('/word/:level', wordController.getScrambleWord);
router.get('/sequence/:level', sequenceController.getSequence);
router.get('/reaction', reactionController.getReactionConfig);
router.get('/hack/:level', hackController.getHackConfig);
router.get('/cube/:level', logicController.getCubeConfig);
router.get('/chess', chessController.getChessConfig);
router.get('/laser/:level', laserController.getLaserConfig);
router.get('/angle', angleController.getAngleConfig);
router.get('/reflex', reflexController.getReflexConfig);
module.exports = router;