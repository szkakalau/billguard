import { prisma } from "@/lib/db";
import { decryptString } from "@/lib/crypto";
import { runOncePerDay } from "@/lib/notify/dedupe";
import { sendEmail } from "@/lib/notify/email";
import { sendSlackWebhook } from "@/lib/notify/slack";
import type { AlertThreshold } from "@/lib/prisma-types";

function startOfDayUtc(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function startOfMonthUtc(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function pickThreshold(ratio: number): AlertThreshold | null {
  if (ratio >= 1) return "p100";
  if (ratio >= 0.9) return "p90";
  if (ratio >= 0.5) return "p50";
  return null;
}

export async function evaluateCapAndNotify(apiKeyId: string, now = new Date()) {
  const rule = await prisma.alertRule.findUnique({
    where: { apiKeyId },
    include: {
      user: { select: { email: true } },
      apiKey: { select: { name: true, status: true } },
    },
  });
  if (!rule) return { ok: true as const, skipped: "no_rule" as const };

  const day = startOfDayUtc(now);
  const month = startOfMonthUtc(now);

  const [dailyAgg, monthlyAgg] = await Promise.all([
    prisma.usageRecord.aggregate({
      where: { apiKeyId, date: { gte: day } },
      _sum: { costUsd: true },
    }),
    prisma.usageRecord.aggregate({
      where: { apiKeyId, date: { gte: month } },
      _sum: { costUsd: true },
    }),
  ]);

  const dailyCost = Number(dailyAgg._sum.costUsd ?? 0);
  const monthlyCost = Number(monthlyAgg._sum.costUsd ?? 0);

  const dailyBudget = rule.dailyBudgetUsd ? Number(rule.dailyBudgetUsd) : null;
  const monthlyBudget = rule.monthlyBudgetUsd ? Number(rule.monthlyBudgetUsd) : null;

  const dailyRatio = dailyBudget ? dailyCost / dailyBudget : null;
  const monthlyRatio = monthlyBudget ? monthlyCost / monthlyBudget : null;

  const threshold = Math.max(dailyRatio ?? 0, monthlyRatio ?? 0);
  const hit = pickThreshold(threshold);
  if (!hit) return { ok: true as const, skipped: "below_threshold" as const };

  const subjectBase = `BillGuard：${rule.apiKey.name} 用量提醒`;
  const message = [
    `Key：${rule.apiKey.name}`,
    `今日：$${dailyCost.toFixed(4)}${dailyBudget ? ` / $${dailyBudget.toFixed(4)}` : ""}`,
    `本月：$${monthlyCost.toFixed(4)}${monthlyBudget ? ` / $${monthlyBudget.toFixed(4)}` : ""}`,
    hit === "p50" ? "阈值：50%（提醒）" : hit === "p90" ? "阈值：90%（警告）" : "阈值：100%（已触发熔断）",
  ].join("\n");

  const notifyErrors: string[] = [];

  if (rule.notifyEmailEnabled && rule.user.email) {
    try {
      await runOncePerDay({
        apiKeyId,
        date: day,
        threshold: hit,
        channel: "email",
        run: async () => {
          await sendEmail({
            to: rule.user.email!,
            subject: subjectBase,
            text: message,
          });
        },
      });
    } catch (e) {
      notifyErrors.push(`email: ${(e as Error).message}`.slice(0, 500));
    }
  }

  if (rule.slackWebhookCiphertext && rule.slackWebhookIv && rule.slackWebhookTag) {
    const webhookUrl = decryptString({
      ciphertext: rule.slackWebhookCiphertext,
      iv: rule.slackWebhookIv,
      tag: rule.slackWebhookTag,
    });

    try {
      await runOncePerDay({
        apiKeyId,
        date: day,
        threshold: hit,
        channel: "slack",
        run: async () => {
          await sendSlackWebhook({ webhookUrl, text: message });
        },
      });
    } catch (e) {
      notifyErrors.push(`slack: ${(e as Error).message}`.slice(0, 500));
    }
  }

  const shouldCap =
    (dailyRatio !== null && dailyRatio >= 1) ||
    (monthlyRatio !== null && monthlyRatio >= 1);

  if (shouldCap && rule.apiKey.status !== "capped") {
    await prisma.apiKey.update({
      where: { id: apiKeyId },
      data: { status: "capped" },
    });
  }

  return {
    ok: true as const,
    dailyCost,
    monthlyCost,
    hit,
    capped: shouldCap,
    notifyErrors,
  };
}

