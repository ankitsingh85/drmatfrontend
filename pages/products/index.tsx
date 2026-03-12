import { useEffect } from "react";
import { useRouter } from "next/router";

const Products = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace("/product-listing");
  }, [router]);

  return null;
};

export default Products;
