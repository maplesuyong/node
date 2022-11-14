// 카카오 로그인 전략
const KakaoStrategy = require('passport-kakao').Strategy;   // Strategy 생성자 호출

const { User } = require('../models');

module.exports = (passport) => {
  passport.use(new KakaoStrategy({
    clientID: process.env.KAKAO_ID,   // 카카오에서 발급해주는 아이디 (노출 방지를 위해 .env 사용)
    callbackURL: '/auth/kakao/callback',  // 카카오로부터 인증 결과를 받을 라우터 주소
  }, async (accessToken, refreshToken, profile, done) => {
    // 인증 후 callbackURL에 적힌 주소로 accessToken, refreshToken, profile을 보낸다
    // profile: 사용자 정보 (카카오에서 보내주는 데이터)
    // console.log(profile)  // profile 데이터 확인용
    try {
      // 기존에 카카오로 로그인한 사용자가 있는지 User DB에서 조회
      const exUser = await User.findOne({ where: { snsId: profile.id, provider: 'kakao'} });
      if (exUser) {   // 있다면 done 함수 호출 (exUser를 전달)
        done(null, exUser);
      } else {  // 없다면 profile 객체에서 원하는 정보를 꺼내와 회원가입을 진행
        const newUser = await User.create({
          email: profile._json && profile._json.kaccount_email,
          nick: profile.displayName,
          snsId: profile.id,
          provider: 'kakao',
        });
        done(null, newUser);  // 사용자를 생성하는 INSERT문 수행 후, done 함수 호출
      }
    } catch (error) {
      console.error(error);
      done(error);
    }
  }));
};