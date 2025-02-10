const sequelize = require('./database');
const User = require('./models/user');
const Session = require('./models/session');
// Import other models here

// Define associations here
User.hasMany(Session, { as: 'client', foreignKey: 'clientId' });
User.hasMany(Session, { as: 'therapist', foreignKey: 'therapistId' });
// Post.belongsTo(User);

module.exports = {
  sequelize,
  User,
  Session
  // Export other models
};
