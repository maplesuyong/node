const http = require('http');
const fs = require('fs');
const url = require('url');
const qs = require('querystring');

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
    const cookies = parseCookies(req.headers.cookie);
    // 주소가 /login 으로 시작할 경우
    if (req.url.startsWith('/login')) {
        const { query } = url.parse(req.url);
        const { name } = qs.parse(query);
        const expires = new Date();
        // 쿠키의 만료시간 (지금 + 5분)
        expires.setMinutes(expires.getMinutes() + 5);
        // 302 응답 코드 (리다이렉트) + 쿠키를 헤더에 넣는다
        // 브라우저는 이 응답 코드를 보고 페이지를 해당 주소로 리다이렉트한다
        res.writeHead(302, {
            Location: '/',
            // 쿠키 옵션 설정
            // 옵션1 (Expires=날짜, 쿠키 만료 기한, 기본값: 클라이언트 종료까지)
            // 옵션2 (Path=URL, 쿠키가 전송될 URL을 특정한다, 기본값 '/')
            // 옵션3 (HttpOnly, 설정 시 자바스크립트에서 쿠키에 접근할 수 없다. 쿠키 조작 방지)
            // 헤더에는 한글을 설정할 수 없으므로 name 변수를 encodeURIComponent 메서드로 인코딩
            'Set-Cookie': `name=${encodeURIComponent(name)}; Expires=${expires.toGMTString()}; HttpOnly; Path=/`,
        });

        res.end();
    // 먼저 쿠키가 있는지 없는지 확인 (있을때)
    // 인사말을 보냄
    // res.end 메서드에 한글이 들어가면 인코딩 문제가 발생하므로 
    // res.writeHead에 Content-Type을 text/html; charset:utf-8로 설정해 인코딩을 명시
    } else if (cookies.name) {
        res.writeHead(200, { 'Content-Type':'text/html; charset=utf-8' });
        res.end(`${cookies.name}님 안녕하세요`);
    // 쿠키가 없을때
    // 로그인할 수 있는 페이지로 보냄 (server4.html)
    } else {
        fs.readFile('./Chapter4/server4.html', (err, data) => {
            if (err) {
                throw err;
            }
            res.end(data);
        });
    }
}).listen(8083, () => {
    console.log('8083번 포트에서 서버 대기 중입니다!');
});