import { generateSignature } from "../utils/signature";

export async function callApi(endpoint: string, body: any) {
  const signature = await generateSignature();
  const deviceLabel = (localStorage.getItem("device_label") || "").toString();

  return fetch(`${process.env.REACT_APP_API_BASE}/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-unique-signature": signature, //Encrypted header
      ...(deviceLabel ? { "x-device-label": deviceLabel } : {}),
    },
    body: JSON.stringify(body),
  });
}
