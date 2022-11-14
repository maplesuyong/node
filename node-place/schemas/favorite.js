const mongoose = require('mongoose');

const { Schema } = mongoose;
const favoriteSchema = new Schema({
  placeId: {
    type: String,
    unique: true,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  location: { type: [Number], index: '2dsphere'},   // index : 2dsphere  ->  위치 정보를 저장하겠다
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Favorite', favoriteSchema);