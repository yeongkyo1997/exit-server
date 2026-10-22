import { Injectable } from "@nestjs/common";
import { Bucket, Storage } from "@google-cloud/storage";
import { v4 } from "uuid";
import { toLocalDate } from "src/commons/utils/date";
import { pipeUpload, planUpload } from "src/commons/utils/upload";

@Injectable()
export class FilesService {
  private storageBucket: Bucket;

  async upload({ file, type }) {
    const waitedImages = await Promise.all(file);
    // 아무것도 쓰기 전에 전부 검사한다 (허용되지 않는 형식이면 422).
    // 저장할 Content-Type은 파일 이름이 아니라 서버가 정한다
    const plans = waitedImages.map((el) => planUpload(type, el));

    const bucket = process.env.BUCKET_NAME;

    // Storage 클라이언트는 첫 업로드 때 한 번만 만든다
    this.storageBucket ??= new Storage({
      projectId: process.env.PROJECT_ID,
      keyFilename: process.env.KEY_FILE_NAME,
    }).bucket(bucket);
    const storage = this.storageBucket;

    const time = toLocalDate();
    const year = time.getFullYear();
    const month = String(time.getMonth() + 1).padStart(2, "0");
    const day = String(time.getDate()).padStart(2, "0");
    const today = `${year}-${month}-${day}`;

    return Promise.all(
      waitedImages.map(async (el, i) => {
        const objectName = `${type}/${today}/${v4()}/${plans[i].safeName}`;
        // 크기 제한을 넘거나 읽기·쓰기가 실패하면 스트림을 모두 정리하고 reject한다
        // (GCS 쓰기 스트림은 크기 확인을 통과한 뒤에만 연다)
        await pipeUpload(
          el,
          () =>
            storage
              .file(objectName)
              .createWriteStream({ contentType: plans[i].contentType }),
          plans[i].maxBytes
        );
        return `https://storage.googleapis.com/${bucket}/${objectName}`;
      })
    );
  }
}
