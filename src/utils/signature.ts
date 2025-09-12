import CryptoJS from "crypto-js";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

const SECRET = process.env.REACT_APP_SIGNATURE_SECRET ?? "shared-secret";

// 1. Get geo-data
async function getGeoData() {
  return new Promise<{ lat: number; lon: number }>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject("Geolocation not supported");
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true }
    );
  });
}

// 2. Get device unique ID
async function getDeviceId() {
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  return result.visitorId; // unique per browser/device
}

// 3. Generate encrypted signature
export async function generateSignature() {
  const geo = await getGeoData();
  const deviceId = await getDeviceId();

  const payload = {
    deviceId,
    lat: geo.lat,
    lon: geo.lon,
    timestamp: Date.now(),
  };
  console.log("Signature payload:", payload);

  return CryptoJS.AES.encrypt(JSON.stringify(payload), SECRET).toString();
}
