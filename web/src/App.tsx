import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Moon, Sun, Play, ShieldCheck, Rocket, Palette, Smartphone, RefreshCw, Users } from "lucide-react";
import { cn } from "@/lib/utils";

function useTheme() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);
  return { theme, setTheme };
}

function useActiveSection(ids: string[]) {
  const [active, setActive] = useState<string>("");
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { threshold: 0.6 }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [ids.join(",")]);
  return active;
}

function useScrollAnimations() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".animate-on-scroll"));
    const ob = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("animated");
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    els.forEach((el) => ob.observe(el));
    return () => ob.disconnect();
  }, []);
}

function useHeader() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return scrolled;
}

function smoothScrollTo(id: string) {
  const el = document.querySelector(id) as HTMLElement | null;
  const header = document.getElementById("site-header");
  if (!el) return;
  const headerOffset = header ? header.getBoundingClientRect().height + 12 : 0;
  const y = el.getBoundingClientRect().top + window.pageYOffset - headerOffset;
  window.scrollTo({ top: y, behavior: "smooth" });
}

function Sparkles() {
  useEffect(() => {
    const timer = setInterval(() => {
      const s = document.createElement("div");
      s.className = "sparkle";
      s.style.left = Math.random() * window.innerWidth + "px";
      s.style.top = Math.random() * window.innerHeight + "px";
      document.body.appendChild(s);
      requestAnimationFrame(() => {
        s.style.opacity = "1";
        s.style.transform = `translateY(-${Math.random() * 100 + 50}px) scale(0)`;
      });
      setTimeout(() => s.remove(), 2000);
    }, 3000);
    return () => clearInterval(timer);
  }, []);
  return null;
}

function Header({ active }: { active: string }) {
  const { theme, setTheme } = useTheme();
  const scrolled = useHeader();
  const links = [
    { id: "features", label: "Features" },
    { id: "demo", label: "Demo" },
    { id: "pricing", label: "Pricing" },
    { id: "docs", label: "Docs" },
  ];
  return (
    <header id="site-header" className={cn("header-blur", scrolled && "header-scrolled")}>
      <nav className="mx-auto flex max-w-screen-xl items-center justify-between px-6 py-4">
        <div className="text-xl font-bold">
          <span className="bg-gradient-to-r from-rose-400 to-teal-300 bg-clip-text text-transparent">Loveable</span>
        </div>
        <ul className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <li key={l.id}>
              <a
                href={`#${l.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  smoothScrollTo(`#${l.id}`);
                }}
                aria-current={active === l.id ? "page" : undefined}
                className={cn(
                  "text-sm transition-colors hover:text-primary",
                  active === l.id ? "text-primary" : "text-foreground"
                )}
              >
                {l.label}
              </a>
            </li>
          ))}
          <li>
            <Button className="btn-primary" asChild>
              <a href="#start" onClick={(e) => { e.preventDefault(); smoothScrollTo("#demo"); }}>
                Start Building
              </a>
            </Button>
          </li>
        </ul>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sun className="h-4 w-4" />
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(v) => setTheme(v ? "dark" : "light")}
              aria-label="Toggle theme"
            />
            <Moon className="h-4 w-4" />
          </div>
        </div>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero relative">
      <div className="relative z-10 mx-auto max-w-screen-xl px-6 text-center">
        <h1 className="gradient-text text-4xl font-bold md:text-6xl lg:text-7xl">
          Build Full-Stack Apps with AI
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Transform your ideas into production-ready web applications in minutes, not months. Let AI handle the code while you focus on your vision.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Button className="btn-primary" asChild>
            <a href="#" onClick={(e) => { e.preventDefault(); smoothScrollTo("#pricing"); }}>Start Building for Free</a>
          </Button>
          <Button variant="outline" className="btn-secondary" asChild>
            <a href="#demo" onClick={(e) => { e.preventDefault(); smoothScrollTo("#demo"); }}>Watch Demo</a>
          </Button>
        </div>
      </div>
    </section>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="feature-card animate-on-scroll">
      <div className="feature-icon mb-4">{icon}</div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground">{desc}</p>
    </div>
  );
}

function Features() {
  return (
    <section id="features" className="section bg-gradient-to-b from-transparent to-primary/5">
      <div className="mx-auto max-w-screen-xl px-6">
        <h2 className="section-title gradient-text animate-on-scroll">Why Choose Loveable?</h2>
        <p className="section-subtitle animate-on-scroll">
          Experience the future of web development with our AI-powered platform
        </p>
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Feature icon={<Rocket className="h-6 w-6" />} title="Lightning Fast Development" desc="Go from idea to deployed app in minutes. Our AI understands your requirements and generates production-ready code instantly." />
          <Feature icon={<Palette className="h-6 w-6" />} title="Beautiful UI Components" desc="Pixel-perfect, responsive designs with modern components that work seamlessly across devices." />
          <Feature icon={<RefreshCw className="h-6 w-6" />} title="Full-Stack Integration" desc="Databases, auth, APIs, and hosting - all configured automatically for you." />
          <Feature icon={<ShieldCheck className="h-6 w-6" />} title="Enterprise Security" desc="Built-in best practices, encrypted data, and compliance with industry standards." />
          <Feature icon={<Users className="h-6 w-6" />} title="Real-time Collaboration" desc="Work with your team in real-time, share previews instantly, and iterate fast." />
          <Feature icon={<Smartphone className="h-6 w-6" />} title="Mobile-First Design" desc="Optimized for mobile from the start for perfect UX across all devices." />
        </div>
      </div>
    </section>
  );
}

