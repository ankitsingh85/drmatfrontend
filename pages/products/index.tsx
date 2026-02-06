import React, { useEffect, useState } from "react";
import ProductCard from "@/components/Layout/ProductCard"; // Import the ProductCard component
import styles from "@/styles/Products.module.css";
import Topbar from "@/components/Layout/Topbar";
import { Product } from "@/components/types/product";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { getProductList } from "@/components/lib/api/product";
import UserLayout from "@/components/Layout/UserLayout";

const Products = () => {
  const [cartCount, setCartCount] = useState<number>(0);
  const [productList, setProductList] = useState<Product[]>([]);
  const [trendingProductList, setTrendingProductList] = useState<Product[]>([]);
  const [popularProductList, setPopularProductList] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pages, setPages] = useState<number>(1);
  const [currentPopularPage, setCurrentPopularPage] = useState<number>(1);
  const [popularPages, setPopularPages] = useState<number>(1);
  const [currentTrendingPage, setCurrentTrendingPage] = useState<number>(1);
  const [trendingPages, setTrendingPages] = useState<number>(1);

  const session = useSession();
  const router = useRouter();

  async function populateProducts() {
    var data = await getProductList(currentPage, "", undefined, undefined, "");

    setProductList(data.data.list);
    setPages(data.data.pages);

    data = await getProductList(
      currentPage,
      "Popular",
      undefined,
      undefined,
      ""
    );
    setPopularProductList(data.data.list);
    setPopularPages(data.data.pages);

    data = await getProductList(
      currentPage,
      "Trending",
      undefined,
      undefined,
      ""
    );
    setTrendingProductList(data.data.list);
    setTrendingPages(data.data.pages);
  }

  useEffect(() => {
    populateProducts();
  }, []);

  async function populateProProducts() {
    var data = await getProductList(currentPage, "", undefined, undefined, "");

    setProductList(data.data.list);
    setPages(data.data.pages);
  }
  async function populatePopularProducts() {
    var data = await getProductList(
      currentPage,
      "Popular",
      undefined,
      undefined,
      ""
    );

    setPopularProductList(data.data.list);
    setPopularPages(data.data.pages);
  }
  async function populateTrendingProducts() {
    var data = await getProductList(
      currentPage,
      "Trending",
      undefined,
      undefined,
      ""
    );

    setTrendingProductList(data.data.list);
    setTrendingPages(data.data.pages);
  }

  useEffect(() => {
    populateProProducts();
  }, [currentPage]);
  useEffect(() => {
    populatePopularProducts();
  }, [currentPopularPage]);
  useEffect(() => {
    populateTrendingProducts();
  }, [currentTrendingPage]);

  const productsPerPage = 40;
  const totalPages = Math.ceil(productList.length / productsPerPage);

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  console.log(productList, "prod");
  console.log(popularProductList, "popular");
  console.log(trendingProductList);

  return (
    <UserLayout>
      <div className={styles.productListContainer}>
        <div className={styles.productGrid}>
          {productList.map((product, index) => {
            return (
              <ProductCard
                // id={product.id}
                // name={product.name}
                // price={product.price}
                // saleprice={product.saleprice}
                // description={product.description}
                // long_description={product.long_description}
                // image1={product.image1}
                // image2={product.image2}
                // image3={product.image3}
                // categories={product.categories}
                // categoriesid={product.categoriesid}
                products={[product]}
              />
            );
          })}
        </div>

        <div className={styles.pagination}>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={styles.paginationButton}
          >
            &lt; Prev
          </button>
          {[...Array(pages)].map((_, index) => (
            <button
              key={index}
              onClick={() => handlePageChange(index + 1)}
              className={`${styles.paginationButton} ${
                currentPage === index + 1 ? styles.activePage : ""
              }`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={styles.paginationButton}
          >
            Next &gt;
          </button>
        </div>
      </div>
      <div className={styles.productListContainer}>
        <h1 className={styles.pageTitle}>Trending Products</h1>

        <div className={styles.productGrid}>
          {trendingProductList.map((product, index) => {
            return (
              <ProductCard
                // id={product.id}
                // name={product.name}
                // price={product.price}
                // saleprice={product.saleprice}
                // description={product.description}
                // long_description={product.long_description}
                // image1={product.image1}
                // image2={product.image2}
                // image3={product.image3}
                // categories={product.categories}
                // categoriesid={product.categoriesid}
                products={[product]}
              />
            );
          })}
        </div>

        <div className={styles.pagination}>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={styles.paginationButton}
          >
            &lt; Prev
          </button>
          {[...Array(trendingPages)].map((_, index) => (
            <button
              key={index}
              onClick={() => handlePageChange(index + 1)}
              className={`${styles.paginationButton} ${
                currentPage === index + 1 ? styles.activePage : ""
              }`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={styles.paginationButton}
          >
            Next &gt;
          </button>
        </div>
      </div>
      <div className={styles.productListContainer}>
        <h1 className={styles.pageTitle}>Popular Products</h1>

        <div className={styles.productGrid}>
          {popularProductList.map((product, index) => {
            return (
              <ProductCard
                products={[product]}
                // id={product.id}
                // name={product.name}
                // price={product.price}
                // saleprice={product.saleprice}
                // description={product.description}
                // long_description={product.long_description}
                // image1={product.image1}
                // image2={product.image2}
                // image3={product.image3}
                // categories={product.categories}
                // categoriesid={product.categoriesid}
              />
            );
          })}
        </div>

        <div className={styles.pagination}>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={styles.paginationButton}
          >
            &lt; Prev
          </button>
          {[...Array(popularPages)].map((_, index) => (
            <button
              key={index}
              onClick={() => handlePageChange(index + 1)}
              className={`${styles.paginationButton} ${
                currentPage === index + 1 ? styles.activePage : ""
              }`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={styles.paginationButton}
          >
            Next &gt;
          </button>
        </div>
      </div>
    </UserLayout>
  );
};

export default Products;
