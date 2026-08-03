"use client";

import React from "react";
import { FiEdit2, FiSlash, FiArrowRight, FiCheck, FiX } from "react-icons/fi";
import styles from "@/styles/Dashboard/tableActions.module.css";

type TableActionsProps = {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  canView?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
};

// Shared icon-only action cell used by every admin list table so
// View/Edit/Delete (and Approve/Reject where relevant) look identical
// across the whole dashboard instead of each list inventing its own
// text/emoji buttons.
export default function TableActions({
  onView,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  canView = true,
  canEdit = true,
  canDelete = true,
}: TableActionsProps) {
  return (
    <div className={styles.actions}>
      {onView && canView && (
        <button
          type="button"
          className={`${styles.iconBtn} ${styles.viewBtn}`}
          onClick={onView}
          title="View"
          aria-label="View"
        >
          <FiArrowRight />
        </button>
      )}
      {onEdit && canEdit && (
        <button
          type="button"
          className={`${styles.iconBtn} ${styles.editBtn}`}
          onClick={onEdit}
          title="Edit"
          aria-label="Edit"
        >
          <FiEdit2 />
        </button>
      )}
      {onApprove && (
        <button
          type="button"
          className={`${styles.iconBtn} ${styles.approveBtn}`}
          onClick={onApprove}
          title="Approve"
          aria-label="Approve"
        >
          <FiCheck />
        </button>
      )}
      {onReject && (
        <button
          type="button"
          className={`${styles.iconBtn} ${styles.rejectBtn}`}
          onClick={onReject}
          title="Reject"
          aria-label="Reject"
        >
          <FiX />
        </button>
      )}
      {onDelete && canDelete && (
        <button
          type="button"
          className={`${styles.iconBtn} ${styles.deleteBtn}`}
          onClick={onDelete}
          title="Delete"
          aria-label="Delete"
        >
          <FiSlash />
        </button>
      )}
    </div>
  );
}
