import Layout from "@/components/Layout/Layout";
import { getCategoryList } from "@/components/lib/api/productCategories";
import ModularTable from "@/components/table/ModularTable";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

const allcategory = () => {
  const session = useSession();
  const router = useRouter();

  const [productCatgoryList, setProductCategoryList] = useState<
    { id: number; email: string; admin: boolean }[]
  >([]);

  useEffect(() => {
    if (session.status == "authenticated") {
      getUsers();
    } else if (session.status == "unauthenticated") {
      router.push("/login");
    }
  }, [session]);

  async function getUsers() {
    const user: any = session.data?.user;

    const res = await getCategoryList();
    console.log(res);

    setProductCategoryList(res.data);
  }

  return (
    <Layout>
      alluser
      <ModularTable list={productCatgoryList} onSelect={() => {}} />
    </Layout>
  );
};

export default allcategory;
