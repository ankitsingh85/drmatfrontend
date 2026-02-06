import Layout from "@/components/Layout/Layout";
import { getVendorList } from "@/components/lib/api/vendor";
import ModularTable from "@/components/table/ModularTable";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

function index() {
  const session = useSession();
  const router = useRouter();

  const [page, setPage] = useState<number>(1);
  const [pages, setPages] = useState<number>(1);
  const [venderList, setVenderList] = useState<
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

    const res = await getVendorList(page, user?.token as string);
    console.log(res.data);

    setPages(res.data.pages);
    setVenderList(res.data.list);
  }

  return (
    <Layout>
      <ModularTable list={venderList} onSelect={() => {}} />
    </Layout>
  );
}

export default index;
