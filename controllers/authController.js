const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
  });
  createSendToken(newUser, 201, res);
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
  createSendToken(user, 200, res);
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
  const freshUser = await User.findOne({ _id: decoded.id });
  if (!freshUser) return next(new AppError('The user does not exist', 401));
  //check if user changed password after the token was issued

  // if (freshUser.changedPasswordAfter(decoded.iat)) {
  //   return next(new AppError('User recently changed password', 401));
  // }
  req.user = freshUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles will be an array

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Your do not have necessary permission', 403));
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //get user based on posted email
  console.log(req.body.email);
  const user = await User.findOne({ email: req.body.email });
  if (!user) return next(new AppError('User not found', 404));

  //generate random token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  //send the token as an email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Forgot your password? Submit a patch req with new password to ${resetURL}. \n If not, ignore the message`;
  try {
    await sendEmail({
      email: user.email,
      subject: 'Password reset token',
      text: message,
    });
    res.status(200).json({
      status: 'success',
      message: 'Token sent',
    });
  } catch (err) {
    user.createPasswordResetToken = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('The error occured with sending email', 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  //if token has not expired and the user exists, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  //update the changedPasswordAt property for the user

  //log the user in by sending a new token
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1. Get user from the db
  const user = await User.findById(req.user.id).select('+password');

  //2. check if Posted password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return new AppError('Your current password is wrong', 401);
  }
  //3. if so, update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //4. send JWT to the user with the new password
  createSendToken(user, 200, res);
});
