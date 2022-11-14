const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
    console.log(`마스터 프로세스 아이디: ${process.pid}`);
    // CPU 개수만큼 워커를 생산
    for (let i = 0; i < numCPUs; i+=1) {
        cluster.fork();
    }
    // 워커가 종료되었을 때
    cluster.on('exit', (worker, code, signal) => {
        // process.pid 는 매 실행 시마다 달라짐
        console.log(`${worker.process.pid}번 워커가 종료되었습니다.`);
        // 워커가 죽을 때마다 새로운 워커가 하나 더 생성됨
        cluster.fork();
    });
} else {
    // 워커들이 포트에서 대기
    http.createServer((req, res) => {
        res.write('<h1>Hello Node!</h1>');
        res.end('<p>Hello Cluster!</p>');
        // 8085 서버에 접속하면 1초 후 console에 워커가 종료되었다는 메세지가 뜬다
        // 서버를 새로고집 할때마다(접속할때 마다) 워커가 하나씩 종료된다
        // 코어 개수(numCPUs)만큼 새로고침을 하면 모든 워커가 종료되어 서버가 종료된다
        setTimeout(() => {
            process.exit(1);
        }, 1000);
    }).listen(8085);

    console.log(`${process.pid}번 워커 실행`);
}