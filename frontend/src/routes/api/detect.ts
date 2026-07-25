import { createAPIFileRoute } from "@tanstack/react-start/api";

const BACKEND = process.env["BACKEND_URL"] ?? "http://localhost:8000";

export const APIRoute = createAPIFileRoute("/api/detect")({
  POST: async ({ request }) => {
    const formData = await request.formData();
    const upstream = await fetch(`${BACKEND}/api/detect`, {
      method: "POST",
      body: formData,
    });
    const data = await upstream.arrayBuffer();
    return new Response(data, {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
    });
  },
});
