import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";
import localFont from "next/font/local";
import Layout from "@/components/Layout/Layout";
import Index from "@/pages/home/index"
import UserLayout from "@/components/Layout/UserLayout";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export default function Home() {
  // const router = useRouter();

  // useEffect(() => {
  //   router.replace("/home");
  // }, [router]);
  return (
    <UserLayout>
      <Index/>
    </UserLayout>
  );
}
