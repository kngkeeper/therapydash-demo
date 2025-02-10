const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const User = require('../models').User;
const jwt = require('jsonwebtoken');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

/* POST create user */
router.post('/register', async function(req, res, next) {
  try {
    // Extract user data from request body
    const { email, password, name, surname, role } = req.body;

    // Create new user
    const newUser = await User.create({
      email: email,
      password: password,
      name: name,
      surname: surname,
      role: role
    });

    // Send success response
    res.status(201).json({
      status: 'success',
      data: {
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          name: newUser.name,
          surname: newUser.surname
        }
      }
    });
  } catch (error) {
    // Handle validation errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
    // Handle other errors
    next(error);
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid login credentials'
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, surname: user.surname, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      status: 'success',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          surname: user.surname,
          role: user.role
        }
      }
    });
  } catch (error) { console.error(error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
