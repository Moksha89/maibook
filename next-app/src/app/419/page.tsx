import { headers } from "next/headers"; import { HttpError } from "@/components/ui/http-error";
export default async function SessionExpiredPage() { return <HttpError code="419" title="Session expired" message="Sign in again before continuing." requestId={(await headers()).get("x-request-id") || undefined} />; }
