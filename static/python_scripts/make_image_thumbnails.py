import os, sys
from PIL import Image

size = 500, 500

for infile in sys.argv[1:]:
    outfile = os.path.splitext(infile)[0] + "_thumbnail.jpg"
    if infile != outfile:
        try:
            im = Image.open(infile)
            im.thumbnail(size, Image.ANTIALIAS)
            im.save(outfile, "JPEG")
        except IOError:
            print(f"cannot create thumbnail for {infile}")
