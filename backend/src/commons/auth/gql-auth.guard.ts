import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
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

// 운영자 user id 목록 (env ADMIN_USER_IDS, 쉼표로 구분). 비어 있으면 아무도 운영자가 아니다
export const adminUserIds = () =>
  (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

// 운영자 전용 mutation. 반드시 @UseGuards(GqlAuthAccessGuard, GqlAdminGuard) 순서로 붙인다
// (access 가드가 req.user를 채운 뒤에 실행돼야 한다). ADMIN_USER_IDS에 없는 유저는 403
@Injectable()
export class GqlAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = getGqlRequest(context)?.user;
    if (!user?.id || !adminUserIds().includes(user.id))
      throw new ForbiddenException("운영자만 사용할 수 있습니다.");
    return true;
  }
}
