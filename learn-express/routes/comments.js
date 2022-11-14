const express = require('express');
const { User, Comment } = require('../models');

const router = express.Router();

// 특정 사용자의 댓글을 불러온다
router.get('/:id', function (req, res, next) {
    Comment.findAll({
        // include 옵션: 관련있는 모델을 불러옴 (hasMany나 belongsTo로 연결해주어야함)
        include: {
            model: User,
            where: { id: req.params.id },
        },
    })
        .then((comments) => {
            console.log(comments);
            res.json(comments);
        })
        .catch((err) => {
            console.error(err);
            next(err);
        });
});

// 댓글 생성
router.post('/', function (req, res, next) {
    Comment.create({
        commenter: req.body.id,
        comment: req.body.comment,
    })
        .then((result) => {
            console.log(result);
            res.status(201).json(result);
        })
        .catch((err) => {
            console.log(err);
            next(err);
        });
});

// 댓글 수정
router.patch('/:id', function (req, res, next) {
    Comment.update({ comment: req.body.comment }, { where: { id: req.params.id } })
        .then((result) => {
            res.json(result);
        })
        .catch((err) => {
            console.error(err);
            next(err);
        });
});

// 댓글 삭제
router.delete('/:id', function (req, res, next) {
    Comment.destroy({ where: { id: req.params.id } })
        .then((result) => {
            res.json(result);
        })
        .catch((err) => {
            console.error(err);
            next(err);
        });
});

module.exports = router;