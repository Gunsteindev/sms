import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import { getAccessToken } from "./auth";

/** Shape returned by every Dataverse OData collection endpoint */
export type DvList<T = Record<string, unknown>> = {
    value: T[];
    '@odata.count'?:    number;
    '@odata.nextLink'?: string;
};
/** A raw Dataverse entity row before mapping to a domain type */
export type DvRow = Record<string, unknown>;

// Tables that represent the school/tenant itself — no school filter applied
const NO_TENANT_TABLES = ['sms_schools', 'sms_schoolbranchs'];

// Pluggable tenant resolver — set by server-side code (tenant.ts) at startup.
// Kept as a plain variable so client bundles never import async_hooks.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _getTenantId: (() => string | undefined) | null = null;

export function registerTenantResolver(fn: () => string | undefined) {
  _getTenantId = fn;
}

function getSchoolIdFromContext(): string | undefined {
  return _getTenantId?.();
}

class DataverseClient {
    private client: AxiosInstance;
    private baseUrl: string;

    constructor() {
        this.baseUrl = `${process.env.DATAVERSE_URL}/api/data/v9.2`;
        
        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                "Accept": "application/json",
                "OData-MaxVersion": "4.0",
                "OData-Version": "4.0",
                "Prefer": 'odata.include-annotations="OData.Community.Display.V1.FormattedValue"',
            }
        });

        // Request interceptor to add token to every request
        this.client.interceptors.request.use(
            async (config: InternalAxiosRequestConfig) => {
                const token = await getAccessToken();
                if (token) {
                config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Response interceptor for error handling
        this.client.interceptors.response.use(
            (response) => response,
            (error: AxiosError) => {
                console.error("Dataverse API Error:", {
                    status: error.response?.status,
                    data: error.response?.data,
                    message: error.message
                });
                
                if (error.response?.status === 401) {
                    throw new Error("Unauthorized: Dataverse token expired or invalid. Check Azure AD credentials.");
                }
                
                return Promise.reject(error);
            }
        );
    }

    // Generic GET method
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async get<T>(endpoint: string, params?: any): Promise<T> {
        const schoolId = getSchoolIdFromContext();
        let ep = endpoint;

        if (schoolId) {
            const tableName = ep.split('?')[0].split('(')[0];
            const isSingleRecord = /^[a-z_]+\([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\)/i.test(ep);

            if (!NO_TENANT_TABLES.includes(tableName) && !isSingleRecord) {
                if (ep.includes('$filter=')) {
                    // Insert school condition into existing $filter
                    ep = ep.replace(/(\$filter=[^&]*)/, `$1 and _sms_school_value eq ${schoolId}`);
                } else if (ep.includes('?')) {
                    ep = ep + `&$filter=_sms_school_value%20eq%20${schoolId}`;
                } else {
                    ep = ep + `?$filter=_sms_school_value%20eq%20${schoolId}`;
                }
            }
        }

        const response = await this.client.get<T>(ep, { params });
        return response.data;
    }

    // Generic POST method — requests return=representation so callers get the created entity back
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async post<T>(endpoint: string, data: any): Promise<T> {
        const schoolId = getSchoolIdFromContext();
        const tableName = endpoint.split('?')[0].split('(')[0];

        if (schoolId && !NO_TENANT_TABLES.includes(tableName)) {
            data = { ...data, 'sms_school@odata.bind': `/sms_schools(${schoolId})` };
        }

        const response = await this.client.post<T>(endpoint, data, {
            headers: {
                Prefer: 'return=representation,odata.include-annotations="OData.Community.Display.V1.FormattedValue"',
            },
        });
        return response.data;
    }

    // Generic PATCH method (for updates)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async patch<T>(endpoint: string, data: any): Promise<T> {
        const response = await this.client.patch<T>(endpoint, data);
        return response.data;
    }

    // Binary PUT — used for Dataverse Image columns (PUT entity(id)/column)
    async putBinary(endpoint: string, data: Buffer, contentType: string): Promise<void> {
        await this.client.put(endpoint, data, {
            headers: { 'Content-Type': contentType },
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
        });
    }

    // Binary GET — used for Dataverse Image columns (GET entity(id)/column/$value)
    async getBinary(endpoint: string): Promise<Buffer> {
        const response = await this.client.get<ArrayBuffer>(endpoint, { responseType: 'arraybuffer' });
        return Buffer.from(response.data);
    }

    // Generic DELETE method
    async delete<T>(endpoint: string): Promise<T> {
        const response = await this.client.delete<T>(endpoint);
        return response.data;
    }

    // Helper for FetchXML queries
    async fetchXml<T>(fetchXml: string): Promise<T> {
        const response = await this.client.get<T>(`/`, {
        params: { fetchXml }
        });
        return response.data;
    }

    async getSimple<T>(endpoint: string): Promise<T> {
        try {
            const response = await this.client.get<T>(endpoint);
            return response.data;
        } catch (error) {
            console.error(`GET request failed for ${endpoint}:`, error);
            throw error;
        }
    }

    // Get with OData filters
    async getWithFilter<T>(
        entity: string,
        select: string[] = [],
        filter?: string,
        orderBy?: string,
        top?: number,
        skip?: number
    ): Promise<T> {
        let query = `${entity}?`;
        
        if (select.length > 0) {
            query += `$select=${select.join(",")}&`;
        }
        
        if (filter) {
            query += `$filter=${encodeURIComponent(filter)}&`;
        }
        
        if (orderBy) {
            query += `$orderby=${orderBy}&`;
        }
        
        if (top) {
            query += `$top=${top}&`;
        }
        
        if (skip) {
            query += `$skip=${skip}&`;
        }
        
        return this.get<T>(query);
    }

    // Batch operations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async batch(operations: Array<{ method: string; uri: string; body?: any }>) {
        const batchId = `batch_${Date.now()}`;
        const changesetId = `changeset_${Date.now()}`;
        
        let batchContent = `--${batchId}
        Content-Type: multipart/mixed; boundary=${changesetId}
        Content-Length: ${operations.length}
        `;
        
        operations.forEach(op => {
            batchContent += `
            --${changesetId}
            Content-Type: application/http
            Content-Transfer-Encoding: binary

            ${op.method} ${op.uri} HTTP/1.1
            Content-Type: application/json

            ${op.body ? JSON.stringify(op.body) : ''}
            `;
        });
        
        batchContent += `
        --${changesetId}--
        --${batchId}--`;
            
        const response = await this.client.post('/$batch', batchContent, {
            headers: {
                'Content-Type': `multipart/mixed; boundary=${batchId}`
            }
        });
        
        return response.data;
    }
}

export const dataverseClient = new DataverseClient();