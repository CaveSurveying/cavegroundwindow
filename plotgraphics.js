var PlotGraphics = 
{
    camera: null,
    scene: null, 
    renderer: null, 
    controls: null, 
    threejselement: null, 
    vizcontainer: null, 
    clock: new THREE.Clock(), 
    linewidth: 3, 

    backgroundscene: null, 
    backgroundcamera: null, 
    videotexture: null, 
    backgroundvideo: null, 
    backgroundcamerascale: 1.67, // may need different scale on y and x or by aspect ratio of something
    bshowvideobackground: false,  

    resize: function() 
    {
        var width = this.vizcontainer.offsetWidth;
        var height = this.vizcontainer.offsetHeight;
        this.camera.aspect = width / height;
        PlotGeometryObject.resizeP(width, height); 
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        document.getElementById("instructionssplash").style.height = height*0.8+"px"; 
    },

    update: function(dt) 
    {
        this.resize();
        this.camera.updateProjectionMatrix();
        this.controls.update(dt);
    },

    render: function(dt) 
    {
        this.renderer.autoClear = false; 
        this.renderer.clear(); 
        if (this.bshowvideobackground && this.backgroundscene) {
            if (this.backgroundvideo.readyState === this.backgroundvideo.HAVE_ENOUGH_DATA) {
                this.videotexture.needsUpdate = true; 
            }
            this.renderer.render(this.backgroundscene, this.backgroundcamera);
        }
        this.renderer.render(this.scene, this.camera);
    }, 

    init: function()
    {
        this.renderer = new THREE.WebGLRenderer();
        this.threejselement = this.renderer.domElement;
        this.vizcontainer = document.getElementById('viz');
        this.vizcontainer.appendChild(this.threejselement);
        
        this.scene = new THREE.Scene();
        PlotGeometryObject.scene = this.scene; 
        var fieldofview = 30; // degrees (smaller is more tunnel like)
        var aspect = 1;       // reset in resize()
        this.camera = new THREE.PerspectiveCamera(fieldofview, aspect, neardistance, fardistance);
        this.camera.position.set(0, 0, 0); 
        this.scene.add(this.camera); 

        this.controls = new THREE.DeviceOrientationControls(this.camera, true);
        this.controls.connect();
        this.controls.update();

        var light = new THREE.PointLight(0xffffff);
        light.position.set(0, 2500, 0);
        this.scene.add(light);
    }, 
    
    LoadVideoBackground: function()
    {
        window.URL = window.URL || window.webkitURL; 
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia; 
        
        if (this.bshowvideobackground) {
            this.bshowvideobackground = false; 
            document.getElementById("backcamera").className = ""; 
            return; 
        }
        if (this.backgroundscene) {
            this.bshowvideobackground = true; 
            document.getElementById("backcamera").className = "selected"; 
            return; 
        }
            
        this.backgroundvideo = document.createElement("video"); 
        this.backgroundvideo.width = PlotGraphics.vizcontainer.offsetWidth; 
        this.backgroundvideo.height = PlotGraphics.vizcontainer.offsetHeight; 
        this.backgroundvideo.autoplay = true; 
        
        navigator.getUserMedia({"audio":false, "video":true}, function(streamVideo) { 
            var pg = PlotGraphics; 
            pg.backgroundvideo.src = window.URL.createObjectURL(streamVideo); 
            //alert(backgroundvideo.src); 
            pg.videotexture = new THREE.Texture(pg.backgroundvideo); 
            var backgroundmesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2, 0), new THREE.MeshBasicMaterial({map: pg.videotexture})); 
            backgroundmesh.material.depthTest = false; 
            backgroundmesh.material.depthWrite = false; 
            pg.backgroundscene = new THREE.Scene(); 
            pg.backgroundcamera = new THREE.Camera(); 
            pg.backgroundcamera.projectionMatrix.makeScale(pg.backgroundcamerascale, pg.backgroundcamerascale, pg.backgroundcamerascale); 
            pg.backgroundscene.add(pg.backgroundcamera); 
            pg.backgroundscene.add(backgroundmesh); 
            pg.bshowvideobackground = true; 
            document.getElementById("backcamera").className = "selected"; 
        }, function() { alert("bad camera"); }); 
    }
    
    
};
