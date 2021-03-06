# Cave Ground Window

A WebGL/Javascript program for rendering the perspective 3D structures of caves on a tablet or phone in a browser 
using the device's GPS and orientation sensors to control the viewpoint.  It should seem as if the screen is a window 
that can see through the ground to the caves underneath.

For a preview, click on [goatchurchprime.github.io/groundwindow/groundwindow.html](https://goatchurchprime.github.io/groundwindow/groundwindow.html#caves/expoloser.js)

![alt text](https://raw.githubusercontent.com/CaveSurveyGIS/cavegroundwindow/master/groundwindowpreview.png "ground windo previes")

## Controls

**?** - Show the control panel

**Hop** - Hop up by 500m (also can be done by bouncing phone upwards)

**Cen** - Shift GPS location to the cave, or back to reality

**Mag** - Try to get the magnetic orientation correct

**See** - Show the back camera image

**Lab** - Turn off or on labels

**Top** - Reorient view to see from above

**Drg** - Mode for dragging virtual foot position

**Psg** - Hide LRUD-based passages

**Bak** - Return to front screen to choose cave

**?** - Display help page

*Touch screen then drag right* - to spin the north orientation

*Touch then drag up or down* - to change lighting distance

*Two finger touch then pinch* - to change field of view

*Touch and hold for one second* - to select a cave section or entrance


## How it works

This system uses [ThreeJS](https://threejs.org/), which is a widely used interface to WebGL.  WebGL is an interface that 
gives access to GPU rendering from a javascript browser program.  A GPU is a type of computer processor that can execute 
small programs called shaders in parallel in order render complex scenes fast enough to use for animation.  



(In the future it would be great if this system could be combined something that is properly designed, like [Peak Finder](https://www.peakfinder.org).)


## Commands for generating the data files

```dump3d maxpleasure2.3d | ../survexprocessing/parse3ddmp.py -s --js=maxpleasure2.js 
python ../survexprocessing/parse3ddmp.py --js=test.js --svx=test.svx￼Q
python ../survexprocessing/parse3ddmp.py --js=leckfell.js --svx=/home/goatchurch/caving/NorthernEngland/ThreeCountiesArea/survexdata/all.svx

python parse3ddmp.py -x ~/data/expodata/loser/all.svx -j caves/all.js
```

## Commands for deploying to github.io

```cp caves/*js ~/repositories/goatchurchprime.github.io/groundwindow/caves/
cp *js ~/repositories/goatchurchprime.github.io/groundwindow/
cp *html ~/repositories/goatchurchprime.github.io/groundwindow/
```

## Commands for loading files locally onto an Android phone

```adb shell: to get onto the filesystem

adb push groundwindow.html /storage/emulated/legacy/groundwindow/
```

on the S5

```adb push groundwindow.html /storage/self/primary/groundwindow```

to get to the webpage it's

```file:///storage/emulated/0/groundwindow/groundwindow.html```


## Stuff to do

* sort out the gl_Position to gl_FragCoord conversion where one gets the z value done by dividing z/w before comparing to closedistance
       then we will have the replication in javascript to get to the same distance thing by: 		
```    this.entproj.fromArray(PlotGeometryObject.entgeometry.attributes.position.array, i*9); 
		this.entproj.setW(1.0); 
		var mvPosition = this.entproj.applyMatrix4(PlotGraphics.camera.modelViewMatrix)
		var glPosition = mvPosition.applyMatrix4(PlotGraphics.camera.projectionMatrix);  
		var fdepth = glPosition.z; 
```

* then we will have the proper conversion of coordinates in javascript which we can use to thin 
out the labels at source by visibility (in parallel to the wholly webgl one of the triangles marking the entrances
we must also simplify the entrance names
and do the experimental hilde passage below the basecamp


* remove textlabelmaterials and use PlotGeometryObject.entlabelscard.children[i].material instead
* make work on blackview phone
* shorten labels a lot on the parse3ddump
* hide labels by their entvisiblity case

* legindexes could use negative index if it is duplicated
* would be nice to merge all the entrance labels into the same object and texture of all the words

* #blocknamessplash { position: relative; background-color: #cfc; margin-left:auto; margin-right:auto; margin-top:10%; width:80%; height: 200px; text-align:left; overflow: scroll; display: none }
* could want this as a tree
* ability to reselect outer subblockname
* move background video into 
* back to start (reload without hash)
* make selection of subblockname to happen
* make selection value blink occasionally

* build/deploy script (copies to goatchurch.io and to phone)
* vertex_shader_enttriangle to attribute float svxlegindex attribute set LoadEntrances as entindex
* move more code into JS files
* light up the entrance labels that match as well



* unhosted.org

* do Philip's conversion stuff
* conversion code to note multiple node names for a node

* separate makefiles for the svx on loser and on leckfell
* provide option of which cave data to load
* make the camera view slightly faded (would require special shader rather that basicmaterial)
* small hops and sideways hops (in relation to the screen, poss using the accelerometer)
* do the mag check early on on startup
* set up links to caves


## Stuff done

* use hash to startup with one of the caves immediately
* other peaks in view into database (put them into the svx files as visible peaks if possible???)
* write a splash screen instructions list
* mapping to blockname to cave entrance label selection
* ? to disappear on startup page
* cave entrance to blockname mapping
* mapping to blockname to cave entrance selection
* then apply to cave entrance selection
* selected attribute onto passagetubes and indexed
* provide an offset and digit rounding to the java file to shorten it
* light should minimum be 10m
* ability to select different js files of data
* put entrance triangles back in (and have them converted from the 3d processing)
* offset the positions of everything by the base position origin
* trail should work with key motions
* assign date attribute onto legs as a year float
* ability to offset the alt and latlng in the phone UI
* dot trail to spawn off the dots from current position
* attribute colouring on the slopes using that trick
* get aspect ratio of triangles to remain constant when device rotates
* do mountain peak on the horizon seen from gite
* pyproj to set the p1 positions of relative projections
* use the fakegps coords to make work with the displacement
* make the test.js case work
* move the latlngG crap to position code and simplify
* and then one working on the test.js one
* check with case that has a latlng valid latlng in it
* convert *fix type mountains (like the entrances)
* shift the makecentrelines and entrances into the plottedgeometry.js file
* dot tracking changed to vertical lines from sea level
* the north position thing  set gamma=0.1
* move the shaders into own compiled include file
* leck fell to have entrance names and separate caves
* check out the WestKingsdaleSystem and make all works -- move the all.svx to the top level NorthernCaves
* scale colours for the altitude
* recalc the latest survey data from expo
* make yorkshire include file [needs cs setting in that file]
* analyse underground camping data
* move mountains into include file
* background image from camera
* picking to be its own class in another javascript file
* make this work off the github.io webpage
* find out why the 204 and 161 entrances are not all joined up
* hard-coded fake position offset mode
* click to find cave

* drop straight into data if miles away
* sort out aspect ratio when picking a point in xy
* picking (possibly light up a cave)
* put the cave index as attribute to entrances and legs
* clean version of data without fake cave junk
* make the open out bit a button on the top right
* when dragging the alpha, fix the position even when device is moving (given up)
* set gfac to 1.0
* landing feet underneath you and poss compass rose
* make the info panel pop up and disappear 
* bigger buttons that pop up and go down
* pinch zoom for FOV
* make the light up of words nice 
* swipe up to handle close and far bits
* minimized three.js
* remove query load
* get line width handled in fragment shader
* use magnetometer to set start point
* disable screen drag in phone orientation
* cave entrance daggers of same colour as passage
* depth colour spectrum implemented in shader
* closest point fog case
* vertical lines darker as if overhead light
** upgrade tunnelx on expo laptop
** make the open svx work by calling the correct svx file


```
// copy the file to the phone

adb push groundwindow.html /storage/emulated/legacy/Cardboard/

// generate gps flight from igc file in Python

fname = "/home/goatchurch/hgstuff/2016-06-25-loserdachstein/66OB0913.IGC"
Blines = [ ]
for l in open(fname):
    if l[0] == 'B':
        utime = int(l[1:3])*3600+int(l[3:5])*60+int(l[5:7])
        latminutes1000 = int(l[7:9])*60000+int(l[9:11])*1000+int(l[11:14])
        lngminutes1000 = (int(l[15:18])*60000+int(l[18:20])*1000+int(l[20:23]))*(l[23]=='E' and 1 or -1) 
        alt10 = int(l[25:31])
        altbaro = int(l[31:])
        Blines.append((utime, latminutes1000, lngminutes1000, alt10, altbaro))

gpslocs = [ (latminutes1000/60000, lngminutes1000/60000, alt10*0.1)  for utime, latminutes1000, lngminutes1000, alt10, altbaro in Blines ]
fout = open("/home/goatchurch/geom3d/cardboardlike/dachflightgps.js", "w")
fout.write("var igcflight = [\n")
for lat, lng, alt in gpslocs[:-1]:
    fout.write("    [%f, %f, %.0f],\n" % (lat, lng, alt))
fout.write("    [%f, %f, %.0f]\n" % gpslocs[-1])
fout.write("];\n")
fout.close()
```


report issue:
```
proj4js doesn't take d value in lon_0

eg I believe this should be valid (and it works in eg pyproj):

+proj=tmerc +lat_0=0 +lon_0=13d20 +k=1 +x_0=0 +y_0=-5200000 +ellps=bessel +towgs84=577.326,90.129,463.919,5.137,1.474,5.297,2.4232

but proj4js fails unless you replace the 13d20 with 13.33333
```


