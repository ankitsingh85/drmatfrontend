import type { GetServerSideProps } from "next";

const WorkshopListingRedirectPage = () => null;

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: "/workshop-trainings",
      permanent: false,
    },
  };
};

export default WorkshopListingRedirectPage;
