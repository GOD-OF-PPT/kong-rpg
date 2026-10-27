"""Pin the current ZIP and extract a separate file:// acceptance copy."""
import hashlib
import json
from pathlib import Path
import zipfile

root = Path(__file__).resolve().parent.parent
version = json.loads((root / 'package.json').read_text(encoding='utf-8'))['version']
archive = root / 'artifacts' / f'kong-rpg-offline-v{version}.zip'
destination = root / 'artifacts' / 'portable-heroes-v10'
destination.mkdir(exist_ok=False)
with zipfile.ZipFile(archive) as package:
    assert package.testzip() is None
    for entry in package.infolist():
        target = (destination / entry.filename).resolve()
        assert target.is_relative_to(destination.resolve())
    package.extractall(destination)
sha = lambda p: hashlib.file_digest(p.open('rb'), 'sha256').hexdigest()
report = {'version': version, 'zip': str(archive), 'zipSha256': sha(archive),
          'entry': str(destination / 'index.html'), 'entrySha256': sha(destination / 'index.html'),
          'currentSha256': sha(root / 'release' / 'index.html'), 'allCRCsValid': True}
assert report['entrySha256'] == report['currentSha256']
out = root / 'evidence' / 'heroes-v10' / 'offline-package.json'
out.write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report))
