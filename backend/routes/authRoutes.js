const express = require('express');
const router = express.Router();
const {
  createUser,
  createSignupInfo,
  createSignInInfo,
} = require('../controllers/authController');

router.post('/users', createUser);
router.post('/signup-info', createSignupInfo);
router.post('/signin-info', createSignInInfo);

module.exports = router;
