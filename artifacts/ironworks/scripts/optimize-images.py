from pathlib import Path
from PIL import Image, ImageOps
import json
# Run manually with Python + Pillow when repository-owned photos change.
# Originals and administrator uploads are never modified.
artifact=Path(__file__).resolve().parent.parent
root=artifact/'public'
manifest={}; before=after=0
for p in sorted((root/'images').rglob('*')):
    if p.suffix.lower() not in ['.jpg','.jpeg','.png'] or 'admin-uploads' in p.parts or 'optimized' in p.parts: continue
    if p.stat().st_size < 180000: continue
    im=ImageOps.exif_transpose(Image.open(p)).convert('RGB')
    if max(im.size)<700: continue
    rel=p.relative_to(root).as_posix(); outputs=[]
    for width in sorted(set([min(640,im.width),min(1280,im.width)])):
        resized=im.copy(); resized.thumbnail((width,round(im.height*width/im.width)),Image.Resampling.LANCZOS)
        dest=root/'images'/'optimized'/p.relative_to(root/'images').with_suffix('')
        dest=dest.with_name(dest.name+'-'+str(width)+'.webp'); dest.parent.mkdir(parents=True,exist_ok=True)
        resized.save(dest,'WEBP',quality=86,method=6)
        outputs.append({'src':'/'+dest.relative_to(root).as_posix(),'width':resized.width,'height':resized.height,'bytes':dest.stat().st_size})
    if outputs[-1]['bytes'] >= p.stat().st_size: continue
    manifest['/'+rel]=outputs; before+=p.stat().st_size; after+=outputs[-1]['bytes']
(artifact/'src/data/optimized-images.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'images':len(manifest),'originalBytes':before,'largeVariantBytes':after,'reductionPercent':round((1-after/before)*100,1) if before else 0},indent=2))
