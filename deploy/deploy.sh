#!/usr/bin/env bash
# Pull-based deploy: when origin/main has new commits, fast-forward the checkout
# on the server and rebuild the container. Run by puzzles-deploy.timer as root.
#
# Installed as /usr/local/sbin/puzzles-deploy (root-owned copy, not run from the
# repo) so that the account owning the checkout cannot change what root executes.
set -euo pipefail

REPO_DIR=${REPO_DIR:-/home/macedo/code/puzzles.srmacedo.com}
COMPOSE_FILE=${COMPOSE_FILE:-/etc/puzzles/compose.yaml}
BRANCH=${BRANCH:-main}

OWNER=$(stat -c %U "$REPO_DIR")
OWNER_HOME=$(getent passwd "$OWNER" | cut -d: -f6)
# git runs as the checkout owner, never as root
g() { runuser -u "$OWNER" -- env HOME="$OWNER_HOME" git -C "$REPO_DIR" "$@"; }

g fetch --quiet origin "$BRANCH"
local_rev=$(g rev-parse HEAD)
remote_rev=$(g rev-parse "origin/$BRANCH")
[[ $local_rev == "$remote_rev" ]] && exit 0

# Never clobber work in progress on the server
current=$(g branch --show-current)
if [[ $current != "$BRANCH" ]]; then
  echo "skip: checkout is on '$current', not '$BRANCH'"; exit 0
fi
if [[ -n $(g status --porcelain --untracked-files=no) ]]; then
  echo "skip: uncommitted changes in $REPO_DIR"; exit 0
fi

echo "deploying ${local_rev:0:7} -> ${remote_rev:0:7}"
g merge --quiet --ff-only "origin/$BRANCH"
# If the build fails, compose aborts and the running container is kept
docker compose -f "$COMPOSE_FILE" up -d --build
docker image prune -f >/dev/null
echo "deployed $(g log -1 --format='%h %s')"
