const EventEmitter = require('events');

const myEvent = new EventEmitter();

// on(이벤트명, 콜백): 이벤트 이름과 이벤트 발생 시의 콜백을 연결 -> 이벤트 리스닝
// 이벤트 하나에 이벤트 여러개를 달 수 있다
myEvent.addListener('event1', () => {
    console.log('이벤트 1');
});

myEvent.addListener('event1', () => {
    console.log('이벤트 1 추가');
});

// addListener 와 기능이 같다 (addListener 와 마찬가지로 중복 가능)
myEvent.on('event2', () => {
    console.log('이벤트 2');
});

myEvent.on('event2', () => {
    console.log('이벤트 2 추가');
});

// 이벤트를 호출하는 메서드. 이벤트 이름을 인자로 넣어주면 미리 등록해뒀던 이벤트 콜백이 실행
myEvent.emit('event1');
myEvent.emit('event2');

// once(이벤트명, 콜백): 한번만 실행되는 이벤트
myEvent.once('event3', () => {
    console.log('이벤트 3');
});

// once 로 할당한 이벤트를 두번 호출했지만 콜백이 한번만 실행되는 모습
myEvent.emit('event3');
myEvent.emit('event3');

myEvent.on('event4', () => {
    console.log('이벤트 4');
});

// removeAllListeners(이벤트명): 이벤트에 연결된 모든 이벤트 리스너를 제거
myEvent.removeAllListeners('event4');
myEvent.emit('event4');

const listener = () => {
    console.log('이벤트 5');
};

myEvent.on('event5', listener);
// removeListener(이벤트명, 리스너): 이벤트에 연결된 리스너를 하나씩 제거
myEvent.removeListener('event5', listener);
myEvent.emit('event5');

// listenerCount(이벤트명): 현재 리스너가 몇 개 연결되어 있는지 확인
console.log(myEvent.listenerCount('event2'));