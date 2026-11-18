"""Verify archived objects against the post-merge backup, including the old v9 digest."""
import hashlib
import json
from pathlib import Path
import subprocess

root = Path(__file__).resolve().parents[1]
index = json.loads((root / 'docs/merge-main-20261118/archive-index.json').read_text(encoding='utf8'))
commit = index['backupCommit']
remote = subprocess.check_output(['git', 'ls-remote', '--heads', 'origin', 'refs/heads/' + index['backupBranch']], cwd=root).decode().split()[0]
assert remote == commit
tree = {}
for row in subprocess.check_output(['git', 'ls-tree', '-r', '-l', '-z', commit], cwd=root).split(b'\0'):
    if row:
        meta, name = row.split(b'\t', 1)
        tree[name.decode()] = (meta.split()[2].decode(), int(meta.split()[3]))
for entry in index['removed']:
    assert tree[entry['path']] == (entry['gitBlob'], entry['bytes']), entry['path']
# This is the original assertion from verify-campaign.cjs, now checked against
# the actual archived bytes instead of requiring a 67 MB runtime-unreferenced file.
legacy = subprocess.check_output(['git', 'show', commit + ':release/legacy-v9.html'], cwd=root)
digest = hashlib.sha256(legacy).hexdigest()
assert digest == 'ccfe000ebe3c4eb57fe3d5afbc17691aeb1304353a2df05a076929b2c965086d'
report = dict(backupCommit=commit, remoteBackupVerified=True, archivedObjectsVerified=len(index['removed']),
              legacyV9SHA256=digest, originalLegacyDigestAssertionPassed=True)
out = root / 'docs/merge-main-20261118/archive-verification.json'
out.write_text(json.dumps(report, indent=2) + '\n', encoding='utf8')
print(json.dumps(report, indent=2))
