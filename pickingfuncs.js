
// selection procedure that will batchwise look for an intersection clicked
// should be in its own object
var PickingObject = {
    
    isvxents: 0, 
    minisvxents: -1, 
    minsvxentdsq: -1, 
    vStart: new THREE.Vector3(), 
    vEnd: new THREE.Vector3(), 
    selectbatchproctimeout: null, 
    selectposx: 0, 
    selectposy: 0,
    pickray: new THREE.Raycaster(), 
    selectbatchproc: function()
    {
        if (this.selectbatchproctimeout == null) {
            this.isvxents = 0; 
            this.minisvxents = -1; 
            this.minsvxentdsq = -1; 
            this.selectbatchproctimeout = setTimeout(this.selectbatchproc.bind(this), 10); 
            return; 
        } else {
            this.selectbatchproctimeout = null; 
        }
        
        for (var j = 501; j > 0; j--) { // batch in this callback to work through
            if ((this.isvxents == svxents.length) && (this.minsvxentdsq != -1)) {
                var pix2dist = Math.sqrt(this.minsvxentdsq)*window.innerHeight; 
                if (pix2dist <= 60)
                    break; 
            }
            if (this.isvxents < svxents.length) {
                this.vStart.fromArray(entgeometry.attributes.position.array, this.isvxents*9);
                //var dsq = pickray.ray.distanceSqToPoint(vStart); 
                this.vStart.project(camera); 
                if (this.vStart.z > 0.0) {
                    var dx = (this.vStart.x - this.selectposx)*camera.aspect
                    var dy = this.vStart.y - this.selectposy; 
                    var dsq = dx*dx + dy*dy; 
                    if ((this.minisvxents == -1) || (dsq < this.minsvxentdsq)) {
                        this.minsvxentdsq = dsq; 
                        this.minisvxents = this.isvxents; 
                        this.vEnd.fromArray(entgeometry.attributes.position.array, this.isvxents*9);
                    }
                }
            } else if (this.isvxents < svxents.length + svxlegs.length) {
                var i = this.isvxents - svxents.length; 
                this.vStart.fromArray(centrelinebuffergeometry.attributes.position.array, i*6);
                this.vEnd.fromArray(centrelinebuffergeometry.attributes.position.array, i*6+3);
                this.vStart.project(camera); 
                this.vEnd.project(camera); 
                if ((this.vStart.z > 0.0) && (this.vEnd.z > 0.0)) {
                    var dx = (this.selectposx - this.vStart.x)*camera.aspect; 
                    var dy = this.selectposy - this.vStart.y; 
                    var vx = (this.vEnd.x - this.vStart.x)*camera.aspect; 
                    var vy = this.vEnd.y - this.vStart.y; 
                    var vsq = vx*vx + vy*vy; 
                    var ddv = dx*vx + dy*vy; 
                    var lam = (((ddv <= 0) || (vsq == 0)) ? 0 : (ddv > vsq ? 1.0 : ddv/vsq)); 
                    var ex = dx - vx*lam; 
                    var ey = dy - vy*lam; 
                    var esq = ex*ex + ey*ey; 
                    if ((this.minisvxents == -1) || (esq < this.minsvxentdsq)) {
                        this.minsvxentdsq = esq; 
                        this.minisvxents = this.isvxents; 
                    }
                }
            } else {
                break; 
            }
            this.isvxents++; 
        }
        if (j == 0) {
            this.selectbatchproctimeout = setTimeout(this.selectbatchproc.bind(this), 10); 
            //console.log("batch", isvxents); 
            return; 
        } 
        var ni = -1; 
        if (this.minsvxentdsq >= 0) {
            var pix2dist = Math.sqrt(this.minsvxentdsq)*window.innerHeight; 
            if (pix2dist <= 80) {
                if (this.minisvxents < svxents.length) {
                    quantshowtextelement.textContent = "Entrance of: "+svxents[this.minisvxents][0]; 
                    quantshowhidedelay(5000); 
                    ni = svxents[this.minisvxents][4]; 
                } else if (this.minisvxents < svxents.length + svxlegs.length) {
                    var ni = svxlegs[this.minisvxents - svxents.length][6]; 
                    if (ni >= 0) {
                        quantshowtextelement.textContent = "Cave: "+svxnames[ni]; 
                        quantshowhidedelay(5000); 
                    }
                }
                console.log("pix2dist", pix2dist, ni); 
            }
        }
        this.setselectedindex(ni); 
    },
     
    selecteffort: function(px, py, sesource)
    {
        quantshowshow("SELECT"+px+" "+py+" "+sesource); 
        this.selectposx = (px/window.innerWidth)*2 - 1; 
        this.selectposy = -(py/window.innerHeight)*2 + 1; 
        this.pickray.setFromCamera({x:this.selectposx, y:this.selectposy}, camera); 
        var ray = this.pickray.ray; 
        var rfac = 150.0; 
        if (PositionObject.pickposmesh) {
            PositionObject.pickposmesh.position.set(ray.origin.x + ray.direction.x*rfac, ray.origin.y + ray.direction.y*rfac, ray.origin.z + ray.direction.z*rfac); 
            console.log(PositionObject.pickposmesh.position, "f", PositionObject.footposmesh.position); 
        }
        this.selectbatchproc(); 
    }, 

    setselectedindex: function(selectedvsvxcaveindex)
    {
        centrelinematerial.uniforms.selectedvsvxcaveindex.value = selectedvsvxcaveindex; 
        enttrianglematerial.uniforms.selectedvsvxcaveindex.value = selectedvsvxcaveindex; 
        //for (var i = 0; i < textlabelmaterials.length; i++) 
        //    textlabelmaterials[i].uniforms.closedist.value = closedistvalue; 
    }
}; 
