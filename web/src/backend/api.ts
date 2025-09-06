// Example API worker for your backend endpoints
// This runs on Cloudflare Workers at the edge

// You can import types and utilities (they'll be bundled by esbuild)
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface TodoItem {
  id: string;
  userId: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

// Mock data - in production, you'd use a database like D1 or KV
const mockUsers: User[] = [
  { id: "1", name: "Alice Johnson", email: "alice@example.com", createdAt: "2024-01-01" },
  { id: "2", name: "Bob Smith", email: "bob@example.com", createdAt: "2024-01-02" },
];

const mockTodos: TodoItem[] = [
  { id: "1", userId: "1", title: "Deploy to Cloudflare", completed: true, createdAt: "2024-01-01" },
  { id: "2", userId: "1", title: "Add authentication", completed: false, createdAt: "2024-01-02" },
];

// Helper function for CORS headers
function corsHeaders(origin: string): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };
}

// Main worker handler
export default {
  async fetch(request: Request, env: Record<string, string | undefined>): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;
    const origin = request.headers.get("Origin") || "*";

    // Handle CORS preflight
    if (method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(origin) });
    }

    async function callGLM(prompt: string, existing?: unknown, model = "glm-4.5", stream = false) {
      const apiKey = env?.ZHIPUAI_API_KEY || request.headers.get("x-zhipuai-key") || ""; // Prefer env, allow header for local testing
      if (!apiKey) {
        return { error: "Missing ZHIPUAI_API_KEY. Set it in your environment or pass x-zhipuai-key header." };
      }
      const system = `You are Loveable's code generation engine. Return ONLY JSON following this schema:\n{\n  "project": {\n    "command": string,\n    "ir": {\n      "pages": Array<{ name: string; path: string; type: "landing"|"login"|"dashboard"|"custom"; widgets?: string[] }>,\n      "models": Array<{ name: string; fields: Array<{ name: string; type: string; optional?: boolean }> }>,\n      "auth": { type: "jwt"|"oauth"; providers?: string[] },\n      "apis": Array<{ method: "GET"|"POST"|"PUT"|"DELETE"; route: string; model?: string; action?: string }>,\n      "notes"?: string[]\n    },\n    "frontend": Record<string,string>, // path => file contents (React + Tailwind)\n    "backend": Record<string,string>,  // Next.js App Router files (API routes etc.)\n    "prisma": string                    // Full Prisma schema\n  }\n}\n- Include inline comments for assumptions.\n- Provide sample data so UIs are not empty.\n- Be concise but production-grade.\n- If 'existing' project is provided, update/merge instead of rewriting everything.`;

      const user = JSON.stringify({ command: prompt, existing });

      // Try official SDK first, fall back to REST
      try {
        // @ts-ignore dynamic import may fail in edge; handled by catch
        const mod = await import("zhipuai");
        const ZhipuAI = (mod as any).default || (mod as any).ZhipuAI || (mod as any);
        const client = new ZhipuAI({ apiKey });
        // OpenAI-compatible chat.completions API in SDK v2
        // @ts-ignore - types depend on SDK version
        const resp = await client.chat.completions.create({
          model,
          temperature: 0.2,
          stream,
          // Ask for JSON-only output if supported
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        });
        if (stream) {
          // Streaming passthrough (concatenate for now)
          // @ts-ignore
          const reader = (resp as any)[Symbol.asyncIterator] || (resp as any).iterator?.();
          let content = "";
          if (reader) {
            for await (const chunk of resp as any) {
              const piece = chunk?.choices?.[0]?.delta?.content ?? "";
              content += piece;
            }
          } else {
            // non-iterable fallback
            // @ts-ignore
            content = resp?.choices?.[0]?.message?.content ?? "";
          }
          return JSON.parse(content);
        }
        // Non-streaming
        // @ts-ignore
        const text = resp?.choices?.[0]?.message?.content ?? "";
        return JSON.parse(text);
      } catch (e) {
        // Fallback: REST API (OpenAI-compatible)
        const body = {
          model,
          temperature: 0.2,
          stream,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        };
        const res = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const errText = await res.text();
          return { error: `GLM request failed: ${res.status} ${errText}` };
        }
        const data: any = await res.json();
        const text = data?.choices?.[0]?.message?.content ?? data?.data ?? "";
        try { return JSON.parse(text); } catch { return { error: "Model did not return valid JSON", raw: text }; }
      }
    }

    // Router - match paths and methods
    try {
      // POST /api/ai/generate - Invoke GLM-4.5 to produce project JSON
      if (url.pathname === "/api/ai/generate" && method === "POST") {
        const body = await request.json().catch(() => ({}));
        const prompt: string = body?.command ?? body?.prompt ?? "";
        const existing = body?.existingProject ?? body?.existing;
        const model: string = body?.model ?? "glm-4.5";
        const stream: boolean = Boolean(body?.stream);
        if (!prompt) {
          return Response.json({ error: "Missing 'command' in request body" }, { status: 400, headers: corsHeaders(origin) });
        }
        const result = await callGLM(prompt, existing, model, stream);
        return Response.json(result, { headers: corsHeaders(origin) });
      }

      // GET /api/health - Health check endpoint
      if (url.pathname === "/api/health" && method === "GET") {
        return Response.json(
          {
            status: "healthy",
            timestamp: new Date().toISOString(),
            version: "1.0.0",
          },
          { headers: corsHeaders(origin) },
        );
      }

      // GET /api/users - List all users
      if (url.pathname === "/api/users" && method === "GET") {
        return Response.json({ users: mockUsers }, { headers: corsHeaders(origin) });
      }

      // GET /api/users/:id - Get specific user
      const userMatch = url.pathname.match(/^\/api\/users\/(\d+)$/);
      if (userMatch && method === "GET") {
        const userId = userMatch[1];
        const user = mockUsers.find((u) => u.id === userId);
        if (!user) {
          return Response.json({ error: "User not found" }, { status: 404, headers: corsHeaders(origin) });
        }
        return Response.json({ user }, { headers: corsHeaders(origin) });
      }

      // POST /api/users - Create new user
      if (url.pathname === "/api/users" && method === "POST") {
        const body = (await request.json()) as Partial<User>;
        if (!body.name || !body.email) {
          return Response.json({ error: "Name and email are required" }, { status: 400, headers: corsHeaders(origin) });
        }
        const newUser: User = {
          id: String(mockUsers.length + 1),
          name: body.name,
          email: body.email,
          createdAt: new Date().toISOString(),
        };
        mockUsers.push(newUser);
        return Response.json({ user: newUser }, { status: 201, headers: corsHeaders(origin) });
      }

      // GET /api/todos - List todos with optional filtering
      if (url.pathname === "/api/todos" && method === "GET") {
        const userId = url.searchParams.get("userId");
        const completed = url.searchParams.get("completed");
        let filteredTodos = mockTodos;
        if (userId) filteredTodos = filteredTodos.filter((t) => t.userId === userId);
        if (completed !== null) filteredTodos = filteredTodos.filter((t) => t.completed === (completed === "true"));
        return Response.json({ todos: filteredTodos }, { headers: corsHeaders(origin) });
      }

      // PUT /api/todos/:id - Update todo
      const todoMatch = url.pathname.match(/^\/api\/todos\/(\d+)$/);
      if (todoMatch && method === "PUT") {
        const todoId = todoMatch[1];
        const body = (await request.json()) as Partial<TodoItem>;
        const todoIndex = mockTodos.findIndex((t) => t.id === todoId);
        if (todoIndex === -1) {
          return Response.json({ error: "Todo not found" }, { status: 404, headers: corsHeaders(origin) });
        }
        mockTodos[todoIndex] = { ...mockTodos[todoIndex], ...body };
        return Response.json({ todo: mockTodos[todoIndex] }, { headers: corsHeaders(origin) });
      }

      // POST /api/echo - Echo endpoint for testing
      if (url.pathname === "/api/echo" && method === "POST") {
        const body = await request.json();
        return Response.json(
          { echo: body, headers: Object.fromEntries(request.headers.entries()), timestamp: new Date().toISOString() },
          { headers: corsHeaders(origin) },
        );
      }

      // 404 for unmatched routes
      return Response.json({ error: "Not Found", path: url.pathname }, { status: 404, headers: corsHeaders(origin) });
    } catch (error) {
      console.error("API Error:", error);
      return Response.json({ error: "Internal Server Error" }, { status: 500, headers: corsHeaders(origin) });
    }
  },
};

// You can also define environment bindings interface for type safety
// interface Env {
//   DB: D1Database;           // For SQL database
//   KV: KVNamespace;          // For key-value storage
//   BUCKET: R2Bucket;         // For file storage
//   API_KEY: string;          // For secrets
// } 