const User = require('../models/User');
const SignupInfo = require('../models/SignupInfo');
const SignInInfo = require('../models/SignInInfo');

exports.createUser = async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.createSignupInfo = async (req, res) => {
  try {
    const signupInfo = await SignupInfo.create(req.body);
    res.status(201).json({ success: true, data: signupInfo });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.createSignInInfo = async (req, res) => {
  try {
    const signInInfo = await SignInInfo.create(req.body);
    res.status(201).json({ success: true, data: signInInfo });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
