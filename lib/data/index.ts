import type { StoreRepository } from "@/lib/data/repository";
import { mockRepository } from "@/lib/data/mock/repository";
import { supabaseRepository } from "@/lib/data/supabase/repository";

const dataSource = process.env.NEXT_PUBLIC_DATA_SOURCE ?? "mock";

if (dataSource !== "mock" && dataSource !== "supabase") {
  throw new Error(
    `Invalid NEXT_PUBLIC_DATA_SOURCE "${dataSource}". Use "mock" or "supabase".`,
  );
}

export const dataRepository: StoreRepository =
  dataSource === "supabase" ? supabaseRepository : mockRepository;
