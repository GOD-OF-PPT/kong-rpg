"""Package only the current offline game's runtime dependency closure."""
import hashlib
import json
from pathlib import Path
import zipfile

root = Path(__file__).resolve().parents[1]
release = root / 'dist-offline'
manifest = json.loads((release / 'manifest.json').read_text(encoding='utf8'))
assert hashlib.sha256((release / manifest['entry']).read_bytes()).hexdigest() == manifest['sha256']
target = root / 'artifacts' / ('kong-rpg-offline-v' + manifest['version'] + '.zip')
temporary = target.with_suffix('.zip.tmp')
# Package the active Vite dependency closure, rather than every stale hash
# left beside retained legacy releases by an incremental build.
payloads = {release / manifest['entry'], release / 'manifest.json'}
payloads.update(release / name for name in manifest['files'])
payloads.update(release / image['file'] for image in manifest['images'].values())
for file in payloads:
    assert file.resolve().is_relative_to(release.resolve()), file
    assert file.is_file(), file
with zipfile.ZipFile(temporary, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for file in sorted(payloads):
        info = zipfile.ZipInfo(file.relative_to(release).as_posix(), (2026, 10, 26, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        archive.writestr(info, file.read_bytes(), compresslevel=9)
temporary.replace(target)
print(json.dumps({'archive': str(target), 'bytes': target.stat().st_size,
                  'sha256': hashlib.sha256(target.read_bytes()).hexdigest(),
                  'localArtifact': target.stat().st_size > 100 * 1024 * 1024}, indent=2))
