# @nsis/dent-ui

> Web UI for the Dent NSIS code formatter 

![License](https://img.shields.io/npm/l/%40nsis%2Fdent-ui?style=for-the-badge)
[![Version](https://img.shields.io/npm/v/@nsis/dent-ui?style=for-the-badge)](https://www.npmjs.org/package/@nsis/dent-ui)
[![Build](https://img.shields.io/github/actions/workflow/status/idleberg/nsis-org/ci.yml?style=for-the-badge)](https://github.com/idleberg/nsis-org/actions)

[Demo Time](https://idleberg.github.io/nsis-org/dent-ui/) 🙌

## Usage

```svelte
<script>
  import DentUI from '@nsis/dent-ui/DentUI.svelte';
</script>

<DentUI strict={true} />
```

> [!NOTE]
> By default, NSIS keywords are matched case-insensitively (e.g. `messagebox` and `MessageBox` are both highlighted). Set `strict` to `true` to require canonical casing.

## License

This work is licensed under [The MIT License](LICENSE).
