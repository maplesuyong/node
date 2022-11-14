const express = require('express');
const jwt = require('jsonwebtoken');

const { verifyToken, deprecated } = require('./middlewares');
const { Domain, User, Post, Hashtag } = require('../models');

const router = express.Router();

// 기존 v1 라우터를 사용할 시에는 경고 메시지(deprecated)를 띄워준다
router.use(deprecated);

// 토큰을 발급하는 라우터
router.post('/token', async (req, res) => {
  const { clientSecret } = req.body;  // 전달받은 클라이언트 비밀키
  try {   // 먼저 등록된 도메인인지 Domain 테이블에서 확인한다
    const domain = await Domain.findOne({
      where: { clientSecret },
      include: {
        model: User,
        attribute: ['nick', 'id'],
      },
    });
    // 등록되지 않은 도메인일시...
    if (!domain) {
      return res.status(401).json({
        code: 401,
        message: '등록되지 않은 도메인입니다. 먼저 도메인을 등록하세요',
      });
    }

    // 등록된 도메인이라면, 토큰 발급(jsw.sign) 후 응답
    // jwt.sign
    // 첫번째 인자 : 토큰의 내용
    // 두번째 인자 : 토큰의 비밀키
    // 세번째 인자 : 토큰의 설정
    const token = jwt.sign({  
      id: domain.user.id,
      nick: domain.user.nick,
    }, process.env.JWT_SECRET, {
      expiresIn: '1m',  // 1분 (유효기간)
      issuer: 'nodebird',   // 발급자
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

// 사용자가 토큰을 테스트 해볼 수 있는 라우터
// 토큰을 검증하는 미들웨어(verifyToken)를 거친다
router.get('/test', verifyToken, (req, res) => {
  res.json(req.decoded);
});

// 내가 올린 포스트를 가져오는 라우터
router.get('/posts/my', verifyToken, async (req, res) => {
  try{
    const posts = await Post.findAll({ where: { userId: req.decoded.id } });
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

// 해시태그 검색 결과를 가져오는 라우터
router.get('/posts/hashtag/:title', verifyToken, async (req, res) => {
  try {
    const hashtag = await Hashtag.findOne({ where: { title: req.params.title } });
    if (!hashtag) {
      return res.status(404).json({
        code: 404,
        message: '검색 결과가 없습니다.',
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

module.exports = router;