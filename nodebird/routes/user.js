const express = require('express');

const { isLoggedIn } = require('./middlewares');
const { User } = require('../models');

const router = express.Router();

// 다른 사용자를 팔로우하는 라우터
// :id = req.params.id
router.post('/:id/follow', isLoggedIn, async (req, res, next) => {
  try {
    // 팔로우할 사용자를 User 테이블에서 SELECT
    const user = await User.findOne({ where: { id: req.user.id } });
    // addFollowing : 현재 로그인한 사용자(user)와 팔로잉(Following)의 관계를 지정 (자동으로)
    await user.addFollowing(parseInt(req.params.id, 10));
    res.send('success');
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 다른 사용자를 언팔로우하는 라우터
// :id = req.params.id
router.post('/:id/unfollow', isLoggedIn, async (req, res, next) => {
  try {
    // 팔로우할 사용자를 User 테이블에서 SELECT
    const user = await User.findOne({ where: { id: req.user.id } });
    // removeFollowing : 현재 로그인한 사용자(user)와 팔로잉(Following)의 관계를 삭제 (자동으로)
    await user.removeFollowing(parseInt(req.params.id, 10));
    res.send('success');
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.post('/profile', async (req, res, next) => {
  try {
    await User.update({ nick: req.body.nick }, {
      where: { id: req.user.id },
    });
    res.redirect('/profile');
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;