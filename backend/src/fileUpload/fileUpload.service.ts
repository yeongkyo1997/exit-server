import { Injectable } from "@nestjs/common";
import { Storage } from "@google-cloud/storage";

@Injectable()
export class FileUploadsService {
  async upload({ file }) {
    const waitedImages = await Promise.all(file);

    const bucket = process.env.BUCKET_NAME;

    const storage = new Storage({
      projectId: process.env.PROJECT_ID,
      keyFilename: process.env.KEY_FILE_NAME,
    }).bucket(bucket);

    const results = [];
    await Promise.all(
      waitedImages.map(async (el) => {
        const url = await new Promise((resolve, reject) => {
          el.createReadStream()
            .pipe(storage.file(el.filename).createWriteStream())
            .on("finish", async () => {
              resolve(
                `https://storage.googleapis.com/${bucket}/${el.filename}`
              );
            })
            .on("error", (error) => {
              reject(`Unable to upload image`);
              return error;
            });
        });
        await results.push(url);
      })
    );
    return results;
  }
}
