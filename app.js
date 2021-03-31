const path = require('path');
const express = require('express');
const app = express();
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

//custom modules
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const AppError = require('./utilities/appError');
const globalErrorHandler = require('./controllers/errorController');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
//1) GLOBAL MIDDLEWARE START

//Serving static files
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));
//set security HTTP Header
app.use(helmet());

//development logging
if (process.env.NODE_ENV === 'development') {
  // console.log(process.env.NODE_ENV);
  app.use(morgan('dev'));
}

//Limit request from same IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP!.Please try again in an hour',
});
app.use('/api', limiter);

//Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

//data sanitization from NOSQL injection
app.use(mongoSanitize());
//data sanitize against xss
app.use(xss());
//prevent http parameter pollution
app.use(
  hpp({
    whitelist: ['duration', 'ratingsAverage', 'ratingsQuantity', 'duration', 'difficulty', 'price'],
  })
);

//test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  next();
});
// END OF MIDDLEWARE

//ROUTES
app.use('/api/v1/tours', tourRouter); //middleware
app.use('/api/v1/users', userRouter); //middleware
app.use('/api/v1/reviews', reviewRouter); //middleware
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'failed',
  //   message: `Can not find ${req.originalUrl} on this server!`,
  // });
  // const err = new Error(`Can not find ${req.originalUrl} on this server!`);
  // err.statusCode = 404;
  // err.status = 'failed';
  next(new AppError(`Can not find ${req.originalUrl} on this server!`, 404));
});
app.use(globalErrorHandler);
//END OF ROUTES

//SERVER START
module.exports = app;
