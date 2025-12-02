import { PRESIGNED_URL_API_URL } from "../config";
import { generateSignature } from "../utils/signature";

export interface PresignedUrlRequest {
  patientId: string;
  filename: string;
  audioType: "cough" | "speech" | "breath" | "unknown";
  deviceName: string;
  contentType?: string;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  key: string;
  filename: string;
}

/**
 * Log detailed error information
 */
function logError(step: string, error: unknown, context?: Record<string, any>) {
  const errorDetails: any = {
    timestamp: new Date().toISOString(),
    step,
    context,
  };

  if (error instanceof Error) {
    errorDetails.message = error.message;
    errorDetails.stack = error.stack;
    errorDetails.name = error.name;
  } else {
    errorDetails.error = String(error);
  }

  console.error(` [PRESIGNED URL ERROR] ${step}:`, errorDetails);
  console.error("Full error details:", JSON.stringify(errorDetails, null, 2));
}

/**
 * Fetches a presigned URL from the Lambda API for direct S3 upload
 */
export async function getPresignedUrl(
  request: PresignedUrlRequest
): Promise<PresignedUrlResponse> {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(" PresignedURL] Starting presigned URL request:", {
    patientId: request.patientId,
    filename: request.filename,
    audioType: request.audioType,
    deviceName: request.deviceName,
    contentType: request.contentType,
  });

  // Validate API URL configuration
  const apiUrl = `${PRESIGNED_URL_API_URL}/getS3presignedURL`;
  console.log("[PresignedURL] API Configuration:", {
    baseUrl: PRESIGNED_URL_API_URL,
    fullUrl: apiUrl,
    isConfigured: !!PRESIGNED_URL_API_URL && PRESIGNED_URL_API_URL !== "",
  });

  if (!PRESIGNED_URL_API_URL || PRESIGNED_URL_API_URL === "") {
    const error = new Error("PRESIGNED_URL_API_URL is not configured");
    logError("PresignedURL - Configuration Error", error, {
      request,
      configValue: PRESIGNED_URL_API_URL,
    });
    throw error;
  }

  try {
    // Step 1: Generate signature
    console.log("[PresignedURL] Step 1: Generating signature...");
    let signature: string;
    try {
      signature = await generateSignature();
      console.log("[PresignedURL] Signature generated:", signature.substring(0, 50) + "...");
    } catch (signatureError) {
      logError("PresignedURL - Generate Signature", signatureError, {
        request,
      });
      throw new Error(`Failed to generate signature: ${signatureError instanceof Error ? signatureError.message : String(signatureError)}`);
    }

    // Step 2: Prepare request
    const requestBody = {
      patientId: request.patientId,
      filename: request.filename,
      audioType: request.audioType,
      deviceName: request.deviceName,
      contentType: request.contentType || "audio/wav",
    };

    console.log("[PresignedURL] Step 2: Preparing API request:", {
      url: apiUrl,
      method: "POST",
      body: requestBody,
    });

    // Step 3: Make API request
    console.log("[PresignedURL] Step 3: Calling Lambda API...");
    console.log("[PresignedURL] Request details:", {
      url: apiUrl,
      method: "POST",
      origin: typeof window !== 'undefined' ? window.location.origin : 'unknown',
    });

    let response: Response;
    try {
      response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-unique-signature": signature,
        },
        body: JSON.stringify(requestBody),
        mode: "cors",
        credentials: "omit",
      });
    } catch (fetchError) {
      const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
      
      // Enhanced error detection
      let diagnosticMessage = `Network error calling presigned URL API: ${errorMessage}`;
      
      if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
        const isCORS = fetchError instanceof TypeError;
        const isLocalhost = typeof window !== 'undefined' && 
          (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
        
        diagnosticMessage += "\n\n DIAGNOSTICS:";
        diagnosticMessage += `\n• Error Type: ${isCORS ? "TypeError (likely CORS)" : "Network Error"}`;
        diagnosticMessage += `\n• Your Origin: ${typeof window !== 'undefined' ? window.location.origin : 'unknown'}`;
        diagnosticMessage += `\n• Target URL: ${apiUrl}`;
        diagnosticMessage += `\n• Running on: ${isLocalhost ? "localhost" : "production"}`;
        
        diagnosticMessage += "\n\n TROUBLESHOOTING STEPS:";
        diagnosticMessage += "\n1. Check if CORS is configured on API Gateway:";
        diagnosticMessage += `\n   - Allow-Origin header must include your origin`;
        diagnosticMessage += `\n   - Your origin: ${typeof window !== 'undefined' ? window.location.origin : 'unknown'}`;
        diagnosticMessage += "\n   - Allow-Methods must include: POST, OPTIONS";
        diagnosticMessage += "\n   - Allow-Headers must include: Content-Type, x-unique-signature";
        
        diagnosticMessage += "\n2. Test the API endpoint directly:";
        diagnosticMessage += `\n   - Open: ${apiUrl}`;
        
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.error("[CORS/NETWORK ERROR DETECTED]");
        console.error("[PresignedURL] Network Error Diagnostics:", {
          url: apiUrl,
          origin: typeof window !== 'undefined' ? window.location.origin : 'unknown',
          isLocalhost,
          errorType: isCORS ? "TypeError (likely CORS)" : "Other",
          isCORS,
        });
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      }
      
      logError("PresignedURL - Fetch Request", fetchError, {
        url: apiUrl,
        requestBody,
        hasSignature: !!signature,
        origin: typeof window !== 'undefined' ? window.location.origin : 'unknown',
        errorMessage: errorMessage,
        errorType: fetchError?.constructor?.name,
        isCORS: errorMessage.includes("Failed to fetch") || fetchError instanceof TypeError,
      });
      
      throw new Error(diagnosticMessage);
    }

    console.log("[PresignedURL] API response received:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    // Step 4: Handle error responses
    if (!response.ok) {
      let errorText = "";
      try {
        errorText = await response.text();
        console.log("[PresignedURL] Error response body:", errorText.substring(0, 500));
      } catch (textError) {
        console.warn("[PresignedURL] Could not read error response text:", textError);
      }

      logError("PresignedURL - API Error Response", new Error(`HTTP ${response.status}`), {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText.substring(0, 1000),
        url: apiUrl,
        requestBody,
        responseHeaders: Object.fromEntries(response.headers.entries()),
      });

      throw new Error(
        `Failed to get presigned URL: HTTP ${response.status} ${response.statusText}${errorText ? ` - ${errorText.substring(0, 500)}` : ""}`
      );
    }

    // Step 5: Parse response
    console.log("[PresignedURL] Step 4: Parsing response...");
    let data: any;
    try {
      const responseText = await response.text();
      console.log("[PresignedURL] Response text length:", responseText.length);
      console.log("[PresignedURL] Response text preview:", responseText.substring(0, 200));
      
      data = JSON.parse(responseText);
      console.log("[PresignedURL]  Response parsed successfully");
    } catch (parseError) {
      logError("PresignedURL - Parse Response", parseError, {
        status: response.status,
        url: apiUrl,
      });
      throw new Error(`Failed to parse API response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }

    console.log("[PresignedURL] Response data:", {
      hasUploadUrl: !!data.uploadUrl,
      hasKey: !!data.key,
      uploadUrlPreview: data.uploadUrl ? data.uploadUrl.substring(0, 100) + "..." : "missing",
      key: data.key,
      allKeys: Object.keys(data),
    });

    // Step 6: Validate response structure
    if (!data.uploadUrl || !data.key) {
      logError("PresignedURL - Invalid Response Structure", new Error("Missing required fields"), {
        receivedKeys: Object.keys(data),
        hasUploadUrl: !!data.uploadUrl,
        hasKey: !!data.key,
        fullResponse: data,
      });
      throw new Error(
        `Invalid presigned URL response format. Expected 'uploadUrl' and 'key', but got: ${JSON.stringify(Object.keys(data))}`
      );
    }

    console.log("[PresignedURL] Successfully obtained presigned URL:", {
      key: data.key,
      filename: data.filename || request.filename,
    });
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    return {
      uploadUrl: data.uploadUrl,
      key: data.key,
      filename: data.filename || request.filename,
    };
  } catch (error) {
    logError("PresignedURL - Overall Failure", error, {
      request,
    });
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    if (error instanceof Error) {
      throw new Error(`Presigned URL request failed: ${error.message}`);
    }
    throw error;
  }
}

