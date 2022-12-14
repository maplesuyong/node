const express = require('express');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const { Post, User } = require('../models');

const router = express.Router();

// 프로필 페이지
router.get('/profile', isLoggedIn, (req, res) => {
  res.render('profile', { title: '내 정보 - NodeBird', user: req.user });
});

// 회원가입 페이지
router.get('/join', isNotLoggedIn, (req, res) => {
	res.render('join', {
		title: '회원가입 - NodeBird',
		user: req.user,
		joinError: req.flash('joinError'),
	});
});

// 메인 페이지
router.get('/', (req, res, next) => {
	Post.findAll({
		// include 속성으로 User DB의 id와 nick 컬럼의 테이블을 Post 테이블과 JOIN 합니다
		include: [{
			model: User,
			attributes: ['id', 'nick'],
		}, {
			model: User,
			attributes: ['id', 'nick'],
			as: 'Liker',
		}],
		order: [['createdAt', 'DESC']],
	})
		.then((posts) => {	// Post DB에서 findAll로 조회한 데이터인 posts를 twits에 넣어 렌더링한다
			res.render('main', {
				title: 'NodeBird',
				twits: posts,
				user: req.user,
				loginError: req.flash('loginError'),
			});
		})
		.catch((error) => {
			console.error(error);
			next(error);
		});
});

module.exports = router;