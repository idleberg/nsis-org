# @nsis/twinkleplop

![License](https://img.shields.io/npm/l/@nsis%2Ftwinkleplop?style=for-the-badge)
[![Version](https://img.shields.io/npm/v/@nsis/twinkleplop?style=for-the-badge)](https://www.npmjs.org/package/@nsis/twinkleplop)
[![Build](https://img.shields.io/github/actions/workflow/status/idleberg/nsis-org/ci.yml?style=for-the-badge)](https://github.com/idleberg/nsis-org/actions)

NSIS language support for [twinkleplop](https://twinkleplop.pngwn.at), a fast syntax highlighter driven by compiled grammars.

[Demo Time](https://idleberg.github.io/nsis-org/twinkleplop/) 🙌

## Installation

```bash
$ npm install @nsis/twinkleplop
```

## Usage

```typescript
import { language } from "@nsis/twinkleplop";

const highlight = language();
const html = highlight('Name "Example"\nOutFile "example.exe"');
```

Pair the output with one of the twinkleplop themes, e.g. `@twinkleplop/theme-atom-one`.

## License

Released under [The MIT License](LICENSE).
