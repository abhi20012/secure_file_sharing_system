const router = require('express').Router();
const userController = require('../controllers/user_controller');


router.get('/Register', userController.Register);
router.post('/Register', userController.Create);
router.get('/Login', userController.Login);
router.post('/Login', userController.LoginUser);

router.get('/ForgotPassword', userController.ForgotPassword);
router.post('/SendRecoveryLink', userController.RecoveryLink);
router.post('/ResetPassword', userController.ResetPasswordLink);
router.get('/Logout', userController.Logout);

router.get('/verifyEmail/:email/:verification_token', userController.VerifyEmail);
router.get('/ResetPassword/:email/:reset_token', userController.ResetPassword);

module.exports = router;