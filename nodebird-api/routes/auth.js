const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const { User } = require('../models');

const router = express.Router();

// app.js와 연결할 때 /auth 접두사를 붙인다
// /auth/login, /auth/logout

// 회원가입 라우터
router.post('/join', isNotLoggedIn, async (req, res, next) => {
  const { email, nick, password } = req.body;
  try {
    // 기존에 같은 이메일로 가입한 사용자가 있는 User db모델에서 조회
    const exUser = await User.findOne({ where: { email } });
    // 이메일 중복이면 회원가입 페이지로 리턴
    if (exUser) {
      req.flash('joinError', '이미 가입된 이메일입니다.');
      return res.redirect('/join');
    }

    // 새로운 이메일이면, 비밀번호를 암호화하고 사용자 정보를 생성
    // bcrypt 모듈의 hash 메서드로 암호화한다 (두번째 인자의 숫자가 커질수록 암호화력 증가)
    const hash = await bcrypt.hash(password, 12);
    // create => INSERT, DB에 사용자 정보를 INSERT
    await User.create({
      email,
      nick,
      password: hash,   // 비밀번호는 hash로 암호화해서 저장
    });

    return res.redirect('/');
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

// 로그인 라우터
// passport.authenticate('local') 미들웨어가 로컬 로그인 전략을 수행
// 특징 1: 미들웨어인데 라우터 미들웨어 안에 들어있다 (미들웨어에 사용자 정의 기능을 추가하고 싶을 때 이 방식 사용)
router.post('/login', isNotLoggedIn, (req, res, next) => {
  passport.authenticate('local', (authError, user, info) => {
    if (authError) {
      console.error(authError);
      return next(authError);
    }
    if (!user) {  // 로그인 실패시
      req.flash('loginError', info.message);
      return res.redirect('/');
    }
    return req.login(user, (loginError) => {  // 로그인 성공시 req.login 메서드 호출
      if (loginError) {                       // req.login은 passport.serializeUser를 호출
        console.error(loginError);            // req.login의 user 객체 인자가 serializeUser로 넘어감
        return next(loginError);
      }
      return res.redirect('/');
    });
  })(req, res, next);   // 미들웨어 내의 미들웨어에는 (req, res, next)를 붙인다
});

// 로그아웃 라우터
router.get('/logout', isLoggedIn, (req, res) => {
  req.logout(function(err) {
    req.session.destroy();  // req.session 객체의 내용을 제거
    if (err) { return next(err); }
    res.redirect('/');
  });
});

// 카카오 로그인 라우터
// passport.authenticate('kakao') -> 카카오 로그인 창으로 리다이렉트
router.get('/kakao', passport.authenticate('kakao'));
// 결과를 GET /auth/kakao/callback 으로 받는다
// 로컬 로그인과는 다르게 passport.authenticate 메서드에 콜백 함수를 제공하지 않음
router.get('/kakao/callback', passport.authenticate('kakao', {
  failureRedirect: '/',   // failureRedirect: 로그인 실패시 이동할 주소
}), (req, res) => {
  res.redirect('/');
});

module.exports = router;