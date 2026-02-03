import { headers } from "next/headers";
import { redirect } from "next/navigation";

import AuthControls from "@/components/Auth/AuthControls";
import Workspace from "@/components/Workspace/Workspace";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    redirect("/login");
  }

  const userLabel = session.user.name ?? session.user.email ?? "已登录";

  return (
    <main className="relative">
      <AuthControls label={userLabel} />
      <Workspace />
    </main>
  );
}
