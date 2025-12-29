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
const jungleController = require('../controllers/jungleController');
const woodCarverController = require('../controllers/woodCarverController');
const towerMasterController = require('../controllers/towerMasterController');
const highwayRacerController = require('../controllers/highwayRacerController'); // ✅ ADDED THIS

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
router.get('/jungle/config', jungleController.getJungleConfig);
router.get('/wood-carver/config', woodCarverController.getWoodCarverConfig);
router.post('/tower-master/score', towerMasterController.saveHighScore);

// ✅ Highway Racer Route Added
router.get('/racer/config', highwayRacerController.getRacerConfig);
router.post('/racer/score', highwayRacerController.saveHighScore);

module.exports = router;