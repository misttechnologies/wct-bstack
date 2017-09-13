/**
 * @license
 * Copyright (c) 2017 Mist Technologies, Inc. All rights reserved.
 */
import * as wd from 'wd';
export declare function normalize(browsers: (string | {
    browserName: string;
})[]): string[];
/**
 * Expands an array of browser identifiers for locally installed browsers into
 * their webdriver capabilities objects.
 *
 * If `names` is empty, or contains `all`, all installed browsers will be used.
 */
export declare function expand(names: string[]): Promise<wd.Capabilities[]>;
/**
 * Exported and declared as `let` variables for testabilty in wct.
 *
 * @return A list of local browser names that are supported by
 *     the current environment.
 */
export declare let supported: () => wd.Capabilities[];
