const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const schedule = require('node-schedule');

const { Good, Auction, User, sequelize } = require('../models');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');

const router = express.Router();

router.use((req, res, next) => {
  // 모든 pug 템플릿에 사용자 정보(req.user)를 로컬 변수로 집어넣음
  // 모든 res.render 메서드에 'user: req.user'를 하지 않아도 됨 (중복 요소 제거)
  res.locals.user = req.user;
  next();
});

// 메인 화면 렌더링
router.get('/', async (req, res, next) => {
  try {
    // goods : 경매가 진행중인 상품 목록 (soldId 컬럼 = null, 낙찰자가 없다)
    const goods = await Good.findAll({ where: { soldId: null } });
    res.render('main', {
      title: 'NodeAuction',
      goods,
      loginError: req.flash('loginError'),
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// 회원가입 화면 렌더링
router.get('/join', isNotLoggedIn, (req, res) => {
  res.render('join', {
    title: '회원가입 - NodeAuction',
    joinError: req.flash('joinError'),
  });
});

// 상품 등록 화면 렌더링
router.get('/good', isLoggedIn, (req, res) => {
  res.render('good', { title: '상품 등록 = NodeAuction' });
});

fs.readdir('uploads', (error) => {
  if (error) {
    console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.');
    fs.mkdirSync('uploads');
  }
});

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, 'uploads/');
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, path.basename(file.originalname, ext) + new Date().valueOf() + ext);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// 업로드한 상품을 처리하는 라우터
// upload.single : 상품 이미지 업로드
router.post('/good', isLoggedIn, upload.single('img'), async (req, res, next) => {
  try {
    const { name, price } = req.body;
    const good = await Good.create({
      ownerId: req.user.id,
      name,
      end: req.body.end,
      img: req.file.filename,
      price,
    });

    const end = new Date();
    end.setHours(end.getHours() + good.end);   // 하루 뒤
    // schedule.scheduleJon : 일정 예약
    // 첫번째 인자 : 실행될 시각
    // 두번째 인자 : 시간이 되었을 때 수행할 콜백 함수
    // node-schedule 패키지의 단점 : 노드가 종료되면 스케줄 예약도 같이 종료...
    schedule.scheduleJob(end, async () => {
      // Auction 테이블에서 가장 높은 입찰가를 부른 사람
      const success = await Auction.findOne({
        where: { goodId: good.id },   // 상품 아이디
        order: [['bid', 'DESC']],   // 입찰가 컬럼의 내림차순으로 정렬
      });

      if (success) {
        // 위에서 찾은 가장 높은 입찰가를 부른 사람의 아이디(success.userId)를
        // Good 테이블의 낙찰자(soldId) 컬럼에 집어넣는다
        await Good.update({
          soldId: success.userId
        }, { 
          where: { id: good.id }
        });

        // 그 낙찰자의 보유 자산(money 컬럼)을 낙찰된 금액(success.bid)만큼 뺀다
        // { 컬럼: sequelize.literal(컬럼 - 숫자) } : 시퀄라이즈에서 해당 컬럼의 숫자를 줄이는 방법
        // { 컬럼: sequelize.literal(컬럼 + 숫자) } : 시퀄라이즈에서 해당 컬럼의 숫자를 늘이는 방법
        await User.update({
          money: sequelize.literal(`money-${success.bid}`),
        }, {
          where: { id: success.userId },
        });
      } else {  // 경매가 종료됬지만 낙찰자가 아무도 없을때
        await Good.update({   // 낙찰자 컬럼(soldId)를 상품의 주인(target.ownerId)으로 UPDATE 한다
          soldId: good.ownerId,
        }, {
          where: {
            id: good.id,
          }
        });
      }
    });
    res.redirect('/');
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// 해당 상품(:id)과 기존 입찰 정보들을 불러와 렌더링하는 라우터
router.get('/good/:id', isLoggedIn, async (req, res, next) => {
  try {
    // 해당 상품의 '정보'와 '기존 입찰 정보'를 const 변수 good과 auction에 담는다
    const [good, auction] = await Promise.all([
      // 해당 상품 정보 (Good 테이블에서...)
      Good.findOne({
        where: { id: req.params.id },
        include: {
          model: User,
          as: 'owner',  // Good과 User는 일대다 관계가 두번 연결(owner, sold)되어있기 때문에, 어떤 관계를 JOIN 할지 as 속성으로 밝힌다
        },
      }),
      // 해당 상품의 기존 입찰 정보 (Auction 테이블에서...)
      Auction.findAll({
        where: { goodId: req.params.id },
        include: { model: User },
        order: [['bid', 'ASC']],
      }),
    ]);

    // 위에서 해당 상품(:id)의 데이터를 저장한 const 변수 'good' 과 'auction' 데이터를
    // 경매화면(auction.pug)을 렌더링할 때 보내준다
    res.render('auction', {
      title: `${good.name} - NodeAuction`,
      good,
      auction,
      auctionError: req.flash('auctionError'),
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// 클라리언트로부터 받은 입찰 정보를 저장하는 라우터
router.post('/good/:id/bid', isLoggedIn, async (req, res, next) => {
  try {
    const { bid, msg } = req.body;
    const good = await Good.findOne({
      where: { id: req.params.id },
      include: { model: Auction },
      order: [[{ model: Auction }, 'bid', 'DESC']],   // Auction 테이블의 bid 컬럼을 기준으로 내림차순 정렬
    });

    // 시작 가격보다 낮게 입찰하면
    if (good.price > bid) {
      return res.status(403).send('시작 가격보다 높게 입찰해야합니다.');
    }

    // 경매 종료 시간이 지났다면, 경매를 종료
    if (new Date(good.createdAt).valueOf() + (24 * 60 * 60 * 1000) < new Date()) {
      return res.status(403).send('경매가 이미 종료되었습니다.');
    }

    // 직전 입찰가와 현재 입찰가 비교
    if (good.auctions[0] && good.auctions[0].bid >= bid) {
      return res.status(403).send('이전 입찰가보다 높아야 합니다');
    }

    // 상품 등록한 주인은 입찰을 못하게 한다
    if (good.ownerId === req.user.id) {
      return res.status(403).send('경매 등록자는 입찰할 수 없습니다.');
    }

    // 클라이언트로부터 받은 입찰 정보를 Auction 테이블에 INSERT 한다
    const result = await Auction.create({
      bid,
      msg,
      userId: req.user.id,
      goodId: req.params.id,
    });

    // 해당 방의 모든 사람에게 입찰자, 입찰가격, 입찰 메시지 등을 웹 소켓으로 전달
    req.app.get('io').to(req.params.id).emit('bid', {
      bid: result.bid,
      msg: result.msg,
      nick: req.user.nick,
    });
    return res.send('ok');
  } catch (err) {
    console.error(err);
    return next(err);
  }
});

// 유저가 낙찰 목록을 볼 수 있는 페이지 렌더링
router.get('/list', isLoggedIn, async (req, res, next) => {
  try {
    const goods = await Good.findAll({
      where: { soldId: req.user.id },   // 낙찰자가 현재 로그인한 유저이고
      include: { model: Auction },
      order: [[{ model: Auction }, 'bid', 'DESC']],   // 낙찰된 가격의 내림차순으로 정렬
    });
    res.render('list', { title: '낙찰 목록 - NodeAuction', goods });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

module.exports = router;