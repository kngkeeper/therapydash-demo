const express = require('express');
const { Op } = require('sequelize');
const router = express.Router();
const Session = require('../models').Session;
const User = require('../models').User;
const authMiddleware = require('../middleware/auth');

// Protect all routes
router.use(authMiddleware);

// Get all sessions for current user
router.get('/', async (req, res) => {
  try {
    const sessions = await Session.findAll({
      where: {
        [Op.or]: [
          { clientId: req.user.id },
          { therapistId: req.user.id }
        ] // could be made faster by using separate queries
      },
      order: [['datetime', 'ASC']],
      include: [
        {
          model: User,
          as: 'therapist',
          attributes: ['id', 'name', 'surname']
        },
        {
          model: User,
          as: 'client',
          attributes: ['id', 'name', 'surname']
        }
      ]
    });
    res.json({ status: 'success', data: { sessions } });
  } catch (error) { console.error(error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get available upcoming sessions
router.get('/available', async (req, res) => {
  try {
    const {
      therapistId,
      page = 1,
      limit = 10
    } = req.query;

    const query = {
      where: {
        status: Session.STATUS.AVAILABLE,
        datetime: {
          [Op.gt]: new Date()
        }
      },
      order: [['datetime', 'ASC']],
      include: [{
        model: User,
        as: 'therapist',
        attributes: ['id', 'name', 'surname']
      }],
      offset: (page - 1) * limit,
      limit: parseInt(limit)
    };

    // Add therapist filter if provided
    if (therapistId) {
      query.where.therapistId = therapistId;
    }

    const { count, rows: sessions } = await Session.findAndCountAll(query);

    res.json({
      status: 'success',
      data: {
        sessions,
        pagination: {
          total: count,
          pages: Math.ceil(count / limit),
          currentPage: page
        }
      }
    });
  } catch (error) { console.error(error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Create new session
router.post('/', async (req, res) => {
  try {
    const { therapistId, datetime, duration } = req.body;

    // Convert Unix timestamp to Date object
    const sessionDatetime = new Date(datetime * 1000);

    const session = await Session.create({
      therapistId,
      datetime: sessionDatetime,
      duration,
      status: Session.STATUS.AVAILABLE
    });

    res.status(201).json({ status: 'success', data: { session } });
  } catch (error) {
    console.error(error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ status: 'error', message: error.message });
    }
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Book session (client only)
router.patch('/:id/book', async (req, res) => {
  try {
    const session = await Session.findByPk(req.params.id);

    if (!session) {
      return res.status(404).json({
        status: 'error',
        message: 'Session not found'
      });
    }

    if (req.user.role !== User.ROLES.CLIENT) {
      return res.status(403).json({
        status: 'error',
        message: 'Only clients can book sessions'
      });
    }

    await session.book(req.user.id);
    res.json({ status: 'success', data: { session } });

  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
});

// Reschedule session
router.patch('/:id/reschedule', async (req, res) => {
  try {
    const session = await Session.findByPk(req.params.id);

    if (!session) {
      return res.status(404).json({ status: 'error', message: 'Session not found' });
    }

    if (session.clientId !== req.user.id && session.therapistId !== req.user.id) {
      return res.status(403).json({ status: 'error', message: 'Unauthorized' });
    }

    const newDatetime = req.body.datetime;
    // Convert Unix timestamp to Date object
    const sessionDatetime = new Date(newDatetime * 1000);
    await session.reschedule(sessionDatetime);
    res.json({ status: 'success', data: { session } });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
});

// Cancel session
router.patch('/:id/cancel', async (req, res) => {
  try {
    const session = await Session.findByPk(req.params.id);

    if (!session) {
      return res.status(404).json({ status: 'error', message: 'Session not found' });
    }

    if (session.clientId !== req.user.id && session.therapistId !== req.user.id) {
      return res.status(403).json({ status: 'error', message: 'Unauthorized' });
    }

    await session.cancel(req.user.id);
    res.json({ status: 'success', data: { session } });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
});

// Add feedback (client only, after session)
router.post('/:id/feedback', async (req, res) => {
  try {
    const session = await Session.findByPk(req.params.id);

    if (!session) {
      return res.status(404).json({ status: 'error', message: 'Session not found' });
    }

    if (session.clientId !== req.user.id) {
      return res.status(403).json({ status: 'error', message: 'Only clients can add feedback' });
    }

    const { feedback } = req.body;
    session.feedback = feedback;
    await session.save();

    res.json({ status: 'success', data: { session } });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
