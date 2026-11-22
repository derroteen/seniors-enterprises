"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";

import {
  deleteProductImage,
  reorderProductImages,
} from "@/app/admin/actions";
import { StatusMessage } from "@/components/ui/status-message";
import { prepareProductImage } from "@/lib/admin/images";
import type { ProductImage } from "@/lib/data/types";

export interface PendingPhoto {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  status: "ready" | "uploading" | "error";
  error?: string;
}

interface ProductPhotosProps {
  /** null while the product does not exist yet (create mode). */
  productId: string | null;
  productName: string;
  images: ProductImage[];
  pendingPhotos: PendingPhoto[];
  onPendingPhotosChange: React.Dispatch<React.SetStateAction<PendingPhoto[]>>;
  /** Upload one pending photo; the parent owns status updates and product id. */
  onUploadPhoto: (photo: PendingPhoto) => void;
}

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp";

function imageSignature(images: ProductImage[]) {
  return images.map((image) => `${image.id}:${image.sort_order}`).join("|");
}

export function ProductPhotos({
  productId,
  productName,
  images: imagesProp,
  pendingPhotos,
  onPendingPhotosChange,
  onUploadPhoto,
}: ProductPhotosProps) {
  const [images, setImages] = useState<ProductImage[]>(imagesProp);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [busyImageId, setBusyImageId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastPropSignature = useRef(imageSignature(imagesProp));

  // Keep the local list in sync when the product's photos change elsewhere
  // (for example after the page data refreshes), without clobbering the
  // optimistic updates made by this component's own actions.
  useEffect(() => {
    const signature = imageSignature(imagesProp);
    if (signature !== lastPropSignature.current) {
      lastPropSignature.current = signature;
      setImages(imagesProp);
    }
  }, [imagesProp]);

  async function addFiles(fileList: FileList | File[] | null) {
    if (!fileList || fileList.length === 0) {
      return;
    }
    setError("");
    setMessage("");
    const additions: PendingPhoto[] = [];

    for (const file of Array.from(fileList)) {
      try {
        const prepared = await prepareProductImage(file);
        additions.push({
          id: crypto.randomUUID(),
          file: prepared,
          previewUrl: URL.createObjectURL(prepared),
          name: prepared.name,
          status: "ready",
        });
      } catch (prepareError) {
        setError(
          prepareError instanceof Error
            ? prepareError.message
            : "That photo could not be used.",
        );
      }
    }

    if (additions.length === 0) {
      return;
    }
    onPendingPhotosChange((current) => [...current, ...additions]);
    if (productId) {
      for (const photo of additions) {
        onUploadPhoto(photo);
      }
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    void addFiles(event.currentTarget.files);
    event.currentTarget.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    void addFiles(event.dataTransfer.files);
  }

  function removePending(photo: PendingPhoto) {
    URL.revokeObjectURL(photo.previewUrl);
    onPendingPhotosChange((current) =>
      current.filter((entry) => entry.id !== photo.id),
    );
  }

  function movePending(photo: PendingPhoto, direction: -1 | 1) {
    onPendingPhotosChange((current) => {
      const index = current.findIndex((entry) => entry.id === photo.id);
      const target = index + direction;
      if (index === -1 || target < 0 || target >= current.length) {
        return current;
      }
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function makePendingMain(photo: PendingPhoto) {
    onPendingPhotosChange((current) => {
      const index = current.findIndex((entry) => entry.id === photo.id);
      if (index <= 0) {
        return current;
      }
      const next = [...current];
      const [entry] = next.splice(index, 1);
      next.unshift(entry);
      return next;
    });
  }

  async function moveImage(imageId: string, direction: -1 | 1) {
    const index = images.findIndex((image) => image.id === imageId);
    const target = index + direction;
    if (index === -1 || target < 0 || target >= images.length) {
      return;
    }
    const ordered = [...images];
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    await applyImageOrder(ordered.map((image) => image.id));
  }

  async function makeImageMain(imageId: string) {
    const index = images.findIndex((image) => image.id === imageId);
    if (index <= 0) {
      return;
    }
    const ordered = [images[index], ...images.filter((_, i) => i !== index)];
    await applyImageOrder(ordered.map((image) => image.id));
  }

  async function applyImageOrder(orderedIds: string[]) {
    if (!productId) {
      return;
    }
    setBusyImageId("reorder");
    setError("");
    try {
      setImages(await reorderProductImages(productId, orderedIds));
    } catch (actionError) {
      setError(
        actionError instanceof Error ? actionError.message : "Photos could not be reordered.",
      );
    } finally {
      setBusyImageId(null);
    }
  }

  async function removeImage(image: ProductImage) {
    if (!productId || !window.confirm("Remove this photo?")) {
      return;
    }
    setBusyImageId(image.id);
    setError("");
    try {
      setImages(await deleteProductImage(image.id));
    } catch (actionError) {
      setError(
        actionError instanceof Error ? actionError.message : "The photo could not be removed.",
      );
    } finally {
      setBusyImageId(null);
    }
  }

  const hasPhotos = images.length > 0 || pendingPhotos.length > 0;

  return (
    <div className="grid gap-3">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`rounded-xl border-2 border-dashed p-4 text-center transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-border"
        }`}
      >
        <p className="text-sm text-muted-foreground">
          {productId
            ? "Add photos: choose files or drag them here. The first photo is the main one."
            : "Add photos now or after saving: choose files or drag them here. The first photo is the main one."}
        </p>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-3 inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-semibold hover:bg-background"
        >
          Choose photos
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          multiple
          className="sr-only"
          onChange={handleFileChange}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          JPG, PNG or WebP. Photos are resized automatically.
        </p>
      </div>

      {images.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image, index) => (
            <li
              key={image.id}
              className="overflow-hidden rounded-xl border border-border bg-background"
            >
              <div className="relative aspect-[4/3]">
                <Image
                  src={image.url}
                  alt={image.alt_text || productName}
                  fill
                  sizes="(max-width: 640px) 50vw, 200px"
                  unoptimized
                  className="object-cover"
                />
                {index === 0 ? (
                  <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
                    Main
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-1 p-2">
                {index > 0 ? (
                  <button
                    type="button"
                    disabled={busyImageId !== null}
                    onClick={() => void makeImageMain(image.id)}
                    className="min-h-9 rounded-md border border-border px-2 text-xs font-medium hover:bg-surface disabled:opacity-60"
                  >
                    Make main
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={busyImageId !== null || index === 0}
                  onClick={() => void moveImage(image.id, -1)}
                  aria-label="Move photo left"
                  className="min-h-9 rounded-md border border-border px-2 text-xs font-medium hover:bg-surface disabled:opacity-60"
                >
                  ←
                </button>
                <button
                  type="button"
                  disabled={busyImageId !== null || index === images.length - 1}
                  onClick={() => void moveImage(image.id, 1)}
                  aria-label="Move photo right"
                  className="min-h-9 rounded-md border border-border px-2 text-xs font-medium hover:bg-surface disabled:opacity-60"
                >
                  →
                </button>
                <button
                  type="button"
                  disabled={busyImageId !== null}
                  onClick={() => void removeImage(image)}
                  className="min-h-9 rounded-md border border-danger-border px-2 text-xs font-medium text-danger hover:bg-danger-bg disabled:opacity-60"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {pendingPhotos.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {pendingPhotos.map((photo, index) => (
            <li
              key={photo.id}
              className="overflow-hidden rounded-xl border border-border bg-background"
            >
              <div className="relative aspect-[4/3]">
                {/* eslint-disable-next-line @next/next/no-img-element -- local preview blob */}
                <img
                  src={photo.previewUrl}
                  alt={photo.name}
                  className="h-full w-full object-cover"
                />
                {index === 0 ? (
                  <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">
                    Main
                  </span>
                ) : null}
                {photo.status === "uploading" ? (
                  <span className="absolute inset-x-0 bottom-0 bg-background/85 px-2 py-1 text-center text-xs font-medium">
                    Uploading…
                  </span>
                ) : null}
              </div>
              <div className="grid gap-1 p-2">
                <p className="truncate text-xs text-muted-foreground" title={photo.name}>
                  {photo.name}
                </p>
                {photo.status === "error" && photo.error ? (
                  <p className="text-xs text-danger">{photo.error}</p>
                ) : null}
                <div className="flex flex-wrap gap-1">
                  {index > 0 ? (
                    <button
                      type="button"
                      disabled={photo.status === "uploading"}
                      onClick={() => makePendingMain(photo)}
                      className="min-h-9 rounded-md border border-border px-2 text-xs font-medium hover:bg-surface disabled:opacity-60"
                    >
                      Make main
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={photo.status === "uploading" || index === 0}
                    onClick={() => movePending(photo, -1)}
                    aria-label={`Move ${photo.name} left`}
                    className="min-h-9 rounded-md border border-border px-2 text-xs font-medium hover:bg-surface disabled:opacity-60"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    disabled={
                      photo.status === "uploading" ||
                      index === pendingPhotos.length - 1
                    }
                    onClick={() => movePending(photo, 1)}
                    aria-label={`Move ${photo.name} right`}
                    className="min-h-9 rounded-md border border-border px-2 text-xs font-medium hover:bg-surface disabled:opacity-60"
                  >
                    →
                  </button>
                  <button
                    type="button"
                    disabled={photo.status === "uploading"}
                    onClick={() => removePending(photo)}
                    className="min-h-9 rounded-md border border-danger-border px-2 text-xs font-medium text-danger hover:bg-danger-bg disabled:opacity-60"
                  >
                    Remove
                  </button>
                  {productId && photo.status !== "uploading" ? (
                    <button
                      type="button"
                      onClick={() => onUploadPhoto(photo)}
                      className="min-h-9 rounded-md bg-primary px-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
                    >
                      {photo.status === "error" ? "Retry" : "Upload"}
                    </button>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {!hasPhotos ? (
        <p className="text-sm text-muted-foreground">
          No photos yet. Photos are optional — you can add them later.
        </p>
      ) : null}

      {message ? <StatusMessage tone="success">{message}</StatusMessage> : null}
      {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
    </div>
  );
}
