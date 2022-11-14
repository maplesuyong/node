// Passport는 req 객체에 isAuthenticated 메서드를 추가한다

const jwt = require('jsonwebtoken');
const RateLimit = require('express-rate-limit');

exports.isLoggedIn = (req, res, next) => {
  // req.isAuthenticated로 로그인 여부 확인
  if (req.isAuthenticated()) {
    next();
  } else {
    res.status(403).send('로그인 필요');
  }
};

exports.isNotLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    next();
  } else {
    res.redirect('/');
  }
};

// 토큰 검증 미들웨어
exports.verifyToken = (req, res, next) => {
  try {
    // jwt.verify() : 토큰을 검증한다 (토큰, 비밀키)
    // req.headers.authorization : 저장된 토큰
    // 인증 성공시 토큰의 내용 리턴 -> req.decoded에 대입
    req.decoded = jwt.verify(req.headers.authorization, process.env.JWT_SECRET);
    return next();
  } catch (error) {   // 토큰의 비밀키가 일치하지 않을 때, catch문으로...
    if (error.name === 'TokenExpiredError') {   // 유효기간 초과
      return res.status(419).json({
        code: 419,
        message: '토큰이 만료되었습니다',
      });
    }
    return res.status(401).json({
      code: 401,
      message: '유효하지 않은 토큰입니다',
    });
  }
};

// apiLimiter : 라우터에 넣으면 라우터에 사용량 제한이 걸리게한다
exports.apiLimiter = RateLimit({
  windowMs: 60 * 1000,  // 1분
  max: 1,   // 허용 횟수
  delayMs: 0,   // 호출 간격
  handler(req, res) {   // 제한 초과시 콜백 함수
    res.status(this.statusCode).json({
      code: this.statusCode,  // 기본값 429
      message: '무료 사용자는 1분에 한 번만 요청할 수 있습니다.',
    });
  },
});

// premiumApiLimiter : 라우터에 넣으면 라우터에 사용량 제한이 걸리게한다
exports.premiumApiLimiter = RateLimit({
  windowMs: 60 * 1000,  // 1분
  max: 1000,   // 허용 횟수
  delayMs: 0,   // 호출 간격
  handler(req, res) {   // 제한 초과시 콜백 함수
    res.status(this.statusCode).json({
      code: this.statusCode,  // 기본값 429
      message: '1분에 한 번만 요청할 수 있습니다.',
    });
  },
});

// deprecated : 사용하면 안되는 라우터에 붙여주는 '경고 메세지' 미들웨어
exports.deprecated = (req, res) => {
  res.status(410).json({
    code: 410,
    message: '새로운 버전이 나왔습니다. 새로운 버전을 사용하세요.',
  });
};