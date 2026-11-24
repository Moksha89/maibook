import type { Metadata } from "next";

import { PageHeader } from "@/components/ui/page-header";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ChangePasswordForm, ProfileForm } from "./profile-forms";

export const metadata: Metadata = { title: "My profile" };

export default async function ProfilePage() {
  const session = await requireSession();
  const user = await db.user.findUniqueOrThrow({ where: { id: session.userId }, include: { roles: { include: { role: true } } } });
  return (
    <>
      <PageHeader title="My profile" />
      <div className="space-y-3"><ProfileForm profile={{ displayName: user.displayName, email: user.email ?? "", phone: user.phone ?? "" }} /><ChangePasswordForm /></div>
    </>
  );
}
