"use client";

import { API_URL } from "@/config/api";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/styles/ProductList.module.css";
import productImg from "@/public/product1.png";
import Topbar from "@/components/Layout/Topbar";
import Footer from "@/components/Layout/Footer";
import MobileNavbar from "@/components/Layout/MobileNavbar";
import { useCart } from "@/context/CartContext";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import FullPageLoader from "@/components/common/FullPageLoader";
import { resolveMediaUrl } from "@/lib/media";

interface Category {
  _id: string;
  name: string;
  imageUrl?: string;
}

interface Product {
  _id: string;
  productName: string;
  brandName: string;
  category: string[];
  mrpPrice: number;
  discountedPrice: number;
  productImages: string[];
  createdAt: string;
}

interface ProductWithCategory extends Product {
  categoryObj?: Category | null;
}

interface StoredCategory {
  _id?: string;
  id?: string;
  name?: string;
}

const ProductListingPage: React.FC = () => {
  const router = useRouter();
  const { addToCart, cartItems, toggleWishlist, wishlistItems } = useCart();

  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const extractArray = (payload: unknown): any[] => {
    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === "object") {
      const obj = payload as Record<string, unknown>;
      if (Array.isArray(obj.products)) return obj.products as any[];
      if (Array.isArray(obj.data)) return obj.data as any[];
    }
    return [];
  };

  const normalizeCategories = (raw: unknown): Category[] =>
    extractArray(raw)
      .map((cat: any) => ({
        _id: String(cat?._id ?? cat?.id ?? ""),
        name: String(cat?.name ?? ""),
        imageUrl: cat?.imageUrl,
      }))
      .filter((cat) => cat._id && cat.name);

  const normalizeIdLike = (value: unknown): string => {
    if (value == null) return "";
    if (typeof value === "string" || typeof value === "number") {
      return String(value).trim();
    }
    if (typeof value === "object") {
      const obj = value as Record<string, unknown>;
      const fromKnown =
        obj._id ?? obj.id ?? obj.$oid ?? (obj.valueOf && obj.valueOf());
      if (
        typeof fromKnown === "string" ||
        typeof fromKnown === "number"
      ) {
        return String(fromKnown).trim();
      }
    }
    return "";
  };

  const getImage = (img?: string) => {
    if (!img) return productImg.src;
    return resolveMediaUrl(img) || productImg.src;
  };

const normalizeProduct = (
  p:any,
  cats:Category[]
):ProductWithCategory => {


let categoryIds:string[] = [];


// CASE 1 ARRAY
if(Array.isArray(p.category)){


categoryIds = p.category.map((c:any)=>{


// simple id
if(typeof c === "string"){
return c;
}


// mongodb object id
if(c?._id){
return String(c._id);
}


// populated category object
if(c?.id){
return String(c.id);
}


return "";

}).filter(Boolean);



}


// CASE 2 SINGLE CATEGORY
else if(p.category){


if(typeof p.category === "string"){

categoryIds=[
p.category
];

}else{


categoryIds=[
String(
p.category._id ||
p.category.id ||
""
)
];


}

}




const categoryObj =
cats.find((cat)=>
categoryIds.includes(
String(cat._id)
)
)
||
null;




return {


_id:String(
p._id
),


productName:
p.productName || "",


brandName:
p.brandName || "",


// IMPORTANT
category:
categoryIds.map(String),


mrpPrice:
Number(p.mrpPrice || 0),


discountedPrice:
Number(
p.discountedPrice ||
p.mrpPrice ||
0
),


productImages:
Array.isArray(p.productImages)
?
p.productImages
:
[],


createdAt:
p.createdAt || "",


categoryObj


};


};
  const resolveInitialCategoryId = (catData: Category[]): string | null => {
    const savedId = localStorage.getItem("selectedCategoryId");
    if (savedId && catData.some((c) => c._id === savedId)) return savedId;

    const storedCategory = localStorage.getItem("selectedCategory");
    if (!storedCategory) return null;

    try {
      const parsed: StoredCategory = JSON.parse(storedCategory);
      const wantedId = parsed?._id ?? parsed?.id;
      if (wantedId && catData.some((c) => c._id === wantedId)) return wantedId;

      if (parsed?.name) {
        const byName = catData.find(
          (c) => c.name.toLowerCase() === parsed.name?.toLowerCase()
        );
        if (byName) return byName._id;
      }
    } catch (error) {
      console.error("Invalid selectedCategory in localStorage:", error);
    }

    return null;
  };

 const fetchAllProducts = async () => {

setLoading(true);

try {

const [catRes, prodRes] = await Promise.all([
fetch(`${API_URL}/categories`),
fetch(`${API_URL}/products`)
]);


if(!catRes.ok || !prodRes.ok){
throw new Error("Failed to fetch");
}


const catRaw = await catRes.json();
const prodRaw = await prodRes.json();


const catData = normalizeCategories(catRaw);

const prodData = extractArray(prodRaw);


const normalizedProducts = prodData
.map((p)=>normalizeProduct(p,catData))
.filter(
(p)=>p._id && p.productName
);


// DEBUG
console.log(
"SELECTED CATEGORY",
localStorage.getItem("selectedCategoryId")
);


console.log(
"PRODUCT CATEGORY IDS",
normalizedProducts.map((p)=>({
name:p.productName,
category:p.category.join(",")
}))
);



setCategories(catData);

setProducts(normalizedProducts);


const initialCategoryId =
resolveInitialCategoryId(catData);


if(initialCategoryId){

const id = String(initialCategoryId);

setSelectedCategoryId(id);

localStorage.setItem(
"selectedCategoryId",
id
);

}


}

catch(error){

console.log(
"Product fetch error",
error
);

}

finally{

setLoading(false);

}


};
  useEffect(() => {
    fetchAllProducts();
  }, []);

