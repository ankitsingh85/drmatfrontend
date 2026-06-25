import React from "react";
import Chat from "@/components/UserPanel/Chat";
import Topbar from "@/components/Layout/Topbar";
import Footer from "@/components/Layout/Footer";

const ChatPage = () => {
  return (
    <>
      <Topbar />

      <main>
        <Chat />
      </main>

      <Footer />
    </>
  );
};

export default ChatPage;