import { Card } from "@/components/ui/card";

export default function Docs(){
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="gradient-text text-3xl font-bold">Loveable Docs</h1>
      <p className="text-muted-foreground mt-2">How to use the Builder and deploy your generated project.</p>
      <div className="mt-6 space-y-4">
        <Card className="p-4">
          <h2 className="text-xl font-semibold">Quickstart</h2>
          <ol className="mt-2 list-decimal pl-6 text-sm text-muted-foreground">
            <li>Open the Builder and type a command (e.g. "build login page with JWT and tasks CRUD").</li>
            <li>Toggle "Use GLM-4.5" to generate with ZhipuAI, or turn it off to use the local generator.</li>
            <li>Preview updates live. Tweak your command to refine.</li>
            <li>Download ZIP with frontend + Next.js backend + Prisma schema.</li>
            <li>Set DATABASE_URL and JWT_SECRET in .env, run Prisma migrations, deploy to Vercel.</li>
          </ol>
        </Card>
        <Card className="p-4">
          <h2 className="text-xl font-semibold">GLM-4.5 Integration</h2>
          <p className="text-sm text-muted-foreground mt-2">The Builder calls <code>/api/ai/generate</code> which uses the official ZhipuAI SDK (with REST fallback) to produce a strict JSON project. Set your API key:</p>
          <pre className="mt-2 rounded bg-black/50 p-3 text-xs text-white/90">{`# Worker/Server env
ZHIPUAI_API_KEY=sk-...  # required
`}</pre>
          <p className="text-xs text-muted-foreground mt-2">For local testing, you can pass <code>x-zhipuai-key</code> header to the endpoint, but do not use this in production.</p>
        </Card>
        <Card className="p-4">
          <h2 className="text-xl font-semibold">Environment</h2>
          <pre className="mt-2 rounded bg-black/50 p-3 text-xs text-white/90">{`# .env
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=change-me`}</pre>
        </Card>
      </div>
    </div>
  );
}