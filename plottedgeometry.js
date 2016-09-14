
var PlotGeometryObject = 
{
    // filled in externally
    scene: null,   
    
    peaktrianglematerial: null, 
    peaktriangles: null,

    centrelinematerial: null, 
    centrelinebuffergeometry: null,  
    centrelines: null,
    minyearvalue: 9999.0, 
    maxyearvalue: 9999.0, 
    altminF: 0, 
    altmaxF: 0, 
    vfac:0.003972, 
    redalt: 0.894682,
    lightvx: 0.2, lightvy: 0.1, lightvz: Math.sqrt(1 - (0.2*0.2 + 0.1*0.1)), 

    enttrianglematerial: null,
    entgeometry: null, 
    entlabelscard: null, 
    entriangles: null,

    passagetubematerial: null,
    passagetubes: null, 
    
    textlabelmaterials: [ ], 

    MakeLabel: function(card, text, fillstyle, p, scale)
    {
        var canvas1 = document.createElement('canvas');
        canvas1.width = 256;  canvas1.height = 32; 
        var context1 = canvas1.getContext('2d');
        context1.font = "28px Helvetica";
        context1.fillStyle = fillstyle;
        context1.fillText(text, 0, 20); 

    // this one we can highlight it individually with a selection boolean
        var texture1 = new THREE.Texture(canvas1);  
        texture1.needsUpdate = true; 
        var textlabelmaterial = new THREE.ShaderMaterial({
            uniforms: { pixelsize: {type: 'f', value: 1.2}, 
                        aspect: { type: 'f', value: 1.0 },
                        textureaspect: { type: 'f', value: canvas1.width/canvas1.height }, 
                        texture: { value: texture1 },
                        closedist: { type: 'f', value: 5.0 },  
                        bselindex: { type: 'f', value: 0.0 },
                        redalt: { type: 'f', value: this.redalt },   // shouldn't be here
                        vfac: { type: 'f', value: this.vfac } 
                      }, 
            vertexShader: getshader('vertex_shader_textlabel'),
            fragmentShader: getshader('fragment_shader_textlabel'), 
            depthWrite:true, depthTest:true, 
            side: THREE.DoubleSide
        }); 
        this.textlabelmaterials.push(textlabelmaterial); 

        var textlabelpositionsbuff = new THREE.BufferAttribute(new Float32Array(4*3), 3);
        var textlabeluvsbuff = new THREE.BufferAttribute(new Float32Array(4*2), 2);
        for (var i = 0; i < 4; i++) {
            textlabelpositionsbuff.setXYZ(i, p.x, p.y, p.z); 
            textlabeluvsbuff.setXY(i, ((i == 0) || (i == 2) ? 0.0 : 1.0), (i <= 1 ? 0.0 : 1.0)); 
        }
        var indices = new Uint16Array(6);
        indices[0] = 0; indices[1] = 1; indices[2] = 2; 
        indices[3] = 1; indices[4] = 3; indices[5] = 2; 
        var buffergeometry = new THREE.BufferGeometry(); 
        buffergeometry.setIndex(new THREE.BufferAttribute(indices, 1));
        buffergeometry.addAttribute('position', textlabelpositionsbuff);
        buffergeometry.addAttribute('uv', textlabeluvsbuff);
        mesh1 = new THREE.Mesh(buffergeometry, textlabelmaterial); 
        card.add(mesh1);
    },
    
    LoadMountains: function(landmarks, svxscaleInv)
    {
        if (landmarks.length == 0)  return; 
        var peakpositionbuff = new THREE.BufferAttribute(new Float32Array(landmarks.length*9), 3); 
        var peakcorner = new Float32Array(landmarks.length*3); 
        
        var card = new THREE.Object3D();
        for (var i = 0; i < landmarks.length; i++) {
            var landmark = landmarks[i]; 
            var xl = -landmark[1]*svxscaleInv, yl=landmark[3]*svxscaleInv, zl=landmark[2]*svxscaleInv; 
            peakpositionbuff.setXYZ(i*3, xl, yl, zl);  peakpositionbuff.setXYZ(i*3+1, xl, yl, zl);  peakpositionbuff.setXYZ(i*3+2, xl, yl, zl); 
            peakcorner[i*3] = 0.0;  peakcorner[i*3+1] = 1.0;  peakcorner[i*3+2] = 2.0; 
            this.MakeLabel(card, landmarks[i][0], "rgba(255,255,255,0.95)", {x:xl, y:yl, z:zl}, 10); 
        }
        this.scene.add(card);
        
        var buffergeometry = new THREE.BufferGeometry(); 
        buffergeometry.addAttribute('position', peakpositionbuff); 
        buffergeometry.addAttribute('pcorner', new THREE.BufferAttribute(peakcorner, 1)); 
        this.peaktrianglematerial = new THREE.ShaderMaterial({
            uniforms: { trianglesize: {type: 'f', value: 15.0}, 
                        aspect: { type: 'f', value: 1.0 }
                      }, 
            vertexShader: getshader('vertex_shader_peaktriangle'),
            depthWrite:true, depthTest:true, // how is the colour being set to red??
            side: THREE.DoubleSide
        }); 
        
        this.peaktriangles = new THREE.Mesh(buffergeometry, this.peaktrianglematerial);  
        this.scene.add(this.peaktriangles); 
    }, 
    
    LoadCentrelines: function(legnodes, legindexes, svxscaleInv)
    {
        this.centrelinematerial = new THREE.ShaderMaterial({
            uniforms: { closedist: { type: 'f', value: 5.0 }, 
                        selindexlo: { type: 'f', value: -1.0 }, 
                        selindexhi: { type: 'f', value: -1.0 }, 
                        redalt: { type: 'f', value: this.redalt },
                        vfac: { type: 'f', value: this.vfac } 
                      }, 
            vertexShader: getshader('vertex_shader_centreline'),
            fragmentShader: getshader('fragment_shader_centreline'), 
            depthWrite:true, depthTest:true,  // not sure these work
            linewidth:3 
        });
        
        var nlegs = legindexes.length/2; 
        var centrelinepositionsbuff = new THREE.BufferAttribute(new Float32Array(nlegs*2*3), 3);
        var cosslope = new Float32Array(nlegs*2); 
        var legindex = new Float32Array(nlegs*2); 

        for (var i = 0; i < nlegs; i++) {
            var i0 = legindexes[i*2]*3; 
            var i1 = legindexes[i*2+1]*3; 
            var x0 = -legnodes[i0]*svxscaleInv, y0=legnodes[i0+2]*svxscaleInv, z0=legnodes[i0+1]*svxscaleInv; 
            var x1 = -legnodes[i1]*svxscaleInv, y1=legnodes[i1+2]*svxscaleInv, z1=legnodes[i1+1]*svxscaleInv; 
            
            centrelinepositionsbuff.setXYZ(i*2, x0, y0, z0); 
            centrelinepositionsbuff.setXYZ(i*2+1, x1, y1, z1); 
            var dx = x1 - x0, dy = y1 - y0, dz = z1 - z0; 
            var lcosslope = Math.cos(Math.atan2(dy, Math.sqrt(dx*dx + dz*dz))); 
            cosslope[i*2] = lcosslope; 
            cosslope[i*2+1] = lcosslope; 
            
            legindex[i*2] = i; 
            legindex[i*2+1] = i; 
            
            if ((i == 0) || (this.altminF > legnodes[i0+2]))
                this.altminF = legnodes[i0+2]; 
            if ((this.altminF > legnodes[i1+2]))
                this.altminF = legnodes[i1+2]; 
            if ((i == 0) || (this.altmaxF < legnodes[i1+2]))
                this.altmaxF = legnodes[i0+2]; 
            if ((this.altmaxF < legnodes[i1+2]))
                this.altmaxF = legnodes[i1+2]; 
        }
        console.log("altminmax", this.altminF*svxscaleInv, this.altmaxF*svxscaleInv); 
        this.vfac = 0.9/((this.altmaxF - this.altminF)*svxscaleInv); 
        this.redalt = (0.5 - this.altmaxF*svxscaleInv*this.vfac) % 1; 
        
        this.centrelinebuffergeometry = new THREE.BufferGeometry(); 
        this.centrelinebuffergeometry.addAttribute('position', centrelinepositionsbuff);
        this.centrelinebuffergeometry.addAttribute('cosslope', new THREE.BufferAttribute(cosslope, 1)); 
        this.centrelinebuffergeometry.addAttribute('legindex', new THREE.BufferAttribute(legindex, 1)); 

        this.centrelines = new THREE.LineSegments(this.centrelinebuffergeometry, this.centrelinematerial);  
        this.scene.add(this.centrelines); 
    },
    
// vertex_shader_enttriangle
    LoadEntrances: function(legnodes, legentrances, svxscaleInv)
    {
        var nentrances = legentrances.length/3; 
        var entpositionbuff = new THREE.BufferAttribute(new Float32Array(nentrances*9), 3); 
        var entcorner = new Float32Array(nentrances*3); 
        var entindex = new Float32Array(nentrances*3); 
        
        this.entgeometry = new THREE.BufferGeometry(); 
        this.entgeometry.addAttribute('position', entpositionbuff); 
        this.entgeometry.addAttribute('pcorner', new THREE.BufferAttribute(entcorner, 1)); 
        this.entgeometry.addAttribute('entindex', new THREE.BufferAttribute(entindex, 1)); 
        this.enttrianglematerial = new THREE.ShaderMaterial({
            uniforms: { trianglesize: {type: 'f', value: 10.0}, 
                        aspect: { type: 'f', value: 1.0 }, 
                        closedist: { type: 'f', value: 5.0 }, 
                        selindexlo: { type: 'f', value: -1.0 }, 
                        selindexhi: { type: 'f', value: -1.0 }, 
                        redalt: { type: 'f', value: this.redalt },
                        vfac: { type: 'f', value: this.vfac } 
                      }, 
            vertexShader: getshader('vertex_shader_enttriangle'),
            fragmentShader: getshader('fragment_shader_centreline'), 
            depthWrite:true, depthTest:true, 
            side: THREE.DoubleSide
        }); 
        this.enttriangles = new THREE.Mesh(this.entgeometry, this.enttrianglematerial);  
        this.scene.add(this.enttriangles); 

        this.entlabelscard = new THREE.Object3D();
        for (var i = 0; i < nentrances; i++) {
            var i1 = legentrances[i*3+0]*3;  // node index
            var x1 = -legnodes[i1]*svxscaleInv, y1=legnodes[i1+2]*svxscaleInv, z1=legnodes[i1+1]*svxscaleInv; 
            var p = {x:x1, y:y1, z:z1}; 
            entpositionbuff.setXYZ(i*3, p.x, p.y, p.z);  entpositionbuff.setXYZ(i*3+1, p.x, p.y, p.z);  entpositionbuff.setXYZ(i*3+2, p.x, p.y, p.z); 
            entcorner[i*3] = 0.0;  entcorner[i*3+1] = 1.0;  entcorner[i*3+2] = 2.0; 
            entindex[i*3] = i; entindex[i*3+1] = i; entindex[i*3+2] = i;
            this.MakeLabel(this.entlabelscard, legentrances[i*3+1], "rgba(0,200,200,0.95)", p, 0.5);  // rgba(0,200,200,0.95)
        }
        this.scene.add(this.entlabelscard);
    },

    LoadPassageTubesP: function(cumupassagexcsseq, xcs, svxscaleInv) 
    {
        var nxcs = cumupassagexcsseq[cumupassagexcsseq.length - 1]; 
        console.assert(xcs.length == nxcs*3*4); 
        this.passagetubematerial = new THREE.ShaderMaterial({
            uniforms: { closedist: { type: 'f', value: 5.0 },  
                        selindexlo: { type: 'f', value: -1.0 }, 
                        selindexhi: { type: 'f', value: -1.0 }, 
                        redalt: { type: 'f', value: this.redalt },
                        vfac: { type: 'f', value: this.vfac } 
                      }, 
            vertexShader: getshader('vertex_shader_passage'),
            fragmentShader: getshader('fragment_shader_passage'), 
            wireframe: false, 
            depthWrite:true, depthTest:true 
        });
        
        var nnodes = xcs.length/3; 
        var flatfaceattributes = new Float32Array(nnodes*4); 
        var ssgvertbuff = new THREE.Float32Attribute(new Float32Array(nnodes*3), 3); 
        var passageindex = new Float32Array(nnodes); 
        for (var i = 0; i < nnodes; i++) {
            ssgvertbuff.setXYZ(i, -xcs[i*3]*svxscaleInv, xcs[i*3+2]*svxscaleInv, xcs[i*3+1]*svxscaleInv); 
            passageindex[i] = i/4|0;  // int value for index of the xsection
        }
        
        var ntris = (4*nxcs - 2*cumupassagexcsseq.length)*2; // 4 quads between pairs of xcs plus endcaps
        var indices = new Uint16Array(ntris*3); 
        
        var iquad = 0; 
        var AddQuad = function(q0, q1, q2, q3, iflat) {
            indices[iquad*6] = q0; 
            indices[iquad*6+1] = q2; 
            indices[iquad*6+2] = q1; 
            indices[iquad*6+3] = q0; 
            indices[iquad*6+4] = q3; 
            indices[iquad*6+5] = q2; 
            if (iflat != 0) {
                var ax = ssgvertbuff.getX(q1) - ssgvertbuff.getX(q0), ay = ssgvertbuff.getY(q1) - ssgvertbuff.getY(q0), az = ssgvertbuff.getZ(q1) - ssgvertbuff.getZ(q0); 
                var bx = ssgvertbuff.getX(q2) - ssgvertbuff.getX(q0), by = ssgvertbuff.getY(q2) - ssgvertbuff.getY(q0), bz = ssgvertbuff.getZ(q2) - ssgvertbuff.getZ(q0); 
                var cx = ay*bz - by*az, cy = -ax*bz + bx*az, cz = ax*by - bx*ay; 
                var cleng = Math.sqrt(cx*cx + cy*cy + cz*cz); 
                var cdot = Math.min(Math.abs(PlotGeometryObject.lightvx*cx + PlotGeometryObject.lightvy*cz + PlotGeometryObject.lightvz*cy)/cleng, 1.0); 
                //cdot = Math.random(); 
                var cosfac = (1 - cdot)*0.4; 
                var flatval = (iflat>0 ? 510+cosfac : -510-cosfac); 
                var lflatel = (iflat>0?iflat:-iflat)-1; 
                flatfaceattributes[q0*4+lflatel] = flatval; 
                flatfaceattributes[q1*4+lflatel] = flatval; 
                flatfaceattributes[q2*4+lflatel] = flatval; 
                flatfaceattributes[q3*4+lflatel] = flatval; 
            }
            iquad++; 
        }
        
        for (var j = 0; j < cumupassagexcsseq.length; j++) {
            var k = (j != 0 ? cumupassagexcsseq[j-1] : 0)*4; 
            var passagexcsseqj = cumupassagexcsseq[j] - (j != 0 ? cumupassagexcsseq[j-1] : 0); 
            AddQuad(k+0, k+1, k+2, k+3, 2); 
            for (var l = 0; l < passagexcsseqj-1; l++) {
                k += 4; 
                var l1 = (l%2 + 1)*(Math.floor(l/2)%2 == 0?1:-1);
                var l2 = (l%2 + 3)*(Math.floor(l/2)%2 == 0?1:-1);
                AddQuad(k+0, k+1, k-4+1, k-4+0, l1); 
                AddQuad(k+1, k+2, k-4+2, k-4+1, l2);
                AddQuad(k+2, k+3, k-4+3, k-4+2, -l1);
                AddQuad(k+3, k+0, k-4+0, k-4+3, -l2);
            }
            AddQuad(k+3, k+2, k+1, k+0, (passagexcsseqj%2 + 2)); 
            k += 4; 
        }
        console.assert(iquad == (4*nxcs - 2*cumupassagexcsseq.length)); 
        
        var buffergeometry = new THREE.BufferGeometry(); 
        buffergeometry.setIndex(new THREE.BufferAttribute(indices, 1)); 
        buffergeometry.addAttribute('position', ssgvertbuff);
        buffergeometry.addAttribute('flat4', new THREE.Float32Attribute(flatfaceattributes, 4));  // goes into vec4
        buffergeometry.addAttribute('passageindex', new THREE.Float32Attribute(passageindex, 1)); 

        //this.passagetubematerial = new THREE.MeshBasicMaterial({ color: 0xDD44EE, shading: THREE.FlatShading, depthWrite:true, depthTest:true }); 
        this.passagetubes = new THREE.Mesh(buffergeometry, this.passagetubematerial);  
        this.scene.add(this.passagetubes); 
    }, 

    resizeP: function(width, height)
    {
        var aspect = width / height;
        if (this.peaktrianglematerial) {
            this.peaktrianglematerial.uniforms.aspect.value = aspect; 
            this.peaktrianglematerial.uniforms.trianglesize.value = 50/width; 
        }
        for (var i = 0; i < this.textlabelmaterials.length; i++) {
            this.textlabelmaterials[i].uniforms.aspect.value = aspect; 
            this.textlabelmaterials[i].uniforms.pixelsize.value = 60/width; 
        }
        if (this.enttrianglematerial) {
            this.enttrianglematerial.uniforms.aspect.value = aspect; 
            this.enttrianglematerial.uniforms.trianglesize.value = 5/width; 
        }
    },
    setredalts: function(redalt, vfac)
    {
        if (this.passagetubematerial) {
            this.passagetubematerial.uniforms.redalt.value = redalt; 
            this.passagetubematerial.uniforms.vfac.value = vfac; 
        }
        for (var i = 0; i < this.textlabelmaterials.length; i++) {
            this.textlabelmaterials[i].uniforms.redalt.value = redalt; 
            this.textlabelmaterials[i].uniforms.vfac.value = vfac; 
        }
        if (this.centrelinematerial) {
            this.centrelinematerial.uniforms.redalt.value = redalt; 
            this.centrelinematerial.uniforms.vfac.value = vfac; 
        }
        if (this.enttrianglematerial) {
            this.enttrianglematerial.uniforms.redalt.value = redalt; 
            this.enttrianglematerial.uniforms.vfac.value = vfac; 
        }
    },

    setclosedistvalueP: function(closedistvalue)
    {
        if (this.centrelinematerial) 
            this.centrelinematerial.uniforms.closedist.value = closedistvalue; 
        if (this.passagetubematerial) 
           this.passagetubematerial.uniforms.closedist.value = closedistvalue; 
        for (var i = 0; i < this.textlabelmaterials.length; i++) 
            this.textlabelmaterials[i].uniforms.closedist.value = closedistvalue; 
        if (this.enttrianglematerial) 
            this.enttrianglematerial.uniforms.closedist.value = closedistvalue; 
    }, 

    togglelabels: function(event) {
        if (this.entlabelscard)
            this.entlabelscard.visible = !this.entlabelscard.visible; 
        PositionObject.footposmesh.visible = !PositionObject.footposmesh.visible; 
        document.getElementById("labelsonoff").className = (PositionObject.footposmesh.visible ? "" : "selected"); 
    }, 
    togglepassages: function(event) {
        this.passagetubes.visible = !this.passagetubes.visible; 
        document.getElementById("passagesonoff").className = (this.passagetubes.visible ? "" : "selected"); 
    }
    
};

