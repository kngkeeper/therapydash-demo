require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const sessionsRouter = require('./routes/sessions');
const { sequelize } = require('./models');

const app = express();

app.use(cors({
  origin: [
    /^https:\/\/(.*\.)?therapydash\.7447a\.ca$/,
    'https://therapyapi.7447a.ca',
    'http://localhost:4200'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization',
    'Origin',
    'X-Requested-With',
    'Accept',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Headers',
    'Access-Control-Allow-Methods'
  ],
  exposedHeaders: ['Access-Control-Allow-Origin'],
  preflightContinue: true,
  optionsSuccessStatus: 204
}));

const PORT = process.env.PORT || 3000;

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Add this after CORS middleware but before routes
app.options('*', cors()); // Enable pre-flight for all routes

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/sessions', sessionsRouter);

// Synchronize models with database
sequelize.sync().then(() => {
    console.log('Database synchronized');
}).catch(err => {
    console.error('Error synchronizing database:', err);
});

module.exports = app;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
