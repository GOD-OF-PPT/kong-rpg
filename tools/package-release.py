"""Package the standalone release with every preserved legacy entry (standard library only)."""
import hashlib
import json
from pathlib import Path
import zipfile

root = Path(__file__).resolve().parents[1]
release = root / 'release'
manifest = json.loads((release / 'manifest.json').read_text(encoding='utf8'))
assert hashlib.sha256((release / manifest['entry']).read_bytes()).hexdigest() == manifest['sha256']
target = root / 'artifacts' / ('kong-rpg-offline-v' + manifest['version'] + '.zip')
temporary = target.with_suffix('.zip.tmp')
with zipfile.ZipFile(temporary, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for file in sorted(release.rglob('*')):
        if file.is_file() and not file.is_relative_to(release / 'web') and not file.name.startswith('.') and file.suffix in ('.html', '.md', '.json'):
            info = zipfile.ZipInfo(file.relative_to(release).as_posix(), (2026, 10, 26, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            archive.writestr(info, file.read_bytes(), compresslevel=9)
temporary.replace(target)
print(json.dumps({'archive': str(target), 'bytes': target.stat().st_size,
                  'sha256': hashlib.sha256(target.read_bytes()).hexdigest(),
                  'localArtifact': target.stat().st_size > 100 * 1024 * 1024}, indent=2))
