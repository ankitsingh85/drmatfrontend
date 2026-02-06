import React from 'react'

function index() {
  return (
    <div>index</div>
  )
}

export default index



// import Layout from "@/components/Layout/Layout";
// import { useRouter } from "next/router";
// import { useSession } from "next-auth/react";
// import React , {useEffect} from "react";

// const index = () => {
//   const { data: session, status } = useSession();
//   const router = useRouter();

//   // useEffect(() => {
//   //   // Check if user is not logged in or not an admin
//   //   if (status === "unauthenticated" || session?.user?.role !== "admin") {
//   //     router.push("/login");
//   //   }
//   // }, [session, status, router]);

//   // if (status === "loading") {
//   //   return <p>Loading...</p>;
//   // }

//   return (
    
//     <Layout>
//       welcome admin!
//     </Layout>
//   );
// };

// export default index;


// // function index() {
// //   return <Layout>
// //     welcome admin!
// //   </Layout>;
// // }

// // export default index;
