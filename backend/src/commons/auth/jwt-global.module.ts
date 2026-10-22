import { Global, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

// JwtService를 모든 모듈에서 주입받을 수 있게 한다 (AppModule에서 한 번 import).
// 서명·검증 때마다 secret을 넘기므로 옵션은 비워 둔다 (AuthsModule의 JwtModule.register({})와 같다)
@Global()
@Module({
  imports: [JwtModule.register({})],
  exports: [JwtModule],
})
export class JwtGlobalModule {}
