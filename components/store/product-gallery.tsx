"use client";

import Image from "next/image";
import { useRef, useState, type TouchEvent } from "react";

import { ChevronLeftIcon, ChevronRightIcon, ZoomIcon } from "@/components/store/icons";
import type { ProductImage } from "@/lib/data/types";

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const activeImage = images[activeIndex];

  function showPrevious() {
    setActiveIndex((index) => (index - 1 + images.length) % images.length);
    setZoomed(false);
  }

  function showNext() {
    setActiveIndex((index) => (index + 1) % images.length);
    setZoomed(false);
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const startX = touchStartX.current;
    const endX = event.changedTouches[0]?.clientX;
    touchStartX.current = null;

    if (startX === null || endX === undefined || Math.abs(endX - startX) < 40) {
      return;
    }

    if (endX < startX) {
      showNext();
    } else {
      showPrevious();
    }
  }

  if (!activeImage) {
    return (
      <div
        role="img"
        aria-label={`${productName} product images coming soon`}
        className="grid aspect-[4/5] place-items-center rounded-2xl border border-border bg-surface text-center text-muted-foreground"
      >
        <div>
          <span className="font-display text-6xl text-primary/40" aria-hidden="true">
            {productName.charAt(0)}
          </span>
          <p className="mt-2 text-sm">Product images coming soon</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-surface"
        onTouchStart={(event) => {
          touchStartX.current = event.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          src={activeImage.url}
          alt={activeImage.alt_text || `${productName}, image ${activeIndex + 1}`}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 55vw"
          unoptimized
          className={`object-cover transition-transform duration-300 ${
            zoomed ? "scale-125 cursor-zoom-out" : "cursor-zoom-in"
          }`}
        />
        {images.length > 1 ? (
          <>
            <button
              type="button"
              onClick={showPrevious}
              aria-label="Show previous product image"
              className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-surface/90 text-foreground shadow transition-colors hover:bg-surface"
            >
              <ChevronLeftIcon className="size-5" />
            </button>
            <button
              type="button"
              onClick={showNext}
              aria-label="Show next product image"
              className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-surface/90 text-foreground shadow transition-colors hover:bg-surface"
            >
              <ChevronRightIcon className="size-5" />
            </button>
          </>
        ) : null}
        <button
          type="button"
          onClick={() => setZoomed((current) => !current)}
          aria-label={zoomed ? "Zoom out of product image" : "Zoom in on product image"}
          aria-pressed={zoomed}
          className="absolute bottom-3 right-3 grid size-11 place-items-center rounded-full bg-surface/90 text-foreground shadow hover:bg-surface"
        >
          <ZoomIcon className="size-5" />
        </button>
      </div>

      {images.length > 1 ? (
        <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => {
                setActiveIndex(index);
                setZoomed(false);
              }}
              aria-label={`Show product image ${index + 1}`}
              aria-pressed={index === activeIndex}
              className={`relative size-16 shrink-0 overflow-hidden rounded-lg border-2 ${
                index === activeIndex ? "border-primary" : "border-border"
              }`}
            >
              <Image
                src={image.url}
                alt=""
                fill
                sizes="64px"
                unoptimized
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
