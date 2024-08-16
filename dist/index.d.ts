export declare class Monkedo {
    constructor(projectId: string);
    connectApp(params: Record<string, any>): Promise<string>;
    getAppCredentialInfo(params: Record<string, any>): Promise<void>;
    handleSubmit(event: Event, userId: string, appKey: string): Promise<void>;
    private openConsentWindow;
    private createForm;
}
export declare enum ErrorCodes {
    INVALID_PARAMETER = 1,
    CONNECTION_ALREADY_EXISTS = 222
}
