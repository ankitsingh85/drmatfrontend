import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Layout from "@/components/Layout/Layout";
import { useRouter } from "next/router";
import { getUserList } from "@/components/lib/api/user";
import { log } from "console";
import ModularTable from "@/components/table/ModularTable";

const alluser = () => {
  const session = useSession();
  const router = useRouter();

  const [page, setPage] = useState<number>(1);
  const [pages, setPages] = useState<number>(1);
  const [userList, setUserList] = useState<
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

    const res = await getUserList(page, user?.token as string);
    console.log(res.data);
    setPages(res.data.pages);
    setUserList(res.data.list);
  }

  return (
    <Layout>
      alluser
      <ModularTable list={userList} onSelect={() => {}} />
    </Layout>
  );
};

export default alluser;
