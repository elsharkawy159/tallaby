"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { TableSectionLabels } from "@workspace/ui/components/table-section";

/** TableSection copy in the active locale, from the "table" namespace. */
export function useTableSectionLabels(): TableSectionLabels {
  const t = useTranslations("table");
  return useMemo(
    () => ({
      selectAll: t("selectAll"),
      selectRow: t("selectRow"),
      search: t("search"),
      searchPlaceholder: t("searchPlaceholder"),
      clearFilter: t("clearFilter"),
      view: t("view"),
      toggleColumns: t("toggleColumns"),
      delete: t("delete"),
      confirmTitle: t("confirmTitle"),
      confirmDescription: (count) => t("confirmDescription", { count }),
      cancel: t("cancel"),
      sortAscending: t("sortAscending"),
      sortDescending: t("sortDescending"),
      clearSort: t("clearSort"),
      noResults: t("noResults"),
      rowsPerPage: t("rowsPerPage"),
      range: (start, end, total) => t("range", { start, end, total }),
      first: t("first"),
      previous: t("previous"),
      page: (page, pageCount) => t("page", { page, pageCount }),
      next: t("next"),
      last: t("last"),
    }),
    [t]
  );
}
