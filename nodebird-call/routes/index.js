const express = require('express');
const axios = require('axios');

const router = express.Router();
const URL = 'http://localhost:8002/v2';

// origin 헤더 추가
axios.defaults.headers.origin = 'http://localhost:4000'; // 없으면 TypeError [ERR_INVALID_ARG_TYPE]: The "url" argument must be of type string. Received undefined 에러뜸

// request : 발급받은 토큰을 세션에다 저장하는 함수
const request = async (req, api) => {
  try {
    if (!req.session.jwt) {   // 세션에 토큰이 없으면
      const tokenResult = await axios.post(`${URL}/token`, {
        clientSecret: process.env.CLIENT_SECRET,
      });
      req.session.jwt = tokenResult.data.token;   // 세션에 토큰 저장
    }
    return await axios.get(`${URL}${api}`, {  // API 요청
      headers: { authorization: req.session.jwt },
    });
  } catch (error) {
    console.error(error);
    // 토큰 만료 시
    if (error.response.status < 500) {  // 410 이나 419(만료) 처럼 의도된 에러면 발생
      delete req.session.jwt;   // req.session에 들어있는 jwt를 삭제한다
      request(req, api);  // 다시 req.session에 새로 발급받은 토큰을 넣어주는 request 함수를 재귀호출
      return error.response;
    }
    throw error;
  }
};

// 사용자가 토큰 인증 과정을 테스트하는 라우터
router.get('/test', async (req, res, next) => {
  try {
    if (!req.session.jwt) {   // 세션에 토큰이 없으면
      const tokenResult = await axios.post('http://localhost:8002/v1/token', {
        clientSecret: process.env.CLIENT_SECRET,
      });
      if (tokenResult.data && tokenResult.data.code === 200) {  // 토큰 발급 성공
        req.session.jwt = tokenResult.data.token;   // 세션에 토큰 저장
      } else {  // 토큰 발급 실패
        return res.json(tokenResult.data);  // 발급 실패 사유 응답
      }
    }
    // 발급받은 토큰 테스트
    const result = await axios.get('http://localhost:8002/v1/test', {
      // 보통 토큰은 HTTP 요청 헤더에 넣어서 보낸다
      headers: { authorization: req.session.jwt },
    });
    return res.json(result.data);   // 응답 결과
  } catch (error) {
    console.error(error);
    if (error.response.status === 419) {  // 토큰 만료 시
      return res.json(error.response.data);
    }
    return next(error);
  }
});

// 자신이 작성한 포스트를 JSON 형식으로 가져오는 라우터
router.get('/mypost', async (req, res, next) => {
  try {
    const result = await request(req, '/posts/my');
    res.json(result.data);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 해시태그를 검색하는 라우터
router.get('/search/:hashtag', async (req, res, next) => {
  try {
    const result = await request(
      req, `/posts/hashtag/${encodeURIComponent(req.params.hashtag)}`,
    );
    res.json(result.data);
  } catch (error) {
    if (error.code) {
      console.error(error);
      next(error);
    }
  }
});

router.get('/follow', async (req, res, next) => {
  try {
    const result = await request(req, `/follow`);
    res.json(result.data);
  } catch (error) {
    if (error.code) {
      console.error(error);
      next(error);
    }
  }
});

router.get('/', (req, res) => {
  res.render('main', { key: process.env.FRONT_SECRET });
});

module.exports = router;