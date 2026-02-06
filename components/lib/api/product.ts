import { Product } from "@/components/types/product";

export async function createNewProduct(
  name: string,
  price: number,
  saleprice: number,
  description: string,
  longdescription: string,
  image1: any,
  image2: any,
  image3: any,
  categories: number[],
  token: string
): Promise<{ success: boolean; message: string }> {
  var data: { message: string } = { message: "" };

  try {
    const res = await fetch("/api/v1/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: name,
        price: price,
        description: description,
        longdescription,
        saleprice,
        categories,
        image1,
        image2,
        image3,
      }),
    });

    data = await res.json();

    if (!res.ok) {
      return { message: data.message, success: false };
    }
    return { message: data.message, success: true };
  } catch (error) {
    return { message: data.message, success: true };
  }
}

export async function getProductList(
  page: number,
  categoryValue: string,
  minPrice: number | null | undefined,
  maxPrice: number | null | undefined,
  searchText: string
  // token: string
): Promise<{ success: boolean; message: string; data: any }> {
  const res = await fetch(`/api/v1/products/${page}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      categoryValue,
      minPrice,
      maxPrice,
      searchText,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    return { message: data.message, success: false, data: null };
  }

  return { message: data.message, success: true, data: data.data };
}

export async function updateProduct({
  id,
  name,
  price,
  saleprice,
  description,
  longdescription,
  categories,
  token,
}: {
  id: number;
  name: string;
  price: number;
  saleprice: number;
  description: string;
  longdescription: string;
  categories: number[];
  token: string;
}): Promise<{
  success: boolean;
  message: string;
}> {
  const res = await fetch(`/api/v1/products`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      id,
      name,
      price,
      saleprice,
      description,
      longdescription,
      categories,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    return { message: data.message, success: false };
  }

  return { message: data.message, success: true };
}

export async function getProductWithId({ id }: { id: number }): Promise<{
  success: boolean;
  message: string;
  product: Product | null;
}> {
  const res = await fetch(`/api/v1/products/getwithid?id=${id}`);

  const data = await res.json();

  if (!res.ok) {
    return { message: data.message, success: false, product: null };
  }

  return { message: data.message, success: true, product: data.result[0] };
}
