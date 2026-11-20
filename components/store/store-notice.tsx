import { Container } from "@/components/ui/container";

export function StoreNotice() {
  return (
    <div role="status" className="border-b border-accent/50 bg-accent/10 py-3">
      <Container>
        <p className="text-sm text-foreground">
          The live catalog is not connected yet. Add{" "}
          <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">
            NEXT_PUBLIC_SUPABASE_URL
          </code>{" "}
          and{" "}
          <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">
            NEXT_PUBLIC_SUPABASE_ANON_KEY
          </code>{" "}
          to <code className="font-mono text-xs">.env.local</code> after applying
          the Supabase migration.
        </p>
      </Container>
    </div>
  );
}
