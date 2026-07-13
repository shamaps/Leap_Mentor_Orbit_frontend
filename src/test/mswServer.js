import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

export const server = setupServer(
    http.post("https://in.logs.betterstack.com/", () => HttpResponse.json({ ok: true })),
);