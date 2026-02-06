export async function createNewPaymentPlan(
  months: number,
  installlment: number,
  total: number,
  token: string
): Promise<{ success: boolean; message: string }> {
  var data: { message: string } = { message: "" };
  try {
    const res = await fetch("/api/v1/paymentplans", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        months: months,
        installlment: installlment,
        total: total,
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

export async function getPaymentPlansList(
  page: number,
  token: string
): Promise<{ success: boolean; message: string; data: any }> {
  const res = await fetch(`/api/v1/paymentplans/${page}/`, {
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
