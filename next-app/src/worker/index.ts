import { hostname } from "node:os";
import { db } from "../lib/db";
import { runScheduledBackupIfDue } from "../lib/services/backups";
import { claimJob, executeJob, settleJob } from "./jobs";

const workerId = `${hostname()}:${process.pid}`;
let stopping = false;
process.on("SIGINT", () => { stopping = true; });
process.on("SIGTERM", () => { stopping = true; });

let lastScheduleCheck = 0;

async function scheduleTick() {
  if (Date.now() - lastScheduleCheck < 60_000) return;
  lastScheduleCheck = Date.now();
  try {
    const backupId = await runScheduledBackupIfDue();
    if (backupId) console.log(`Scheduled backup ${backupId} completed`);
  } catch (error) {
    console.error("Scheduled backup failed:", error instanceof Error ? error.message : error);
  }
}

async function run() {
  console.log(`Maibook worker ${workerId} started`);
  while (!stopping) {
    await scheduleTick();
    const job = await claimJob(workerId);
    if (!job) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      continue;
    }
    try {
      await executeJob(job);
    } catch (error) {
      await settleJob(job, error);
      continue;
    }
    await settleJob(job);
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => db.$disconnect());
