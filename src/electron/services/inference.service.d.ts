export declare function runInference(name: string, data: string): Promise<{
    success: boolean;
    predictions?: Record<string, number>;
    error?: string;
}>;
