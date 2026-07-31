# License

This project is **dual-licensed**, to keep software and content cleanly separated.
Creative Commons is for the content, not the code.

| Part | Covers | License |
|---|---|---|
| **Software** | `bin/`, `scripts/` (including `scripts/fixtures/`), `.github/`, `package.json`, every `*.sh`, and the shipped executables under `.claude/skills/` (`report.js`, `journal.js`, `report.sh`, `journal.sh`) and `chatgpt/knowledge/report.py` | MIT, below |
| **Council content** | persona prompts (`.claude/agents/`), the `SKILL.md` orchestrators, the configuration registers (`frameworks.md`, `context.md`, `external-websources.md`), the shared exercise fixtures, and the documentation | [CC BY-SA 4.0](LICENSE-CC-BY-SA-4.0.txt) |

In short: do what you like with the **code** under MIT. If you reuse or adapt the
**council content**, credit *"Luméro"*, link back to this repository, indicate your
changes, and license your adaptations under **CC BY-SA 4.0** (share-alike).

**The rule of thumb, where a path is not listed:** if a file executes, it is MIT. If it
is read as prose or configuration by a model or a person, it is CC BY-SA. The report
generators and the journal live inside the skill directories for packaging reasons, not
because they are content.

## Trademark and bundled assets

The **Luméro** name and logos (`.claude/skills/infosec-council/assets/lumero-logo-*.webp`)
are trademarks of Luméro and are **not** covered by either license above. If you fork this
project under your own brand, replace or remove them.

The HTML dossiers use the system font stack, so no web fonts are bundled and no external
request is made when one is opened.

## MIT License

Copyright (c) 2026 Luméro

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

© 2026 Luméro. The Luméro name and logos are reserved trademarks; the code and content
are licensed as stated above.
