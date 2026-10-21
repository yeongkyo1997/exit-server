import { Injectable } from "@nestjs/common";
import { Bucket, Storage } from "@google-cloud/storage";
import { v4 } from "uuid";
import { toLocalDate } from "src/commons/utils/date";

@Injectable()
export class FilesService {
  private storageBucket: Bucket;

  async upload({ file, type }) {
    const waitedImages = await Promise.all(file);

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
      waitedImages.map(
        (el) =>
          new Promise<string>((resolve, reject) => {
            const fname = `${type}/${today}/${v4()}`;
            el.createReadStream()
              .pipe(storage.file(`${fname}/${el.filename}`).createWriteStream())
              .on("finish", () => {
                resolve(
                  `https://storage.googleapis.com/${bucket}/${fname}/${el.filename}`
                );
              })
              .on("error", (error) => {
                reject(error);
              });
          })
      )
    );
  }
}
