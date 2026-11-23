import { headers } from "next/headers"; import { HttpError } from "@/components/ui/http-error";
export default async function MaintenancePage() { return <HttpError code="503" title="Service unavailable" message="This service is temporarily unavailable." requestId={(await headers()).get("x-request-id") || undefined} />; }
