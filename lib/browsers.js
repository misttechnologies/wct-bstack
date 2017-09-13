"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
function normalize(browsers) {
    return (browsers || []).map(function (browser) {
        if (typeof browser === 'string') {
            return browser;
        }
        return browser.browserName;
    });
}
exports.normalize = normalize;
/**
 * Expands an array of browser identifiers for locally installed browsers into
 * their webdriver capabilities objects.
 *
 * If `names` is empty, or contains `all`, all installed browsers will be used.
 */
function expand(names) {
    return __awaiter(this, void 0, void 0, function* () {
        const map = {};
        for (let browser of exports.supported()) {
            map[browser.browserName] = browser;
        }
        if (names.indexOf('all') !== -1 || names.indexOf('default') !== -1) {
            names = Object.keys(map);
        }
        const unsupported = difference(names, Object.keys(map));
        if (unsupported.length > 0) {
            throw new Error(`The following browsers are unsupported: ${unsupported.join(', ')}. ` +
                `(All supported browsers: ${Object.keys(map).join(', ')})`);
        }
        return names.map(function (n) { return map[n]; });
    });
}
exports.expand = expand;
/**
 * Exported and declared as `let` variables for testabilty in wct.
 *
 * @return A list of local browser names that are supported by
 *     the current environment.
 */
exports.supported = function supported() {
    return require('./../default-bstack-browsers.json');
};
/** Filter out all elements from toRemove from source. */
function difference(source, toRemove) {
    return source.filter((value) => toRemove.indexOf(value) < 0);
}
