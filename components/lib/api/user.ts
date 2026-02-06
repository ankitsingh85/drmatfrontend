export async function createNewUser(
  name: string,
  email: string,
  password: string,
  admin: boolean
): Promise<{ success: boolean; message: string }> {
  var data: { message: string } = { message: "" };
  try {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name,
        email: email,
        password: password,
        admin: admin,
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

export async function getUserList(
  page: number,
  token: string
): Promise<{ success: boolean; message: string; data: any }> {
  const res = await fetch(`/api/v1/users/${page}/`, {
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
