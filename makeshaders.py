#! /usr/bin/python

import re
fin = open("shaderssrc.html")
s = fin.read()
fin.close()

fout = open("shaders.js", "w")
fout.write('shaders = { "X":""')
for k, v in re.findall('(?s)<script id="([^"]*)".*?>(.*?)</script>', s):
    v = re.sub("//.*", "", v)
    v = re.sub("\n", "\t", v)
    fout.write(',\n\t"%s":"%s"' % (k, v))
fout.write("\n}\n"); 
fout.close()

