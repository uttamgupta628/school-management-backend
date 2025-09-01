const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const {
  healthCheck,
  getAllSchools,
  getSchoolById,
  addSchool,
  updateSchool,
  deleteSchool,
  searchSchools
} = require('../controller/schoolController');

router.get('/health', healthCheck);
router.get('/schools', getAllSchools);
router.get('/schools/search/:term', searchSchools);
router.get('/schools/:id', getSchoolById);
router.post('/schools', upload.single('image'), addSchool);
router.put('/schools/:id', upload.single('image'), updateSchool);
router.delete('/schools/:id', deleteSchool);

module.exports = router;