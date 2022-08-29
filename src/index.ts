import puppeteer from "puppeteer";

import Helpers from "@lawlzer/helpers";

import ms from "ms";
import fs from "fs";

// interface Page2 extends Omit<puppeteer.Page, 'click'> {
//     click: (selector: string, timeout?: 30000) => Promise<void>;
// };

export type Page = puppeteer.Page & {
  originalClick: (selector: string) => Promise<void>;
  click: (selector: string, timeout?: number) => Promise<void>;
  // click: (selector: string, timeout?: 30000) => Promise<void>;

  originalType: (selector: string, text: string) => Promise<void>;

  exists: (selector: string, timeout?: number) => Promise<boolean>;

  waitForAnyOfSelectors: (
    selectors: string[],
    timeout?: number
  ) => Promise<null | string>;
  clickUntilSelectorAppears: (
    selector: string,
    waitingForThisSelector: string,
    timeout?: number
  ) => Promise<boolean>;
  clickUntilSelectorDisappears: (
    selector: string,
    timeout?: number
  ) => Promise<boolean>;
  waitForChildNodeAmountToChange: (
    selector: string,
    timeout?: number
  ) => Promise<number>;
  // waitForNumberInnerHTML: (selector: string, timeout?: number) => Promise<number>;
};

export interface Browser extends puppeteer.Browser {
  resetBrowser: (
    viewportWidth?: number,
    viewportHeight?: number
  ) => Promise<void>;
  launchPage: (
    viewportWidth?: number,
    viewportHeight?: number
  ) => Promise<Page>;
  killBrowser: () => Promise<void>;
  // newPage: () => Promise<Page>;
}

// a Generator function that returns the browser and page.
export async function launchBrowser({
  realHeadless = false,
  fakeHeadless = false,
  chromePath = undefined,
  slowMo = 30,
  viewportWidth = 1920,
  viewportHeight = 800,
} = {}): Promise<{ browser: Browser; page: Page }> {
  const browser = (await puppeteer.launch({
    executablePath: chromePath,
    headless: realHeadless,
    // slowMo: slowmo,
    // userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36',
    ignoreHTTPSErrors: true,
    args: [
      // '--display=' + xvfb._display,
      fakeHeadless ? "--window-position=10000,0" : "--window-position=0,0",
      "--mute-audio",
      "--disable-canvas-aa", // Disable antialiasing on 2d canvas
      "--disable-2d-canvas-clip-aa", // Disable antialiasing on 2d canvas clips
      "--disable-dev-shm-usage", // ???
      "--no-zygote", // wtf does that mean ?
      "--use-gl=desktop", // better cpu usage with --use-gl=desktop rather than --use-gl=swiftshader, still needs more testing.
      "--enable-webgl",
      "--hide-scrollbars",
      "--no-first-run",
      "--disable-infobars",
      "--disable-breakpad",

      " --disable-gpu",
      "--no-sandbox",
      "--disable-setuid-sandbox",

      "--disable-site-isolation-trials", // Fixes issue with inconsistent crawling behavior
    ],
    // '--proxy-server=socks5://127.0.0.1:9050'] // tor if needed
  })) as Browser;

  await replaceBrowserFunctions(browser);

  const page = await browser.launchPage(viewportWidth, viewportHeight);

  (await browser.pages())[0].close(); // close page[0], it's about:blank

  return { browser: browser, page: page };
}

const replaceBrowserFunctions = async (browser: Browser): Promise<Browser> => {
  // stops an inconsistent error with pages not closing automatically
  browser.killBrowser = async () => {
    // this is the only time we will run this function, so we do not need to fix the function to use Page
    let allPages = await browser.pages();
    await Promise.all(allPages.map((page: puppeteer.Page) => page.close()));
    await browser.close();
  };

  browser.launchPage = async function (
    viewportWidth = 1920,
    viewportHeight = 1080
  ): Promise<Page> {
    const page = (await browser.newPage()) as Page; // fix this function to return a Page
    await page.setViewport({
      width: viewportWidth,
      height: viewportHeight,
    });
    return await replacePageFunctions(page);
    // await replacePageFunctions(page);
    // return page;
  };

  browser.resetBrowser = async (
    viewportWidth = 1920,
    viewportHeight = 1080
  ) => {
    const page = await browser.launchPage(viewportWidth, viewportHeight);
    const client = await page.target().createCDPSession();
    await client.send("Network.clearBrowserCookies");
    await client.send("Network.clearBrowserCache");
    await page.close();
    // return { browser: browser, page: page };
    // await browser.killBrowser();
    // return await launchBrowser();
  };
  return browser;
};

