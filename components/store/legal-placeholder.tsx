import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

interface LegalPlaceholderProps {
  title: string;
  description: string;
  topics: string[];
}

export function LegalPlaceholder({
  title,
  description,
  topics,
}: LegalPlaceholderProps) {
  return (
    <main>
      <Section>
        <Container>
          <article className="mx-auto max-w-3xl">
            <p className="inline-flex rounded-full border border-accent bg-accent/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              Placeholder — not final policy
            </p>
            <h1 className="mt-4 font-display text-4xl font-semibold">{title}</h1>
            <p className="mt-4 text-lg leading-7 text-muted-foreground">
              {description}
            </p>
            <div className="mt-8 rounded-2xl border border-border bg-surface p-5 sm:p-7">
              <p className="font-semibold">Before launch</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Replace this page with reviewed information that reflects
                Seniors Enterprises&apos; actual policies and applicable Kenyan
                requirements.
              </p>
              <ul className="mt-5 grid gap-3">
                {topics.map((topic) => (
                  <li
                    key={topic}
                    className="flex gap-3 text-sm leading-6 text-muted-foreground"
                  >
                    <span aria-hidden="true" className="font-semibold text-primary">
                      •
                    </span>
                    <span>{topic}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        </Container>
      </Section>
    </main>
  );
}
