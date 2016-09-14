
// selection procedure that will batchwise look for an intersection clicked
// should be in its own object
var PickingObject = {
    
    minisvxents: -1, 
    minsvxentdsq: -1, 
    isvxents: 0, 
    
    vStart: new THREE.Vector3(), 
    vEnd: new THREE.Vector3(), 
    selectbatchproctimeout: null, 
    selectposx: 0, 
    selectposy: 0,
    pickray: new THREE.Raycaster(), 
    
    
    selectbatchproc: function()
    {
        // starting off condition
        if (this.selectbatchproctimeout == null) {
            this.isvxents = 0; 
            this.minisvxents = -1; 
            this.minsvxentdsq = -1; 
            this.selectbatchproctimeout = setTimeout(this.selectbatchproc.bind(this), 10); 
            return; 
        } else {
            this.selectbatchproctimeout = null; 
        }
        
        // batch of elements to work through
        for (var j = 501; j > 0; j--) { 
            
            // bail out if entrance found that is close enough
            if ((this.isvxents == svx3d.nentrances) && (this.minsvxentdsq != -1)) {
                var pix2dist = Math.sqrt(this.minsvxentdsq)*window.innerHeight; 
                if (pix2dist <= 60)
                    break; 
            }
            
            // find closest entrance position
            if (this.isvxents < svx3d.nentrances) {
                this.vStart.fromArray(PlotGeometryObject.entgeometry.attributes.position.array, this.isvxents*9);
                this.vStart.project(PlotGraphics.camera); 
                if (this.vStart.z > 0.0) {
                    var dx = (this.vStart.x - this.selectposx)*PlotGraphics.camera.aspect
                    var dy = this.vStart.y - this.selectposy; 
                    var dsq = dx*dx + dy*dy; 
                    if ((this.minisvxents == -1) || (dsq < this.minsvxentdsq)) {
                        this.minsvxentdsq = dsq; 
                        this.minisvxents = this.isvxents; 
                    }
                }
                
            // find closest leg position
            } else if (this.isvxents < svx3d.nentrances + svx3d.nlegs) {
                var i = this.isvxents - svx3d.nentrances; 
                this.vStart.fromArray(PlotGeometryObject.centrelinebuffergeometry.attributes.position.array, i*6);
                this.vEnd.fromArray(PlotGeometryObject.centrelinebuffergeometry.attributes.position.array, i*6+3);
                this.vStart.project(PlotGraphics.camera); 
                this.vEnd.project(PlotGraphics.camera); 
                if ((this.vStart.z > 0.0) && (this.vEnd.z > 0.0)) {
                    var dx = (this.selectposx - this.vStart.x)*PlotGraphics.camera.aspect; 
                    var dy = this.selectposy - this.vStart.y; 
                    var vx = (this.vEnd.x - this.vStart.x)*PlotGraphics.camera.aspect; 
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
        
        // callback for next batch
        if (j == 0) {
            this.selectbatchproctimeout = setTimeout(this.selectbatchproc.bind(this), 10); 
            return; 
        } 
        
        // derive the blockname
        var blockname = null, selblockname = null; 
        if (this.minsvxentdsq >= 0) {
            var pix2dist = Math.sqrt(this.minsvxentdsq)*window.innerHeight; 
            if (pix2dist <= 80) {
                if (this.minisvxents < svx3d.nentrances) {
                    blockname = svx3d.legentrances[this.minisvxents*3+1]; 
                    selblockname = svx3d.legentrances[this.minisvxents*3+2]; 
                } else if (this.minisvxents < svx3d.nentrances + svx3d.nlegs) {
                    for (var j = 1; j < svx3d.legblockstarts.length; j++) {
                        if (svx3d.legblockstarts[j] >= this.minisvxents - svx3d.nentrances) {
                            blockname = svx3d.blocknames[j-1]; 
                            selblockname = blockname; 
                            break; 
                        }
                    }
                        
                }
            }
        }

        if (blockname !== null) {
            console.log("blockname", blockname); 
            if (this.minisvxents < svx3d.nentrances)
                quantshowtextelement.textContent = "Entrance of:"+blockname+" sel:"+selblockname; 
            else
                quantshowtextelement.textContent = "Block of: "+blockname; 
            quantshowhidedelay(5000); 
        }
        this.setselectedblock(selblockname); 
    },
     
    selecteffort: function(px, py, sesource)
    {
        quantshowshow("SELECT("+px+","+py+") "+sesource); 
        this.selectposx = (px/window.innerWidth)*2 - 1; 
        this.selectposy = -(py/window.innerHeight)*2 + 1; 
        this.pickray.setFromCamera({x:this.selectposx, y:this.selectposy}, PlotGraphics.camera); 
        var ray = this.pickray.ray; 
        var rfac = 150.0; 
        if (PositionObject.pickposmesh) {
            PositionObject.pickposmesh.position.set(ray.origin.x + ray.direction.x*rfac, ray.origin.y + ray.direction.y*rfac, ray.origin.z + ray.direction.z*rfac); 
            console.log(PositionObject.pickposmesh.position, "f", PositionObject.footposmesh.position); 
        }
        this.selectbatchproc(); 
    }, 

    setselectedblock: function(blockname)
    {
        var blocknamedot = blockname+"."; 
        var matchblockname = function(bn) { return ((bn == blockname) || (bn.substring(0, blocknamedot.length) == blocknamedot)); }
            
        var bselindexlo = 0; 
        while ((bselindexlo < svx3d.blocknames.length) && !matchblockname(svx3d.blocknames[bselindexlo]))
            bselindexlo++; 
        var bselindexhi = bselindexlo; 
        while ((bselindexhi < svx3d.blocknames.length) && matchblockname(svx3d.blocknames[bselindexhi]))
            bselindexhi++; 
            
        PlotGeometryObject.centrelinematerial.uniforms.selindexlo.value = svx3d.legblockstarts[bselindexlo]; 
        PlotGeometryObject.centrelinematerial.uniforms.selindexhi.value = svx3d.legblockstarts[bselindexhi]; 

console.log("setselblock ", blockname, bselindexlo, bselindexhi, svx3d.legblockstarts[bselindexlo], svx3d.legblockstarts[bselindexhi]); 
        if (svx3d.xsectblockstarts !== undefined) {
            var bselxsecindexlo = svx3d.xsectblockstarts[bselindexlo]; 
            var bselxsecindexhi = svx3d.xsectblockstarts[bselindexhi]; 
            PlotGeometryObject.passagetubematerial.uniforms.selindexlo.value = (bselxsecindexlo != 0 ? svx3d.cumupassagexcsseq[bselxsecindexlo - 1] : 0); 
            PlotGeometryObject.passagetubematerial.uniforms.selindexhi.value = (bselxsecindexhi != 0 ? svx3d.cumupassagexcsseq[bselxsecindexhi - 1] : 0); 
console.log("selxsec ", bselxsecindexlo, bselxsecindexhi, PlotGeometryObject.passagetubematerial.uniforms.selindexlo.value, PlotGeometryObject.passagetubematerial.uniforms.selindexhi.value); 
        }
        
        if (svx3d.legentrances !== undefined) {
            var bentselindexlo = 0; 
            while ((bentselindexlo < svx3d.nentrances) && !matchblockname(svx3d.legentrances[bentselindexlo*3+2]))
                bentselindexlo++; 
            var bentselindexhi = bentselindexlo; 
console.log("entsec", bentselindexlo); 
            while ((bentselindexhi < svx3d.nentrances) && matchblockname(svx3d.legentrances[bentselindexhi*3+2]))
                bentselindexhi++;
console.log("entsec", bentselindexlo, bentselindexhi); 
            if ((bentselindexlo < svx3d.nentrances) && (svx3d.legentrances[bentselindexlo*3+2] == "")) {
                console.log("no matching blockname for this entrance"); 
                bentselindexlo = -1; bentselindexhi = -1
            }
            PlotGeometryObject.enttrianglematerial.uniforms.selindexlo.value = bentselindexlo; 
            PlotGeometryObject.enttrianglematerial.uniforms.selindexhi.value = bentselindexhi; 
        }
        
        for (var i = 0; i < svx3d.nentrances; i++) 
            PlotGeometryObject.textlabelmaterials[i+svx3d.landmarks.length].uniforms.bselindex.value = (((i >= bentselindexlo) && (i < bentselindexhi)) ? 1.0 : 0.0); 

    }
    
}; 



