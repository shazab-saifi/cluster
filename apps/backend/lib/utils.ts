export function generateRandomCharStr() {
  const chars = "!@#$%&_";
  return Array.from(
    { length: 3 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}
