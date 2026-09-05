"use client";

import React, { useState } from "react";
import { FiTrash2, FiX } from "react-icons/fi";
import styles from "@/styles/Dashboard/bulkSelect.module.css";
import { useConfirm } from "@/context/ConfirmContext";
import { useToast } from "@/context/ToastContext";
import { bulkDeleteByIds } from "@/lib/bulkDelete";

type BulkSelectBarProps = {
  endpointPath: string;
  selectedIds: string[];
  noun?: string;
  onDeleted: (deletedIds: string[]) => void;
  onClear: () => void;
  canDelete?: boolean;
};

// Shown above a table whenever at least one row checkbox is selected.
// Deletes are fired via the same single-item DELETE endpoint the table's
// per-row delete action already uses (see lib/bulkDelete.ts) — no new
// backend routes required.
export default function BulkSelectBar({
  endpointPath,
  selectedIds,
  noun = "items",
  onDeleted,
  onClear,
  canDelete = true,
}: BulkSelectBarProps) {
  const confirmDialog = useConfirm();
  const toast = useToast();
  const [deleting, setDeleting] = useState(false);

  if (selectedIds.length === 0 || !canDelete) return null;

  const handleDelete = async () => {
    const ok = await confirmDialog(
      `Delete ${selectedIds.length} selected ${noun}? This cannot be undone.`,
      { danger: true, confirmLabel: "Delete", title: "Delete selected" }
    );
    if (!ok) return;

    setDeleting(true);
    try {
      const { succeededIds, failed } = await bulkDeleteByIds(endpointPath, selectedIds);

      if (succeededIds.length > 0) {
        onDeleted(succeededIds);
        toast.success(
          `${succeededIds.length} ${noun} deleted${failed.length ? "" : "."}${
            failed.length ? `, ${failed.length} failed.` : ""
          }`
        );
      } else if (failed.length > 0) {
        toast.error(`Failed to delete ${failed.length} ${noun}.`);
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={styles.bar}>
      <span className={styles.count}>{selectedIds.length} selected</span>
      <button
        type="button"
        className={styles.deleteBtn}
        onClick={handleDelete}
        disabled={deleting}
      >
        <FiTrash2 /> {deleting ? "Deleting..." : "Delete Selected"}
      </button>
      <button
        type="button"
        className={styles.clearBtn}
        onClick={onClear}
        disabled={deleting}
      >
        <FiX /> Clear
      </button>
    </div>
  );
}
