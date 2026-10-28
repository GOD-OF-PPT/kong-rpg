"""Check the current complete ZIP and isolate its actual offline entry."""
from pathlib import Path
import hashlib
import json
import zipfile

root = Path(__file__).resolve().parents[1]
version = json.loads((root / 'package.json').read_text(encoding='utf8'))['version']
archive = root / 'artifacts' / f'kong-rpg-offline-v{version}.zip'
destination = root / 'artifacts/portable-art-completeness-v10'
with zipfile.ZipFile(archive) as package:
    assert package.testzip() is None
    entry_bytes = package.read('index.html')
    assert entry_bytes == (root / 'release/index.html').read_bytes()
    if not destination.exists():
        destination.mkdir()
        for info in package.infolist():
            assert (destination / info.filename).resolve().is_relative_to(destination.resolve())
        package.extractall(destination)
    assert (destination / 'index.html').read_bytes() == entry_bytes
    names = package.namelist()
with archive.open('rb') as stream:
    archive_sha = hashlib.file_digest(stream, 'sha256').hexdigest()
report = {'version': version, 'archive': str(archive), 'bytes': archive.stat().st_size,
          'zipSHA256': archive_sha, 'entrySHA256': hashlib.sha256(entry_bytes).hexdigest(),
          'allCRCsValid': True, 'extractedEntryMatches': True, 'entry': str(destination / 'index.html'),
          'hasNewReview': 'docs/art-completeness-v10/REVIEW.md' in names,
          'hasPrompts': 'docs/art-completeness-v10/PROMPTS.md' in names}
(root / 'evidence/art-completeness-v10/package.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf8')
print(json.dumps(report))
