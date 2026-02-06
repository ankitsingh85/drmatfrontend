export interface Product {
  id: number;
  isBestseller: any;
  image: string[];
  name: string;
  size: string;
    category: { _id: string; name: string }; // ✅ updated

  price: number;
  mrp: number;
  discount: string;
  link: string;
  buttonText?: string;
  categories: number[];
  description: string;
  rating: number;
  long_description: string;
  buttonAction?: () => void;
}
