module.exports = (sequelize, DataTypes) => {
    // 첫번째 인자로 테이블명, 두번째 인자로 각 컬럼의 스펙, 세번째 인자로 테이블 옵션
    return sequelize.define('user', {
        // 시퀄라이즈는 알아서 id를 기본키로 연결한다 (id 필요 x)
        // NOT NULL => allowNull
        name: {
            // VARCHAR => STRING
            type: DataTypes.STRING(20),
            allowNull: false,
            unique: true,
        },
        age: {
            // INT => INTEGER
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
        },
        married: {
            // TINYINT => BOOLEAN
            type: DataTypes.BOOLEAN,
            allowNull: false,
        },
        comment: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        created_at: {
            // DATETIME => DATE
            type: DataTypes.DATE,
            allowNull: false,
            // 기본값 입력시 sequelize.literal 메서드로
            defaultValue: sequelize.literal('now()'),
        },
    }, {
        // timestamps가 true면, 'createdAt'과 'updatedAt' 컬럼이 자동 추가됨 (로우의 생성과 수정시 자동 입력)
        // 또다른 옵션 (paranoid, underscored, tableName)
        // 1. paranoid : timestamps가 true여야 설정 가능, deletedAt 컬럼 추가
        //              로우를 삭제하는 시퀄라이즈 명령시, 로우를 제거하는 대신 deletedAt에 제거된 날짜를 입력
        //              이후 로우를 조회하는 명령시, deletedAt의 값이 null인 로우(삭제되지 않은 로우)를 조회해줌 (데이터는 테이블에 남아있다는 뜻 -> 데이터 복구 염려)
        // 2. underscored : createdAt, updatedAt, deletedAt 컬럼과 관계 컬럼들의 이름을 스네이크케이스(변수 이름에 대문자 대신 _를 사용) 형식으로 바꾼다
        //                  created_At, updated_At, deleted_At
        // 3. tableName : 테이블 이름을 다른 것으로 설정하고 싶을 때 사용
        //                시퀄라이즈는 define 메서드의 첫번째 인자로 들어온 테이블 이름을 자동으로 복수형으로 만들어 테이블 이름으로 사용
        //                ex) user -> users, comment -> comments
        timestamps: false,
    });
};