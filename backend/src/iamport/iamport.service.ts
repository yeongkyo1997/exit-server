import {
  BadGatewayException,
  HttpException,
  Injectable,
  UnprocessableEntityException,
} from "@nestjs/common";
import axios from "axios";

const IAMPORT_API = "https://api.iamport.kr";

// 아임포트 응답을 기다리는 최대 시간(ms). 없으면 axios는 응답이 올 때까지 무한정 기다린다
const IAMPORT_TIMEOUT = 10000;

const IAMPORT_UNAVAILABLE_MESSAGE = "결제 서버와 통신하지 못했습니다.";

// 응답이 없거나(시간 초과, 네트워크 오류) 아임포트가 우리 API 키를 거부한 경우(401/403).
// 401을 그대로 넘기면 apollo가 UNAUTHENTICATED로 바꿔 프론트가 세션 만료로 오해하므로 502로 바꾼다
function isIamportUnavailable(error): boolean {
  const status = error?.response?.status;
  return typeof status !== "number" || status === 401 || status === 403;
}

function iamportErrorMessage(error): string {
  const message = error?.response?.data?.message;
  return typeof message === "string" && message
    ? message
    : IAMPORT_UNAVAILABLE_MESSAGE;
}

// 아임포트 응답의 메시지와 상태 코드를 돌려준다 (응답이 없거나 인증 오류면 502)
function toIamportHttpException(error): HttpException {
  if (error instanceof HttpException) return error;
  if (isIamportUnavailable(error)) {
    // 원인은 서버 로그에만 남긴다 (토큰·키는 남기지 않는다)
    console.error(
      "아임포트 통신 실패:",
      error?.response?.status,
      error?.message
    );
    return new BadGatewayException(IAMPORT_UNAVAILABLE_MESSAGE);
  }
  return new HttpException(iamportErrorMessage(error), error.response.status);
}

@Injectable()
export class IamportService {
  // 인증 토큰 발급 받기
  async getToken() {
    try {
      const result = await axios({
        url: `${IAMPORT_API}/users/getToken`,
        method: "post",
        headers: { "Content-Type": "application/json" },
        data: {
          imp_key: process.env.IMP_KEY, // REST API키
          imp_secret: process.env.IMP_SECRET, // REST API Secret
        },
        timeout: IAMPORT_TIMEOUT,
      });

      // 아임포트가 실패를 HTTP 200 + response null로 돌려주면 여기서 TypeError가 나고 아래에서 502가 된다
      const { access_token } = result.data.response;
      return access_token;
    } catch (error) {
      throw toIamportHttpException(error);
    }
  }

  // 토큰 검증하기
  async verifyToken({ impUid, accessToken }) {
    try {
      const result = await axios({
        url: `${IAMPORT_API}/payments/${impUid}`,
        method: "get",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`, // 발행된 액세스 토큰
        },
        timeout: IAMPORT_TIMEOUT,
      });
      return result.data?.response;
    } catch (error) {
      if (isIamportUnavailable(error)) throw toIamportHttpException(error);
      throw new UnprocessableEntityException(iamportErrorMessage(error));
    }
  }

  async cancelPayment({ accessToken, impUid }) {
    let result;
    try {
      result = await axios({
        url: `${IAMPORT_API}/payments/cancel`,
        method: "post",
        headers: { Authorization: accessToken }, // 인증 토큰 Authorization header 추가
        data: {
          imp_uid: impUid,
        },
        timeout: IAMPORT_TIMEOUT,
      });
    } catch (error) {
      throw toIamportHttpException(error);
    }

    // 아임포트는 환불 실패(이미 취소됨 등)를 HTTP 200 + code != 0 으로 돌려준다
    if (result.data?.code !== 0)
      throw new UnprocessableEntityException(
        result.data?.message ?? "결제 취소에 실패했습니다."
      );
    return result.data.response;
  }
}
