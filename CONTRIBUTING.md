# Contributing to wct-bstack

We greatly value feedback and contributions from our community. Whether it's a
new feature, correction, or additional documentation, we welcome your pull requests.
Please submit any [issues][] or [pull requests][pull-requests] through GitHub.
Feel free to even play with our repo!

1. Fork this repo
2. Work in a feature branch: `git checkout -b new-feature`
3. Commit changes: `git commit -am 'Add some feature'`
4. Push the branch to your forked repo: `git push origin new-feature`
5. Create a pull request on our original repo

## What you should keep in mind

1. The library is released under the [BSD-3-Clause][license]. Any code
   you submit will be released under that license.
2. Sources under `src/` should be written in TypeScript. Codes under `lib/` are
   by-product of `tsc` compilation.
3. All operations against codes (e.g. tsc) can be done via npm command. See npm scripts in the [package.json][package-json].

## What we are looking for

We are open to anything that improves the plugin and doesn't unnecessarily
cause backwards-incompatible changes. If you are unsure if your idea is
something we would be open to, please ask us; Open an issue or send us an email.
Specifically, here are a few things that we would appreciate help on:

1. **Docs** – We  greatly appreciate contributions to our documentation.
   The docs are written as code comments.
2. **Tests** –  If there are any tests you feel are missing, please add them
   To be honest, we are not so good at making tests. So **what we are looking
   for most is contributors to testing**, perhaps.
3. **Convenience features** – Are there any features you feel would add value
   to the library? Contributions in this area would be greatly appreciated.
   See the [issue list with enhancement tag][issues] for a list of ideas.
4. If you have some other ideas, please let us know!

[issues]: https://github.com/misttechnologies/wct-bstack/issues
[pull-requests]: https://github.com/misttechnologies/wct-bstack/pulls
[license]: https://github.com/misttechnologies/wct-bstack/blob/master/LICENSE
[package-json]: https://github.com/misttechnologies/wct-bstack/blob/master/package.json
