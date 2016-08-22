
var PlotGeometryObject = 
{
    // filled in externally
    scene: null,   
    
    peaktrianglematerial: null, 
    peaktriangles: null,

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
    
    resizeP: function(width, height)
    {
        var aspect = width / height;
        if (this.peaktrianglematerial) {
            this.peaktrianglematerial.uniforms.aspect.value = aspect; 
            this.peaktrianglematerial.uniforms.trianglesize.value = 10/height; 
        }
        for (var i = 0; i < this.textlabelmaterials.length; i++) {
            this.textlabelmaterials[i].uniforms.aspect.value = aspect; 
            this.textlabelmaterials[i].uniforms.pixelsize.value = 60/width; 
        }
    },
    setclosedistvalueP: function(closedistvalue)
    {
        for (var i = 0; i < this.textlabelmaterials.length; i++) 
            this.textlabelmaterials[i].uniforms.closedist.value = closedistvalue; 
    }
    
};

