"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12">
        <h1 className="text-2xl font-semibold tracking-tight">BillGuard</h1>
        <p className="mt-2 text-sm text-zinc-600">
          使用 GitHub 登录后即可管理 OpenAI API Key、预算阈值与通知。
        </p>

        <button
          type="button"
          onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
          className="mt-8 w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          使用 GitHub 登录
        </button>
      </div>
    </div>
  );
}

