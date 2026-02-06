export async function createNewVendor(
  name: string,
  address: string,
  head: string,
  token: string
): Promise<{ success: boolean; message: string }> {
  var data: { message: string } = { message: "" };
  try {
    const res = await fetch("/api/v1/venders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: name,
        address: address,
        head: head,
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

export async function getVendorList(
  page: number,
  token: string
): Promise<{ success: boolean; message: string; data: any }> {
  const res = await fetch(`/api/v1/venders/${page}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    return { message: data.message, success: false, data: null };
  }

  return { message: data.message, success: true, data: data.data };
}
