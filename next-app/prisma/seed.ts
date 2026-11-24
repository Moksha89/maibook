import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const roleDefinitions = [
  { key: "superadmin", name: "SuperAdmin", description: "Complete platform access" },
  { key: "admin", name: "Admin", description: "Company and user administration" },
  { key: "manager", name: "Manager", description: "Operational management" },
  { key: "employee", name: "Employee", description: "Assigned operational access" },
] as const;

const permissionDefinitions = {
  dashboard: ["read"],
  companies: ["read", "create", "update", "delete"],
  agents: ["read", "create", "update", "delete"],
  ledger: ["read", "create", "update", "delete", "restore"],
  identifiers: ["read", "create", "update", "delete"],
  settlements: ["read", "create", "reverse"],
  uplines: ["read", "create", "update", "delete", "distribute"],
  shareholders: ["read", "create", "update", "delete", "distribute"],
  owners: ["read", "create", "update", "delete"],
  reports: ["read", "generate", "export", "deliver"],
  whatsapp: ["read", "connect", "disconnect", "send"],
  users: ["read", "create", "update", "delete", "revoke_sessions"],
  roles: ["read", "manage"],
  audit: ["read", "export"],
  settings: ["read", "update"],
  backups: ["read", "create", "download", "restore", "delete"],
  database: ["read", "export", "manage"],
  api_tokens: ["read", "create", "revoke"],
} as const;

const adminDeniedModules = new Set(["database"]);
const managerActions = new Set(["read", "create", "update", "generate", "export", "deliver", "send"]);
const employeeActions = new Set(["read", "create", "generate", "export"]);

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("en-US");
}

async function seedRolesAndPermissions() {
  const roles = new Map<string, string>();

  for (const definition of roleDefinitions) {
    const role = await prisma.role.upsert({
      where: { key: definition.key },
      update: { name: definition.name, description: definition.description, isSystem: true },
      create: { ...definition, isSystem: true },
    });
    roles.set(definition.key, role.id);
  }

  for (const [module, actions] of Object.entries(permissionDefinitions)) {
    for (const action of actions) {
      const key = `${module}.${action}`;
      const permission = await prisma.permission.upsert({
        where: { key },
        update: { module, action },
        create: { key, module, action },
      });

      const grants = ["superadmin"];
      if (!adminDeniedModules.has(module)) grants.push("admin");
      if (managerActions.has(action) && !["users", "roles", "settings", "backups", "database", "api_tokens"].includes(module)) {
        grants.push("manager");
      }
      if (employeeActions.has(action) && ["dashboard", "companies", "agents", "ledger", "identifiers", "reports"].includes(module)) {
        grants.push("employee");
      }

      await prisma.rolePermission.createMany({
        data: grants.map((roleKey) => ({ roleId: roles.get(roleKey)!, permissionId: permission.id })),
        skipDuplicates: true,
      });
    }
  }

  return roles;
}

async function seedSuperAdmin(superAdminRoleId: string) {
  const username = process.env.SEED_SUPERADMIN_USERNAME?.trim();
  const email = process.env.SEED_SUPERADMIN_EMAIL?.trim();
  const password = process.env.SEED_SUPERADMIN_PASSWORD;

  if (!username || !password || password.length < 12) {
    throw new Error("SEED_SUPERADMIN_USERNAME and a 12-character SEED_SUPERADMIN_PASSWORD are required.");
  }

  const user = await prisma.user.upsert({
    where: { normalizedUsername: normalize(username) },
    update: {
      username,
      email: email || null,
      normalizedEmail: email ? normalize(email) : null,
      displayName: "Super Administrator",
      status: "ACTIVE",
    },
    create: {
      username,
      normalizedUsername: normalize(username),
      email: email || null,
      normalizedEmail: email ? normalize(email) : null,
      passwordHash: await hash(password, 12),
      displayName: "Super Administrator",
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: superAdminRoleId } },
    update: {},
    create: { userId: user.id, roleId: superAdminRoleId },
  });
}

async function seedSettings() {
  const settings = [
    ["site.branding", { title: "iBook", compactInterface: true, primaryColor: "#c9952e" }],
    ["integrations.email", { enabled: false, provider: "sendgrid" }],
    ["integrations.sms", { enabled: false, provider: "twilio" }],
    ["integrations.whatsapp", { enabled: false, reportModes: ["TEXT", "IMAGE", "BOTH"] }],
    ["backups.policy", { enabled: true, schedule: "0 2 * * *", retentionDays: 30 }],
  ] as const;

  for (const [key, value] of settings) {
    await prisma.applicationSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
}

async function main() {
  const roles = await seedRolesAndPermissions();
  await seedSuperAdmin(roles.get("superadmin")!);
  await seedSettings();
  console.log("Seeded roles, permissions, settings, and the local SuperAdmin account.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
