"""Use the existing Git credential manager without printing or persisting credentials."""
import os
import subprocess
import sys

env = os.environ.copy()
env.update(GCM_INTERACTIVE="never", GIT_TERMINAL_PROMPT="0")
credential = subprocess.run(
    ["git", "credential", "fill"],
    input="protocol=https\nhost=github.com\n\n",
    text=True, capture_output=True, env=env, check=True,
)
fields = dict(line.split("=", 1) for line in credential.stdout.splitlines() if "=" in line)
if not fields.get("password"):
    sys.exit("No GitHub credential is available.")
env["GH_TOKEN"] = fields["password"]
response = subprocess.run(["gh", "api", *sys.argv[1:]], env=env)
sys.exit(response.returncode)
