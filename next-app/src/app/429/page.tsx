import { headers } from "next/headers"; import { HttpError } from "@/components/ui/http-error";
export default async function RateLimitedPage() { return <HttpError code="429" title="Too many requests" message="Wait briefly before trying again." requestId={(await headers()).get("x-request-id") || undefined} />; }
