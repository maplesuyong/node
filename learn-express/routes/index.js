const express = require('express');
const User = require('../models').User;

const router = express.Router();

router.get('/', async (req, res, next) => {
  // res.locals 객체를 사용해서 title 변수를 넣을 수도 있음
  // res.locals.title = 'Express';
  // 위 방식의 장점은 현재 라우터뿐만 아니라 다른 미들웨어에서도 res.locals 객체에 접근할 수 있음
  // res.render('index', { title: 'Express' });
  try {
    const users = await User.findAll();
    res.render('sequelize', { users });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
