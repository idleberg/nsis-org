# @nsis/textmate

> NSIS TextMate grammar for Shiki and other highlighters.

![License](https://img.shields.io/npm/l/@nsis%2Ftextmate?style=for-the-badge)
[![Version](https://img.shields.io/npm/v/@nsis/textmate?style=for-the-badge)](https://www.npmjs.org/package/@nsis/textmate)
[![Build](https://img.shields.io/github/actions/workflow/status/idleberg/nsis-org/ci.yml?style=for-the-badge)](https://github.com/idleberg/nsis-org/actions)

[Demo Time](https://idleberg.github.io/nsis-org/textmate/) 🙌

## Installation

```bash
$ npm install @nsis/textmate
```

## Usage

```typescript
import { createHighlighter } from "shiki";
import grammar from "@nsis/textmate";

import example from './bigtest.nsi?raw';

const highlighter = await createHighlighter({
  themes: ["one-dark-pro"],
  langs: [{ ...grammar, name: "nsis" }],
});

const html = highlighter.codeToHtml(example, {
  lang: "nsis",
  theme: "one-dark-pro",
});
```

## License

Released under the [MIT License](LICENSE-MIT) or [Apache License 2.0](LICENSE-APACHE).
