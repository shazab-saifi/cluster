import { createClient, RedisClientType } from "redis";

export const redisClient: RedisClientType = createClient({
  url: "redis://localhost:6379",
});
export const subscriber: RedisClientType = redisClient.duplicate();
subscriber.on("error", () => console.error);

try {
  await subscriber.connect();
} catch (error) {
  console.log("Subscriber error while connecting: ", error);
}

export const publisher: RedisClientType = redisClient.duplicate();
publisher.on("error", () => console.error);

try {
  await publisher.connect();
} catch (error) {
  console.log("Publisher error while connecting: ", error);
}
