const http = require('http');
const { parse } = require('path');

// 원래 쿠키는 문자열 형식으로 온다 ( name=zerocho;year=1994)
// 위를 { name:'zerocho', year:'1994' }와 같이 객체로 바꾸는 함수
// 요약: 문자열 -> 객체
const parseCookies = (cookie = '') => 
    cookie
    .split(';')
    .map(v => v.split('='))
    .map(([k, ...vs]) => [k, vs.join('=')])
    .reduce((acc, [k, v]) => {
        acc[k.trim()] = decodeURIComponent(v);
        return acc;
    }, {});

http.createServer((req, res) => {
    // 쿠키는 req.headers.cookie 에 들어있다.
    // req.headers 는 요청의 헤더를 의미
    const cookies = parseCookies(req.headers.cookie);
    console.log(req.url, cookies);
    // 응답의 헤더에 쿠키를 기록해야 하므로 res.writeHead 메서드를 사용
    // 첫번째 인자는 상태 코드 (200은 성공), 두번째 인자는 헤더의 내용 Set-Cookie 는 브라우저한테 다음과 같은 쿠키를 저장하라는 의미
    res.writeHead(200, {'Set-Cookie':'mycookie=test'});
    res.end('Hello Cookie');
}).listen(8082, () => {
    console.log('8082번 포트에서 서버 대기 중입니다!');
});