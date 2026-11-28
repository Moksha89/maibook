CREATE TYPE "AgentType" AS ENUM ('AGENT', 'SUB_AGENT');

ALTER TABLE "agents" ADD COLUMN IF NOT EXISTS "type" "AgentType" NOT NULL DEFAULT 'AGENT';

-- People whose only current IDs are Sub-agent IDs become Sub-agent; everyone else stays Agent.
UPDATE "agents" AS a
SET "type" = 'SUB_AGENT'
WHERE EXISTS (
    SELECT 1
    FROM "identifier_agent_assignments" ia
    JOIN "agent_ids" i ON i.id = ia.identifier_id
    WHERE ia.agent_id = a.id
      AND ia.effective_to IS NULL
      AND i.deleted_at IS NULL
      AND i.type = 'SUB_AGENT'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM "identifier_agent_assignments" ia
    JOIN "agent_ids" i ON i.id = ia.identifier_id
    WHERE ia.agent_id = a.id
      AND ia.effective_to IS NULL
      AND i.deleted_at IS NULL
      AND i.type = 'AGENT'
  );
