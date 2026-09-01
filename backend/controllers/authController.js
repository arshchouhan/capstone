const User = require('../models/User');
const SignupInfo = require('../models/SignupInfo');
const SignInInfo = require('../models/SignInInfo');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Signup with full auth flow
exports.signup = async (req, res) => {
  try {
    console.log('Signup request received:', req.body);
    
    const { firstName, lastName, email, confirmEmail, password, confirmPassword, farmName, newsletter } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password) {
      console.log('Missing required fields:', { firstName, lastName, email, password });
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (email !== confirmEmail) {
      console.log('Emails do not match:', { email, confirmEmail });
      return res.status(400).json({ success: false, message: 'Emails do not match' });
    }

    if (password !== confirmPassword) {
      console.log('Passwords do not match');
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('Password hashed');

    // Create user in User model
    const user = await User.create({
      fullName: `${firstName} ${lastName}`,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'user',
    });
    console.log('User created:', user._id);

    // Create signup info
    const signupInfo = await SignupInfo.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      confirmEmail: confirmEmail.toLowerCase(),
      password: hashedPassword,
      confirmPassword: hashedPassword,
      farmName: farmName || '',
      sendEmailUpdates: newsletter || false,
      user: user._id,
    });
    console.log('SignupInfo created:', signupInfo._id);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    console.log('JWT token generated');

    // Set cookie
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Set session
    req.session.userId = user._id;
    req.session.userEmail = user.email;
    console.log('Session set');

    console.log('Signup successful for:', user.email);
    res.status(201).json({
      success: true,
      message: 'Signup successful',
      data: {
        userId: user._id,
        email: user.email,
        fullName: user.fullName,
      },
      token,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Signin with authentication
exports.signin = async (req, res) => {
  try {
    console.log('Signin request received:', req.body);
    
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    console.log('Password valid for:', email);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set cookie
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Set session
    req.session.userId = user._id;
    req.session.userEmail = user.email;

    console.log('Signin successful for:', user.email);
    res.status(200).json({
      success: true,
      message: 'Signin successful',
      data: {
        userId: user._id,
        email: user.email,
        fullName: user.fullName,
      },
      token,
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

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
