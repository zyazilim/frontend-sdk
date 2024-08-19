export declare class Monkedo {
    constructor(projectId: string, themeOptions?: ThemeOptions);
    connectApp(params: Record<string, any>): Promise<void>;
    getAppCredentialInfo(params: Record<string, any>): Promise<void>;
    handleSubmit(event: Event, userId: string, appKey: string): Promise<void>;
    setTheme(themeOptions: ThemeOptions): void;
    closeModal(): void;
    private createForm;
}
export declare enum ErrorCodes {
    INVALID_PARAMETER = 1,
    CONNECTION_ALREADY_EXISTS = 222
}
type ThemeOptions = {
    headers?: {
        h1?: string;
        h2?: string;
        h3?: string;
        h4?: string;
        h5?: string;
        h6?: string;
    };
    buttons?: {
        modalClose?: string;
        save?: string;
    };
};
export {};
