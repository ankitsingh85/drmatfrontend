import Layout from "@/components/Layout/Layout";
import { getClinicsList } from "@/components/lib/api/clinics";
import ModularTable from "@/components/table/ModularTable";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

const index = () => {
  const session = useSession();
  const router = useRouter();

  const [page, setPage] = useState<number>(1);
  const [pages, setPages] = useState<number>(1);
  const [productList, setProductList] = useState<
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

    const res = await getClinicsList(page, user?.token as string);
    console.log(res.data);
    console.log(session.data);

    setPages(res.data.pages);
    setProductList(res.data.list);
  }

  return (
    <Layout>
      alluser
      <ModularTable list={productList} onSelect={() => {}} />
    </Layout>
  );
};

export default index;
