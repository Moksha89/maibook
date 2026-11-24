import { headers } from "next/headers"; import { HttpError } from "@/components/ui/http-error";
export default async function ForbiddenPage() { return <HttpError code="403" title="Access denied" message="Your account does not have permission to open this page." requestId={(await headers()).get("x-request-id") || undefined} />; }
