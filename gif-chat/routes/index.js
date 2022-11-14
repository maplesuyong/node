const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const Room = require('../schemas/room');
const Chat = require('../schemas/chat');

const router = express.Router();

// 채팅방 목록이 보이는 메인 화면을 렌더링
router.get('/', async (req, res, next) => {
  try {
    const rooms = await Room.find({});
    res.render('main', { rooms, title: 'GIF 채팅방', error: req.flash('roomError') });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 채팅방 생성 화면을 렌더링
router.get('/room', (req, res) => {
  res.render('room', { title: 'GIF 채팅방 생성' });
});

// 채팅방을 만드는 라우터
router.post('/room', async (req, res, next) => {
  try {
    const room = new Room({
      title: req.body.title,
      max: req.body.max,
      owner: req.session.color,
      password: req.body.password,
    });
    const newRoom = await room.save();
    const io = req.app.get('io');   // app.set('io', io)로 저장했던 io 객체를 req.app.get('io')로 가져온다
    // /room 네임스페이스에 연결한 모든 클라이언트에게 데이터(새로 생성된 채팅방)를 보내는 메서드
    io.of('/room').emit('newRoom', newRoom);
    res.redirect(`/room/${newRoom._id}?password=${req.body.password}`);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 채팅방을 렌더링 하는 라우터
router.get('/room/:id', async (req, res, next) => {
  try {
    const room = await Room.findOne({ _id: req.params.id });
    const io = req.app.get('io');
    if (!room) {
      req.flash('roomError', '존재하지 않는 방입니다.');
      return res.redirect('/');
    }
    if (room.password && room.password !== req.query.password) {
      req.flash('roomError', '비밀번호가 틀렸습니다.');
      return res.redirect('/');
    }
    const { rooms } = io.of('/chat').adapter;   // 방 목록
    // rooms[req.params.id] : 해당 방의 소켓 목록
    if (rooms && rooms[req.params.id] && room.max <= rooms[req.params.id].length) {
      req.flash('roomError', '허용 인원이 초과하였습니다.');
      return res.redirect('/');
    }
    console.log(rooms && rooms[req.params.id]);
    // 해당 라우터로 방 접속 시 기존 채팅 내역을 변수 chats에 저장
    const chats = await Chat.find({ room: room._id }).sort('createdAt');
    return res.render('chat', {
      room,
      title: room.title,
      chats,  // 기존 채팅 내역
      // 채팅방 참여자 수에 +1을 해준 이유: 참여했을 때 자기 자신은 romms[req.params]에 포함되지 않으므로...
      number: (rooms && rooms[req.params.id] && rooms[req.params].length + 1) || 0,
      user: req.session.color,
    });
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

// 채팅을 할때마다 채팅을 DB에 저장하고 같은 방에 들어있는 소켓들에게 메시지 데이터를 전송하는 라우터
router.post('/room/:id/chat', async (req, res, next) => {
  try {
    const chat = new Chat({   // 채팅의 정보 (어디 방, 어느 유저, 어떤 내용)
      room: req.params.id,
      user: req.session.color,
      chat: req.body.chat,
    });
    await chat.save();  // 채팅 정보를 DB에 INSERT
    res.send('ok');
    // req.app.get('io').of('/chat').to(req.params.id).emit('chat', chat);   // 같은 방에 들어있는 소켓들에게 메시지 데이터 전송
    req.app.get('io').of('/chat').to(req.params.id).emit('chat', {
      socket: req.body.sid,
      room: req.params.id,
      user: req.session.color,
      chat: req.body.chat,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

// 채팅방을 삭제하는 라우터
router.delete('/room/:id', async (req, res, next) => {
  try {
    await Room.remove({ _id: req.params.id });  // 채팅방을 삭제
    await Chat.remove({ room: req.params.id});  // 채팅내역을 삭제
    res.sendStatus('ok');
    setTimeout(() => {  // 2초 뒤에 웹 소켓으로 /room 네임스페이스에 방이 삭제되었음(removeRoom)을 알린다
      req.app.get('io').of('/room').emit('removeRoom', req.params.id);
    }, 2000);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// uploads 폴더가 없다면 만든다
fs.readdir('uploads', (error) => {
  if (error) {
    console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.');
    fs.mkdirSync('uploads');
  }
});

// uploads 폴더에 사진을 저장한다
const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, 'uploads/');
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname);
      // 파일명에 타임스탬프(new Date())를 붙인다
      cb(null, path.basename(file.originalname, ext) + new Date().valueOf() + ext);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },  // 5MB 용량 제한
});


//
router.post('/room/:id/gif', upload.single('gif'), async (req, res, next) => {
  try {
    const chat = new Chat({
      room: req.params.id,
      user: req.session.color,
      gif: req.file.filename,
    });
    await chat.save();
    res.send('ok');
    // 방의 모든 소켓에게 채팅 데이터를 보낸다
    // req.app.get('io').of('/chat').to(req.params.id).emit('chat', chat);
    req.app.get('io').of('/chat').to(req.params.id).emit('chat', {
      socket: req.body.sid,
      room: req.params.id,
      user: req.session.color,
      chat: req.body.chat,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 시스템 메시지를 저장하는 라우터
// DB 저장을 위해 axios로 라우터를 태웠음
router.post('/room/:id/sys', async (req, res, next) => {
  try {
    const chat = req.body.type === 'join'
      ? `${req.session.color}님이 입장하셨습니다.`  // 입장시(type = join)는 입장 메시지
      : `${req.session.color}님이 퇴장하셨습니다.`; // 퇴장시(type = exit)는 퇴장 메시지

    // 시스템 메시지 정보
    const sys = new Chat({
      room: req.params.id,
      user: 'system',
      chat,
    });
    await sys.save();   // 위 시스템 메시지를 DB에 저장

    // 웹 소켓으로 입장&퇴장(시스템) 메시지를 방의 모든 소켓에게 데이터를 보낸다
    req.app.get('io').of('/chat').to(req.params.id).emit(req.body.type, {
      user: 'system',
      chat,
      number: req.app.get('io').of('/chat').adapter.rooms[req.params.id].length,
    });
    res.send('ok');
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;