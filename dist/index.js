"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.launchBrowser = exports.hello = void 0;
var puppeteer_1 = __importDefault(require("puppeteer"));
;
function hello() {
    return 'hello';
}
exports.hello = hello;
// a Generator function that returns the browser and page.
function launchBrowser(_a) {
    var _b = _a === void 0 ? {} : _a, _c = _b.realHeadless, realHeadless = _c === void 0 ? false : _c, _d = _b.fakeHeadless, fakeHeadless = _d === void 0 ? false : _d, _e = _b.chromePath, chromePath = _e === void 0 ? undefined : _e, _f = _b.slowMo, slowMo = _f === void 0 ? 30 : _f, _g = _b.viewportWidth, viewportWidth = _g === void 0 ? 1920 : _g, _h = _b.viewportHeight, viewportHeight = _h === void 0 ? 800 : _h;
    return __awaiter(this, void 0, void 0, function () {
        var browser, page;
        return __generator(this, function (_j) {
            switch (_j.label) {
                case 0: return [4 /*yield*/, puppeteer_1["default"].launch({
                        executablePath: chromePath,
                        headless: realHeadless,
                        // slowMo: slowmo,
                        // userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36',
                        ignoreHTTPSErrors: true,
                        args: [
                            // '--display=' + xvfb._display,
                            fakeHeadless ? '--window-position=10000,0' : '--window-position=0,0',
                            '--mute-audio',
                            '--disable-canvas-aa',
                            '--disable-2d-canvas-clip-aa',
                            '--disable-dev-shm-usage',
                            '--no-zygote',
                            '--use-gl=desktop',
                            '--enable-webgl',
                            '--hide-scrollbars',
                            '--no-first-run',
                            '--disable-infobars',
                            '--disable-breakpad',
                            ' --disable-gpu',
                            '--no-sandbox',
                            '--disable-setuid-sandbox',
                        ]
                    })];
                case 1:
                    browser = _j.sent();
                    return [4 /*yield*/, replaceBrowserFunctions(browser)];
                case 2:
                    _j.sent();
                    return [4 /*yield*/, browser.launchPage(viewportWidth, viewportHeight)];
                case 3:
                    page = _j.sent();
                    return [4 /*yield*/, browser.pages()];
                case 4:
                    (_j.sent())[0].close(); // close page[0], it's about:blank
                    return [2 /*return*/, { browser: browser, page: page }];
            }
        });
    });
}
exports.launchBrowser = launchBrowser;
;
var replaceBrowserFunctions = function (browser) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        // stops an inconsistent error with pages not closing automatically
        browser.killBrowser = function () { return __awaiter(void 0, void 0, void 0, function () {
            var allPages;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, browser.pages()];
                    case 1:
                        allPages = _a.sent();
                        return [4 /*yield*/, Promise.all(allPages.map(function (page) { return page.close(); }))];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, browser.close()];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); };
        browser.launchPage = function (viewportWidth, viewportHeight) {
            if (viewportWidth === void 0) { viewportWidth = 1920; }
            if (viewportHeight === void 0) { viewportHeight = 1080; }
            return __awaiter(this, void 0, void 0, function () {
                var page;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, browser.newPage()];
                        case 1:
                            page = _a.sent();
                            return [4 /*yield*/, page.setViewport({
                                    width: viewportWidth,
                                    height: viewportHeight
                                })];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, replacePageFunctions(page)];
                        case 3: return [2 /*return*/, (_a.sent())
                            // await replacePageFunctions(page);
                            // return page;
                        ];
                    }
                });
            });
        };
        browser.resetBrowser = function (viewportWidth, viewportHeight) {
            if (viewportWidth === void 0) { viewportWidth = 1920; }
            if (viewportHeight === void 0) { viewportHeight = 1080; }
            return __awaiter(void 0, void 0, void 0, function () {
                var page, client;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, browser.launchPage(viewportWidth, viewportHeight)];
                        case 1:
                            page = _a.sent();
                            return [4 /*yield*/, page.target().createCDPSession()];
                        case 2:
                            client = _a.sent();
                            return [4 /*yield*/, client.send('Network.clearBrowserCookies')];
                        case 3:
                            _a.sent();
                            return [4 /*yield*/, client.send('Network.clearBrowserCache')];
                        case 4:
                            _a.sent();
                            return [4 /*yield*/, page.close()];
                        case 5:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        return [2 /*return*/, browser];
    });
}); };
var replacePageFunctions = function (page) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        page.originalClick = page.click;
        page.click = function (selector, timeout) {
            if (timeout === void 0) { timeout = 30000; }
            return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (typeof timeout !== 'number')
                                throw new Error('click: the type of "timeout" must be a number');
                            return [4 /*yield*/, page.waitForSelector(selector, { timeout: timeout })];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, page.$eval(selector, function (el) { return el.click(); })];
                        case 2:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        page.originalType = page.type;
        page.type = function (selector, text) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, page.waitForSelector(selector)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, page.originalType(selector, text)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); };
        page.exists = function (selector, timeout) {
            if (timeout === void 0) { timeout = 50; }
            return __awaiter(void 0, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, page.waitForSelector(selector, { timeout: timeout })];
                        case 1:
                            _b.sent();
                            return [2 /*return*/, true];
                        case 2:
                            _a = _b.sent();
                            return [2 /*return*/, false];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        return [2 /*return*/, page];
    });
}); };
// 	page.waitForAnyOfSelectors = async (selectors, timeout = 30000) => {
// 		const startTime = Date.now();
// 		while (Date.now() - startTime < timeout) {
// 			await sleep(ms('0.01s'));
// 			for await (selector of selectors) {
// 				if (await exists(page, selector, 100)) return selector;
// 			}
// 		}
// 		return null;
// 	};
// 	page.clickUntilSelectorAppears = async (selector, waitForThis, timeout = 30000) => {
// 		const start = Date.now();
// 		while (Date.now() - start < timeout) {
// 			await sleep(ms('0.01s'));
// 			if (await exists(page, waitForThis, 10)) return true;
// 			await click(page, selector);
// 		}
// 		throw new Error('page.clickUntilSelectorAppears: we never got selector: ' + waitForThis);
// 	};
// 	page.clickUntilSelectorDisappears = async (selector, timeout = 30000) => {
// 		const start = Date.now();
// 		await page.waitForSelector(selector);
// 		while (Date.now() - start < timeout) {
// 			await sleep(ms('0.01s')); // sleep a tiny bit
// 			if (!(await exists(page, selector, 10))) return;
// 			await click(page, selector);
// 		}
// 		throw new Error('page.clickUntilSelectorDisappears: Never saw selector: : ' + selector);
// 	};
// 	page.waitForChildNodeAmountToChange = async (selector, timeout = 30000) => {
// 		const start = Date.now();
// 		await page.waitForSelector(selector);
// 		let initialChildNodeAmount = await page.$eval(selector, (el) => el.childNodes.length);
// 		while (Date.now() - start < timeout) {
// 			await sleep(ms('0.01s')); // sleep a tiny bit
// 			let currentChildNodeAmount = await page.$eval(selector, (el) => el.childNodes.length);
// 			if (currentChildNodeAmount !== initialChildNodeAmount) {
// 				return currentChildNodeAmount;
// 			}
// 		}
// 		throw new Error('page.waitForChildNodeAmountToChange: waited for timeout, but it did not change. Throwing error. Selector: ', selector);
// 	};
// 	page.waitForNumberInnerHTML = async (selector, timeout = 30000) => {
// 		const start = Date.now();
// 		while (Date.now() - start < timeout) {
// 			await sleep(ms('0.01s')); // sleep a tiny bit
// 			let maybeNumber = await page.$eval(selector, (el) => el.innerHTML);
// 			maybeNumber = parseInt(await replaceAll(maybeNumber, ',', '')); // remove all commas
// 			if (typeof maybeNumber === 'number' && !isNaN(maybeNumber)) return maybeNumber;
// 		}
// 		throw new Error('page.waitForNumberInnerHTML: waited for over 30 seconds, did not get a number. Throwing error. Selector: ' + selector);
// 	};
// };
//# sourceMappingURL=index.js.map