import { ExecutionContext } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import { AuthGuard } from "@nestjs/passport";

// passport 가드가 GraphQL 컨텍스트의 req를 보도록 한다
const getGqlRequest = (context: ExecutionContext) =>
  GqlExecutionContext.create(context).getContext().req;

// 가드는 이름 있는 클래스로 둔다. Nest는 name이 빈 가드 클래스를 걸러내서 실행하지 않는다
export class GqlAuthAccessGuard extends AuthGuard("access") {
  getRequest(context: ExecutionContext) {
    return getGqlRequest(context);
  }
}

export class GqlAuthRefreshGuard extends AuthGuard("refresh") {
  getRequest(context: ExecutionContext) {
    return getGqlRequest(context);
  }
}