const replacePageFunctions = async (page: Page): Promise<Page> => {
  page.originalClick = page.click;
  page.click = async (selector: string, timeout = 30000) => {
    if (typeof timeout !== "number")
      throw new Error('click: the type of "timeout" must be a number');
    await page.waitForSelector(selector, { timeout: timeout });
    await page.$eval(selector, (el: any) => el.click());
  };

  page.originalType = page.type;
  page.type = async (selector: string, text: string) => {
    await page.waitForSelector(selector);
    await page.originalType(selector, text);
  };

  page.exists = async (selector: string, timeout = 50) => {
    try {
      await page.waitForSelector(selector, { timeout: timeout });
      return true;
    } catch {
      return false;
    }
  };

  page.waitForAnyOfSelectors = async (
    selectors,
    timeout = 30000
  ): Promise<null | string> => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      await Helpers.sleep(ms("0.01s"));

      for await (const selector of selectors) {
        if (await page.exists(selector, 50)) return selector;
      }
    }
    return null;
  };

  page.clickUntilSelectorAppears = async (
    selector,
    waitingForThisSelector,
    timeout = 30000
  ): Promise<boolean> => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      await Helpers.sleep(ms("0.01s"));
      if (await page.exists(waitingForThisSelector, 10)) return true;
      await page.click(selector);
    }
    throw new Error(
      "page.clickUntilSelectorAppears: we never got selector: " +
        waitingForThisSelector
    );
  };

  page.clickUntilSelectorDisappears = async (
    selector,
    timeout = 30000
  ): Promise<boolean> => {
    const start = Date.now();
    await page.waitForSelector(selector);
    while (Date.now() - start < timeout) {
      await Helpers.sleep(ms("0.01s")); // sleep a tiny bit
      if (!(await page.exists(selector, 10))) return true;
      await page.click(selector);
    }
    throw new Error(
      "page.clickUntilSelectorDisappears: Never saw selector: : " + selector
    );
  };

  page.waitForChildNodeAmountToChange = async (
    selector: string,
    timeout = 30000
  ): Promise<number> => {
    const start = Date.now();
    await page.waitForSelector(selector);
    let initialChildNodeAmount = await page.$eval(
      selector,
      (el) => el.childNodes.length
    );
    while (Date.now() - start < timeout) {
      await Helpers.sleep(ms("0.01s")); // sleep a tiny bit
      let currentChildNodeAmount = await page.$eval(
        selector,
        (el) => el.childNodes.length
      );
      if (currentChildNodeAmount !== initialChildNodeAmount) {
        return currentChildNodeAmount;
      }
    }
    throw new Error(
      "page.waitForChildNodeAmountToChange: waited for timeout, but it did not change. Throwing error. Selector: " +
        selector
    );
  };

  // page.waitForNumberInnerHTML = async (selector, timeout = 30000) => {
  //     const start = Date.now();
  //     while (Date.now() - start < timeout) {
  //         await Helpers.sleep(ms('0.01s')); // sleep a tiny bit
  //         let maybeNumber = await page.$eval(selector, (el) => el.innerHTML);
  //         maybeNumber = parseInt(await replaceAll(maybeNumber, ',', '')); // remove all commas
  //         if (typeof maybeNumber === 'number' && !isNaN(maybeNumber)) return maybeNumber;
  //     }
  //     throw new Error('page.waitForNumberInnerHTML: waited for over 30 seconds, did not get a number. Throwing error. Selector: ' + selector);
  // };

  return page as Page;
};

// };
