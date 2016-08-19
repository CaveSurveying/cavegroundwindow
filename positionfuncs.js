
var PositionObject = 
{
    fakegpsstart: [47.69278936428201, 13.820952855143327, 1877.69],  // this is at 204a entrance
    ifakegpsstart: 0, 
    bgpserror: false, 

    trailgeometry: null, 
    trailgeometryindex: 0, 
    footminusalt: 20, 
    trailpoints: null, 

    footposmesh: null, 
    pickposmesh: null, 

    fakegpsgenerator: function()
    {
        var ioffs = 100, ifac = 1.0/600; 
        var i = ioffs; 
        var x0 = Math.cos(i*ifac)*i*0.00001; 
        var y0 = -Math.sin(i*ifac)*i*0.00001; 

        i = ioffs + ifakegpsstart; 
        var x = Math.cos(i*ifac)*i*0.00001; 
        var y = -Math.sin(i*ifac)*i*0.00001; 
        
        this.geo_success({ coords: { latitude: this.fakegpsstart[0] + x - x0, longitude: this.fakegpsstart[1] + y - y0, accuracy: i*0.01, altitudeAccuracy: i*0.01+1, altitude: ((i % 31) != 6 ? this.fakegpsstart[2] : 0.0) }}); 
        this.ifakegpsstart++; 
        if (this.ifakegpsstart < 100)
            setTimeout(this.fakegpsgenerator, 1000); 
    }, 

    LoadTrailRods: function(scene)
    {
        this.trailrodsbuff = new THREE.Geometry(); 
        this.trailrodsbuffindex = 0; 
        for (var i = 0; i < 50; i++) {
            this.trailrodsbuff.vertices.push(new THREE.Vector3(camera.position.x, 0, camera.position.z)); 
            this.trailrodsbuff.vertices.push(new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z)); 
        }
        var trailrodsmaterial = new THREE.LineDashedMaterial({ color: 0x555555, linewidth: 1, gapSize:10 }); 
        this.trailrods = new THREE.LineSegments(this.trailrodsbuff, trailrodsmaterial); 
        scene.add(this.trailrods); 
    },

    LoadTrail: function(scene) 
    {
        this.trailgeometry = new THREE.Geometry();
        //var p = latlngtopt(svxents[i][1], svxents[i][2], svxents[i][3]); 
        var p = new THREE.Vector3(camera.position.x, camera.position.y - this.footminusalt, camera.position.z); 
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
            var pc = camera.position; 
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
            var pc = camera.position; 
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
        
        if (this.footposmesh) {
            this.footposmesh.position.set(camera.position.x, camera.position.y - this.footminusalt, camera.position.z); 
        }
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




    geo_set: function(platitude, plongitude, paltitude, paccuracy, paltitudeaccuracy) 
    { 
        this.bgpserror = false; 
        latG = platitude; 
        lngG = plongitude; 
        if (paltitude != 0.0) 
            altG = paltitude; 
        if ((latR === 0) && (altG != 0.0)) {
            var llmax = Math.max(Math.abs(latG - lat0), Math.abs(lngG - lng0)); 
            if (llmax > 0.1) {  
                latR = latG - lat0; 
                lngR = lngG - lng0; 
                altR = altG - alt0; 
                quantshowshow("Moving GPS origin to the caves d>"+llmax.toFixed(3)+"deg"); 
                console.log("Moving GPS origin to the caves d>"+llmax+"deg"); 
                quantshowhidedelay(4500); 
            }
        }
        
        document.getElementById('gpsrec').textContent = "Lat:"+latG.toFixed(7)+" Lng:"+lngG.toFixed(7)+
                                                        " (~"+paccuracy.toFixed(0)+"m)"+
                                                        " Alt:"+paltitude.toFixed(1)+
                                                        " (~"+paltitudeaccuracy.toFixed(0)+"m)"; 
        //document.getElementById('speed').textContent = position.coords.speed.toFixed(2); 
        //document.getElementById('heading').textContent = position.coords.heading.toFixed(0); 
        this.SetCameraPositionG();
    }, 
    
    SetCameraPositionG: function()
    {
        var pc = latlngtopt(latG - latR, lngG - lngR, altG - altR); 
        camera3JSAlt = pc.y; 
        camera.position.set(pc.x, pc.y, pc.z); 
        this.TrailUpdate(); 
    }, 

    geosetcount: 0,
    geo_success: function(position) 
    { 
        this.bgpserror = false; 

        // use valley entrance settings calculated as follows from the SVX fix positions
        // cs = "CS +proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=100000 +y_0=-500000 +ellps=airy +datum=OSGB36 +units=m +no_defs"
        // proj = pyproj.Proj(cs)
        // lng, lat = proj(77407.244, 69907.233, inverse=True)

        var latVentReal = 54.195764; lngVentReal = -2.4627084; 
        var latVentCalc = 54.124351228332046; lngVentCalc = -2.3457319933824166;   
        var altVentDispl = 47; 
        
        this.geo_set(position.coords.latitude - latVentReal + latVentCalc, 
                     position.coords.longitude - lngVentReal + lngVentCalc, 
                     position.coords.altitude - altVentDispl, 
                     position.coords.accuracy, position.coords.altitudeAccuracy); 
        document.getElementById('gpsrecV').textContent = " "+(position.coords.speed|0).toFixed(1)+"m/s "+(position.coords.heading|0).toFixed(1)+"D"; 
        document.getElementById('testout2').textContent = "#"+(this.geosetcount++)+"#"+position.coords.altitude; 
    },
    
    geoerrcount: 0,
    geo_error: function() 
    {
        this.bgpserror = true; 
        document.getElementById('gpsrec').textContent = "gps errror"; 
        document.getElementById('testout2').textContent = "#E"+(this.geoerrcount++); 
    }
}


