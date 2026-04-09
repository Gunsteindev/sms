import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import { getAccessToken } from "./auth";

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
                "OData-Version": "4.0"
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
        const response = await this.client.get<T>(endpoint, { params });
        return response.data;
    }

    // Generic POST method
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async post<T>(endpoint: string, data: any): Promise<T> {
        const response = await this.client.post<T>(endpoint, data);
        return response.data;
    }

    // Generic PATCH method (for updates)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async patch<T>(endpoint: string, data: any): Promise<T> {
        const response = await this.client.patch<T>(endpoint, data);
        return response.data;
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