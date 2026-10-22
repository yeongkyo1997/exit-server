import { Cache } from "cache-manager";

// cache-manager-redis-store 2.0.0의 store.getClient()가 돌려주는 redis v3(콜백 방식) 클라이언트 중 쓰는 부분
interface RedisMulti {
  incr(key: string): RedisMulti;
  expire(key: string, seconds: number): RedisMulti;
  exec(callback: (error: Error | null, replies: unknown[]) => void): void;
}

interface RedisCallbackClient {
  multi(): RedisMulti;
  set(key: string, value: string, ...args: unknown[]): boolean;
}

const redisClient = (cache: Cache): RedisCallbackClient | undefined =>
  (cache.store as { getClient?: () => RedisCallbackClient }).getClient?.();

// 값을 원자적으로 1 올리고 TTL(초)을 다시 건다. 새 값을 돌려준다.
// (Apollo 배치 요청은 병렬로 실행되므로 get→set 카운터는 우회된다)
// 키에 숫자가 아닌 값이 있는 등 redis가 실패하면 예외를 던진다.
export const incrementWithTtl = async (
  cache: Cache,
  key: string,
  ttl: number
): Promise<number> => {
  const client = redisClient(cache);
  if (!client) {
    // redis가 아닌 store(테스트용 memory 등)에서만 쓰는 비원자 대체 경로
    const next = (Number(await cache.get(key)) || 0) + 1;
    await cache.set(key, next, { ttl });
    return next;
  }
  return new Promise<number>((resolve, reject) =>
    client
      .multi()
      .incr(key)
      .expire(key, ttl)
      .exec((error, replies) => {
        const value = Number(replies?.[0]);
        if (error || replies?.[0] instanceof Error || !Number.isFinite(value))
          return reject(error ?? replies?.[0] ?? new Error("INCR 실패"));
        resolve(value);
      })
  );
};

// 키가 없을 때만 값을 쓰고 TTL(초)을 건다 (redis SET NX EX). 이번 호출이 썼으면 true
export const setIfAbsent = async (
  cache: Cache,
  key: string,
  ttl: number
): Promise<boolean> => {
  const client = redisClient(cache);
  if (!client) {
    // redis가 아닌 store에서만 쓰는 비원자 대체 경로
    const existing = await cache.get(key);
    if (existing !== undefined && existing !== null) return false;
    await cache.set(key, 1, { ttl });
    return true;
  }
  return new Promise<boolean>((resolve, reject) =>
    // cache.get이 JSON.parse로 읽을 수 있게 JSON 값("1")을 쓴다
    client.set(key, "1", "EX", ttl, "NX", (error: Error | null, reply) =>
      error ? reject(error) : resolve(reply === "OK")
    )
  );
};
