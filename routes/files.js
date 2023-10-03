const router = require('express').Router();

const fileController = require('../controllers/files_controller');

router.get('/MyUploads/:_id?', fileController.MyUploads);

router.post("/CreateFolder", fileController.CreateFolder);

router.post('/UploadFile', fileController.UploadFile);



module.exports = router;