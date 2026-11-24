import { apiData, apiError, authenticateApi, pageParams, requestId } from "@/lib/api/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const id = requestId(request);
  try {
    const token = await authenticateApi(request, "agents:read");
    const { page, perPage, skip } = pageParams(request);
    const superAdmin = token.user.roles.some(({ role }) => role.key === "superadmin");
    const companyIds = token.user.companyAccess.map(({ companyId }) => companyId);
    const assignments = { removedAt: null, company: { deletedAt: null }, ...(superAdmin ? {} : { companyId: { in: companyIds } }) };
    const where = { deletedAt: null, ...(superAdmin ? {} : { companies: { some: assignments } }) };
    const [data, total] = await Promise.all([
      db.agent.findMany({
        where,
        select: {
          id: true, name: true, phone: true, email: true, status: true, createdAt: true,
          companies: { where: assignments, select: { companyId: true, currentBalance: true, company: { select: { name: true } } } },
        },
        skip, take: perPage, orderBy: [{ name: "asc" }, { id: "asc" }],
      }),
      db.agent.count({ where }),
    ]);
    return apiData(data, id, { page, perPage, total, pages: Math.ceil(total / perPage) });
  } catch (error) { return apiError(error, id); }
}
