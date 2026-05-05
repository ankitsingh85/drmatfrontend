"use client";

import Topbar from "@/components/Layout/Topbar";
import Footer from "@/components/Layout/Footer";
import TraningWorkshop from "@/pages/home/TraningWorkshop";

export default function WorkshopTrainingsPage() {
  return (
    <>
      <Topbar />
      <main style={{ backgroundColor: "#ffffff" }}>
        <div style={{ padding: "30px 0px" }}>
          <TraningWorkshop showAll title="All Workshop Trainings" showSeeMore={false} />
        </div>
      </main>
      <Footer />
    </>
  );
}
