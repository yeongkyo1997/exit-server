import {
  HttpException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class IamportService {
  async getToken() {
    try {
      const result = await axios({
        url: 'https://api.iamport.kr/users/getToken',
        method: 'post', // POST method
        headers: { 'Content-Type': 'application/json' }, // "Content-Type": "application/json"
        data: {
          imp_key: process.env.IMP_KEY, // REST API키
          imp_secret: process.env.IMP_SECRET, // REST API Secret
        },
      });
      const { access_token } = result.data.response;
      return access_token;
    } catch (error) {
      throw new HttpException(
        error.response.data.message,
        error.response.status,
      );
    }
  }

  // 토큰 검증하기
  async verifyToken({ impUid, accessToken }) {
    try {
      const result = await axios({
        url: `https://api.iamport.kr/payments/${impUid}`,
        method: 'get', // GET method
        headers: {
          'Content-Type': 'application/json', // "Content-Type": "application/json"
          Authorization: `Bearer ${accessToken}`, // 발행된 액세스 토큰
        },
      });
      return result.data.response;
    } catch (error) {
      throw new UnprocessableEntityException(error.response.data.message);
    }
  }

  async cancel({ accessToken, impUid }) {
    try {
      await axios({
        url: `https://api.iamport.kr/payments/cancel`,
        method: 'post', // POST method
        headers: { Authorization: accessToken }, // 인증 토큰 Authorization headerd 추가
        data: {
          imp_uid: impUid,
        },
      });
    } catch (error) {
      throw new HttpException(
        error.response.data.message,
        error.response.status,
      );
    }
  }
}
