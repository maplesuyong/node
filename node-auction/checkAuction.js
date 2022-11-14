// 낙찰자가 없고 경매 종료시간이 다 된 모든 상품을 찾아서
// 그 상품들의 입찰중 낙찰액이 제일 높은 유저의 아이디가 낙찰자로 한다
// 그리고 그 낙찰자의 보유 금액을 낙찰액만큼 차감한다
const { Good, Auction, User, sequelize} = require('./models');
const schedule = require('node-schedule');

module.exports = async () => {
  try {
    // 낙찰자가 없는 상품들을 먼저 다 찾는다
    const targets = await Good.findAll({
      where: {
        soldId: null,
      },
    });

    // 낙찰자가 없는 각 상품들로 하여금...
    targets.forEach(async (target) => {
      // 낙찰자가 없는 상품들의 각 경매 종료 시간(target.end)에
      // 생성 시간(target.createdAt)을 더한 시간이 현재 시간(new Date())보다 작을 경우가
      // 경매가 종료되었다는 뜻이다
      const end = new Date(target.createdAt);
      end.setHours(end.getHours() + target.end);
      if (new Date() > end) {
        const success = await Auction.findOne({
          where: { goodId: target.id },
          order: [['bid', 'DESC']],   // 입찰가가 가장 큰 가격의 입찰(Auction의 rows)이 success에 들어간다
        });
        if (success) {  // 경매가 종료됬고 낙찰자가 있을때
          // Good 테이블에서 id가 '위에서 찾은 상품의 아이디'와 같다면,
          // 낙찰자 컬럼(soldId)을 success.userId로 UPDATE 한다
          // success.userId가 낙찰자가 된다
          await Good.update({
            soldId: success.userId
          }, {
            where: {
              id: target.id
            }
          });
    
          // User 테이블에서 id가 '낙찰자 아이디(success.userId)'와 같은 row를
          // 보유 금액 컬럼(money)을 현재 금액에서 낙찰액을 뺀 값으로 UPDATE 한다
          await User.update({
            money: sequelize.literal(`money - ${success.bid}`),
          }, {
            where: {
              id: success.userId,
            },
          });
        } else {  // 경매가 종료됬지만 낙찰자가 아무도 없을때
          await Good.update({   // 낙찰자 컬럼(soldId)를 상품의 주인(target.ownerId)으로 UPDATE 한다
            soldId: target.ownerId,
          }, {
            where: {
              id: target.id,
            }
          });
        }
      } else {  // 낙찰자는 없지만 아직 경매가 진행중인 상품들은 재시작할때 스케줄러를 재시작한다
        schedule.scheduleJob(end, async () => {
          const success = await Auction.findOne({
            where: { goodId: target.id },   // 상품 아이디
            order: [['bid', 'DESC']],   // 입찰가 컬럼의 내림차순으로 정렬
          });
          if (success) {
            // 위에서 찾은 가장 높은 입찰가를 부른 사람의 아이디(success.userId)를
            // Good 테이블의 낙찰자(soldId) 컬럼에 집어넣는다
            await Good.update({
              soldId: success.userId
            }, { 
              where: { id: target.id }
            });
      
            // 그 낙찰자의 보유 자산(money 컬럼)을 낙찰된 금액(success.bid)만큼 뺀다
            // { 컬럼: sequelize.literal(컬럼 - 숫자) } : 시퀄라이즈에서 해당 컬럼의 숫자를 줄이는 방법
            // { 컬럼: sequelize.literal(컬럼 + 숫자) } : 시퀄라이즈에서 해당 컬럼의 숫자를 늘이는 방법
            await User.update({
              money: sequelize.literal(`money-${success.bid}`),
            }, {
              where: { id: success.userId },
            });
          } else {  // 경매가 종료됬지만 낙찰자가 아무도 없을때
            await Good.update({   // 낙찰자 컬럼(soldId)를 상품의 주인(target.ownerId)으로 UPDATE 한다
              soldId: target.ownerId,
            }, {
              where: {
                id: target.id,
              }
            });
          }
        })
      }
    });
  } catch (err) {
    console.error(err);
  }
};