import {
  HttpException,
  Injectable,
  UnprocessableEntityException,
} from "@nestjs/common";
import axios from "axios";

const IAMPORT_API = "https://api.iamport.kr";

// 아임포트 응답의 메시지와 상태 코드를 그대로 돌려준다
function toIamportHttpException(error) {
  return new HttpException(error.response.data.message, error.response.status);
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
      });

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
      });
      return result.data.response;
    } catch (error) {
      throw new UnprocessableEntityException(error.response.data.message);
    }
  }

  async cancelPayment({ accessToken, impUid }) {
    try {
      await axios({
        url: `${IAMPORT_API}/payments/cancel`,
        method: "post",
        headers: { Authorization: accessToken }, // 인증 토큰 Authorization header 추가
        data: {
          imp_uid: impUid,
        },
      });
    } catch (error) {
      throw toIamportHttpException(error);
    }
  }
}
