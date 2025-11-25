
/* ==== Debug helper (prints raw UA and client hints) ==== */
export async function logDeviceDebugInfo(): Promise<void> {
    try {
      console.log('[DeviceDebug] navigator.userAgent:', navigator.userAgent);
      // @ts-ignore
      const uad = navigator.userAgentData;
      console.log('[DeviceDebug] navigator.userAgentData (raw):', uad);
      // @ts-ignore
      if (uad && typeof uad.getHighEntropyValues === 'function') {
        try {
          // @ts-ignore
          const high = await uad.getHighEntropyValues(['model', 'platform', 'platformVersion']);
          console.log('[DeviceDebug] navigator.userAgentData.getHighEntropyValues:', high);
        } catch (err) {
          console.warn('[DeviceDebug] getHighEntropyValues failed:', err);
        }
      }
    } catch (err) {
      console.warn('[DeviceDebug] error reading navigator info:', err);
    }
  }

  /* ==== Async device name extractor (uses Client Hints when available) ==== */
  export async function getDeviceName(): Promise<string> {
    if (typeof navigator === 'undefined') return 'Unknown Device';
    const ua = navigator.userAgent || '';
    const platform = navigator.platform || '';

    try {
      // @ts-ignore
      const uad = navigator.userAgentData;
      // @ts-ignore
      if (uad && typeof uad.getHighEntropyValues === 'function') {
        try {
          // @ts-ignore
          const high = await uad.getHighEntropyValues(['model', 'platform', 'platformVersion']);
          const model = (high?.model || '').toString().trim();
          const plat = (high?.platform || '').toString().trim();
          if (model) {
            const brandMap: Array<[RegExp, string]> = [
              [/^\s*SM-/i, 'Samsung'],
              [/samsung/i, 'Samsung'],
              [/redmi|mi|poco|mix/i, 'Xiaomi'],
              [/oneplus/i, 'OnePlus'],
              [/huawei|honor/i, 'Huawei'],
              [/vivo/i, 'Vivo'],
              [/oppo/i, 'Oppo'],
              [/pixel/i, 'Google'],
            ];
            const brandEntry = brandMap.find(([rx]) => rx.test(model));
            return (brandEntry ? `${brandEntry[1]} ${model}` : model).slice(0, 200);
          }
          if (plat) {
            // @ts-ignore
            const brands = Array.isArray(uad.brands) ? uad.brands.map((b: any) => String(b.brand).replace(/[^A-Za-z0-9 .-]/g, '').trim()) : [];
            const brandChoice = brands.find((b: string) => /Chrome|Chromium|Firefox|Edge|Safari|Opera/i.test(b)) || brands[brands.length - 1] || '';
            const basic = [plat, brandChoice].filter(Boolean).join(' ').trim();
            if (basic) return basic.slice(0, 200);
          }
        } catch (err) { }
      }
    } catch (e) { }

    const androidMatch = ua.match(/Android[^;]*;\s*([^;()]+?)\s*(?:Build\/|\))/i);
    if (androidMatch && androidMatch[1]) {
      const rawModel = androidMatch[1].trim();
      const model = rawModel.replace(/\b(wv|mobile|tablet)\b/gi, '').trim().slice(0, 120);
      const brandMap: Array<[RegExp, string]> = [
        [/^\s*SM-/i, 'Samsung'],
        [/samsung/i, 'Samsung'],
        [/redmi|mi|poco|mix/i, 'Xiaomi'],
        [/oneplus/i, 'OnePlus'],
        [/huawei|honor/i, 'Huawei'],
        [/vivo/i, 'Vivo'],
        [/oppo/i, 'Oppo'],
        [/pixel/i, 'Google'],
      ];
      const brandEntry = brandMap.find(([rx]) => rx.test(model));
      return (brandEntry ? `${brandEntry[1]} ${model}` : model) || 'Unknown Device';
    }

    if (/iPhone/i.test(ua)) return 'Apple iPhone';
    if (/iPad/i.test(ua)) return 'Apple iPad';
    if (/Macintosh/i.test(ua)) return 'Apple Mac';

    const desktopMap: Array<[RegExp, string]> = [
      [/Win/i, 'Windows PC'],
      [/Mac/i, 'Apple Mac'],
      [/Linux/i, 'Linux PC'],
    ];
    const desktop = desktopMap.find(([rx]) => rx.test(platform));
    if (desktop) return desktop[1];

    return 'Unknown Device';
  }

  /* ==== New User-Agent generator ==== */
  export async function generateUserAgent(): Promise<string> {
    const deviceName = await getDeviceName();
    const ua = navigator.userAgent || '';
    

    // Browser versions (modern, realistic)
    const chromeVersions = ['114.0.5735.196', '120.0.6099.144', '122.0.6261.94'];
    const safariVersions = ['604.1', '605.1.15'];
    const iosVersions = ['17_5', '18_0'];
    const androidVersions = ['11', '12', '13', '14'];

    // Randomize versions for variety
    const randomChrome = chromeVersions[Math.floor(Math.random() * chromeVersions.length)];
    const randomSafari = safariVersions[Math.floor(Math.random() * safariVersions.length)];
    const randomAndroid = androidVersions[Math.floor(Math.random() * androidVersions.length)];
    const randomIos = iosVersions[Math.floor(Math.random() * iosVersions.length)];

    // Android devices
    if (deviceName.includes('Android') || /Android/i.test(ua)) {
      const modelMatch = deviceName.match(/(Samsung|Google|Xiaomi|OnePlus|Huawei|Vivo|Oppo)\s+(.+)/i);
      const model = modelMatch ? modelMatch[2] : deviceName.replace('Android', '').trim();
      return `Mozilla/5.0 (Linux; Android ${randomAndroid}; ${model}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${randomChrome} Mobile Safari/537.36`;
    }

    // iOS devices (iPhone/iPad)
    if (deviceName.includes('iPhone')) {
      return `Mozilla/5.0 (iPhone; CPU iPhone OS ${randomIos} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${randomIos.replace('_', '.')} Mobile/15E148 Safari/${randomSafari}`;
    }
    if (deviceName.includes('iPad')) {
      return `Mozilla/5.0 (iPad; CPU OS ${randomIos} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${randomIos.replace('_', '.')} Mobile/15E148 Safari/${randomSafari}`;
    }

    // Desktop devices
    if (deviceName.includes('Windows PC')) {
      return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${randomChrome} Safari/537.36`;
    }
    if (deviceName.includes('Apple Mac')) {
      return `Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/${randomSafari}`;
    }
    if (deviceName.includes('Linux PC')) {
      return `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${randomChrome} Safari/537.36`;
    }

    // Fallback for unknown devices
    return `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${randomChrome} Safari/537.36`;
  }