import React from "react";
import { useRouter } from "next/router";
import OrderDetail from "@/components/UserPanel/OrderDetail";

const UserOrderDetailPage = () => {
  const router = useRouter();
  const orderKey = typeof router.query.key === "string" ? router.query.key : "";

  return <OrderDetail orderKey={orderKey} />;
};

export default UserOrderDetailPage;
