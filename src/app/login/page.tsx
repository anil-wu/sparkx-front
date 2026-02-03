import { headers } from "next/headers";
import { redirect } from "next/navigation";

import LoginForm from "@/components/Auth/LoginForm";
import { auth } from "@/lib/auth";

export default async function LoginPage() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (session) {
    redirect("/");
  }

  return <LoginForm />;
}
