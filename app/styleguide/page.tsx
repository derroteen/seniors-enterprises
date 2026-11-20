import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { Section } from "@/components/ui/section";
import { BRAND } from "@/lib/brand";

const colorTokens = [
  { name: "Background", className: "bg-background", value: "var(--background)" },
  { name: "Surface / card", className: "bg-surface", value: "var(--surface)" },
  { name: "Text", className: "bg-foreground", value: "var(--foreground)" },
  { name: "Primary blue", className: "bg-primary", value: "var(--primary)" },
  { name: "Primary dark", className: "bg-primary-dark", value: "var(--primary-dark)" },
  { name: "Gold accent", className: "bg-accent", value: "var(--accent)" },
  { name: "Muted text", className: "bg-muted", value: "var(--muted)" },
  { name: "Border", className: "bg-border", value: "var(--border)" },
];

export default function StyleguidePage() {
  return (
    <main>
      <Section>
        <Container>
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {BRAND.name}
              </p>
              <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
                Design system
              </h1>
              <p className="mt-3 max-w-2xl text-muted-foreground">
                A warm, confident foundation for a growing retail brand.
              </p>
            </div>
            <ThemeToggle />
          </div>
        </Container>
      </Section>

      <Section surface className="border-y">
        <Container>
          <h2 className="font-display text-2xl font-semibold">Color palette</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Switch themes to inspect the light and dark token values.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {colorTokens.map((token) => (
              <div key={token.name} className="overflow-hidden rounded-xl border border-border">
                <div className={`h-16 border-b border-border ${token.className}`} />
                <div className="bg-background p-3">
                  <p className="text-sm font-medium">{token.name}</p>
                  <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{token.value}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <h2 className="font-display text-2xl font-semibold">Typography</h2>
              <p className="mt-5 font-display text-4xl font-semibold">Playfair Display</p>
              <p className="mt-2 text-muted-foreground">Inter is the clean, readable body typeface.</p>
              <p className="mt-6 max-w-lg leading-7">
                Thoughtful details, dependable quality, and a welcoming experience across every category.
              </p>
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold">Buttons</h2>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="gold">Gold</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
                <Button disabled>Disabled</Button>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="primary">Primary</Badge>
                <Badge variant="gold">Gold</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
            </div>
          </div>
          <div className="mt-10 max-w-md">
            <Input label="Sample input" placeholder="Enter a value" />
          </div>
        </Container>
      </Section>
    </main>
  );
}
