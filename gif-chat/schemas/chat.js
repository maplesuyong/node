const mongoose = require('mongoose');

const { Schema } = mongoose;
const { Types: { ObjectId } } = Schema;
const chatSchema = new Schema({
  room: {   // 채팅방 아이디
    type: ObjectId,
    required: true,
    ref: 'Room',  // Room 스키마와 연결하여 Room 컬렉션의 ObjectId가 들어가게 된다
  },
  user: {   // 채팅을 한 사람
    type: String,
    requried: true,
  },
  // chat 또는 img 필드에 required 속성이 없는 이유 : 채팅 메시지나 GIF 이미지 둘 중 하나만 저장하면 되기 때문
  chat: String,   // 채팅 내역
  gif: String,  // GIF 이미지 주소
  createdAt: {  // 채팅 시간
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Chat', chatSchema);