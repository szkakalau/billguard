/** Mirrors `AlertThreshold` / `AlertChannel` in prisma/schema.prisma (avoids fragile `@prisma/client` type re-exports on some CI setups). */
export type AlertThreshold = "p50" | "p90" | "p100";
export type AlertChannel = "email" | "slack";
