// 소셜 로그인 가입자는 예전에 "이메일 = 비밀번호"로 저장되었다.
// 이 스크립트는 비밀번호가 이메일과 일치하는 계정을 찾아 추측 불가능한 임의 비밀번호로 교체한다.
// 실행: DATABASE_* 환경변수를 설정한 뒤 `node scripts/rotate-social-passwords.js`
// 기본은 대상만 출력하는 dry-run이며, 실제로 바꾸려면 `--apply`를 붙인다.
require("dotenv/config");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const mysql = require("mysql2/promise");

async function main() {
  const apply = process.argv.includes("--apply");
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    user: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_DATABASE,
  });

  const [users] = await connection.query(
    "SELECT id, email, password FROM user"
  );

  let count = 0;
  for (const user of users) {
    if (!(await bcrypt.compare(user.email, user.password))) continue;

    count++;
    console.log(`${apply ? "rotated" : "target"}: ${user.id}`);
    if (apply) {
      const password = await bcrypt.hash(
        crypto.randomBytes(32).toString("hex"),
        10
      );
      await connection.query("UPDATE user SET password = ? WHERE id = ?", [
        password,
        user.id,
      ]);
    }
  }

  console.log(`${count}개 계정 ${apply ? "교체 완료" : "교체 대상"}`);
  await connection.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
