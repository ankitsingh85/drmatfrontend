import { useMemo, useState, useCallback, useEffect } from "react";

// Generic row-selection state for admin list tables — tracks selected ids
// against whatever page of `items` is currently rendered, and drops any
// selected id that scrolls out of the current list (e.g. after a filter
// or page change) so "select all" never silently includes hidden rows.
export function useBulkSelection<T>(items: T[], getId: (item: T) => string) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const visibleIds = useMemo(() => items.map(getId), [items, getId]);

  useEffect(() => {
    setSelectedIds((prev) => {
      const visibleSet = new Set(visibleIds);
      let changed = false;
      const next = new Set<string>();
      prev.forEach((id) => {
        if (visibleSet.has(id)) {
          next.add(id);
        } else {
          changed = true;
        }
      });
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleIds.join("|")]);

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const isAllSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const isSomeSelected = visibleIds.some((id) => selectedIds.has(id)) && !isAllSelected;

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      const allSelected = visibleIds.length > 0 && visibleIds.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleIds.join("|")]);

  const clear = useCallback(() => setSelectedIds(new Set()), []);

  const removeIds = useCallback((ids: string[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  }, []);

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    isSelected,
    toggle,
    isAllSelected,
    isSomeSelected,
    toggleAll,
    clear,
    removeIds,
  };
}
