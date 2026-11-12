from pathlib import Path
root=Path(__file__).resolve().parent
names=['color-grouping.js','composition.js','zone-map.js','ratio-labels.js','ratio-tracker.js','spot-meter.js','camera-sound.js']
(root/'meter-runtime.js').write_text('\n'.join('// '+name+'\n'+(root/name).read_text() for name in names))
print('Built meter-runtime.js from local helper sources')
