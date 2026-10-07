const User = require('../models/User');
const SignupInfo = require('../models/SignupInfo');
const SignInInfo = require('../models/SignInInfo');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Signup with full auth flow
exports.signup = async (req, res) => {
  try {
    
    const normalize = value => typeof value === 'string' ? value.trim() : '';
    const firstName = normalize(req.body.firstName), lastName = normalize(req.body.lastName);
    const email = normalize(req.body.email).toLowerCase(), confirmEmail = normalize(req.body.confirmEmail).toLowerCase();
    const { password, confirmPassword, farmName, newsletter } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password) {
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
      return res.status(409).json({ success: false, message: 'This email is already registered. Sign in to continue.' });
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
        accountType: user.accountType,
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
    
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
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
        accountType: user.accountType,
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
exports.doctorSignup=async(req,res)=>{
 const Expert=require('../models/Expert');
 const name=String(req.body.fullName||'').trim(),email=String(req.body.email||'').trim().toLowerCase(),specialty=String(req.body.specialty||'').trim();
 if(!name||!specialty||!/^\S+@\S+\.\S+$/.test(email)||typeof req.body.password!=='string'||req.body.password.length<8)return res.status(400).json({success:false,message:'Enter your name, specialty, valid email and a password of at least 8 characters.'});
 if(req.body.password!==req.body.confirmPassword)return res.status(400).json({success:false,message:'Passwords do not match.'});
 const profile=new Expert({name,specialty,qualifications:req.body.qualifications,location:req.body.location,languages:req.body.languages,experienceYears:req.body.experienceYears,verified:false,active:true});
 try{
 await profile.validate();if(await User.findOne({email}))return res.status(409).json({success:false,message:'This email is already registered. Sign in to continue.'});
 const user=await User.create({fullName:name,email,password:await bcrypt.hash(req.body.password,10),accountType:'doctor'});
 try{profile.user=user._id;await profile.save()}catch(error){await User.deleteOne({_id:user._id});throw error}
 const token=jwt.sign({userId:user._id,email:user.email},JWT_SECRET,{expiresIn:'7d'});
 res.cookie('authToken',token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',maxAge:7*86400000});if(req.session)req.session.userId=user._id;
 res.status(201).json({success:true,token,data:{userId:user._id,email:user.email,fullName:user.fullName,accountType:user.accountType}});
 }catch(error){res.status(error.code===11000?409:error.name==='ValidationError'?400:500).json({success:false,message:error.code===11000?'This email is already registered. Sign in to continue.':error.name==='ValidationError'?error.message:'Could not create your doctor account. Please retry.'})}
};
