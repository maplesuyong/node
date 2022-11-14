const express = require('express');
const util = require('util');
const googleMaps = require('@google/maps');

const History = require('../schemas/history');
const Favorite = require('../schemas/favorite');

const router = express.Router();

// @google/maps 패키지로부터 구글 지도 클라이언트를 만드는 방법
const googleMapsClient = googleMaps.createClient({
  key: process.env.PLACES_API_KEY,
});

router.get('/', async (req, res) => {
  try {
    const favorites = await Favorite.find({});
    const histories = await History.find({}).limit(5).sort('-createdAt');
    res.render('index', { results: favorites, history: histories });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.get('/autocomplete/:query', (req, res, next) => {
  // googleMapsClient.placesQueryAutoComplete : 검색어 자동완성
  googleMapsClient.placesQueryAutoComplete({
    input: req.params.query,  // 라우터로부터 전달된 쿼리를 input 속성의 값으로 넣어준다
    language: 'ko',
  }, (err, response) => {
    if (err) {
      return next(err);
    }
    return res.json(response.json.predictions);   // 결과값 = 예상 검색어 (최대 다섯 개)
  });
});

// 실제 장소 검색 시 결과값을 반환하는 라우터
router.get('/search/:query', async (req, res, next) => {
  // googleMapsClient.places : 장소 검색
  // util.promisify : 구글 지도 클라이언트는 콜백 방식으로 동작하는데,
  // 몽구스 프로미스와 같이 사용하기 위해 프로미스 패턴으로 바꾸는 메서드
  const googlePlaces = util.promisify(googleMapsClient.places);
  const googlePlacesNearby = util.promisify(googleMapsClient.placesNearby);
  const { lat, lng, type } = req.query;
  try {
    const histories = await History.find({}).limit(5).sort('-createdAt');
    const history = new History({ query: req.params.query });
    await history.save();   // 결과값 반환 이전에 검색 내역을 구현하기 위해서 DB에 검색어를 저장
    let response;
    if (lat && lng) {   // 쿼리스트링으로 lat과 lng이 제공되면 places API 대신에 placesNearby API를 사용
      response = await googlePlacesNearby({
        keyword: req.params.query,  // 찾을 검색어
        location: `${lat},${lng}`,  //위도와 경도
        rankby: 'distance',   // 정렬 순서
        language: 'ko',   // 검색 언어
        type,
        // 추가로 radius : 인기순으로 정렬시 검색 반경
      });
    } else {
      response = await googlePlaces({
        query: req.params.query,
        language: 'ko',
        type,
      });
    }
    res.render('result', {
      title: `${req.params.query} 검색 결과`,
      results: response.json.results,   // 검색 결과
      query: req.params.query,
      history: histories,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 즐겨찾기 추가
router.post('/location/:id/favorite', async (req, res, next) => {
  try {
    const favorite = await Favorite.create({
      placeId: req.params.id,
      name: req.body.name,
      location: [req.body.lng, req.body.lat],   // 경도, 위도 순으로 넣어야 한다!
    });
    res.send(favorite);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 즐겨찾기 삭제
router.delete('/location/:id/favorite', async (req, res, next) => {
  try {
    const favorite = await Favorite.remove({
      placeId: req.params.id,
    });
    res.send('deleted');
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.get('/directions', async (req, res, next) => {
  try {
    const { origin, dest } = req.query;
    const directions = util.promisify(googleMapsClient.directions)
    const response = await directions({
      origin,
      destination:  dest,
    });
    console.log(response);
    res.json(response);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;