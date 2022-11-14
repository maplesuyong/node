const SSE = require('sse');

module.exports = (server) => {
  const sse = new SSE(server);
  sse.on('connection', (client) => {
    setInterval(() => {
      // client.send : 접속한 클라이언트에게 데이터를 보낸다 (문자열만)
      // new Date().valueOf.toString() : 서버 시간 타임스탬프
      client.send(new Date().valueOf.toString());
    }, 1000);
  });
};