# App Store 는 투명도(알파) 있는 PNG 를 받지 않는다 → RGB 로 저장하고 크기 확인
import sys, os
from PIL import Image
SIZES = {'iphone-6.9': (1320, 2868), 'ipad-13': (2064, 2752)}
root = sys.argv[1] if len(sys.argv) > 1 else 'store/appstore'
bad = 0
for lang in sorted(os.listdir(root)):
    for dev, size in SIZES.items():
        d = os.path.join(root, lang, dev)
        for n in sorted(os.listdir(d)):
            p = os.path.join(d, n); im = Image.open(p)
            if im.mode != 'RGB': im.convert('RGB').save(p, optimize=True)
            im = Image.open(p)
            ok = im.size == size and im.mode == 'RGB'
            bad += not ok
            print('OK ' if ok else 'BAD', p, im.size, im.mode, f'{os.path.getsize(p)//1024}KB')
sys.exit(1 if bad else 0)
