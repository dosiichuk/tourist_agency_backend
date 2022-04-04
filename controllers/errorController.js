const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldDB = (err) => {
  console.log('Inside duplicateDB');
  const value = err.keyValue.name;
  const message = `Duplicate field value ${value}: use a different value`;
  return new AppError(message, 400);
};

// const handleValidationErrorDB = (err) => {
//   const errors = Object.values(err.errors).map((el) => el.message);
//   const message = `Invalid input data. ${errors.join('. ')}`;
//   return new AppError(message, 400);
// };

const handleJWTError = () => {
  return new AppError('Invalid token, please log in!', 401);
};
const handleJWTExpiredError = () => {
  return new AppError('Your token expired', 401);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err,
  });
};
const sendErrorProd = (err, res) => {
  //if the error was operational, send the details, these are just common errors we can expect
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    //These are unknown errors, which may betray weaknesses of the site, so don't disclose the details
    //log it to the console
    console.error('Error ', err);
    res.status(500).json({
      status: 'error',
      message: 'Smth went wrong',
    });
  }
};

module.exports = (err, req, res, next) => {
  console.log('error is....', err);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV.trim() === 'production') {
    let error = { ...err };
    if (error.name === 'CastError') {
      //for the most common expected errors, we want custom errors (like invalid DB ids)
      //these are CastError
      error = handleCastErrorDB(error);
    }
    if (error.code === 11000) {
      error = handleDuplicateFieldDB(error);
    }
    if (error.name === 'JsonWebTokenError') {
      error = handleJWTError();
    }
    if (error.name === 'TokenExpiredError') {
      error = handleJWTExpiredError();
    }

    sendErrorProd(error, res);
  }
  next();
};
