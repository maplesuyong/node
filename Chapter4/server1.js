// https 사용 (인증서를 발급받았을 경우)
// 첫번째 인자 (인증서에 관련된 옵션 객체)
// 두번째 인자 (http 모듈과 같은 서버 로직)
const https = require('https');
const fs = require('fs');

https.createServer({
    cert: fs.readFileSync('도메인 인증서 경로'),
    key: fs.readFileSync('도메인 비밀키 경로'),
    ca: [
        fs.readFileSync('상위 인증서 경로'),
        fs.readFileSync('상위 인증서 경로'),
    ],
}, (req, res) => {
    res.write('<h1>Hello Node!</h1>');
    res.end('<p>Hello Server!</p>');
}).listen(443, () => {
    console.log('443번 포트에서 서버 대기 중입니다!');
});



// http2 사용 (인증서를 발급받았을 경우)
// 첫번째 인자 (인증서에 관련된 옵션 객체)
// 두번째 인자 (http 모듈과 같은 서버 로직)
const http2 = require('http2');
const fs = require('fs');

// http2 사용 시, createSecureServer 메서드를 사용한다
http2.createSecureServer({
    cert: fs.readFileSync('도메인 인증서 경로'),
    key: fs.readFileSync('도메인 비밀키 경로'),
    ca: [
        fs.readFileSync('상위 인증서 경로'),
        fs.readFileSync('상위 인증서 경로'),
    ],
}, (req, res) => {
    res.write('<h1>Hello Node!</h1>');
    res.end('<p>Hello Server!</p>');
}).listen(443, () => {
    console.log('443번 포트에서 서버 대기 중입니다!');
});