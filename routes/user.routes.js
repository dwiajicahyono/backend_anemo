const multer = require('multer');
const express = require('express');
const fs = require('fs');

const router = express.Router();
const controller = require('../controllers/controllers');

const anemo_3D = '3d_anemo';

const createDirectoryIfNotExist = (directoryName) => {
    if (!fs.existsSync(directoryName)) {
      fs.mkdirSync(directoryName);
      console.log(`Direktori ${directoryName} berhasil dibuat.`);
    } else {
      console.log(`Direktori ${directoryName} sudah ada.`);
    }
};

createDirectoryIfNotExist(anemo_3D);

const storageUp3D = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, anemo_3D);
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname);
    },
});

const uploadUp3D = multer({ storage: storageUp3D });
router.get('/', (req, res) => {
    res.json({ message: 'Dwi Dev X Sepuh' });
  });

router.get('/get50_3d_anemo', controller.get50anemo3d);
router.get('/edstation_latest', controller.getlastanemo3d);
router.get('/gas_daily', controller.carbondaily);
router.get('/anemo_daily', controller.anemodaily);
router.get('/gas_weekly', controller.carbonweekly);
router.get('/anemo_weekly', controller.anemoweekly);
router.get('/gas_monthly', controller.carbonmonthly);
router.get('/anemo_monthly', controller.anemomonthly);
// router.get('/carbon_latest', controller.getlatestanemo3d);
router.get('/downloadanemo3d', controller.downloadanemo3d);
router.post('/up3d_anemo', uploadUp3D.single('csvFile'), controller.add3dAnemo);

// router datalogger
router.get('/datalog_latest', controller.getlastdatalog);
router.get('/datalog_10data', controller.get10datalog);
router.get('/datalog_daily', controller.dataloggerdaily);
router.get('/datalog_weekly', controller.dataloggerweekly);
router.get('/datalog_monthly', controller.dataloggermonthly);
// Jangan lupa untuk mengekspor router Anda
module.exports = router;
