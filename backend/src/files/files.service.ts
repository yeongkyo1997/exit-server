import { Injectable, Logger } from "@nestjs/common";
import { Storage } from "@google-cloud/storage";
import { v4 } from "uuid";
import { Cron } from "@nestjs/schedule";

@Injectable()
export class FilesService {
  async upload({ file, type }) {
    const waitedImages = await Promise.all(file);

    const bucket = process.env.BUCKET_NAME;

    const storage = new Storage({
      projectId: process.env.PROJECT_ID,
      keyFilename:
        process.env.KEY_FILE_NAME || "/team-secret/gcp-file-storage.json",
    }).bucket(bucket);

    const time = new Date(new Intl.DateTimeFormat("kr").format());
    const year = time.getFullYear();
    const month = String(time.getMonth() + 1).padStart(2, "0");
    const day = String(time.getDate()).padStart(2, "0");
    const today = `${year}-${month}-${day}`;

    const results = [];
    await Promise.all(
      waitedImages.map(async (el) => {
        const url = await new Promise((resolve, reject) => {
          const fname = `${type}/${today}/${v4()}`;
          el.createReadStream()
            .pipe(storage.file(`${fname}/${el.filename}`).createWriteStream())
            .on("finish", async () => {
              resolve(
                `https://storage.googleapis.com/${bucket}/${fname}/${el.filename}`
              );
            })
            .on("error", (error) => {
              reject(error);
            });
        });
        await results.push(url);
      })
    );
    return results;
  }

  //softDelete된 url이나 DB에는 저장이 안 되어 있지만 Bucket에는 올라가 있는 url을 찾아서 지워주기
  // @Cron("* * * * * *")
  // async remove({ url }) {
  //   const bucket = process.env.BUCKET_NAME;

  //   const storage = new Storage({
  //     projectId: process.env.PROJECT_ID,
  //     keyFilename:
  //       process.env.KEY_FILE_NAME || "/team-secret/gcp-file-storage.json",
  //   }).bucket(bucket);

  //   const fileName = url.replace(
  //     `"https://storage.googleapis.com/${bucket}/`,
  //     ""
  //   );

  //   await new Promise((resolve, reject) => {
  //     storage
  //       .file(fileName)
  //       .delete()
  //   });

  //   return result.affected ? true : false;
  // }
}
