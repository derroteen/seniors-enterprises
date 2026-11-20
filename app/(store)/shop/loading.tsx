import { Container } from "@/components/ui/container";

export default function ShopLoading() {
  return (
    <main className="py-12 sm:py-16" aria-label="Loading products">
      <Container>
        <div className="h-10 w-56 animate-pulse rounded-lg bg-muted/30" />
        <div className="mt-6 h-32 animate-pulse rounded-2xl bg-muted/20" />
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="animate-pulse">
              <div className="aspect-[4/5] rounded-2xl bg-muted/20" />
              <div className="mt-3 h-4 rounded bg-muted/20" />
              <div className="mt-2 h-4 w-2/3 rounded bg-muted/20" />
            </div>
          ))}
        </div>
      </Container>
    </main>
  );
}
