import { headers } from "next/headers";
import { redirect } from "next/navigation";

import SparkHomeClient from "@/components/Home/SparkHomeClient";
import { getSparkxSessionFromHeaders } from "@/lib/sparkx-session";

export default async function HomePage() {
  const requestHeaders = await headers();
  const session = getSparkxSessionFromHeaders(requestHeaders);

  // 如果用户已登录，重定向到用户首页
  if (session) {
    redirect("/home");
  }

  return <SparkHomeClient isAuthenticated={false} />;
}
