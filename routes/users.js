const router = require('express').Router();
const userController = require('../controllers/user_controller');


router.get('/Register', userController.Register);
router.post('/Register', userController.Create);

router.get('/verifyEmail/:email/:verification_token', userController.VerifyEmail);

module.exports = router;