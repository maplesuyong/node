const local = require('./localStrategy');
const kakao = require('./kakaoStrategy');
const { User } = require('../models');

module.exports = (passport) => {
  // serializeUser : req.session 객체에 사용자 아이디를 저장
  // user가 로그인 사용자 정보
  passport.serializeUser((user, done) => {
    // 정보를 모두 저장하면 세션의 용량에 문제가 생기므로, 아이디만 저장하라는 코드
    done(null, user.id);
  });

  // deserializeUser : 세션에 저장된 아이디를 통해 사용자 정보 객체를 불러옴 (sequelize의 find 함수로)
  // 세션에 불필요한 데이터(아이디 외)를 담아두지 않기 위한 과정
  // 위의 serializeUser의 done 함수에서 user.id가 파라미터 id가 된다
  passport.deserializeUser((id, done) => {
    User.findOne({
      where: { id },
      include: [{
        model: User,
        attributes: ['id', 'nick'],   // attributes 지정 이유 : 실수로 비밀번호를 조회하는 것을 방지하기 위함
        as: 'Followers',
      }, {
        model: User,
        attributes: ['id', 'nick'],
        as: 'Followings',
      }],
    })
      .then(user => done(null, user))   // user는 req.user에 저장
      .catch(err => done(err));
  });

  local(passport);
  kakao(passport);
};