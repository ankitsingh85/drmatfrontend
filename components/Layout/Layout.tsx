import React from "react";
import Sidebar from "./Sidebar";
import TopBar from "./Topbar";
import styles from "@/styles/components/Layout/Layout.module.css";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.mainContent}>
        <TopBar />
        <main className={styles.pageContent}>{children}</main>
      </div>
    </div>
  );
};

export default Layout;
