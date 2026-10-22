import {
  PayloadTooLargeException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { basename, extname } from "path";
import { pipeline, Readable, Transform, Writable } from "stream";
import {
  UPLOAD_MAX_FILE_SIZE,
  UPLOAD_MAX_IMAGE_SIZE,
} from "src/commons/constants";

// 업로드 종류별 허용 확장자 → 저장할 Content-Type.
// 파일 이름이 Content-Type을 정하지 못하게 서버가 고정한다 (svg·html 등은 거부)
const IMAGE_CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

const UPLOAD_RULES: Record<
  string,
  { contentTypes: Record<string, string>; maxBytes: number }
> = {
  board: { contentTypes: IMAGE_CONTENT_TYPES, maxBytes: UPLOAD_MAX_IMAGE_SIZE },
  user: { contentTypes: IMAGE_CONTENT_TYPES, maxBytes: UPLOAD_MAX_IMAGE_SIZE },
  zip: {
    contentTypes: { ".zip": "application/zip" },
    maxBytes: UPLOAD_MAX_FILE_SIZE,
  },
};

export interface UploadPlan {
  contentType: string; // createWriteStream({ contentType })에 그대로 넘긴다
  safeName: string; // 객체 이름의 마지막 부분 (경로 구분자 제거)
  maxBytes: number; // 이 크기를 넘으면 pipeUpload가 중단한다
}

// 저장 전에 파일 하나를 검사해 저장할 Content-Type과 안전한 파일 이름을 정한다.
// 확장자가 우선이고, 확장자로 정해지지 않으면 클라이언트 mimetype이 허용 목록 값일 때만 그 값을 쓴다
// (canvas Blob처럼 이름이 "blob"인 이미지). 허용되지 않으면 UnprocessableEntityException
export const planUpload = (
  type: string,
  file: { filename?: string; mimetype?: string }
): UploadPlan => {
  const rule = UPLOAD_RULES[type];
  const allowed = rule?.contentTypes ?? {};
  const filename = typeof file?.filename === "string" ? file.filename : "";

  const byExtension = allowed[extname(filename).toLowerCase()];
  const byMimetype = Object.values(allowed).includes(file?.mimetype)
    ? file.mimetype
    : undefined;
  const contentType = byExtension ?? byMimetype;
  if (!rule || !contentType)
    throw new UnprocessableEntityException("허용되지 않는 파일 형식입니다.");

  const name = basename(filename).replace(/[\\/]/g, "_").trim();
  const safeName = name && name !== "." && name !== ".." ? name : "file";
  return { contentType, safeName, maxBytes: rule.maxBytes };
};

// 지나가는 바이트를 세다가 maxBytes를 넘으면 PayloadTooLargeException으로 스트림을 끊는다
const sizeLimiter = (maxBytes: number) => {
  let received = 0;
  return new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      received += chunk.length;
      if (received > maxBytes)
        return callback(
          new PayloadTooLargeException("파일 크기가 너무 큽니다.")
        );
      callback(null, chunk);
    },
  });
};

// read → 크기 제한 → write를 잇는다. 끝까지 쓰이면 resolve, 하나라도 실패하면 모든 스트림을 정리하고 reject
// (pipe만 쓰면 읽기 에러가 전달되지 않아 요청이 멈춘다)
const pipeWithLimit = (
  readStream: Readable | NodeJS.ReadableStream,
  maxBytes: number,
  writeStream: Writable
) =>
  new Promise<void>((resolve, reject) =>
    pipeline(readStream, sizeLimiter(maxBytes), writeStream, (error) =>
      error ? reject(error) : resolve()
    )
  );

// 받은 바이트를 버리는 쓰기 스트림 (크기 확인용)
const discardStream = () =>
  new Writable({ write: (_chunk, _encoding, callback) => callback() });

// 업로드 파일을 크기 제한을 걸어 openWriteStream()이 연 스트림으로 보낸다.
// 1) 먼저 끝까지 읽어 크기만 확인한다. 전역 maxFileSize 초과(graphql-upload가 스트림을 끊음)·연결 끊김·크기 초과는
//    여기서 끝나므로 쓰기 스트림을 아예 열지 않는다 (GCS 쓰기 스트림은 destroy해도 내부 resumable 업로드가 열린 채 남는다)
// 2) 통과한 파일만 다시 읽어 보낸다 (graphql-upload는 임시 파일에 받아 두어 같은 파일을 여러 번 읽을 수 있다)
// 이미 실패한 업로드는 createReadStream()이 바로 예외를 던지고, async 함수라 reject가 된다
export const pipeUpload = async (
  file: { createReadStream: () => Readable | NodeJS.ReadableStream },
  openWriteStream: () => Writable,
  maxBytes: number
) => {
  await pipeWithLimit(file.createReadStream(), maxBytes, discardStream());
  await pipeWithLimit(file.createReadStream(), maxBytes, openWriteStream());
};
