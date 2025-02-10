const { DataTypes } = require('sequelize');
const sequelize = require('../database');
const bcrypt = require('bcrypt');

// Role constants
const ROLES = {
  THERAPIST: 'therapist',
  CLIENT: 'client'
};

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  surname: {
    type: DataTypes.STRING,
    allowNull: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      min: 8
    }
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [[ROLES.THERAPIST, ROLES.CLIENT]]
    }
  }
}, {
  hooks: {
    beforeSave: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Instance method to check password
User.prototype.verifyPassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

// Role checker methods
User.prototype.isTherapist = function() {
  return this.role === ROLES.THERAPIST;
};

User.prototype.isClient = function() {
  return this.role === ROLES.CLIENT;
};

// Export constants with model
User.ROLES = ROLES;
module.exports = User;
