import React from 'react'

function callid() {
  return (
    <div>[callid]</div>
  )
}

export default callid




// export const dynamic = "force-dynamic";

// import Layout from "@/components/Layout/Layout";
// import { useSession } from "next-auth/react";
// import { useRouter } from "next/router";
// import React, { useEffect, useState } from "react";

// function CallIdPage() {
//   const { status } = useSession();
//   const router = useRouter();
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     if (status === "unauthenticated") {
//       router.push("/login");
//     }

//     if (status === "authenticated") {
//       setLoading(false);
//     }
//   }, [status, router]);

//   if (loading) {
//     return <h1>Loading...</h1>;
//   }

//   return (
//     <Layout>
//       <div>Call ID: {router.query.callid}</div>
//     </Layout>
//   );
// }

// export default CallIdPage;
