<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## codemap

This repo is indexed by **codemap**, a local dependency-free symbol index (also exposed as the `codemap` skill) that saves tokens by answering "where is X" and "what's in this file" without grepping the tree or reading whole files. Before a broad grep or a full-file read, use it: `codemap find <symbol>` for discovery, `codemap outline <file>` for a file's structure, `codemap map <dir>` to orient. It self-refreshes on commit, so it stays current on its own; the index lives in `.codemap/` and is invisible to git. If the tool is not present on this machine, work normally.
