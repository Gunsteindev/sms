// src/lib/dataverse/auth.ts
import axios from "axios";

let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

interface TokenResponse {
    access_token: string;
    expires_in: number;
    token_type: string;
    scope?: string;
}

// Helper function to get environment variables with better error handling
function getRequiredEnvVar(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

/**
 * Get access token for Dataverse API using Client Credentials flow
 */
export const getAccessToken = async (): Promise<string> => {
    // Return cached token if still valid (with 5 minute buffer for safety)
    if (cachedToken && tokenExpiry && Date.now() < tokenExpiry - 5 * 60 * 1000) {
        console.log("Using cached access token");
        return cachedToken;
    }

    console.log("Getting new access token from Azure AD...");
  
    // Get environment variables with validation
    const tenantId = getRequiredEnvVar("AZURE_TENANT_ID");
    const clientId = getRequiredEnvVar("AZURE_CLIENT_ID");
    const clientSecret = getRequiredEnvVar("AZURE_CLIENT_SECRET");
    const dataverseUrl = getRequiredEnvVar("DATAVERSE_URL");

    const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const scope = `${dataverseUrl}/.default`;

    const params = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: scope,
        grant_type: "client_credentials"
    });

    try {
        const response = await axios.post<TokenResponse>(
            tokenEndpoint,
            params.toString(),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                timeout: 30000 // 30 second timeout
            }
        );

        cachedToken = response.data.access_token;
        tokenExpiry = Date.now() + (response.data.expires_in * 1000);

        console.log(`✅ Access token obtained successfully. Expires in ${response.data.expires_in} seconds`);
        console.log(`Token preview: ${cachedToken.substring(0, 50)}...`);
        
        return cachedToken;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error("❌ Failed to get access token");
        
        if (axios.isAxiosError(error)) {
            console.error("Response status:", error.response?.status);
            console.error("Response data:", JSON.stringify(error.response?.data, null, 2));
            
            if (error.response?.status === 401) {
                throw new Error("Invalid Azure AD credentials. Check your Client ID and Secret.");
            } else if (error.response?.status === 404) {
                throw new Error("Invalid Azure AD tenant. Check your Tenant ID.");
            }
        }
        
        throw new Error(`Authentication failed: ${error.message}`);
    }
};

/**
 * Clear the cached token
 */
export const clearTokenCache = (): void => {
    cachedToken = null;
    tokenExpiry = null;
    console.log("Token cache cleared");
};

/**
 * Check if current token is valid
 */
export const isTokenValid = (): boolean => {
    return !!(cachedToken && tokenExpiry && Date.now() < tokenExpiry);
};

/**
 * Get environment configuration status
 */
export const getConfigStatus = () => {
    return {
        DATAVERSE_URL: !!process.env.DATAVERSE_URL,
        AZURE_TENANT_ID: !!process.env.AZURE_TENANT_ID,
        AZURE_CLIENT_ID: !!process.env.AZURE_CLIENT_ID,
        AZURE_CLIENT_SECRET: !!process.env.AZURE_CLIENT_SECRET,
        NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
        NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    };
};