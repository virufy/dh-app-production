import CryptoJS from "crypto-js";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { v4 as uuidv4 } from "uuid";


const SECRET = process.env.REACT_APP_SIGNATURE_SECRET ?? "shared-secret";

// --- UUID helper ---
function getOrCreateUUID(): string {
  const storageKey = 'device_uuid'; // Or whatever key you are using
  let uuid = localStorage.getItem(storageKey);

  if (!uuid) {
    // If it doesn't exist, create a new one...
    const newUuid = uuidv4(); 
    // ...save it to storage...
    localStorage.setItem(storageKey, newUuid);
    // ...and immediately return the new one.
    return newUuid;
  }

  // If we get here, we know uuid is not null, so we can just return it.
  return uuid;
}

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
  const userUUID = getOrCreateUUID();

  const payload = {
    uuid: userUUID,
    deviceId,
    lat: geo.lat,
    lon: geo.lon,
    timestamp: Date.now(),
  };
  console.log("Signature payload:", payload);

  return CryptoJS.AES.encrypt(JSON.stringify(payload), SECRET).toString();
}
