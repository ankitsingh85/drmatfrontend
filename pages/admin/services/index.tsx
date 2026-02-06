import Layout from "@/components/Layout/Layout";
import { getServiceList } from "@/components/lib/api/services";
import ModularTable from "@/components/table/ModularTable";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

const allservices = () => {
  const session = useSession();
  const router = useRouter();

  const [page, setPage] = useState<number>(1);
  const [pages, setPages] = useState<number>(1);
  const [serviceList, setServiceList] = useState<
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

    const res = await getServiceList(page, user?.token as string);
    console.log(res.data);

    setPages(res.data.pages);
    setServiceList(res.data.list);
  }

  return (
    <Layout>
      alluser
      <ModularTable list={serviceList} onSelect={() => {}} />
    </Layout>
  );
};

export default allservices;
