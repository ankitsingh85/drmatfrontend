import UserLayout from "@/components/Layout/UserLayout";
import { getProductList } from "@/components/lib/api/product";
import PageNavigator from "@/components/page/PageNavigator";
import React, { useEffect, useState } from "react";

const DermatProducts = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [products, setProducts] = useState<any[]>([]);

  async function getProducts() {
    const data = await getProductList(
      currentPage,
      "",
      undefined,
      undefined,
      ""
    );

    setProducts(data.data.list);
    setLoading(false);
  }

  useEffect(() => {
    getProducts();
  }, [currentPage]);

  if (loading) {
    return <UserLayout>Loading</UserLayout>;
  }

  return (
    <UserLayout>
      <div> DermatProducts</div>
      {JSON.stringify(products)}
      <PageNavigator
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
      />
    </UserLayout>
  );
};

export default DermatProducts;
