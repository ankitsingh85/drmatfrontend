import { log } from "console";
import React from "react";

function PageNavigator({
  totalPages,
  currentPage,
  setCurrentPage,
}: {
  totalPages: number;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
}) {
  function nextPage() {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
      console.log("a");
    }
  }
  function prevPage() {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
      console.log("b");
    }
  }

  return (
    <div>
      <button onClick={prevPage}>Prev</button>
      {currentPage} / {totalPages}
      <button onClick={nextPage}>Next</button>
    </div>
  );
}

export default PageNavigator;
