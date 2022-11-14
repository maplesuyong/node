const express = require('express');
// uuidv4 모듈 : 고유한 문자열을 만들때 사용
const uuid = require('uuid');  // 범용 고유 식별자(Universally Unique Identifier)
const { User, Domain } = require('../models');

const router = express.Router();

// 루트 라우터 (로그인 화면)
router.get('/', async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: { id: req.user && req.user.id || null },
      include: { model: Domain },
    });
    res.render('login', {
      user,
      domains: user && user.Domains,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 도메인 등록 라우터
// 폼으로부터 전송된 데이터를 Domain 테이블에 저장
router.post('/domain', async (req, res, next) => {
  try {
    await Domain.create({
      userId: req.user.id,
      host: req.body.host,
      type: req.body.type,
      clientSecret: uuid.v4(),
      frontSecret: uuid.v4(),
    });
    res.redirect('/');
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;