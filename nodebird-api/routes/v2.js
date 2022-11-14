const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const url = require('url');

const { verifyToken, apiLimiter, premiumApiLimiter } = require('./middlewares');
const { Domain, User, Post, Hashtag } = require('../models');

const router = express.Router();

// 2개의 코드는 같은 역할을 한다
// router.use(cors());

// router.user((req, res, next) => {
//   cors()(req, res, next);
// })

router.use(async (req, res, next) => {
  // Domain 테이블에서 호스트 컬럼이 클라이언트 도메인(req.get('origin'))과 일치하는지 검사
  const domain = await Domain.findOne({
    // url.parse : http나 https 같은 프로토클을 떼어낼 때 사용
    where: { host: url.parse(req.get('origin')).host },
  });
  if (domain) {   // 일치하는 데이터가 있을때
    cors({
      origin: req.get('origin'),
      credentials: true,
    })(req, res, next);  // cors 허용 (req.get('origin')만 허용됨)
  } else {
    next();
  }
});

// 도메인의 Type에 따른 무료 혹은 프리미엄을 사용하는 라우터 연결
// 라우터에 공통되는 인증이므로 별도의 미들웨어로 따로 빼내어서 사용(인증)하는 방법
router.use(async (req, res, next) => {
  const domain = await Domain.findOne({
    where: { host: url.parse(req.get('origin')).host },
  });
  if (domain.type === 'premium') {
    premiumApiLimiter(req, res, next);
  } else {
    apiLimiter(req, res, next);
  }
});

// 기존 v1 라우터에 비해서...
// 토큰 유효 기간을 30분으로 늘렸고, 라우터에 사용량 제한 미들웨어(apiLimiter)를 추가
router.post('/token', async (req, res) => {
  const { clientSecret } = req.body;
  try {
    const domain = await Domain.findOne({
      // 서버에서는 clientSecret으로 인증
      // 프론트에서는 frontSecret과 호스트로 인증
      where: { frontSecret: clientSecret },
      include: {
        model: User,
        attribute: ['nick', 'id'],
      },
    });
    if (!domain) {
      return res.status(401).json({
        code: 401,
        message: '등록되지 않은 도메인입니다. 먼저 도메인을 등록하세요',
      });
    }
    const token = jwt.sign({
      id: domain.user.id,
      nick: domain.user.nick,
    }, process.env.JWT_SECRET, {
      expiresIn: '30m',   // 30분
      issuer: 'nodebird',
    });
    return res.json({
      code: 200,
      message: '토큰이 발급되었습니다',
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      message: '서버 에러',
    });
  }
});

router.get('/test', verifyToken, (req, res) => {
  res.json(req.decoded);
});

router.get('/posts/my', verifyToken, async (req, res) => {
  try {
    const posts = await Post.findAll({ where: {userId: req.decoded.id } });
    console.log(posts);
    res.json({
      code: 200,
      payload: posts,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      message: '서버 에러',
    });
  }
});

router.get('/posts/hashtag/:title', verifyToken, async (req, res) => {
  try {
    const hashtag = await Hashtag.findOne({ where: { title: req.params.title } });
    if (!hashtag) {
      return res.status(404).json({
        code: 404,
        message: '검색 결과가 없습니다',
      });
    }
    const posts = await hashtag.getPosts();
    return res.json({
      code: 200,
      payload: posts,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      message: '서버 에러',
    });
  }
});

router.get('/follow', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ where: { id: req.decoded.id } });
    // get테이블명s 메서드의 옵션값으로 원하는 컬럼(attributes)만을 가져올 수 있다
    const follower = await user.getFollowers({ attributes: ['id', 'nick'] });
    const following = await user.getFollowings({ attributes: ['id', 'nick'] });
    return res.json({
      code: 200,
      follower,
      following,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      code: 500,
      message: '서버 에러',
    })
  }
});

module.exports = router;