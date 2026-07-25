import { createAPIFileRoute } from "@tanstack/react-start/api";

const BACKEND = process.env["BACKEND_URL"] ?? "http://localhost:8000";

export const APIRoute = createAPIFileRoute("/api/health")({
  GET: async () => {
    const upstream = await fetch(`${BACKEND}/health`);
    const data = await upstream.arrayBuffer();
    return new Response(data, {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
    });
  },
});
