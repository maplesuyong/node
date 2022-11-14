'use strict';

const path = require('path');
const Sequelize = require('sequelize');

// 개발환경설정 ('development' -> 개발환경, 'production' -> 배포환경, 'test' -> 테스트환경)
const env = process.env.NODE_ENV || 'development';

const config = require(path.join(__dirname,'..', 'config','config.json'))[env];
const db = {};

const sequelize = new Sequelize(config.database, config.username, config.password, config);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.User = require('./user')(sequelize, Sequelize);
db.Comment = require('./comment')(sequelize, Sequelize);

db.User.hasMany(db.Comment, { foreignKey: 'commenter', sourceKey: 'id' });
db.Comment.belongsTo(db.User, { foreignKey: 'commenter', targetKey: 'id' });

module.exports = db;
