// lib/api/clinics.ts

export async function createNewClinic(
  name: string,
  latitude: string,
  longitude: string,
  description: string,
  address: string,
  token: string
): Promise<{ success: boolean; message: string }> {
  var data: { message: string } = { message: "" };
  try {
    const res = await fetch("/api/v1/clinics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        description,
        latitude,
        longitude,
        address,
      }),
    });

    data = await res.json();

    if (!res.ok) {
      return { message: data.message, success: false };
    }
    return { message: data.message, success: true };
  } catch (error) {
    return { message: data.message, success: false };
  }
}

export async function getClinicsList(
  page: number,
  token: string
): Promise<{ success: boolean; message: string; data: any }> {
  const res = await fetch(`/api/v1/clinics/${page}`, {
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

export async function getClinicsListNearMe(
  page: number,
  longitude: string,
  latitude: string
): Promise<{ success: boolean; message: string; data: any }> {
  const res = await fetch(
    `/api/v1/clinics/${page}?longitude=${longitude}&latitude=${latitude}`
  );

  const data = await res.json();

  if (!res.ok) {
    return { message: data.message, success: false, data: null };
  }

  return { message: data.message, success: true, data: data.data };
}

// ✅ New function: getClinicById
export async function getClinicById(
  clinicId: string
): Promise<{ success: boolean; message: string; data: any }> {
  try {
    const res = await fetch(`/api/v1/clinics/details/${clinicId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return { message: data.message, success: false, data: null };
    }

    return { message: data.message, success: true, data: data.data };
  } catch (err: any) {
    return { message: err.message, success: false, data: null };
  }
}
