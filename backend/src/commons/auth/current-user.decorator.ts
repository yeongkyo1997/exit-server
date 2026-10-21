import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";

// 로그인 가드를 통과한 요청의 req.user를 그대로 넘긴다.
// 파라미터 타입은 AuthUser(interface)로 선언해야 전역 ValidationPipe가 건너뛴다.
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    GqlExecutionContext.create(context).getContext().req.user
);
