import Image from "next/image";
import Link from "next/link";

import { ArrowRightIcon } from "@/components/store/icons";
import type { Category } from "@/lib/data/types";

interface CategoryGridProps {
  categories: Category[];
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {categories.map((category, index) => (
        <Link
          key={category.id}
          href={`/shop/${category.slug}`}
          className="group relative flex min-h-52 items-end overflow-hidden rounded-2xl border border-border bg-surface p-6 sm:min-h-64"
        >
          {category.image_url ? (
            <Image
              src={category.image_url}
              alt={`${category.name} collection`}
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              unoptimized
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div
              aria-hidden="true"
              className={`absolute inset-0 ${index % 2 === 0 ? "bg-primary/5" : "bg-accent/10"}`}
            >
              <div className="absolute -right-10 -top-14 size-56 rounded-full border border-primary/10" />
              <div className="absolute -right-2 -top-6 size-40 rounded-full border border-accent/30" />
            </div>
          )}
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
        </Link>
      ))}
    </div>
  );
}
