export async function uploadFile(file: any, token: string) {
  const formData = new FormData();
  formData.append("file", file);
  console.log(formData);

  try {
    const res = await fetch("/api/v1/files", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      return { message: data.message, success: false };
    }
    return { message: data.message, success: true };
  } 
  catch (e) {}
}
