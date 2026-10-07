const express = require('express');
const router = express.Router();
const {
  signup,
  signin,
  createUser,
  createSignupInfo,
  createSignInInfo,
} = require('../controllers/authController');

router.post('/signup', signup);
router.post('/signin', signin);

module.exports = router;
router.post('/doctor/signup',require('../controllers/authController').doctorSignup);
