import React from "react";
import styles from "@/styles/components/table/table.module.css";
export default function ModularTable({
  list,
  onSelect,
}: {
  list: any[];
  onSelect: (data: any) => void;
}) {
  if (list?.length === 0) {
    return <div>No data to display.</div>;
  }

  const headers = Object.keys(list[0]);

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            {headers?.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {list?.map((item, index) => (
            <tr
              key={index}
              onClick={() => {
                onSelect(item);
              }}
            >
              {headers.map((key) => (
                <td key={key}>{item[key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
