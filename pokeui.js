
var PokeUI = { 
    touchStart: new THREE.Vector2(),
    touchEnd: new THREE.Vector2(), 
    touchDelta: new THREE.Vector2(), 
    touchtime: null, 
    touchmovestate: 0, // 1 is touchdrag, 2 is dragging left-right for alpha compass rotate, 3 for depth of fogbrightness, 4 pinch for FOV change, 5 for point selection
    touchmovevalueStart: null, 
    
    touchstartfunc: function(event) 
    {
        event.stopPropagation(); 
        this.touchtime = clock.elapsedTime; 
        if (event.touches.length == 1) {
            this.touchStart.set(event.touches[0].pageX, event.touches[0].pageY); 
            this.touchmovestate = 1; // pre-single move, but don't know direction of drag
        } else if ((event.touches.length == 2) && (this.touchmovestate <= 1)) {
            this.touchStart.set(event.touches[1].pageX - event.touches[0].pageX, event.touches[1].pageX - event.touches[0].pageY); 
            this.touchmovevalueStart = camera.fov; 
            quantshowshow("**"); 
            this.touchmovestate = 4; 
        }
    }, 

    touchholdfunc: function(event) 
    { 
        event.preventDefault(); 
        event.stopPropagation(); 
        if (this.touchmovestate == 1) {
            this.touchmovestate = 5; 
            PickingObject.selecteffort(event.pageX, event.pageY, "contextevent"); 
        }
        return false 
    }, 

    touchmovefunc: function(event)
    {
        event.preventDefault(); 
        event.stopPropagation(); 
        var touchmovepixelsrequired = 20; 
        if (event.touches.length == 1) {
            this.touchEnd.set(event.touches[0].pageX, event.touches[0].pageY);
            this.touchDelta.subVectors(this.touchEnd, this.touchStart); 
            if ((this.touchmovestate == 1) && (Math.max(Math.abs(this.touchDelta.x), Math.abs(this.touchDelta.y)*2) > touchmovepixelsrequired)) {
                this.touchmovestate = (Math.abs(this.touchDelta.x) >= Math.abs(this.touchDelta.y) ? 2 : 3); 
                this.touchmovevalueStart = (this.touchmovestate == 2 ? controls.alphaoffset : PlotGeometryObject.centrelinematerial.uniforms.closedist.value); 
                quantshowshow("**");   // drops through
                //if (this.touchmovestate == 2)
                //    controls.alphalock = true; 
            }
            if  ((this.touchmovestate == 1) && (clock.elapsedTime - this.touchtime > 1)) {
                this.touchmovestate = 5; 
                PickingObject.selecteffort(this.touchStart.x, this.touchStart.y, "touchholdmove")
            }

            if (this.touchmovestate == 2) {
                //controls.alpha += THREE.Math.degToRad(touchDelta.x*0.1);  // didnt work
                //touchStart.set(touchEnd.x, touchEnd.y); // make incremental so the holding flag within the controls can also work
                controls.alphaoffset = this.touchmovevalueStart + this.touchDelta.x*0.3;  
                quantshowtextelement.textContent = "A-offs: "+controls.alphaoffset.toFixed(0); 
            } else if (this.touchmovestate == 3) {
                PlotGeometryObject.setclosedistvalueP(Math.max(0.0, this.touchmovevalueStart - Math.max(1.0, this.touchmovevalueStart)*this.touchDelta.y*(this.touchDelta.y < 0 ? 0.02 : 0.005))); 
                quantshowtextelement.textContent = "Light: "+(PlotGeometryObject.centrelinematerial.uniforms.closedist.value).toFixed(0)+"m"; 
            }
        } else if (event.touches.length == 2) {
            if (this.touchmovestate == 4) {
                this.touchEnd.set(event.touches[1].pageX - event.touches[0].pageX, event.touches[1].pageX - event.touches[0].pageY); 
                camera.fov = Math.min(175.0, Math.max(1.0, this.touchmovevalueStart*(this.touchStart.length()/this.touchEnd.length()))); 
                quantshowtextelement.textContent = "FOV: "+camera.fov.toFixed(0)+"deg"; 
            }
        }
        return false; 
    }, 

    touchendfunc: function(event)
    {
        event.preventDefault(); 
        //if (this.touchmovestate == 2)
        //    controls.alphalock = false; 
        if (this.touchmovestate > 0)
            quantshowhidedelay(1500); 
        this.touchmovestate = 0; 
    }
}; 
    
