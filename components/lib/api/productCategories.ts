export async function createNewCategory(
  name: string,
  description: string,
  token: string
): Promise<{ success: boolean; message: string }> {
  var data: { message: string } = { message: "" };
  try {
    const res = await fetch("/api/v1/productcategories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: name,
        description: description,
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

export async function getCategoryList(): Promise<{
  // token: string
  success: boolean;
  message: string;
  data: any;
}> {
  const res = await fetch(`/api/v1/productcategories/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      // authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    return { message: data.message, success: false, data: null };
  }

  return { message: data.message, success: true, data: data.data };
}
