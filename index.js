const puppeteer = require('puppeteer');

const Helpers = require('@lawlzer/helpers');

const ms = require('ms');
const fs = require('fs');

// a Generator function that returns the browser and page.
const launchBrowser = async ({ realHeadless = false, fakeHeadless = false, chromePath = undefined, slowmo = 30, viewportWidth = 1920, viewportHeight = 800 } = {}) => {
	const browser = await puppeteer.launch({
		executablePath: chromePath,
		headless: realHeadless,
		slowmo: slowmo,
		userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36',
		ignoreHTTPSErrors: true,
		args: [
			// '--display=' + xvfb._display,
			fakeHeadless ? '--window-position=10000,0' : '--window-position=0,0',
			'--mute-audio',
			'--disable-canvas-aa', // Disable antialiasing on 2d canvas
			'--disable-2d-canvas-clip-aa', // Disable antialiasing on 2d canvas clips
			'--disable-dev-shm-usage', // ???
			'--no-zygote', // wtf does that mean ?
			'--use-gl=desktop', // better cpu usage with --use-gl=desktop rather than --use-gl=swiftshader, still needs more testing.
			'--enable-webgl',
			'--hide-scrollbars',
			'--no-first-run',
			'--disable-infobars',
			'--disable-breakpad',

			' --disable-gpu',
			'--no-sandbox',
			'--disable-setuid-sandbox',
		],
		// '--proxy-server=socks5://127.0.0.1:9050'] // tor if needed
	});

	await replaceBrowserFunctions(browser);
	const page = await browser.launchPage({ viewportWidth, viewportHeight });

	(await browser.pages())[0].close(); // close page[0], it's about:blank

	return { browser: browser, page: page };
};
module.exports.launchBrowser = launchBrowser;

const replaceBrowserFunctions = async (browser) => {
	// stops an inconsistent error with pages not closing automatically
	browser.killBrowser = async () => {
		let allPages = await browser.pages();
		await Promise.all(allPages.map((page) => page.close()));
		await browser.close();
	};

	browser.launchPage = async ({ viewportWidth = 1920, viewportHeight = 1080 } = {}) => {
		const page = await browser.newPage(browser);
		await page.setViewport({
			width: viewportWidth,
			height: viewportHeight,
		});
		await replacePageFunctions(page);
		return page;
	};

	browser.resetBrowser = async () => {
		const page = await browser.launchPage();
		const client = await page.target().createCDPSession();
		await client.send('Network.clearBrowserCookies');
		await client.send('Network.clearBrowserCache');
		await page.close();
		// await browser.killBrowser();
		// return await launchBrowser();
	};
};

const replacePageFunctions = async (page) => {
	page.originalClick = page.click;
	page.click = async (selector, timeout = 30000) => {
		await page.waitForSelector(selector, { timeout: timeout });
		await page.$eval(selector, (el) => el.click());
	};

	page.originalType = page.type;
	page.type = async (selector, text) => {
		await page.waitForSelector(selector);
		await page.originalType(selector, text);
	};

	page.exists = async (selector, timeout = 50) => {
		try {
			await page.waitForSelector(selector, { timeout: timeout });
			return true;
		} catch {
			return false;
		}
	};

	page.waitForAnyOfSelectors = async (selectors, timeout = 30000) => {
		const startTime = Date.now();
		while (Date.now() - startTime < timeout) {
			await sleep(ms('0.01s'));

			for await (selector of selectors) {
				if (await exists(page, selector, 100)) return selector;
			}
		}
		return null;
	};

	page.clickUntilSelectorAppears = async (selector, waitForThis, timeout = 30000) => {
		const start = Date.now();
		while (Date.now() - start < timeout) {
			await sleep(ms('0.01s'));
			if (await exists(page, waitForThis, 10)) return true;
			await click(page, selector);
		}
		throw new Error('page.clickUntilSelectorAppears: we never got selector: ' + waitForThis);
	};

	page.clickUntilSelectorDisappears = async (selector, timeout = 30000) => {
		const start = Date.now();
		await page.waitForSelector(selector);
		while (Date.now() - start < timeout) {
			await sleep(ms('0.01s')); // sleep a tiny bit
			if (!(await exists(page, selector, 10))) return;
			await click(page, selector);
		}
		throw new Error('page.clickUntilSelectorDisappears: Never saw selector: : ' + selector);
	};

	page.waitForChildNodeAmountToChange = async (selector, timeout = 30000) => {
		const start = Date.now();
		await page.waitForSelector(selector);
		let initialChildNodeAmount = await page.$eval(selector, (el) => el.childNodes.length);
		while (Date.now() - start < timeout) {
			await sleep(ms('0.01s')); // sleep a tiny bit
			let currentChildNodeAmount = await page.$eval(selector, (el) => el.childNodes.length);
			if (currentChildNodeAmount !== initialChildNodeAmount) {
				return currentChildNodeAmount;
			}
		}
		throw new Error('page.waitForChildNodeAmountToChange: waited for timeout, but it did not change. Throwing error. Selector: ', selector);
	};

	page.waitForNumberInnerHTML = async (selector, timeout = 30000) => {
		const start = Date.now();
		while (Date.now() - start < timeout) {
			await sleep(ms('0.01s')); // sleep a tiny bit
			let maybeNumber = await page.$eval(selector, (el) => el.innerHTML);
			maybeNumber = parseInt(await replaceAll(maybeNumber, ',', '')); // remove all commas
			if (typeof maybeNumber === 'number' && !isNaN(maybeNumber)) return maybeNumber;
		}
		throw new Error('page.waitForNumberInnerHTML: waited for over 30 seconds, did not get a number. Throwing error. Selector: ' + selector);
	};
};
