// 도메인 테이블(모델)
// 컬럼: host(인터넷 주소), type(도메인 종류), clientSecret(클라이언트 비밀키)
module.exports = (sequelize, DataTypes) => (
  sequelize.define('domain', {
    host: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    clientSecret: {
      type: DataTypes.STRING(40),
      allowNull: false,
    },
    frontSecret: {
      type: DataTypes.STRING(40),
      allowNull: false,
    },
  }, {
    // validate 속성 : 데이터를 추가로 검증
    validate: {
      // unknownType : 검증기
      // 종류: free(무료) vs premium(프리미엄)
      unknownType() {
        console.log(this.type, this.type !== 'free', this.type !== 'premium');
        if (this.type !== 'free' && this.type !== 'premium') {
          throw new Error('type 컬럼은 free나 premium이어야 합니다.');
        }
      },
    },
    timestamps: true,
    paranoid: true,
  })
);