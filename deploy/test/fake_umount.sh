#!/bin/sh
# umount <target> for the deploy tests: drops the last bind over target
# from $MGU_DEPLOY_FAKE_BINDS. Nothing bound fails as umount does.
f="$MGU_DEPLOY_FAKE_BINDS"
n=$(awk -F '\t' -v t="$1" '$1 == t { n = NR } END { print n + 0 }' "$f" 2>/dev/null)
[ "${n:-0}" -gt 0 ] || { echo "umount: $1: not mounted." >&2; exit 32; }
awk -v n="$n" 'NR != n' "$f" > "$f.tmp" && mv "$f.tmp" "$f"
