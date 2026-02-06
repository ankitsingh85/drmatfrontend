export async function getCartItems(
  token: string
): Promise<{ success: boolean; data: any }> {
  var data: { message: string } = { message: "" };
  try {
    const res = await fetch("/api/v1/carts", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${token}`,
      },
    });

    data = await res.json();

    if (!res.ok) {
      return { data: data, success: false };
    }
    return { data: data, success: true };
  } catch (error) {
    return { data: data, success: true };
  }
}

export async function addCartItem(
  type: string,
  id: number,
  quantity: number,
  token: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/v1/carts/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ type, id, quantity }),
  });

  const data = await res.json();

  if (!res.ok) {
    return { message: data.message, success: false };
  }

  return { message: data.message, success: true };
}

export async function deleteCartItem(
  id: number,
  quantity: number,
  type: string,
  token: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/v1/carts`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ type, id, quantity }),
  });

  const data = await res.json();

  if (!res.ok) {
    return { message: data.message, success: false };
  }

  return { message: data.message, success: true };
}
