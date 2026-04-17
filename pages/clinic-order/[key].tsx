import React from "react";
import { useRouter } from "next/router";

import ClinicOrderDetail from "@/components/ClinicAdmin/ClinicOrderDetail";

const ClinicOrderDetailPage = () => {
  const router = useRouter();
  const orderKey = typeof router.query.key === "string" ? router.query.key : "";

  return <ClinicOrderDetail orderKey={orderKey} />;
};

export default ClinicOrderDetailPage;
