import puppeteer from 'puppeteer';
export declare type Page = puppeteer.Page & {
    originalClick: (selector: string) => Promise<void>;
    click: (selector: string, timeout?: number) => Promise<void>;
    originalType: (selector: string, text: string) => Promise<void>;
    exists: (selector: string) => Promise<boolean>;
};
export interface Browser extends puppeteer.Browser {
    resetBrowser: (viewportWidth?: number, viewportHeight?: number) => Promise<void>;
    launchPage: (viewportWidth?: number, viewportHeight?: number) => Promise<Page>;
    killBrowser: () => Promise<void>;
}
export declare function hello(): string;
export declare function launchBrowser({ realHeadless, fakeHeadless, chromePath, slowMo, viewportWidth, viewportHeight }?: {
    realHeadless?: boolean | undefined;
    fakeHeadless?: boolean | undefined;
    chromePath?: undefined;
    slowMo?: number | undefined;
    viewportWidth?: number | undefined;
    viewportHeight?: number | undefined;
}): Promise<({
    browser: Browser;
    page: Page;
})>;
//# sourceMappingURL=index.d.ts.map