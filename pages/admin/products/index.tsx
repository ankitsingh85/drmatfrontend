import ProductUpdateForm from "@/components/forms/ProductUpdateForm";
import Layout from "@/components/Layout/Layout";
import { getProductList } from "@/components/lib/api/product";
import { getUserList } from "@/components/lib/api/user";
import Modal from "@/components/modal/Modal";
import ModularTable from "@/components/table/ModularTable";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

const allproducts = () => {
  const session = useSession();
  const router = useRouter();

  const [page, setPage] = useState<number>(1);
  const [pages, setPages] = useState<number>(1);
  const [minPrice, setminPrice] = useState<number | null>();
  const [maxPrice, setMaxPrice] = useState<number | null>();
  const [categoryValue, setCategoryValue] = useState<string>("");
  const [searchText, setSearchText] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalData, setModalData] = useState<any>();
  const [productList, setProductList] = useState<any[]>([]);

  console.log(productList);

  useEffect(() => {
    if (session.status == "authenticated") {
      getProducts();
    } else if (session.status == "unauthenticated") {
      router.push("/login");
    }
  }, [session, searchText, minPrice, maxPrice, categoryValue]);

  async function getProducts() {
    const user: any = session.data?.user;

    const res = await getProductList(
      page,
      categoryValue,
      minPrice,
      maxPrice,
      searchText
    );
    console.log(res);
    console.log(session.data);

    setPages(res.data.pages);
    setProductList(res.data.list);
  }

  function openModal(data: any) {
    setModalData(data);
    setShowModal(true);
  }

  return (
    <>
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
        }}
      >
        <ProductUpdateForm product={modalData} />
      </Modal>
      <Layout>
        <div>
          <button
            onClick={() => {
              setCategoryValue("Popular");
            }}
          >
            Popular Products
          </button>
          <button
            onClick={() => {
              setCategoryValue("Trending");
            }}
          >
            Sponcered Products
          </button>
        </div>
        <ModularTable list={productList} onSelect={openModal} />
      </Layout>
    </>
  );
};

export default allproducts;
