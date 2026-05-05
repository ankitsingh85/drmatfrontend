import React from "react";
import { useRouter } from "next/router";

import DoctorOrderDetail from "@/components/DoctorAdmin/DoctorOrderDetail";

const DoctorOrderDetailPage = () => {
  const router = useRouter();
  const orderKey = typeof router.query.key === "string" ? router.query.key : "";

  return <DoctorOrderDetail orderKey={orderKey} />;
};

export default DoctorOrderDetailPage;
