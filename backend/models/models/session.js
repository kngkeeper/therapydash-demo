const { DataTypes } = require('sequelize');
const moment = require('moment');
const sequelize = require('../database');
const { ROLES } = require('./user');

// Session status constants
const SESSION_STATUS = {
  AVAILABLE: 'available',
  BOOKED: 'booked',
  CANCELLED: 'cancelled',
  RESCHEDULED: 'rescheduled'
};

const Session = sequelize.define('Session', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  datetime: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: true,
      isFuture(value) {
        if (value < new Date()) {
          throw new Error('Session date must be in the future');
        }
      }
    }
  },
  duration: {
    type: DataTypes.INTEGER, // Duration in minutes
    allowNull: false,
    defaultValue: 60,
    validate: {
      min: 30,
      max: 120
    }
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: SESSION_STATUS.AVAILABLE,
    validate: {
      isIn: [Object.values(SESSION_STATUS)]
    }
  },
  cancelledBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  originalDatetime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      async feedbackOnlyAfterSession() {
        if (this.feedback && this.datetime > new Date()) {
          throw new Error('Feedback can only be added after the session date');
        }
      },
      len: [0, 1000] // Limit feedback to 1000 characters
    }
  },
  therapistId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  clientId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  hooks: {
    beforeSave: (session) => {
      session.datetime = moment(session.datetime).utc().toDate(); // Convert to UTC
    }
  },
  validate: {
    async validateUsers() {
      const therapist = await this.getTherapist();
      if (!therapist || therapist.role !== ROLES.THERAPIST) {
        throw new Error('Session creator must be a therapist');
      }

      // Only validate client if one is assigned
      if (this.clientId) {
        const client = await this.getClient();
        if (!client || client.role !== ROLES.CLIENT) {
          throw new Error('Assigned user must be a client');
        }
      }
    }
  }
});

// Set up associations
Session.belongsTo(sequelize.models.User, {
  as: 'client',
  foreignKey: { name: 'clientId', allowNull: true },
  onDelete: 'SET NULL'
});

Session.belongsTo(sequelize.models.User, {
  as: 'therapist',
  foreignKey: { name: 'therapistId', allowNull: false },
  onDelete: 'RESTRICT'
});

// Instance methods
Session.prototype.cancel = async function(userId) {
  if (this.status === SESSION_STATUS.CANCELLED) {
    throw new Error('Session is already cancelled');
  }
  this.status = SESSION_STATUS.CANCELLED;
  this.cancelledBy = userId;
  await this.save();
};

Session.prototype.reschedule = async function(newDatetime) {
  if (this.status === SESSION_STATUS.CANCELLED) {
    throw new Error('Cannot reschedule cancelled session');
  }
  this.originalDatetime = this.datetime;
  this.datetime = newDatetime;
  this.status = SESSION_STATUS.RESCHEDULED;
  await this.save();
};

Session.prototype.book = async function(clientId) {
  if (this.status !== SESSION_STATUS.AVAILABLE) {
    throw new Error('Session is not available for booking');
  }

  this.clientId = clientId;
  this.status = SESSION_STATUS.BOOKED;
  await this.save();
};

// Export constants with model
Session.STATUS = SESSION_STATUS;
module.exports = Session;
