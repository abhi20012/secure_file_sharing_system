const router = require('express').Router();
const indexController = require('../controllers/index_controller');
console.log("Router Loaded")


router.get('/', indexController.index);


router.use('/users', require('./users'));


module.exports = router;