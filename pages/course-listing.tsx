import React from "react";
import Topbar from "@/components/Layout/Topbar";
import Footer from "@/components/Layout/Footer";
import CourseListing from "@/components/Layout/CourseListing";

const CourseListingPage = () => {
  return (
    <>
      <Topbar />
      <CourseListing />
      <Footer />
    </>
  );
};

export default CourseListingPage;
