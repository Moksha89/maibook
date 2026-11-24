import { hostname } from "node:os";
import { db } from "../lib/db";
import { claimJob, executeJob, settleJob } from "./jobs";

const workerId = `${hostname()}:${process.pid}`;
let stopping = false;
process.on("SIGINT", () => { stopping = true; });
process.on("SIGTERM", () => { stopping = true; });

async function run() {
  console.log(`iBook worker ${workerId} started`);
  while (!stopping) {
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
