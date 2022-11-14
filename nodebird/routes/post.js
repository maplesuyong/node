// 앱 전체에 붙는 미들웨어는 아니지만, multipart 데이터를 업로드하는 라우터에 붙는 미들웨어

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { Post, Hashtag, User } = require('../models');
const { isLoggedIn } = require('./middlewares');

const router = express.Router();

//  fs 모듈은 이미지를 업로드할 uploads 폴더가 없을 때 uploads 폴더를 생성
fs.readdir('uploads', (error) => {
  if (error) {
    console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.');
    fs.mkdirSync('uploads');
  }
});

// 변수 upload : Multer 모듈에 옵션을 주어 미들웨어를 만드는 객체
const upload = multer({
  // 옵션1 storage: 파일 저장 방식과 경로, 파일명 등 설정
  storage: multer.diskStorage({   // multer.diskStorage : 이미지가 서버 디스크에 저장되도록하는 메서드
    // diskStorage의 destination 메서드 : 저장 경로를 nodebird 폴더 아래 uploads 폴더로 지정
    destination(req, file, cb) {
      cb(null, 'uploads/');
    },
    // diskStorage의 filename 메서드 : 파일명 설정
    filename(req, file, cb) {
      const ext = path.extname(file.originalname);  // file.originalname : 기존 파일명
      // new Date().valueOf() : 업로드 날짜값 (파일명이 중복되는 것을 막기 위함)
      cb(null, path.basename(file.originalname, ext) + new Date().valueOf() + ext);
    },
  }),
  // 옵션2 limits: 최대 이미지 파일 용량 허용치
  limits: { fileSize: 5 * 1024 * 1024 },
});

// upload 변수는 미들웨어를 만드는 여러가지 메서드를 가진다  ex) single, array, fields, none
// 1. single : 하나의 이미지를 업로드할 때 사용 (req.file 객체 생성)
// 2. array : 여러개의 이미지를 업로드할 때 사용 (req.filess 객체 생성)
//            속성 하나에 이미지를 여러개 업로도 시
// 3. fields : 여러개의 이미지를 업로드할 때 사용 (req.filess 객체 생성) (array와 차이점은 이미지를 업로드한 body 속성 개수)
//            여러개의 속성에 이미지를 하나씩 업로드 시
// 4. none : 이미지를 올리지 않고 데이터만 multipart 형식으로 전송했을 때 사용

// req.file { 
//  fieldname:'img',
//  originalname:'nodejs.png',
//  encoding:'7bit',
//  mimetype:'image/png',
//  destination:'uploads/',
//  filename:'nodejs1514197844339.png',
//  path:'uploads\\nodejs1514197844339.png',
//  size: 53357 }

// 이미지 업로드 (single 미들웨어 사용)
router.post('/img', isLoggedIn, upload.single('img'), (req, res) => {   // req.body 속성의 이름 = img
  console.log(req.file);
  res.json({ url: `/img/${req.file.filename}` });
});

// 게시글 업로드
const upload2 = multer();
// 데이터 형식이 multipart이긴 하지만, 이미지 데이터가 들어 있지 않으므로 none 메서드를 사용 (이미지 주소가 온 것임)
router.post('/', isLoggedIn, upload2.none(), async (req, res, next) => {
  try {
    // 게시글을 Post DB에 INSERT
    const post = await Post.create({
      content: req.body.content,
      img: req.body.url,
      userId: req.user.id,
    });
    // 게시글 내용에서 해시태그를 정규표현식으로 추출
    const hashtags = req.body.content.match(/#[^\s]*/g);
    if (hashtags) {
      // 추출한 해시태그들을 Hashtag DB에 INSERT
      // sequelize의 findOrCreate : 데이터(행)을 INSERT 하기 전에 존재하는지 존재하는지 여부를 체크, 있다면 no 없다면 INSERT
      const result = await Promise.all(hashtags.map(tag => Hashtag.findOrCreate({
        where: { title: tag.slice(1).toLowerCase() },
      })));
      // post.addHashtags : 게시글과 해시태그의 관계를 PostHashtag 테이블에 넣는다
      await post.addHashtag(result.map(r => r[0]));
    }
    res.redirect('/');
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 게시글 삭제
router.delete('/:id', async (req, res, next) => {
  try {
    // 현재 접속한 나의 게시글만 지울 수 있도록
    await Post.destroy({ where: { id: req.params.id, userId: req.user.id }});
    res.send('OK');
  } catch (error) {
    console.error(error);
    next(error);
  }
})

// 해시태그로 조회
router.get('/hashtag', async (req, res, next) => {
  // 쿼리스트링으로 해시태그 이름을 query에 저장
  const query = req.query.hashtag;
  // 해시태그가 없다면 메인페이지로 리다이렉트
  if (!query) {
    return res.redirect('/');
  }
  try {
    // Hashtag 테이블에서 title 컬럼의 값이 query인 해시태그를 SELECT
    const hashtag = await Hashtag.findOne({ where: { title: query } });
    let posts = [];
    // 위의 조건에 해당하는 해시태그가 있다면...
    if (hashtag) {
      // Hashtag 테이블과 User 테이블을 JOIN해서 getPosts 메서드로 모든 게시글을 가져와 posts에 저장
      posts = await hashtag.getPosts({ include: [{ model: User }] });
    }
    return res.render('main', {
      title: `${query} | NodeBird`,
      user: req.user,
      twits: posts,   // 메인페이지 렌더링시 전체 게시글 대신에 해시태그로 조회된 게시글만 twits에 넣어 렌더링한다
    });
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

// 좋아요 라우터
router.post('/:id/like', async (req, res, next) => {
  try {
    const post = await Post.findOne({ where: { id: req.params.id } });
    await post.addLiker(req.user.id);
    res.send('OK');
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 좋아요 취소 라우터
router.delete('/:id/like', async (req, res, next) => {
  try {
    const post = await Post.findOne({ where: { id: req.params.id } });
    await post.removeLiker(req.user.id);
    res.send('OK');
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;