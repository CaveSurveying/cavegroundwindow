
var PositionObject = 
{
    geosuccesscount: 0,
    geosuccesscountpostsvx: 0,
    geoerrorcount: 0, 
    geosetdirectcount: 0, 

    gslatitude: 0, 
    gslongitude: 0, 
    gsaltitude: 0,
    
    gsmdisplacementx: 0,
    gsmdisplacementy: 0, 
    gsmdisplacementz: 0, 

    trailgeometry: null, 
    trailgeometryindex: 0, 
    footminusalt: 20, 
    trailpoints: null, 

    cameraactualposition: new THREE.Vector3(0,0,0), // pre-hop value applied
    footposmesh: null, 
    pickposmesh: null, 

    footvelocitybuff: null, 
    footvelocitylines: null, 

    hopheight: 0.0, 
    hoptime: null, 
    hopmode: 0, // 0 on ground, 1 going up, -1 going down, 2 on the up

    LoadTrailRods: function(scene)
    {
        this.trailrodsbuff = new THREE.Geometry(); 
        this.trailrodsbuffindex = 0; 
        for (var i = 0; i < 50; i++) {
            this.trailrodsbuff.vertices.push(new THREE.Vector3(this.cameraactualposition.x, 0, this.cameraactualposition.z)); 
            this.trailrodsbuff.vertices.push(new THREE.Vector3(this.cameraactualposition.x, this.cameraactualposition.y, this.cameraactualposition.z)); 
        }
        var trailrodsmaterial = new THREE.LineDashedMaterial({ color: 0x555555, linewidth: 2, gapSize:20 }); 
        this.trailrods = new THREE.LineSegments(this.trailrodsbuff, trailrodsmaterial); 
        scene.add(this.trailrods); 
    },

    LoadTrail: function(scene) 
    {
        this.trailgeometry = new THREE.Geometry();
        //var p = latlngtopt(svxents[i][1], svxents[i][2], svxents[i][3]); 
        var p = new THREE.Vector3(this.cameraactualposition.x, this.cameraactualposition.y - this.footminusalt, this.cameraactualposition.z); 
        for (var i = 0; i < 50; i++)
            this.trailgeometry.vertices.push(new THREE.Vector3(p.x, p.y, p.z)); 
        this.trailpointsmaterial = new THREE.PointsMaterial({ color: 0x22FF11, sizeAttenuation: false, size: 5.0 }); 
        this.trailpoints = new THREE.Points(this.trailgeometry, this.trailpointsmaterial); 
        scene.add(this.trailpoints); 
    }, 

    TrailUpdate: function()
    {
        // make the trail
        var trailstep = 15.0; 
        var trailgeometry = this.trailgeometry; 
        if (trailgeometry) {
            var pp = trailgeometry.vertices[this.trailgeometryindex % trailgeometry.vertices.length]; 
            var pc = this.cameraactualposition; 
            if (Math.max(Math.abs(pp.x - pc.x), Math.abs(pp.z - pc.z)) >= trailstep) {
                this.trailgeometryindex++; 
                trailgeometry.vertices[this.trailgeometryindex % trailgeometry.vertices.length].set(pc.x, pc.y - this.footminusalt, pc.z); 
                document.getElementById('testout').textContent = " :::"+this.trailgeometryindex+" "+pc.x.toFixed(0)+","+pc.y.toFixed(0)+","+pc.z.toFixed(0); 
                trailgeometry.verticesNeedUpdate = true; 
                trailgeometry.computeBoundingSphere(); 
                trailgeometry.computeBoundingBox(); 
            }
        }
        
        var trailrodsbuff = this.trailrodsbuff; 
        if (trailrodsbuff) {
            var pp = trailrodsbuff.vertices[this.trailrodsbuffindex % (trailrodsbuff.vertices.length/2)]; 
            var pc = this.cameraactualposition; 
            if (Math.max(Math.abs(pp.x - pc.x), Math.abs(pp.z - pc.z)) >= trailstep) {
                this.trailrodsbuffindex++; 
                var i = this.trailrodsbuffindex % (trailrodsbuff.vertices.length/2); 
                trailrodsbuff.vertices[i*2+1].set(pc.x, pc.y, pc.z); 
                trailrodsbuff.vertices[i*2].set(pc.x, pc.y-50, pc.z); 
                document.getElementById('testout').textContent = " :::"+this.trailgeometryindex+" "+pc.x.toFixed(0)+","+pc.y.toFixed(0)+","+pc.z.toFixed(0); 
                trailrodsbuff.verticesNeedUpdate = true; 
                trailrodsbuff.computeBoundingSphere(); 
                trailrodsbuff.computeBoundingBox(); 
            }
        }
        
        if (this.footposmesh) 
            this.footposmesh.position.set(this.cameraactualposition.x, this.cameraactualposition.y - this.footminusalt, this.cameraactualposition.z); 
        if (this.footvelocitylines)
            this.footvelocitylines.position.set(this.cameraactualposition.x, this.cameraactualposition.y - this.footminusalt, this.cameraactualposition.z); 
    }, 

    UpdateFootVelocity: function(speed, heading)
    {
        var ang = (heading+90.0)*Math.PI/180; 
        this.footvelocitybuff.vertices[1].set(Math.cos(ang)*speed, 0, Math.sin(ang)*speed); 
        this.footvelocitybuff.verticesNeedUpdate = true; 
        this.footvelocitybuff.computeBoundingSphere(); 
        this.footvelocitybuff.computeBoundingBox(); 
    }, 
    
    LoadFootpos: function(scene) 
    {
        var alt = 0, tfac = 0.5, pixsize = 0.06; 
        var vertbuff = new THREE.Float32Attribute(new Float32Array((6+4)*3), 3); 
        var indices = new Uint16Array(6+6);
        for (var i = 0; i <= 1; i++) {
            var xfac = (i == 0 ? -1 : 1); 
            vertbuff.setXYZ(i*3, 0.1*xfac*tfac, alt, 0); 
            vertbuff.setXYZ(i*3+1, 0.1*xfac*tfac, alt, -2*tfac); 
            vertbuff.setXYZ(i*3+2, 1*xfac*tfac, alt, -2*tfac); 
            indices[i*3] = i*3; 
            indices[i*3+1] = i*3+1+i; 
            indices[i*3+2] = i*3+2-i; 
            
            vertbuff.setXYZ(i*2+6, pixsize*xfac*tfac, alt, -pixsize*tfac)
            vertbuff.setXYZ(i*2+7, pixsize*xfac*tfac, alt, pixsize*tfac)
        }
        indices[6] = 6;  indices[7] = 7;  indices[8] = 9; 
        indices[9] = 6;  indices[10] = 9;  indices[11] = 8; 
        var buffergeometry = new THREE.BufferGeometry(); 
        buffergeometry.setIndex(new THREE.BufferAttribute(indices, 1)); 
        buffergeometry.addAttribute('position', vertbuff);
        this.footposmesh = new THREE.Mesh(buffergeometry, new THREE.MeshBasicMaterial({ color: 0x22FF11 }));  
        scene.add(this.footposmesh); 
        
        // velocity vector (could be an arrow, but keep the head on the origin and extend and shift the tail point!)
        this.footvelocitybuff = new THREE.Geometry(); 
        this.footvelocitybuff.vertices.push(new THREE.Vector3(0, 0, 0)); 
        this.footvelocitybuff.vertices.push(new THREE.Vector3(0, 0, 1)); 
        var footvelocitymaterial = new THREE.LineBasicMaterial({ color: 0x44FFDD, linewidth: 2/*, depthTest: false, depthWrite: false*/ }); 
        this.footvelocitylines = new THREE.LineSegments(this.footvelocitybuff, footvelocitymaterial); 
        scene.add(this.footvelocitylines); 
    },

    LoadPickPos: function(scene)
    {
        var alt = 0, tfac = 3; 
        var vertbuff = new THREE.Float32Attribute(new Float32Array(6*3), 3); 
        var indices = new Uint16Array(6);
        for (var i = 0; i <= 1; i++) {
            var xfac = (i == 0 ? -1 : 1); 
            vertbuff.setXYZ(i*3, 0.02*xfac*tfac, alt, 0); 
            vertbuff.setXYZ(i*3+1, 0.02*xfac*tfac, alt, -2*tfac); 
            vertbuff.setXYZ(i*3+2, 1*xfac*tfac, alt + i, -2*tfac); 
            indices[i*3] = i*3; 
            indices[i*3+1] = i*3+1+i; 
            indices[i*3+2] = i*3+2-i; 
        }
        var buffergeometry = new THREE.BufferGeometry(); 
        buffergeometry.setIndex(new THREE.BufferAttribute(indices, 1)); 
        buffergeometry.addAttribute('position', vertbuff);
        this.pickposmesh = new THREE.Mesh(buffergeometry, new THREE.MeshBasicMaterial({ color: "red" }));  
        scene.add(this.pickposmesh); 
    }, 


    ZhopGo: function(lhopheight) 
    {
        if (this.hopmode == 0)
            this.hopheight = lhopheight; 
        this.hopmode = (this.hopmode == 0 ? 1 : -1); 
        document.getElementById("camerahop").className = "selected"; 
        this.hoptime = clock.elapsedTime; 
    }, 

    Zhopdisplacement: function() 
    {
        if (this.hopmode === 0)
            return 0.0; 
        if (this.hopmode === 2)
            return this.hopheight; 
        if (this.hoptime === null)
            return 0.0; 
        var hsecs = clock.elapsedTime - this.hoptime; 
        if (hsecs > 2) {
            this.hoptime = null; 
            this.hopmode = (this.hopmode == 1 ? 2 : 0); 
            if (this.hopmode == 0)
                document.getElementById("camerahop").className = ""; 
            return (this.hopmode === 2 ? this.hopheight : 0); 
        }
        var x = Math.abs((hsecs-2)/2); 
        if (this.hopmode == -1)
            x = 1 - x; 
        var y = (x < 0.5 ? (1 - x*x*2) : (1 - x)*(1 - x)*2); 
        return this.hopheight*y; 
    },


    geosetdirect: function(plongitude, platitude, paltitude, paccuracy, paltitudeaccuracy) 
    { 
        this.gslatitude = platitude; 
        this.gslongitude = plongitude; 
        if (paltitude !== undefined) 
            this.gsaltitude = paltitude; 
        this.geosetdirectcount++; 
        this.SetCameraPositionG();
        this.TrailUpdate(); 
    }, 
    
    SetCameraPositionG: function()
    {
        var rlat = this.gslatitude - svxview.latp0; 
        var rlng = this.gslongitude - svxview.lngp0; 
        var ralt = this.gsaltitude - svxview.altp0; 
        var x = rlat*svxview.eyfac + rlng*svxview.exfac; 
        var y = rlat*svxview.nyfac + rlng*svxview.nxfac; 
        var z = ralt; 
        console.assert((x !== undefined) && (x !== NaN)); 
        this.cameraactualposition.set(-(x+this.gsmdisplacementx), (z+this.gsmdisplacementz), (y+this.gsmdisplacementy)); 
        if (camera !== undefined) 
            camera.position.set(this.cameraactualposition.x, this.cameraactualposition.y+this.Zhopdisplacement(), this.cameraactualposition.z); 
    }, 

    geo_success: function(position) 
    { 
        if (this.geosuccesscount == 0) {
            var earthrad = 6378137; 
            var nyfac = 2*Math.PI*earthrad/360; 
            var exfac = nyfac*Math.cos(this.gslatitude*Math.PI/180); 
            svxviewcurrentgps = { latp0: position.coords.latitude, lngp0: position.coords.longitude, altp0: position.coords.altitude, 
                                  nyfac: nyfac, nxfac: 0, eyfac: 0, exfac: exfac }; 
        }
        this.geosuccesscount++; 
        
        if (svx3d !== undefined) {
            if (this.geosuccesscountpostsvx == 0) {
                var llmax = Math.max(Math.abs(svxview.latp0 - position.coords.latitude), Math.abs(svxview.lngp0 - position.coords.longitude)); 
                var rlat = position.coords.latitude - svxview.latp0; 
                var rlng = position.coords.longitude - svxview.lngp0; 
                var dx = rlat*svxview.eyfac + rlng*svxview.exfac; 
                var dy = rlat*svxview.nyfac + rlng*svxview.nxfac; 
                var distcave = Math.sqrt(dx*dx + dy*dy)/1000; 
                console.log("distcavedistcave", distcave); 
                if (distcave > 20) {  
                    svxview = svxviewcurrentgps; 
                    quantshowshow("Moving GPS origin to the caves as dist="+distcave.toFixed(3)+"km>20km"); 
                    console.log("Moving GPS origin to the caves as dist="+distcave.toFixed(3)+"km>20km"); 
                    document.getElementById("reset31").className = "selected"; 
                    quantshowhidedelay(4500); 
                }
            }
            this.geosuccesscountpostsvx++; 
        }
        
        document.getElementById('gpsrec').textContent = "Lat:"+position.coords.latitude.toFixed(7)+" Lng:"+position.coords.longitude.toFixed(7)+
                                                        " (~"+position.coords.accuracy.toFixed(0)+"m)"+
                                                        " Alt:"+position.coords.altitude.toFixed(1)+
                                                        " (~"+position.coords.altitudeAccuracy.toFixed(0)+"m)"; 
        document.getElementById('gpsrecV').textContent = " "+(position.coords.speed|0).toFixed(1)+"m/s "+(position.coords.heading|0).toFixed(1)+"D"; 
        document.getElementById('testout2').textContent = "#"+(this.geosuccesscount); 


        if (this.footvelocitylines) 
            this.UpdateFootVelocity(position.coords.speed, position.coords.heading); 
        this.geosetdirect(position.coords.longitude, position.coords.latitude, (position.coords.altitude != 0 ? position.coords.altitude : undefined), position.coords.accuracy, position.coords.altitudeAccuracy); 
    },
    
    geo_error: function() 
    {
        this.geoerrorcount++; 
        document.getElementById('gpsrec').textContent = "gps errror"; 
        document.getElementById('testout2').textContent = "#E"+(this.geoerrorcount); 
    }
}


//var ifakegpsstart = 0, fakegpslongitude = 0.823994+0.001, fakegpslatitude = 43.033223, fakegpsaltitude = 500;  
var ifakegpsstart = 0, fakegpslongitude = 0.82225744, fakegpslatitude = 43.0327787, fakegpsaltitude = 477;  
function fakegpsgenerator()
{
    var ioffs = 30, ifac = 1.0/6; 
    var i = ioffs; 
    var x0 = Math.cos(i*ifac)*i*0.00001; 
    var y0 = -Math.sin(i*ifac)*i*0.00001; 

    i = ioffs + ifakegpsstart; 
    var x = Math.cos(i*ifac)*i*0.00001; 
    var y = -Math.sin(i*ifac)*i*0.00001; 
    
    PositionObject.geo_success({ coords: { latitude: fakegpslatitude + x - x0, longitude: fakegpslongitude + y - y0, accuracy: i*0.01, altitudeAccuracy: i*0.01+1, altitude: ((i % 31) != 6 ? fakegpsaltitude : 0.0) }}); 
    ifakegpsstart++; 
    if (ifakegpsstart < 100)
        setTimeout(fakegpsgenerator, 100); 
} 

