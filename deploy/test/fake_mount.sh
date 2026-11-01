#!/bin/sh
# mount --bind <source> <target> for the deploy tests: appends
# "<target><TAB><source><TAB><source's inode>" to $MGU_DEPLOY_FAKE_BINDS.
# A missing source fails as mount does.
[ "$1" = --bind ] || { echo "fake mount: only --bind" >&2; exit 1; }
[ -e "$2" ] || { echo "mount: mounting $2 on $3 failed: special device $2 does not exist." >&2; exit 32; }
printf '%s\t%s\t%s\n' "$3" "$2" "$(ls -i "$2" | awk '{print $1}')" >> "$MGU_DEPLOY_FAKE_BINDS"
