const jwt = require('jsonwebtoken');

const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });
  const token = signToken(newUser._id);

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //check whether email and pass exist in database
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }
  //check whether user exists in database and whether credentials are correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  //send a token to the client
  const token = signToken(user._id);
  res.status(200).json({
    status: 'success',
    token,
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  //get the token and check if the token exists
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(new AppError('You are not logged in. Please log in', 401));
  }
  //validate the token to check whether the token has not been tempered with
  const decoded = await jwt.verify(token, process.env.JWT_SECRET);
  //check whether the user still exists
  const freshUser = await User.find({ _id: decoded.id });
  if (!freshUser) return next(new AppError('The user does not exist', 401));
  //check if user changed password after the token was issued
  console.log('user', freshUser);
  // if (freshUser.changedPasswordAfter(decoded.iat)) {
  //   return next(new AppError('User recently changed password', 401));
  // }
  req.user = freshUser;
  next();
});
