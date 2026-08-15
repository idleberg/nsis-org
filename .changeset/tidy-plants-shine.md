---
"@nsis/dent": minor
---

Normalize the casing of NSIS built-in variables (`$instdir` → `$INSTDIR`, `$r0` → `$R0`), built-in defines (`${nsisdir}` → `${NSISDIR}`) and built-in language strings (`$(^name)` → `$(^Name)`). Custom variables, custom defines, third-party macros, environment variables (`$%windir%`) and escape sequences (`$$`, `$\n`) are left exactly as typed
