const router = require('express').Router();
const indexController = require('../controllers/index_controller');


router.get('/', indexController.index);

module.exports = router;