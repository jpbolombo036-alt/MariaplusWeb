from pathlib import Path
import hashlib,json
manifest=json.loads(Path(__file__).with_name('backend-changes.json').read_text(encoding='utf-8'))
root=Path(manifest['root']).resolve()
assert root.name=='Mariageplus-main',root
for entry in manifest['changes']:
 p=(root/entry['path']).resolve()
 assert p.is_relative_to(root),p
 actual=hashlib.sha256(p.read_bytes()).hexdigest() if p.exists() else None
 assert actual==entry['sha256'],f'File changed since preparation: {p}'
for entry in manifest['changes']:
 p=root/entry['path']; p.parent.mkdir(parents=True,exist_ok=True); p.write_text(entry['content'],encoding='utf-8')
print(f'Applied {len(manifest["changes"])} reviewed backend files to {root}')
