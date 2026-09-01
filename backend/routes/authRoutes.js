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
router.post('/users', createUser);
router.post('/signup-info', createSignupInfo);
router.post('/signin-info', createSignInInfo);

module.exports = router;
