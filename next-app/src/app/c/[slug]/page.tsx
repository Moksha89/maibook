import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export default async function ShortCompanyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const company = await db.company.findFirst({ where: { slug, deletedAt: null }, select: { id: true } });
  if (!company) redirect("/companies");
  redirect(`/companies/${company.id}`);
}
