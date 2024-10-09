export declare class Monkedo {
    /**
     * Initialize Monkedo SDK.
     *
     * @param projectId
     * @param appName In applications that use API-Key, the places where "Monkedo" is written in the description of the form
     * that opens to connect an account are replaced with the value written here.
     * @param themeOptions Customize the appearance of the modal dialog.
     */
    constructor(projectId: string, appName: string, themeOptions?: ThemeOptions);
    checkUserConnections(userId: string, appKeys: string[]): Promise<Record<string, 'connected' | 'not-connected' | 'invalid'>>;
    connectApp(params: CredentialParams): Promise<string>;
    openConnectionForm(params: CredentialParams): Promise<string>;
    handleSubmit(event: Event, userId: string, appKey: string): Promise<void>;
    setTheme(themeOptions: ThemeOptions): void;
    closeModal(): void;
    private createForm;
    private openPopupAndListen;
    private listenModalClose;
    private toggleInputs;
}
export declare enum ErrorCodes {
    INVALID_PARAMETER = 1,
    CONNECTION_ALREADY_EXISTS = 222,
    INTEGRATION_NOT_FOUND = 600,
    PROJECT_NOT_FOUND = 901
}
export type ConnectResponse = {
    success: boolean;
    /**
     * If the success is false, this message will be returned.
     */
    message?: string;
};
type ThemeOptions = {
    styles?: {
        dialog?: string;
        header?: string;
        title?: string;
        buttons?: {
            modalClose?: string;
            save?: string;
        };
        input?: string;
        alert?: {
            box?: string;
            error?: string;
        };
    };
    classes?: {
        dialog?: string;
        header?: string;
        title?: string;
        buttons?: {
            modalClose?: string;
            save?: string;
        };
        input?: string;
        alert?: {
            box?: string;
            error?: string;
        };
    };
};
type CredentialParams = {
    userId: string;
    appKey: string;
    [key: string]: any;
};
export {};
