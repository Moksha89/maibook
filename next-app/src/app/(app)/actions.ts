"use server";

import { redirect } from "next/navigation";

import { revokeCurrentSession } from "@/lib/auth/session";

// Takes the submitted form so the browser posts multipart/form-data, which the production WAF allows.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function logoutAction(_formData?: FormData) {
  await revokeCurrentSession();
  redirect("/login");
}
