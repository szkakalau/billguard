import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { KeysClient } from "@/app/keys/KeysClient";

export default async function KeysPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">API Keys</h1>
            <p className="mt-1 text-sm text-zinc-600">
              登录用户：{session?.user?.email ?? session?.user?.name ?? "用户"}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/dashboard"
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50"
            >
              返回仪表盘
            </Link>
          </div>
        </div>

        <KeysClient />
      </div>
    </div>
  );
}

