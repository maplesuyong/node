'use strict';

const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];
const db = {};

const sequelize = new Sequelize(config.database, config.username, config.password, config);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.User = require('./user')(sequelize, Sequelize);
db.Good = require('./good')(sequelize, Sequelize);
db.Auction = require('./auction')(sequelize, Sequelize);

// (사용자) 1:N (입찰)
// 한 사용자가 입찰을 여러개 할 수 있다
db.User.hasMany(db.Auction);
db.Auction.belongsTo(db.User);

// (상품) 1:N (입찰)
// 한 상품에 여러개의 입찰을 할 수 있다
db.Good.hasMany(db.Auction);
db.Auction.belongsTo(db.Good);

// 사용자와 상품 간에는 1:N 관계가 두 번 적용된다
// 사용자가 여러 상품을 '등록(owner)'할 수 있고 '낙찰(sold)'받을 수 있기 때문
db.Good.belongsTo(db.User, { as:'owner' });
db.Good.belongsTo(db.User, { as:'sold' });

module.exports = db;