const selectedCategory =
categories.find(
(cat)=>
cat._id === selectedCategoryId
)
||
null;


const selectedCategoryName =
selectedCategory?.name || "";

const filteredProducts = useMemo(() => {

  return products.filter((p) => {

    const matchesSearch =
      p.productName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||

      p.brandName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());


const matchesCategory =
selectedCategoryId
?
p.category.some((cat)=>{

const value =
String(cat)
.trim()
.toLowerCase();


return (

value ===
String(selectedCategoryId)
.toLowerCase()

||

value ===
selectedCategoryName
.toLowerCase()

);

})
:
true;


    return (
      matchesSearch &&
      matchesCategory
    );

  });

}, [
  products,
  searchTerm,
  selectedCategoryId
]);

  return (
    <>
      <Topbar hideHamburgerOnMobile />
      {loading && <FullPageLoader />}

      <section className={styles.shopSection}>
        <div className={styles.layoutWrapper}>
          <aside className={styles.sidebar}>
            <h3 className={styles.sidebarTitle}>Categories</h3>

            <div
              className={`${styles.sidebarCard} ${
                !selectedCategoryId ? styles.activeCategory : ""
              }`}
              onClick={() => {
                setSelectedCategoryId(null);
                localStorage.removeItem("selectedCategory");
                localStorage.removeItem("selectedCategoryId");
              }}
            >
              <img src={productImg.src} alt="All" className={styles.sidebarImage} />
              <p className={styles.sidebarName}>All</p>
            </div>

           {categories.map((cat) => (
  <div
    key={cat._id}
    className={`${styles.sidebarCard} ${
      selectedCategory?._id === cat._id
        ? styles.activeCategory
        : ""
    }`}
    onClick={() => {

      const id = String(cat._id);

      setSelectedCategoryId(id);

      localStorage.setItem(
        "selectedCategoryId",
        id
      );

      localStorage.setItem(
        "selectedCategory",
        JSON.stringify({
          _id: id,
          name: cat.name
        })
      );

    }}
  >

    <img
      src={getImage(cat.imageUrl)}
      alt={cat.name}
      className={styles.sidebarImage}
    />

    <p className={styles.sidebarName}>
      {cat.name}
    </p>

  </div>
))}
          </aside>

          <div style={{ width: "100%" }}>
            <div className={styles.headerRow}>
              <div className={styles.searchBar}>
                <input
                  type="text"
                  placeholder="Search products..."
                  className={styles.searchInput}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <span className={styles.searchIcon}>Search</span>
              </div>
            </div>

            {loading ? null : filteredProducts.length === 0 ? (
              <p style={{ padding: 20 }}>No products found.</p>
            ) : (
              <div className={styles.productGrid}>
                {filteredProducts.map((product) => {
                  const image = getImage(product.productImages?.[0]);
                  const price = Number(product.mrpPrice) || 0;
                  const discount = Number(product.discountedPrice) || price;
                  const hasDiscount = discount < price;
                  const inCart = cartItems.some((item) => item.id === product._id);
                  const inWishlist = wishlistItems.some((item) => item.id === product._id);

                  return (
                    <div
                      key={product._id}
                      className={styles.productCard}
                      onClick={() =>
                        router.push(`/product/${slugify(product.productName || product._id)}`)
                      }
                    >
                      <div className={styles.productItem}>
                        <img
                          src={image}
                          alt={product.productName}
                          className={styles.productImage}
                        />

                        <h3 className={styles.productName}>{product.productName}</h3>

                        <p className={styles.productSize}>{product.brandName}</p>

                        {product.categoryObj && (
                          <p className={styles.categoryName}>
                            Category: {product.categoryObj.name}
                          </p>
                        )}

                        <div className={styles.productPriceContainer}>
                          {hasDiscount ? (
                            <>
                              <p className={styles.productPrice}>Rs. {discount}</p>
                              <p className={styles.productMrp}>Rs. {price}</p>
                              <span className={styles.discountTag}>
                                {Math.round(((price - discount) / price) * 100)}% OFF
                              </span>
                            </>
                          ) : (
                            <p className={styles.productPrice}>Rs. {price}</p>
                          )}
                        </div>

                        <div className={styles.productActionsRow}>
                          <button
                            className={styles.productButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (inCart) {
                                router.push("/home/Cart");
                                return;
                              }
                              addToCart({
                                id: product._id,
                                name: product.productName,
                                price: discount,
                                mrp: price,
                                discount: hasDiscount
                                  ? `${Math.round(((price - discount) / price) * 100)}% OFF`
                                  : undefined,
                                discountPrice: discount,
                                company: product.brandName,
                                image: product.productImages?.[0],
                              });
                            }}
                          >
                            {inCart ? "Go to Cart" : "Add to Cart"}
                          </button>

                          <button
                            className={styles.wishlistBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWishlist({
                                id: product._id,
                                name: product.productName,
                                price: discount,
                                mrp: price,
                                discount: hasDiscount
                                  ? `${Math.round(((price - discount) / price) * 100)}% OFF`
                                  : undefined,
                                discountPrice: discount,
                                company: product.brandName,
                                image: product.productImages?.[0],
                              });
                            }}
                            aria-label="Toggle wishlist"
                            title="Toggle wishlist"
                          >
                            {inWishlist ? <FaHeart /> : <FaRegHeart />}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
      <MobileNavbar />
    </>
  );
};

export default ProductListingPage;
