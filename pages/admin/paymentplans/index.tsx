import React, { useEffect, useState } from "react";
import Layout from "@/components/Layout/Layout";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { getPaymentPlansList } from "@/components/lib/api/paymentplans";
import ModularTable from "@/components/table/ModularTable";

const allpayment = () => {
  const session = useSession();
  const router = useRouter();

  const [page, setPage] = useState<number>(1);
  const [pages, setPages] = useState<number>(1);
  const [paymentPlansList, setPaymentPlansList] = useState<
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

    const res = await getPaymentPlansList(page, user?.token as string);
    console.log(res.data);
    setPages(res.data.pages);
    setPaymentPlansList(res.data.list);
  }

  return (
    <Layout>
      alluser
      <ModularTable list={paymentPlansList} onSelect={() => {}} />
    </Layout>
  );
};

export default allpayment;
