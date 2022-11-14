const fs = require('fs');

setInterval(() => {
    // abcdefg.js 라는 없는 파일을 지울려고 한다 -> 에러!
    fs.unlink('./abcdefg.js', (err) => {
        if (err) {
            console.error(err);
        }
    });
}, 1000);