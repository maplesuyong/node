const express = require('express');
const User = require('../models').User;

const router = express.Router();

router.get('/', function(req, res, next) {
  User.findAll()
    .then((users) => {
      // GET /users 에서는 데이터를 JSON 형식으로 반환
      res.json(users);
    })
    .catch((err) => {
      console.error(err);
      next(err);
    });
});

router.post('/', function(req, res, next) {
  User.create({
    name: req.body.name,
    age: req.body.age,
    married: req.body.married,
  })
    .then((result) => {
      console.log(result);
      res.status(201).json(result);
    })
    .catch((err) => {
      console.error(err);
      next(err);
    });
});

// // flash: 일회성 메세지들을 웹 브라우저에 나타냄
// router.get('/flash', function(req, res) {
//   req.session.message = '세션 메시지';
//   // 새로고침하면 출력 x
//   req.flash('message', 'flash 메시지');
//   res.redirect('/users/flash/result');
// })

// router.get('/flash/result', function(req, res) {
//   res.send(`${req.session.message} ${req.flash('message')}`);
// });

module.exports = router;
