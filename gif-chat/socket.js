// Socket.IO는 먼저 폴링 방식으로 서버와 연결한다
// 그렇기 때문에 코드에서 HTTP 프로토콜을 사용
// 폴링 연결 후, 웹 소켓을 사용할 수 있다면 웹 소켓으로 업그레이드한다

const SocketIO = require('socket.io');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const cookie = require('cookie-signature');   // signedCookies(암호화가 적용된 쿠키)를 만든다

module.exports = (server, app, sessionMiddleware) => {
  // socket.io 패키지를 불러와 익스프레스 서버와 연결
  // 두번째 인자로 옵션 객체를 넣어줌
  const io = SocketIO(server, { path:'/socket.io' });

  // 웹소켓 서버(wss)에 이벤트 리스너들을 붙여준 모습 (웹소켓은 이벤트 기반으로 작동)
  // 웹 소켓 상태 4가지
  // 1. CONNECTING : 연결중
  // 2. OPEN : 열림
  // 3. CLOSING : 닫는 중
  // 4. CLOSED : 닫힘

  // io 객체를 쓸 수 있게 저장 (소켓 객체를 익스프레스와 연결)
  // 이 io 객체를 req.app.get('io')로 라우터에서 소켓 객체를 가져온다!
  app.set('io', io);
  
  // of : Socket.IO에 네임스페이스를 부여하는 메서드
  // Socket.IO는 기본적으로 / 네임스페이스에 접속하지만,
  // of 메서드를 사용하면 다른 네임스페이스를 만들어 접속할 수 있다.
  const room = io.of('/room');  // 채팅방 생성 및 삭제에 관한 정보를 전달
  const chat = io.of('/chat');  // 채팅 메시지를 전달

  // io.use 메서드에 미들웨어를 장착
  // 모든 웹 소켓 연결 시마다 실행됨
  io.use((socket, next) => {
    // socket.request : 요청 객체
    // socket.request.res : 응답 객체
    // next : next 함수
    sessionMiddleware(socket.request, socket.request.res, next);
  });

  // /room 네임스페이스에 'connection'이라는 이벤트 리스너를 붙여줌
  room.on('connection', (socket) => {
    console.log('room 네임스페이스에 접속');
    socket.on('disconnect', () => {
      console.log('room 네임스페이스 접속 해제');
    });
  });

  // /chat 네임스페이스에 'connection'이라는 이벤트 리스너를 붙여줌
  chat.on('connection', (socket) => {
    console.log('chat 네임스페이스에 접속');
    const req = socket.request;
    const { headers: { referer } } = req;
    // 현재 웹 페이지의 URL
    const roomId = referer.split('/')[referer.split('/').length - 1].replace(/\?.+/,'');

    socket.join(roomId);  // 접속시 join 메서드

    // 방 참여 시, 누군가가 입장했다는 시스템 메시지를 보낸다
    // socket.to(roomId).emit('join', {  // roomId라는 특정 방에 데이터를 보낸다
    //   user: 'system',
    //   chat: `${req.session.color}님이 입장하셨습니다.`,
    //   number: socket.adapter.rooms[roomId].length,
    // });

    // 입장(join) 시스템 메시지를 DB에 저장하는 라우터로 보냄
    axios.post(`http://localhost:8005/room/${roomId}/sys`, {
      type: 'join',
    }, {
      headers: {
        // connect.sid : 암호화된 쿠키
        // connect.sid로 기존 채팅방의 세션 아이디가 같은 사람인지 확인한다
        // 유저가 나가고 들어올시 로그인 세션이 유지되고 있다면, 같은 아이디로 입장&퇴장 시스템 메시지가 전달된다
        Cookie: `connect.sid=${'s%3A' + cookie.sign(req.signedCookies['connect.sid'], process.env.COOKIE_SECRET)}`,
      }
    });

    socket.on('disconnect', () => {
      console.log('chat 네임스페이스 접속 해체');
      socket.leave(roomId);   // 접속 해제시 leave 메서드

      // 방장이 나간 경우 방 인원 중 랜덤 한명 골라서 방장 위임 (sudo 코드)
      // 몽고디비로 room 스키마 owner update

      const currentRoom = socket.adapter.rooms[roomId];   // 참여 중인 소켓 정보
      const userCount = currentRoom ? currentRoom.length : 0;   // 현재 방의 사람 수
      if (userCount === 0) {  // 방에 사람이 0명이면 방을 제거하는 HTTP 요청을 보낸다
        axios.delete(`http://localhost:8005/room/${roomId}`)
          .then(() => {
            console.log('방 제거 요청 성공');
          })
          .catch((error) => {
            console.error(error);
          });
      } else {  // 방에 사람이 0명이 아니라면 나머지 참여자들에게 나간 사람이 퇴장했다는 데이터를 보낸다

        // socket.to(roomId).emit('exit', {
        //   user: 'system',
        //   chat: `${req.session.color}님이 퇴장하셨습니다.`,
        //   number: socket.adapter.rooms[roomId].length,
        // });

        // 퇴장(exit) 시스템 메시지를 DB에 저장하는 라우터로 보냄
        axios.post(`http://localhost:8005/room/${roomId}/sys`, {
          type: 'exit',
        }, {
          headers: {
            // connect.sid : 암호화된 쿠키
            // connect.sid로 기존 채팅방의 세션 아이디가 같은 사람인지 확인한다
            // 유저가 나가고 들어올시 로그인 세션이 유지되고 있다면, 같은 아이디로 입장&퇴장 시스템 메시지가 전달된다
            Cookie: `connect.sid=${'s%3A' + cookie.sign(req.signedCookies['connect.sid'], process.env.COOKIE_SECRET)}`,
          }
        });
      }
    });

    // 귓속말을 보내는 소켓
    socket.on('dm', (data) => {
      // 귓속말 하고싶은 개인 소켓 아이디(data.target)에게 귓속말을 한다
      // to 메서드에 '개인 아이디' 혹은 '방 아이디(전체)'가 들어올 수 있다
      socket.to(data.target).emit('dm', data);
    });

    // 강퇴 메세지 보내는 소켓
    socket.on('ban', (data) => {
      // 귓속말 하고싶은 개인 소켓 아이디(data.target)에게 귓속말을 한다
      // to 메서드에 '개인 아이디' 혹은 '방 아이디(전체)'가 들어올 수 있다
      socket.to(data.id).emit('ban');
    });

    // 방장 기능 위임하는 소켓
    socket.on('delegate', (data) => {
      socket.to(data.id).emit('delegate');
    });
  });
};