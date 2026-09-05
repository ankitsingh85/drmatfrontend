import { API_URL } from "@/config/api";

export type BulkDeleteOutcome = {
  succeededIds: string[];
  failed: { id: string; message: string }[];
};

// Fires one DELETE per id against the same single-item endpoint every list
// table already uses (`DELETE ${API_URL}/{endpointPath}/{id}`), in
// parallel, and reports which ids actually succeeded — no new backend
// bulk-delete routes needed since each existing DELETE is already
// per-id and idempotent.
export const bulkDeleteByIds = async (
  endpointPath: string,
  ids: string[]
): Promise<BulkDeleteOutcome> => {
  const results = await Promise.allSettled(
    ids.map(async (id) => {
      const res = await fetch(`${API_URL}/${endpointPath}/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || `Failed to delete ${id}`);
      }
      return id;
    })
  );

  const succeededIds: string[] = [];
  const failed: { id: string; message: string }[] = [];

  results.forEach((result, index) => {
    const id = ids[index];
    if (result.status === "fulfilled") {
      succeededIds.push(id);
    } else {
      const reason = result.reason;
      failed.push({ id, message: reason instanceof Error ? reason.message : "Failed to delete" });
    }
  });

  return { succeededIds, failed };
};
