import { prisma } from "@/lib/db";
import type { AlertChannel, AlertThreshold } from "@/lib/prisma-types";

export async function runOncePerDay(params: {
  apiKeyId: string;
  date: Date;
  threshold: AlertThreshold;
  channel: AlertChannel;
  run: () => Promise<void>;
}) {
  // 先用唯一约束“占位”，避免并发重复发送；如果发送失败会回滚占位，允许后续重试
  try {
    await prisma.alertEvent.create({
      data: {
        apiKeyId: params.apiKeyId,
        date: params.date,
        threshold: params.threshold,
        channel: params.channel,
      },
    });
  } catch (e) {
    // Unique constraint hit => already sent today for this threshold + channel
    if ((e as { code?: string }).code === "P2002") return { skipped: true as const };
    throw e;
  }

  try {
    await params.run();
  } catch (e) {
    // 发送失败：删除占位记录，保证下次还能再发（不会被“假成功”去重掉）
    await prisma.alertEvent
      .deleteMany({
        where: {
          apiKeyId: params.apiKeyId,
          date: params.date,
          threshold: params.threshold,
          channel: params.channel,
        },
      })
      .catch(() => {});
    throw e;
  }
  return { skipped: false as const };
}