function Demo() {
  const [open, setOpen] = useState(false);
  return (
    <section id="demo" className="section bg-rose-500/5">
      <div className="mx-auto grid max-w-screen-xl grid-cols-1 items-center gap-10 px-6 md:grid-cols-2">
        <div>
          <h2 className="section-title gradient-text animate-on-scroll">See It In Action</h2>
          <p className="animate-on-scroll mt-4 text-lg text-muted-foreground">
            Watch how easy it is to build a complete web application with Loveable. From concept to deployment in under 5 minutes.
          </p>
          <div className="animate-on-scroll mt-6">
            <Button className="btn-primary" asChild>
              <a href="#" onClick={(e) => { e.preventDefault(); setOpen(true); }}>Try It Yourself</a>
            </Button>
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <div role="button" tabIndex={0} className="animate-on-scroll relative aspect-video w-full cursor-pointer overflow-hidden rounded-2xl border glass transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2">
              <div className="absolute inset-0 brand-gradient opacity-30" />
              <div className="relative z-10 grid h-full place-items-center">
                <div className="grid h-20 w-20 place-items-center rounded-full brand-gradient text-white shadow-lg transition-transform hover:scale-110">
                  <Play className="h-9 w-9" />
                </div>
              </div>
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Loveable Demo</DialogTitle>
              <DialogDescription>Interactive demo preview</DialogDescription>
            </DialogHeader>
            <div className="aspect-video w-full overflow-hidden rounded-lg">
              <iframe
                className="h-full w-full"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0"
                title="Demo Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}

function Pricing() {
  const [yearly, setYearly] = useState(true);
  const plans = useMemo(
    () => [
      {
        name: "Starter",
        desc: "For personal projects and prototypes",
        price: yearly ? 0 : 0,
        suffix: yearly ? "/year" : "/month",
        highlighted: false,
        features: ["Unlimited previews", "Basic components", "Community support"],
        cta: "Start Free",
      },
      {
        name: "Pro",
        desc: "For teams shipping to production",
        price: yearly ? 790 : 79,
        suffix: yearly ? "/year" : "/month",
        highlighted: true,
        features: ["All components", "Auth + DB + APIs", "Priority support", "Custom domains"],
        cta: "Upgrade",
      },
      {
        name: "Enterprise",
        desc: "For orgs with security needs",
        price: yearly ? 2990 : 299,
        suffix: yearly ? "/year" : "/month",
        highlighted: false,
        features: ["SSO/SAML", "VPC deploy", "Audit logs", "Uptime SLA"],
        cta: "Contact Sales",
      },
    ],
    [yearly]
  );
  return (
    <section id="pricing" className="section">
      <div className="mx-auto max-w-screen-xl px-6">
        <h2 className="section-title gradient-text animate-on-scroll">Pricing</h2>
        <p className="section-subtitle animate-on-scroll">Simple, transparent pricing. Cancel anytime.</p>

        <div className="mt-6 flex items-center justify-center gap-3 text-sm">
          <span className="text-muted-foreground">Monthly</span>
          <Switch checked={yearly} onCheckedChange={setYearly} aria-label="Toggle yearly pricing" />
          <span className="font-medium">Yearly</span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">2 months free</span>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <Card
              key={p.name}
              className={cn(
                "relative flex flex-col gap-4 rounded-2xl border p-6",
                p.highlighted && "ring-2 ring-primary"
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{p.name}</h3>
                  <p className="text-sm text-muted-foreground">{p.desc}</p>
                </div>
              </div>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-bold">{p.price === 0 ? "Free" : `$${p.price}`}</span>
                {p.price !== 0 && <span className="text-sm text-muted-foreground">{p.suffix}</span>}
              </div>
              <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {f}
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                <Button className={cn("w-full", p.highlighted ? "btn-primary" : "btn-secondary border")}>{p.cta}</Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t py-10">
      <div className="mx-auto max-w-screen-xl px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <h4 className="mb-3 font-semibold">Product</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li><a href="#features" onClick={(e) => { e.preventDefault(); smoothScrollTo("#features"); }}>Features</a></li>
              <li><a href="#pricing" onClick={(e) => { e.preventDefault(); smoothScrollTo("#pricing"); }}>Pricing</a></li>
              <li><a href="#docs" onClick={(e) => e.preventDefault()}>Documentation</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()}>API Reference</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 font-semibold">Company</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li><a href="#" onClick={(e) => e.preventDefault()}>About</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()}>Blog</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()}>Careers</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()}>Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 font-semibold">Resources</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li><a href="#" onClick={(e) => e.preventDefault()}>Help Center</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()}>Community</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()}>Templates</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()}>Status</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 font-semibold">Legal</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li><a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()}>Terms of Service</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()}>Cookie Policy</a></li>
              <li><a href="#" onClick={(e) => e.preventDefault()}>GDPR</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
          © 2024 Loveable. All rights reserved. Built with ❤️ for developers.
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  useScrollAnimations();
  const active = useActiveSection(["features", "demo", "pricing"]);
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Header active={active} />
      <main>
        <Hero />
        <Features />
        <Demo />
        <Pricing />
      </main>
      <Footer />
      <Sparkles />
    </div>
  );
}
