
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

    enttrianglematerial: null,
    entgeometry: null, 
    entlabelscard: null, 

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
                        closecolour: { type: 'v4', value: new THREE.Vector4(1.0, 1.0, 1.0, 1.0) }, 
                        closedist: { type: 'f', value: 5.0 },  
                        redalt: { type: 'f', value: redalt },
                        vfac: { type: 'f', value: vfac } 
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
        
        buffergeometry = new THREE.BufferGeometry(); 
        buffergeometry.addAttribute('position', peakpositionbuff); 
        buffergeometry.addAttribute('pcorner', new THREE.BufferAttribute(peakcorner, 1)); 
        this.peaktrianglematerial = new THREE.ShaderMaterial({
            uniforms: { trianglesize: {type: 'f', value: 15.0}, 
                        aspect: { type: 'f', value: 1.0 }
                      }, 
            vertexShader: getshader('vertexShader_peaktriangle'),
            depthWrite:true, depthTest:true, 
            side: THREE.DoubleSide
        }); 
        
        this.peaktriangles = new THREE.Mesh(buffergeometry, this.peaktrianglematerial);  
        this.scene.add(this.peaktriangles); 
    }, 
    
    LoadCentrelines: function(legnodes, legindexes, svxscaleInv)
    {
        this.centrelinematerial = new THREE.ShaderMaterial({
            uniforms: { closecolour: { type: 'v4', value: new THREE.Vector4(1.0, 1.0, 1.0, 1.0) }, 
                        closedist: { type: 'f', value: 5.0 }, 
                        yeartime: { type: 'f', value: 9999.0 },
                        selectedvsvxcaveindex: { type: 'f', value: -1.0 }, 
                        redalt: { type: 'f', value: redalt },
                        vfac: { type: 'f', value: vfac } 
                      }, 
            vertexShader: getshader('vertexShader_centreline'),
            fragmentShader: getshader('fragment_shader_centreline'), 
            depthWrite:true, depthTest:true,  // not sure these work
            linewidth:3 
        });
        
        var nlegs = legindexes.length/2; 
        var centrelinepositionsbuff = new THREE.BufferAttribute(new Float32Array(nlegs*2*3), 3);
        var cosslope = new Float32Array(nlegs*2); 
        var svxcaveindex = new Float32Array(nlegs*2); 
        var svxyearvalue = new Float32Array(nlegs*2); 

        for (var i = 0; i < nlegs; i++) {
            var i0 = legindexes[i*2]*3; 
            var i1 = legindexes[i*2+1]*3; 
            var x0 = -legnodes[i0]*svxscaleInv, y0=legnodes[i0+2]*svxscaleInv, z0=legnodes[i0+1]*svxscaleInv; 
            var x1 = -legnodes[i1]*svxscaleInv, y1=legnodes[i1+2]*svxscaleInv, z1=legnodes[i1+1]*svxscaleInv; 
            
            //var p0 = latlngtopt(svxleg[0], svxleg[1], svxleg[2]); 
            //var p1 = latlngtopt(svxleg[3], svxleg[4], svxleg[5]); 
            centrelinepositionsbuff.setXYZ(i*2, x0, y0, z0); 
            centrelinepositionsbuff.setXYZ(i*2+1, x1, y1, z1); 
            var dx = x1 - x0, dy = y1 - y0, dz = z1 - z0; 
            var lcosslope = Math.cos(Math.atan2(dy, Math.sqrt(dx*dx + dz*dz))); 
            cosslope[i*2] = lcosslope; 
            cosslope[i*2+1] = lcosslope; 
            
            if ((i == 0) || (altminF > legnodes[i0+2]))
                altminF = legnodes[i0+2]; 
            if ((altminF > legnodes[i1+2]))
                altminF = legnodes[i1+2]; 
            if ((i == 0) || (altmaxF < legnodes[i1+2]))
                altmaxF = legnodes[i0+2]; 
            if ((altmaxF < legnodes[i1+2]))
                altmaxF = legnodes[i1+2]; 
                
            /*
            svxcaveindex[i*2] = svxleg[6]; 
            svxcaveindex[i*2+1] = svxleg[6]; 
            svxyearvalue[i*2] = svxleg[7]; 
            svxyearvalue[i*2+1] = svxleg[7]; 
            
            if (svxleg[7] != 1900) {
                if ((i == 0) || (svxleg[7] < minyearvalue))  minyearvalue = svxleg[7]; 
                if ((i == 0) || (svxleg[7] > maxyearvalue))  maxyearvalue = svxleg[7]; 
            }
            */
        }
        console.log("altminmax", altminF*svxscaleInv, altmaxF*svxscaleInv); 
        vfac = 0.9/((altmaxF - altminF)*svxscaleInv); 
        redalt = (0.5 - altmaxF*svxscaleInv*vfac) % 1; 
        
        this.centrelinebuffergeometry = new THREE.BufferGeometry(); 
        this.centrelinebuffergeometry.addAttribute('position', centrelinepositionsbuff);
        this.centrelinebuffergeometry.addAttribute('cosslope', new THREE.BufferAttribute(cosslope, 1)); 
        this.centrelinebuffergeometry.addAttribute('svxcaveindex', new THREE.BufferAttribute(svxcaveindex, 1)); 
        this.centrelinebuffergeometry.addAttribute('svxyearvalue', new THREE.BufferAttribute(svxyearvalue, 1)); 

        this.centrelines = new THREE.LineSegments(this.centrelinebuffergeometry, this.centrelinematerial);  
        this.scene.add(this.centrelines); 
    },
    
    LoadEntrances: function(svxents, svxscaleInv)
    {
        var entpositionbuff = new THREE.BufferAttribute(new Float32Array(svxents.length*9), 3); 
        var entcorner = new Float32Array(svxents.length*3); 
        var svxcaveindex = new Float32Array(svxents.length*3); 
        
        this.entgeometry = new THREE.BufferGeometry(); 
        this.entgeometry.addAttribute('position', entpositionbuff); 
        this.entgeometry.addAttribute('pcorner', new THREE.BufferAttribute(entcorner, 1)); 
        this.entgeometry.addAttribute('svxcaveindex', new THREE.BufferAttribute(svxcaveindex, 1)); 
        this.enttrianglematerial = new THREE.ShaderMaterial({
            uniforms: { trianglesize: {type: 'f', value: 10.0}, 
                        aspect: { type: 'f', value: 1.0 }, 
                        closecolour: { type: 'v4', value: new THREE.Vector4(1.0, 1.0, 1.0, 1.0) }, 
                        closedist: { type: 'f', value: 5.0 }, 
                        selectedvsvxcaveindex: { type: 'f', value: -1.0 }, 
                        redalt: { type: 'f', value: redalt },
                        vfac: { type: 'f', value: vfac } 
                      }, 
            vertexShader: getshader('vertex_shader_enttriangle'),
            fragmentShader: getshader('fragment_shader_centreline'), 
            depthWrite:true, depthTest:true, 
            side: THREE.DoubleSide
        }); 
        var enttriangles = new THREE.Mesh(this.entgeometry, this.enttrianglematerial);  
        scene.add(enttriangles); 

        this.entlabelscard = new THREE.Object3D();
        for (var i = 0; i < svxents.length; i++) {
            var p = latlngtopt(svxents[i][1], svxents[i][2], svxents[i][3]); 
            entpositionbuff.setXYZ(i*3, p.x, p.y, p.z);  entpositionbuff.setXYZ(i*3+1, p.x, p.y, p.z);  entpositionbuff.setXYZ(i*3+2, p.x, p.y, p.z); 
            entcorner[i*3] = 0.0;  entcorner[i*3+1] = 1.0;  entcorner[i*3+2] = 2.0; 
            svxcaveindex[i*3] = svxents[i][4];  svxcaveindex[i*3+1] = svxents[i][4];  svxcaveindex[i*3+2] = svxents[i][4]; 
            
            if (svxents[i][0].match(/p\d+[a-z]?$/) !== null) {
                this.MakeLabel(this.entlabelscard, svxents[i][0], "rgba(0,200,200,0.95)", p, 0.5);  // rgba(0,200,200,0.95)
            }
        }
        this.scene.add(this.entlabelscard);
    },

    LoadPassageTubes: function(passagenodes, passagetriangles, svxscaleInv) 
    {
        this.passagetubematerial = new THREE.ShaderMaterial({
            uniforms: { redalt: { type: 'f', value: redalt },
                        vfac: { type: 'f', value: vfac*5 } 
                      }, 
            vertexShader: getshader('vertex_shader_passage'),
            fragmentShader: getshader('fragment_shader_passage'), 
            depthWrite:true, depthTest:true 
        });
        var nnodes = passagenodes.length/3; 
        var ssgvertbuff = new THREE.Float32Attribute(new Float32Array(nnodes*3), 3); 
        for (var i = 0; i < nnodes; i++) {
            var x0 = -passagenodes[i*3]*svxscaleInv, y0=passagenodes[i*3+2]*svxscaleInv, z0=passagenodes[i*3+1]*svxscaleInv; 
            ssgvertbuff.setXYZ(i, x0, y0, z0); 
        }
        var indices = new Uint16Array(passagetriangles.length); 
        var ntris = passagetriangles.length/3; 
        for (var i = 0; i < ntris; i++) {
            indices[i*3] = passagetriangles[i*3]; 
            indices[i*3+2] = passagetriangles[i*3+1]; // needed to invert the orientation
            indices[i*3+1] = passagetriangles[i*3+2]; 
        }
        var buffergeometry = new THREE.BufferGeometry(); 
        buffergeometry.setIndex(new THREE.BufferAttribute(indices, 1)); 
        buffergeometry.addAttribute('position', ssgvertbuff);
        //this.passagetubematerial = new THREE.MeshBasicMaterial({ color: 0xDD44EE, shading: THREE.FlatShading, depthWrite:true, depthTest:true }); 
        this.passagetubes = new THREE.Mesh(buffergeometry, this.passagetubematerial);  
        this.scene.add(this.passagetubes); 
    }, 
    
    LoadPassageTubesP: function(passagexcsseq, xcs, svxscaleInv) 
    {
        var nxcs = 0; 
        for (var j = 0; j < passagexcsseq.length; j++)
            nxcs += passagexcsseq[j]; 
        console.assert(xcs.length == nxcs*3*4); 
        this.passagetubematerial = new THREE.ShaderMaterial({
            uniforms: { redalt: { type: 'f', value: redalt },
                        vfac: { type: 'f', value: vfac*5 } 
                      }, 
            vertexShader: getshader('vertex_shader_passage'),
            fragmentShader: getshader('fragment_shader_passage'), 
            wireframe: true, 
            depthWrite:true, depthTest:true 
        });
        var nnodes = xcs.length/3; 
        var ssgvertbuff = new THREE.Float32Attribute(new Float32Array(nnodes*3), 3); 
        for (var i = 0; i < nnodes; i++) {
            var x0 = -xcs[i*3]*svxscaleInv, y0=xcs[i*3+2]*svxscaleInv, z0=xcs[i*3+1]*svxscaleInv; 
            ssgvertbuff.setXYZ(i, x0, y0, z0); 
        }
        var ntris = (4*nxcs - 2*passagexcsseq.length)*2; // 4 quads between pairs of xcs plus endcaps
        var indices = new Uint16Array(ntris*3); 
        
        var iquad = 0; 
        var AddQuad = function(q0, q1, q2, q3) {
            indices[iquad*6] = q0; 
            indices[iquad*6+1] = q2; 
            indices[iquad*6+2] = q1; 
            indices[iquad*6+3] = q0; 
            indices[iquad*6+4] = q3; 
            indices[iquad*6+5] = q2; 
            iquad++; 
        }
        var k = 0; 
        for (var j = 0; j < passagexcsseq.length; j++) {
            AddQuad(k+0, k+1, k+2, k+3); 
            for (var l = 0; l < passagexcsseq[j]-1; l++) {
                k += 4; 
                AddQuad(k+0, k+1, k-4+1, k-4+0); 
                AddQuad(k+1, k+2, k-4+2, k-4+1);
                AddQuad(k+2, k+3, k-4+3, k-4+2);
                AddQuad(k+3, k+0, k-4+0, k-4+3);
            }
            AddQuad(k+3, k+2, k+1, k+0); 
            k += 4; 
        }
        console.log(k, nxcs, iquad); 
        console.assert(iquad == (4*nxcs - 2*passagexcsseq.length)); 
        console.assert(k == 4*nxcs); 
        
        var buffergeometry = new THREE.BufferGeometry(); 
        buffergeometry.setIndex(new THREE.BufferAttribute(indices, 1)); 
        buffergeometry.addAttribute('position', ssgvertbuff);
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
    setclosedistvalueP: function(closedistvalue)
    {
        this.centrelinematerial.uniforms.closedist.value = closedistvalue; 
        for (var i = 0; i < this.textlabelmaterials.length; i++) 
            this.textlabelmaterials[i].uniforms.closedist.value = closedistvalue; 
        if (this.enttrianglematerial) 
            this.enttrianglematerial.uniforms.closedist.value = closedistvalue; 
    }
};

