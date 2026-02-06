import React from "react";
import styles from "@/styles/components/Layout/SideCategories.module.css";

interface Category {
  _id: string;
  name: string;
  imageUrl: string;
}

interface SideCategoriesProps {
  categories: Category[];
  selectedCategoryId?: string | null;
  onCategorySelect: (categoryId: string | null) => void;
}

const SideCategories: React.FC<SideCategoriesProps> = ({
  categories,
  selectedCategoryId,
  onCategorySelect,
}) => {
  return (
    <div className={styles.sidebar}>
      <h3 className={styles.title}>Categories</h3>
      <div className={styles.categoryList}>
        {/* "All" category */}
        <div
          className={`${styles.card} ${
            selectedCategoryId === null ? styles.cardActive : ""
          }`}
          onClick={() => onCategorySelect(null)}
        >
          {/* You can put an icon for "All" if you want */}
          <div className={styles.label}>All</div>
        </div>

        {categories.map((cat) => (
          <div
            key={cat._id}
            className={`${styles.card} ${
              selectedCategoryId === cat._id ? styles.cardActive : ""
            }`}
            onClick={() => onCategorySelect(cat._id)}
          >
            <img src={cat.imageUrl} alt={cat.name} className={styles.image} />
            {/* Removed category name */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SideCategories;
