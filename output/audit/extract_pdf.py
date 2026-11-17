import pathlib, re, zlib

source = pathlib.Path(r'C:\Users\Ir John Peter\Downloads\createpdf_27d2d11a-e99e-401d-ae02-763417b0ea1b.pdf')
data = source.read_bytes()
objects = {int(m[1]): m[2] for m in re.finditer(rb'(\d+) \d+ obj\b(.*?)endobj', data, re.S)}

def stream(obj):
    raw = re.search(rb'stream\r?\n(.*?)\r?\nendstream', obj, re.S)[1]
    return zlib.decompress(raw) if b'/FlateDecode' in obj else raw

fonts = {}
for n, obj in objects.items():
    ref = re.search(rb'/ToUnicode (\d+) 0 R', obj)
    if not ref:
        continue
    cmap = stream(objects[int(ref[1])])
    mapping = {}
    for block in re.findall(rb'beginbfchar(.*?)endbfchar', cmap, re.S):
        for a, b in re.findall(rb'<(\w+)>\s*<(\w+)>', block):
            mapping[int(a, 16)] = bytes.fromhex(b.decode()).decode('utf-16-be')
    for block in re.findall(rb'beginbfrange(.*?)endbfrange', cmap, re.S):
        for a, b, c in re.findall(rb'<(\w+)>\s*<(\w+)>\s*<(\w+)>', block):
            for code in range(int(a, 16), int(b, 16)+1):
                mapping[code] = chr(int(c, 16)+code-int(a, 16))
    fonts[n] = mapping

pages = re.findall(rb'(\d+) 0 R', re.search(rb'/Kids\[(.*?)\]', objects[21])[1])
output = []
for index, page in enumerate(pages, 1):
    obj = objects[int(page)]
    local = {k.decode(): fonts[int(v)] for k, v in re.findall(rb'/(F\d+) (\d+) 0 R', obj)}
    content = stream(objects[int(re.search(rb'/Contents (\d+) 0 R', obj)[1])])
    lines = []
    for block in re.findall(rb'BT\b(.*?)\bET', content, re.S):
        font = re.search(rb'/(F\d+) [\d.]+ Tf', block)
        if not font:
            continue
        mapping = local[font[1].decode()]
        line = ''.join(mapping.get(int(h[i:i+4], 16), '?') for h in re.findall(rb'<([0-9A-Fa-f]+)>\s*Tj', block) for i in range(0, len(h), 4))
        lines.append(line)
    output.append(f'\n--- PAGE {index} ---\n'+'\n'.join(lines))
result = '\n'.join(output)
pathlib.Path('output/audit/document-extrait.txt').write_text(result, encoding='utf-8')
print(result)
