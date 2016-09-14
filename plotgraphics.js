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

    resize: function() 
    {
        var width = this.vizcontainer.offsetWidth;
        var height = this.vizcontainer.offsetHeight;
        this.camera.aspect = width / height;
        PlotGeometryObject.resizeP(width, height); 
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
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
        if (bshowvideobackground && backgroundscene) {
            if (backgroundvideo.readyState === backgroundvideo.HAVE_ENOUGH_DATA) {
                videotexture.needsUpdate = true; 
            }
            this.renderer.render(backgroundscene, backgroundcamera);
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
    }
};
