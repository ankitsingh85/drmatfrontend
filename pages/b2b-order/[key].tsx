import React from "react";
import { useRouter } from "next/router";

import B2BOrderDetail from "@/components/B2BAdmin/B2BOrderDetail";

const B2BOrderDetailPage = () => {
  const router = useRouter();
  const orderKey = typeof router.query.key === "string" ? router.query.key : "";

  return <B2BOrderDetail orderKey={orderKey} />;
};

export default B2BOrderDetailPage;
