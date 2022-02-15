const puppeteer = require('puppeteer');

const Helpers = require('@lawlzer/helpers');

const ms = require('ms');
const fs = require('fs');

async function racePromises(promises) {
	const wrappedPromises = [];
	promises.map((promise, index) => {
		wrappedPromises.push(
			new Promise((resolve) => {
				promise
					.then(() => {
						resolve(index);
					})
					.catch();
			}).catch()
		);
	});
	return Promise.race(wrappedPromises).catch();
}
exports.racePromises = racePromises;

const exists = async (page, selector, timeout = 100) => {
	if (typeof page !== 'object') {
		console.trace('In custom function Helpers.exists(page, selector, timeout), page is not an object.');
		throw new Error('In custom function Helpers.exists(page, selector, timeout), page is not an object.');
	}
	try {
		await page.waitForSelector(selector, { timeout: timeout });
		return true;
	} catch {
		return false;
	}
};
exports.exists = exists;

const closeBrowser = async (browser) => {
	// stops an inconsistent error
	let pages = await browser.pages();
	await Promise.all(pages.map((page) => page.close()));
	await browser.close();
};
exports.closeBrowser = closeBrowser;

const click = async (page, selector, timeout = 30000) => {
	if (typeof page !== 'object') {
		console.trace('Helpers.click was not passed in page as the first argument.');
		throw new Error();
	}
	await page.waitForSelector(selector, { timeout: timeout });
	await page.$eval(selector, (el) => el.click());
};
exports.click = click;

const launchBrowser = async (realHeadless = false, fakeHeadless = false, chromePath = undefined) => {
	var browser = await puppeteer.launch({
		executablePath: chromePath,
		headless: realHeadless,
		slowmo: 30,
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

	let page = await browser.newPage(browser);
	await page.setViewport({
		width: 1920,
		height: 800,
	});
	let allPages = await browser.pages();
	await allPages[0].close(); // close the page[0] (it's about:blank)
	return { browser: browser, page: page };
};
exports.launchBrowser = launchBrowser;

const resetBrowser = async (browser, realHeadless = false, fakeHeadless = false, chromePath = undefined) => {
	if (browser) await closeBrowser(browser, realHeadless, fakeHeadless, chromePath); // first time this runs, we won't have a browser
	return await launchBrowser();
};
exports.resetBrowser = resetBrowser;

const waitForAnySelector = async (page, selectors, timeout = 30000, trace = true) => {
	if (typeof page !== 'object') {
		console.trace('in waitForAnySelector, page was not passed in as an object. Throwing.');
		throw new Error();
	}

	const startTime = Date.now();

	while (true) {
		await sleep(ms('0.1s'));
		if (Date.now() - startTime > timeout) {
			if (trace) console.trace('None of the possibilities showed up in waitForAnySelector. Returning null. Input selectors: ', selectors);
			return null;
		}

		for await (selector of selectors) {
			if (await exists(page, selector, 100)) {
				return selector;
			}
		}
	}
};
exports.waitForAnySelector = waitForAnySelector;

const type = async (page, selector, text) => {
	if (typeof page !== 'object') {
		console.trace('in Helpers.type, order should be page(type, selector, text). page was not an object.');
		throw new Error();
	}
	if (typeof selector !== 'string') {
		console.trace('in Helpers.type, order should be page(type, selector, text). text was not a string.');
		throw new Error();
	}
	if (typeof text !== 'string') {
		console.trace('in Helpers.type, order should be page(type, selector, text). text was not a strings.');
		throw new Error();
	}
	await page.waitForSelector(selector);
	await page.type(selector, text);
};
exports.type = type;

const waitForNumberInnerHTML = async (page, selector, timeout = 30000) => {
	const start = Date.now();
	while (Date.now() - start < timeout) {
		await sleep(ms('0.1s')); // sleep a tiny bit
		let maybeNumber = await page.$eval(selector, (el) => el.innerHTML);
		maybeNumber = parseInt(await replaceAll(maybeNumber, ',', '')); // remove all commas
		if (typeof maybeNumber === 'number' && !isNaN(maybeNumber)) return maybeNumber;
	}

	console.trace('Error in waitForNumber: waited for over 30 seconds, did not get a number. Throwing error. Selector: ', selector);
	throw new Error();
};
exports.waitForNumberInnerHTML = waitForNumberInnerHTML;

const saveErrorScreenshot = async (page, error, extraInfo = undefined) => {
	if (!fs.existsSync(screenshotPath)) fs.mkdirSync(screenshotPath, { recursive: true });
	let existingScreenshots = fs.readdirSync(screenshotPath);
	existingScreenshots = existingScreenshots.sort((b, a) => parseInt(a) - parseInt(b));
	let fileName = '0';
	if (existingScreenshots.length > 0) fileName = parseInt(existingScreenshots[0]) + 1;
	await page.screenshot({
		path: screenshotPath + '/' + fileName + '.png',
		fullPage: true,
	});
	let message = error.stack;
	if (extraInfo) message += '\nExtra passed in info: `' + extraInfo + '`';
	fs.writeFileSync(screenshotPath + '/' + fileName + '.txt', message);
};
exports.saveErrorScreenshot = saveErrorScreenshot;

const waitForChildNodeToChange = async (page, selector, timeout = 30000) => {
	const start = Date.now();
	await page.waitForSelector(selector);
	let initialChildNodeAmount = await page.$eval(selector, (el) => el.childNodes.length);
	while (Date.now() - start < timeout) {
		await sleep(ms('0.01s')); // sleep a tiny bit
		let currentChildNodeAmount = await page.$eval(selector, (el) => el.childNodes.length);
		// if (typeof maybeNumber === 'number' && !isNaN(maybeNumber)) return maybeNumber;
		if (currentChildNodeAmount !== initialChildNodeAmount) {
			return currentChildNodeAmount;
		}
	}

	console.trace('Error in waitForChildNodeToChange: waited for over 30 seconds, did not change. Throwing error. Selector: ', selector);
	throw new Error('Error in waitForChildNodeToChange: waited for over 30 seconds, did not change. Throwing error. Selector: ', selector);
};
exports.waitForChildNodeToChange = waitForChildNodeToChange;

const clickUntilSelectorAppears = async (page, selector, waitForThis, timeout = 30000) => {
	const start = Date.now();

	while (Date.now() - start < timeout) {
		await sleep(ms('0.05s'));
		if (await exists(page, waitForThis, 10)) return;
		await click(page, selector);
	}
	console.trace('in clickUntilSelectorAppears, we never got selector: ', waitForThis);
	throw new Error('in clickUntilSelectorAppears, we never got selector: ' + waitForThis);
};
exports.clickUntilSelectorAppears = clickUntilSelectorAppears;

const clickUntilSelectorDisappears = async (page, selector, timeout = 30000) => {
	const start = Date.now();
	await page.waitForSelector(selector);
	while (Date.now() - start < timeout) {
		await sleep(ms('0.01s')); // sleep a tiny bit
		if (!(await exists(page, selector, 10))) return;
		await click(page, selector);
	}
	console.trace('Selector never appeared in clickUntilSelectorDisappears: ' + selector);
	throw new Error('Selector never appeared in clickUntilSelectorDisappears: ' + selector);
};
exports.clickUntilSelectorDisappears = clickUntilSelectorDisappears;
