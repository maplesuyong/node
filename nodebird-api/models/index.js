'use strict';

const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.json')[env];
const db = {};

const sequelize = new Sequelize(config.database, config.username, config.password, config);

db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.User = require('./user')(sequelize, Sequelize);
db.Post = require('./post')(sequelize, Sequelize);
db.Hashtag = require('./hashtag')(sequelize, Sequelize);
db.Domain = require('./domain')(sequelize, Sequelize);

// NodeBird의 모델은 총 5개, 즉 직접 생성한 User, Hashtag, Post와
// 시퀄라이즈가 관계를 파악하여 생성한 PostHashtag, Follow까지입니다.

// (사용자) 1:N (게시글)
db.User.hasMany(db.Post);
db.Post.belongsTo(db.User);

// (게시글) N:M (해시태그)
db.Post.belongsToMany(db.Hashtag, { through:'PostHashtag'});
db.Hashtag.belongsToMany(db.Post, { through:'PostHashtag'});

// (사용자) N:M (사용자)
// 사용자 한 명이 팔로워를 여러 명 가질 수도 있고, 여러 명을 팔로잉할 수도 있다
// Follow 모델에서 사용자 아이디를 저장하는 컬럼 이름이 둘 다 userId면
// 누가 팔로워고 누가 팔로잉 중인지 구분이 되지 않으므로 따로 설정해주어야한다
// foreignKey 옵션에 각각 followerId, followingId를 넣어주어 두 사용자 아이디를 구별
// as 옵션: 시퀄라이즈가 JOIN 작업 시 사용하는 이름
db.User.belongsToMany(db.User, {
  foreignKey: 'followingId',
  as: 'Followers',
  through: 'Follow',
});
db.User.belongsToMany(db.User, {
  foreignKey: 'followerId',
  as: 'Followings',
  through: 'Follow',
});

// (사용자) 1:N (도메인)
// 사용자 한 명이 여러 도메인을 소유할 수 있음
db.User.hasMany(db.Domain);
db.Domain.belongsTo(db.User);

module.exports = db;