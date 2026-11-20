import { Container } from "@/components/ui/container";

export default function ProductLoading() {
  return (
    <main className="py-10 sm:py-14" aria-label="Loading product">
      <Container>
        <div className="grid gap-8 md:grid-cols-2">
          <div className="aspect-[4/5] animate-pulse rounded-2xl bg-muted/20" />
          <div className="py-3">
            <div className="h-9 w-3/4 animate-pulse rounded bg-muted/30" />
            <div className="mt-5 h-5 w-1/3 animate-pulse rounded bg-muted/20" />
            <div className="mt-8 h-48 animate-pulse rounded-2xl bg-muted/20" />
          </div>
        </div>
      </Container>
    </main>
  );
}
