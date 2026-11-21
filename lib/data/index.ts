import "server-only";

import type { StoreRepository } from "@/lib/data/repository";
import { mockRepository } from "@/lib/data/mock/repository";
import { supabaseRepository } from "@/lib/data/supabase/repository";

const dataSource = process.env.NEXT_PUBLIC_DATA_SOURCE ?? "supabase";

if (dataSource !== "mock" && dataSource !== "supabase") {
  const message =
    process.env.NODE_ENV === "development"
      ? "Unsupported data source setting. Expected mock or supabase."
      : "Catalog repository configuration is unavailable.";
  throw new Error(message);
}

const activeRepository: StoreRepository =
  dataSource === "supabase" ? supabaseRepository : mockRepository;

const globalDataState = globalThis as typeof globalThis & {
  __seniorsRepositoryLogged?: boolean;
};

if (process.env.NODE_ENV === "development" && !globalDataState.__seniorsRepositoryLogged) {
  console.info(`[data] using ${dataSource} repository`);
  globalDataState.__seniorsRepositoryLogged = true;
}

export const dataRepository = activeRepository;
