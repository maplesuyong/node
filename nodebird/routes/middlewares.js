// Passport는 req 객체에 isAuthenticated 메서드를 추가한다

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