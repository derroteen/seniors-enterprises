import Image from "next/image";
import Link from "next/link";

import { ArrowRightIcon } from "@/components/store/icons";
import { Logo } from "@/components/store/logo";
import type { Category } from "@/lib/data/types";

interface CategoryGridProps {
  categories: Category[];
  /** category id → main photo of its first product, when it has products. */
  covers?: Record<string, string>;
}

export function CategoryGrid({ categories, covers = {} }: CategoryGridProps) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {categories.map((category) => {
        const coverUrl = covers[category.id];
        return (
          <Link
            key={category.id}
            href={`/shop/${category.slug}`}
            className="group relative flex min-h-52 items-end overflow-hidden rounded-2xl border border-border bg-surface p-6 sm:min-h-64"
          >
            {coverUrl ? (
              <>
                <Image
                  src={coverUrl}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  unoptimized
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="relative flex w-full items-end justify-between gap-4 text-white">
                  <div>
                    <p className="text-sm font-medium text-white/80">Explore</p>
                    <h3 className="mt-1 font-display text-3xl font-semibold">
                      {category.name}
                    </h3>
                  </div>
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white/15 transition-colors group-hover:bg-white/25">
                    <ArrowRightIcon className="size-5" />
                  </span>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-surface p-6">
                <Logo variant="mark" className="opacity-50" />
                <span className="font-display text-3xl font-semibold text-foreground">
                  {category.name}
                </span>
                <span className="absolute bottom-6 right-6 grid size-11 shrink-0 place-items-center rounded-full border border-border text-foreground transition-colors group-hover:bg-background">
                  <ArrowRightIcon className="size-5" />
                </span>
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
