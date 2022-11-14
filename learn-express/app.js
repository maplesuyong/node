const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const flash = require('connect-flash');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const commentsRouter = require('./routes/comments');
const sequelize = require('./models').sequelize;

const app = express();
// sync 메서드로 서버 실행 시 알아서 MySQL과 연동
sequelize.sync();

// 템플릿 엔진 설정
app.set('views', path.join(__dirname, 'views'));
// app.get('view engine') 이라는 코드로 'pug' 라는 값을 가져올 수 있다 (get 과 set)
app.set('view engine', 'pug');

app.use(function(req, res, next) {
  console.log(req.url, '저도 미들웨어입니다');
  // 반드시 미들웨어 안에서 next()를 호출해야 다음 미들웨어로 넘어간다
  // 인자로 route를 넣어 특수한 기능을 할 수도 있다 (다음 라우터로)
  next();
});

// use 메서드의 응용 방법으로, 하나의 use에 미들웨어를 여러 개 장착할 수 있다
// app.use(logger('dev'), express.json(), express.urlencoded({ extended: false }), cookieParser(), express.static(path.join(__dirname,'public')));

// morgan의 인자
// dev (HTTP요청, 주소, HTTP상태코드, 응답속도, 응답바이트)
// short, common, combined 옵션도 있음
app.use(logger('dev'));

// static -> 정적 파일들을 제공
// 요청에 부합하는 정적 파일을 발견한 경우 응답으로 해당 파일을 전송 (라우터 기능) -> 최대한 위쪽에 배치
// 인자로 정적 파일들이 담겨 있는 폴더를 지정 (현재 public 폴더)
app.use(express.static(path.join(__dirname, 'public')));

// body-parser의 일부 기능이 익스프레스에 내장
// 파싱된 내용은 req.body 객체에 들어간다
// express.json()
// express.urlencoded()
// json 형식 '{ name:'zerocho', book:'nodejs' }'
app.use(express.json());
// 옵션이 false면 노드의 querystring 모듈을 사용하여 쿼리스트링을 해석하고, true면 qs 모듈을 사용하여 쿼리스트링을 해석
// qs 모듈은 내장 모듈이 아니라 npm 패키지이며, querystring 모듈의 기능을 조금 더 확장한 모듈
// urlencoded 형식 'name=suyong&book=nodejs'
app.use(express.urlencoded({ extended: false }));

// request의 쿠키를 해석, 해석된 쿠키들은 req.cookies 객체에 들어간다
app.use(cookieParser('secret code'));

// 세션 설정
// 세션의 내용은 req.session 객체에 들어간다
app.use(session({
  // 요청이 왔을 때 세션에 수정 사항이 생기지 않더라도 세션을 다시 저장할지에 대한 설정
  resave: false,
  // 세션에 저장할 내역이 없더라도 세션을 저장할지에 대한 설정 (방문자를 추척할 때 사용)
  saveUninitialized: false,
  // 필수 항목으로 cookie-parser의 비밀키와 같은 역할 (쿠키 서명시 필요)
  // cookieParse의 secret과 같게 설정
  secret: 'secret code',
  cookie: {
    // 클라이언트에서 쿠키를 확인하지 못하게 설정
    httpOnly: true,
    // https가 아닌 환경에서도 사용 가능
    secure: false,
  },
}));

app.use(flash());

// 라우터
// use 메서드는 모든 HTTP 메서드에 대해 요청 주소만 일치하면 실행
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/comments', commentsRouter);

// 404 처리 미들웨어
app.use(function(req, res, next) {
  // next 메서드의 인자로 404 상태 코드를 넣어준다
  // createError는 http-errors 모듈
  // createError를 next에 담아 다음 미들웨어인 에러 핸들러로 보낸다
  next(createError(404));
});

// 에러 핸들러
// 전 미들웨어인 404 처리 미들웨어에서 넘어온 인자가 err 매개변수로 연결
// 미들웨어 중 제일 아래에 위치하여 위에 있는 미들웨어에서 발생하는 에러를 받아서 처리
app.use(function(err, req, res, next) {
  // 모든 미들웨어에서 사용가능한 res.locals 객체를 이용해 res.locals.message 와 res.locals.error 도 함께 렌더링한다
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  // error라는 템플릿 파일을 렌더링한다
  res.render('error');
});

module.exports = app;
