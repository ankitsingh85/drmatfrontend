import React, { Fragment, useEffect, useState } from "react";

import styles from "@/styles/components/forms/ProductUpdateForm.module.css";
import { Product } from "../types/product";
import { ProductCategory } from "../types/productCategory";
import { getCategoryList } from "../lib/api/productCategories";
import { updateProduct } from "../lib/api/product";
import { useSession } from "next-auth/react";

type ProductPropType = {
  product: Product;
};

type ProductUpdateType = {
  name: string;
  price: number;
  saleprice: number;
  description: string;
  longdescription: string;
  categories: number[];
};

function ProductUpdateForm({ product }: ProductPropType) {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<
    ProductCategory[]
  >([]);

  const session = useSession();

  async function handleSubmit(event: any) {
    event.preventDefault();
    const form: any = event.target;
    const formData = new FormData(form);
    const formObj = Object.fromEntries(formData);

    const user: any = session.data?.user;

    const tempCategories = selectedCategories.map((cat) => cat.id);

    try {
      const res = await updateProduct({
        id: product.id,
        name: formObj.name as string,
        description: formObj.description as string,
        longdescription: formObj.longdescription as string,
        price: parseInt(formObj.price as string),
        saleprice: parseInt(formObj.saleprice as string),
        categories: tempCategories,
        token: user?.token as string,
      });

      console.log(res);
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Failed to update product. Please try again.");
    }
  }

  async function getCategories() {
    const tempCategories = await getCategoryList();
    setCategories(tempCategories.data);

    const tempSelectCats: ProductCategory[] = product.categories.map(catId => {
      return tempCategories.data.find((cat: ProductCategory) => cat.id === catId);
    }).filter(Boolean) as ProductCategory[];
    setSelectedCategories(tempSelectCats);
  }
  useEffect(() => {
    getCategories();
  }, []);

  const handleSelectChange = (e: any) => {
    const selectedValues = Array.from(
      e.target.selectedOptions,
      (option: { value: number }) => option.value
    );

    const tempSelectCats: ProductCategory[] = selectedValues.map(catId => {
      return categories.find((cat: ProductCategory) => cat.id === catId);
    }).filter(Boolean) as ProductCategory[];
    setSelectedCategories(tempSelectCats);
  };

  function checkSelected(id: number) {
    var flag = false;
    selectedCategories.map((cat) => {
      if (cat.id == id) flag = true;
    });
    return flag;
  }

  return (
    <div className={styles.cont}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h3 className={styles.formHead}>Update Product</h3>
        <div className={styles.inputDiv}>
          <label htmlFor="name">Name</label>
          <input
            type="text"
            name="name"
            id="name"
            defaultValue={product.name}
            className={styles.input}
          />
        </div>
        <div className={styles.inputDiv}>
          <label className={styles.label} htmlFor="description">
            Description
          </label>
          <textarea
            name="description"
            id="description"
            defaultValue={product.description}
            className={styles.input}
          />
        </div>
        <div className={styles.inputDiv}>
          <label className={styles.label} htmlFor="longdescription">
            Long Description
          </label>
          <textarea
            name="longdescription"
            id="longdescription"
            defaultValue={product.long_description}
            className={styles.input}
          />
        </div>
        <div className={styles.inputDiv}>
          <label htmlFor="price" className={styles.label}>
            Price
          </label>
          <input
            type="number"
            name="price"
            id="price"
            defaultValue={product.price}
            className={styles.input}
          />
        </div>
        <div className={styles.inputDiv}>
          <label htmlFor="saleprice" className={styles.label}>
            Sale Price
          </label>
          <input
            type="number"
            name="saleprice"
            id="saleprice"
            defaultValue={product.mrp}
            className={styles.input}
          />
        </div>
        <div className={styles.inputDiv}>
          <label htmlFor="categories" className={styles.label}>
            Categories
          </label>
          <select
            name="categories"
            id="categories"
            multiple
            className={styles.input}
            onChange={handleSelectChange}
          >
            {categories.map((cat) => {
              return (
                <option
                  key={cat.id}
                  value={cat.id}
                  selected={checkSelected(cat.id)}
                >
                  {cat.name}
                </option>
              );
            })}
          </select>

          {selectedCategories.map((category, index) => {
            return (
              <Fragment key={category.id}>
                {category.name}{" "}
                {index + 1 < selectedCategories.length ? ", " : ""}
              </Fragment>
            );
          })}
        </div>
        {/* images */}
        <div className={styles.inputDiv}>
          <label htmlFor="image1" className={styles.label}>
            First Image
          </label>
          <input
            type="file"
            name="image1"
            id="image1"
            className={styles.input}
          />
          <img src={product.image[0]} alt="Product Image" />
        </div>
        <div className={styles.inputDiv}>
          <label htmlFor="image2" className={styles.label}>
            Second Image
          </label>
          <input
            type="file"
            name="image2"
            id="image2"
            className={styles.input}
          />
          <img src={product.image[1]} alt="Product Image" />
        </div>
        <div className={styles.inputDiv}>
          <label htmlFor="image3" className={styles.label}>
            Third Image
          </label>
          <input
            type="file"
            name="image3"
            id="image3"
            className={styles.input}
          />
          <img src={product.image[2]} alt="Product Image" />
        </div>
        <button type="submit" className={styles.button}>
          Update the Product
        </button>
      </form>
    </div>
  );
}

export default ProductUpdateForm;
