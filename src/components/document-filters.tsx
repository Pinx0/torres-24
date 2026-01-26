"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Filter, Search } from "lucide-react";

import { DOCUMENT_TYPES } from "@/lib/document-types";
import { Input } from "@/components/ui/input";

const selectClassName =
  "border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 disabled:bg-input/50 dark:disabled:bg-input/80 h-8 rounded-lg border bg-background/50 backdrop-blur-sm px-2.5 py-1 text-base transition-colors focus-visible:ring-[3px] aria-invalid:ring-[3px] md:text-sm placeholder:text-muted-foreground w-full min-w-0 sm:min-w-[220px] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50";

export function DocumentFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");

  const currentTipo = searchParams.get("tipo") ?? "";
  const currentOrderBy = searchParams.get("orderBy") ?? "fecha";
  const currentOrderDir = searchParams.get("orderDir") ?? "desc";

  const currentOrderValue = `${currentOrderBy}-${currentOrderDir}`;

  const updateParams = useCallback((updates: {
    q?: string | null;
    tipo?: string | null;
    orderBy?: string | null;
    orderDir?: string | null;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (updates.q !== undefined) {
      if (updates.q) {
        params.set("q", updates.q);
      } else {
        params.delete("q");
      }
    }

    if (updates.tipo !== undefined) {
      if (updates.tipo) {
        params.set("tipo", updates.tipo);
      } else {
        params.delete("tipo");
      }
    }

    if (updates.orderBy !== undefined) {
      if (updates.orderBy) {
        params.set("orderBy", updates.orderBy);
      } else {
        params.delete("orderBy");
      }
    }

    if (updates.orderDir !== undefined) {
      if (updates.orderDir) {
        params.set("orderDir", updates.orderDir);
      } else {
        params.delete("orderDir");
      }
    }

    const nextParams = params.toString();
    if (nextParams === searchParams.toString()) {
      return;
    }

    const nextUrl = nextParams ? `${pathname}?${nextParams}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      updateParams({ q: query.trim() || null });
    }, 400);

    return () => clearTimeout(timer);
  }, [query, updateParams]);

  const orderOptions = useMemo(
    () => [
      { value: "fecha-desc", label: "Fecha (más reciente)" },
      { value: "fecha-asc", label: "Fecha (más antigua)" },
      { value: "titulo-asc", label: "Nombre (A-Z)" },
      { value: "titulo-desc", label: "Nombre (Z-A)" },
    ],
    []
  );

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex-1">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por título..."
            className="pl-9"
          />
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="size-4" />
          <span>Filtros</span>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            className={selectClassName}
            value={currentTipo}
            onChange={(event) => updateParams({ tipo: event.target.value || null })}
          >
            <option value="">Todos los tipos</option>
            {DOCUMENT_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            className={selectClassName}
            value={currentOrderValue}
            onChange={(event) => {
              const [orderBy, orderDir] = event.target.value.split("-");
              updateParams({ orderBy, orderDir });
            }}
          >
            {orderOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
