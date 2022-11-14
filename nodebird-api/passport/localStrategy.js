// 로그인 전략
const LocalStrategy = require('passport-local').Strategy;   // Strategy 생성자 호출
const bcrypt = require('bcrypt');

const { User } = require('../models');

// done 함수 설명
// done 함수 호출 이후, passport.authenticate의 콜백 함수에서 나머지 로직 실행
// 첫번째 인자 : 서버쪽에서 에러가 발생했을 때 사용, null이면 로그인 성공, done(error)면 서버 에러
//               passport.authenticate('local', (authError, user, info))에서 authError로 전달
// 두번째 인자 : 로그인 성공 & 성공시 넘겨줄 데이터, null이면 로그인 실패
//               passport.authenticate('local', (authError, user, info))에서 user로 전달
// 세번째 인자 : 로그인 처리 과정에서 사용자 정의 에러가 발생했을 때 사용
//               passport.authenticate('local', (authError, user, info))에서 info로 전달
//              ex) 비밀번호 불일치, 존재하지 않는 회원

module.exports = (passport) => {
  passport.use(new LocalStrategy({
    // 일치하는 req.body의 속성명
    usernameField: 'email',     // req.body.email
    passwordField: 'password',  // req.body.password
  }, async (email, password, done) => {   // 실제 전략 수행, LocalStrategy의 두번째 인자
    try {                                 // 위에서 넣어준 email과 password는 async 함수의 첫번째, 두번째 인자가 된다
      // 먼저 User DB에서 로그인 시도한 이메일이 있는지 찾는다
      const exUser = await User.findOne({ where: { email } });
      if (exUser) {   // DB에 이메일이 있다면...
        // 로그인 시도한 비밀번호와 User DB의 email과 매칭되는 비밀번호를 bcrypt의 compare 함수로 바교한다
        const result = await bcrypt.compare(password, exUser.password);
        if (result) {   // 비밀번호까지 일치한다면...
          done(null, exUser);   // done 함수의 두번째 인자로 사용자 정보 exUser를 넣어 보낸다
        } else {
          done(null, false, { message: '비밀번호가 일치하지 않습니다.' });
        }
      } else {
        done(null, false, { message: '가입되지 않은 회원입니다.' });
      }
    } catch (error) {
      console.error(error);
      done(error);
    }
  }));
};