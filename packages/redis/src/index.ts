import { createClient, RedisClientType } from "redis";

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL environment variable is not set");
}

export const redisClient: RedisClientType = createClient({
  url: process.env.REDIS_URL,
});

export const subscriber: RedisClientType = redisClient.duplicate();
subscriber.on("error", () => console.error);

export const publisher: RedisClientType = redisClient.duplicate();
publisher.on("error", () => console.error);

try {
  await Promise.all([
    redisClient.connect(),
    subscriber.connect(),
    publisher.connect(),
  ]);
} catch (error) {
  console.error("Failed to connect Redis clients:", error);
  process.exit(1);
}

process.on("SIGINT", async () => {
  await Promise.all([redisClient.quit(), subscriber.quit(), publisher.quit()]);
  process.exit(0);
});
