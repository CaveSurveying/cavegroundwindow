
var PokeUI = { 
    touchStart: new THREE.Vector2(),
    touchEnd: new THREE.Vector2(), 
    touchDelta: new THREE.Vector2(), 
    touchtime: null, 
    touchmovestate: 0, // 1 is touchdrag, 2 is dragging left-right for alpha compass rotate, 3 for depth of fogbrightness, 4 pinch for FOV change, 5 for point selection
    touchmovevalueStart: 1.0, 
    stgsmdisplacementx:0, stgsmdisplacementy:0, stgsmdisplacementz:0, 
    bdraggsmmode: false, 

    accthresh: 6.0,  
    hopsuppresstime: 0.0,  
    maxaccz: 0, 
    
    touchstartfunc: function(event) 
    {
        event.stopPropagation(); 
        this.touchtime = clock.elapsedTime; 
        if (event.touches.length == 1) {
            this.touchStart.set(event.touches[0].pageX, event.touches[0].pageY); 
            this.touchmovestate = 1; // pre-single move, but don't know direction of drag
        } else if ((event.touches.length == 2) && (this.touchmovestate <= 1)) {
            this.touchStart.set(event.touches[1].pageX - event.touches[0].pageX, event.touches[1].pageX - event.touches[0].pageY); 
            this.touchmovevalueStart = (bshowvideobackground ? backgroundcamerascale : camera.fov); 
            quantshowshow("**"); 
            this.touchmovestate = 4; 
        }
        if (this.bdraggsmmode) {
            this.stgsmdisplacementx = PositionObject.gsmdisplacementx; 
            this.stgsmdisplacementy = PositionObject.gsmdisplacementy; 
            this.stgsmdisplacementz = PositionObject.gsmdisplacementz; 
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
        var touchmovedistance = 0.0; 
        var touchmovestateN = 0; 
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
            if  ((this.touchmovestate == 1) && (clock.elapsedTime - this.touchtime > 1.00)) {
                this.touchmovestate = 5; 
                PickingObject.selecteffort(this.touchStart.x, this.touchStart.y, "touchholdmove")
            }

            if (this.touchmovestate == 2) {
                touchmovestateN = 2; 
                touchmovedistance = this.touchDelta.x; 
            } else if (this.touchmovestate == 3) {
                touchmovestateN = 3; 
                touchmovedistance = this.touchDelta.y; 
            } else if (this.touchmovestate == 4) {
                console.log("finger off"); // should end
            }
        } else if (event.touches.length == 2) {  // pinch gesture
            if (this.touchmovestate == 4) {
                this.touchEnd.set(event.touches[1].pageX - event.touches[0].pageX, event.touches[1].pageX - event.touches[0].pageY); 
                touchmovestateN = 4; 
                touchmovedistance = this.touchStart.length()/this.touchEnd.length(); 
                if (this.bdraggsmmode)
                    touchmovedistance = this.touchEnd.length() - this.touchStart.length(); 
            } 
        }
            
        // activate the gesture
        if (!this.bdraggsmmode) {
            if (touchmovestateN == 2) {
                controls.alphaoffset = this.touchmovevalueStart + touchmovedistance*0.3;  
                quantshowtextelement.textContent = "A-offs: "+controls.alphaoffset.toFixed(0); 
            } else if (touchmovestateN == 3) {
                PlotGeometryObject.setclosedistvalueP(Math.max(minlightdistance, this.touchmovevalueStart - Math.max(1.0, this.touchmovevalueStart)*touchmovedistance*(touchmovedistance < 0 ? 0.02 : 0.005))); 
                quantshowtextelement.textContent = "Light: "+(PlotGeometryObject.centrelinematerial.uniforms.closedist.value).toFixed(0)+"m"; 
            } else if (touchmovestateN == 4) { 
                if (bshowvideobackground) {
                    backgroundcamerascale = this.touchmovevalueStart/touchmovedistance; 
                    backgroundcamera.projectionMatrix.makeScale(backgroundcamerascale, backgroundcamerascale, backgroundcamerascale); 
                    quantshowtextelement.textContent = "Backcamm scale: "+backgroundcamerascale.toFixed(2); 
                } else {
                    camera.fov = Math.min(175.0, Math.max(1.0, this.touchmovevalueStart*touchmovedistance)); 
                    quantshowtextelement.textContent = "FOV: "+camera.fov.toFixed(0)+"deg"; 
                }
            } 
        } else {
            if (touchmovestateN == 2) {
                PositionObject.gsmdisplacementx = this.stgsmdisplacementx + touchmovedistance*0.1; 
            } else if (touchmovestateN == 3) {
                PositionObject.gsmdisplacementy = this.stgsmdisplacementy + touchmovedistance*0.1; 
            } else if (touchmovestateN == 4) {
                PositionObject.gsmdisplacementz = this.stgsmdisplacementz - touchmovedistance*0.1; 
            }
            if ((touchmovestateN >= 2) && (touchmovestateN <= 4)) {
                PositionObject.SetCameraPositionG(); 
                PositionObject.TrailUpdate(); 
                quantshowtextelement.textContent = "gsm x:"+PositionObject.gsmdisplacementx.toFixed(0)+"m y:"+PositionObject.gsmdisplacementy.toFixed(0)+"m z"+PositionObject.gsmdisplacementz.toFixed(0)+"m"; 
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
    }, 
    
    keyhorizstep: 20.0, 
    keyaltstep: 10.0, 
    keydowncontrols: function(event)
    {
        var mv = { }; 
        if (event.keyCode == 37)       mv[event.shiftKey ? "x" : "rx"] = -1;   // left cursor
        else if (event.keyCode == 39)  mv[event.shiftKey ? "x" : "rx"] = 1;    // right cursor
        else if (event.keyCode == 38)  mv[event.shiftKey ? "y" : "ry"] = 1;    // up cursor
        else if (event.keyCode == 40)  mv[event.shiftKey ? "y" : "ry"] = -1;   // down cursor
        else if (event.keyCode == 33)  mv[event.shiftKey ? "z" : "rz"] = 1;    // page up
        else if (event.keyCode == 34)  mv[event.shiftKey ? "z" : "rz"] = -1;   // page down
        if (mv.rx || mv.ry || mv.rz)  {
            if (mv.rx)  GdeviceOrientation.gamma += mv.rx*5; 
            if (mv.ry)  GdeviceOrientation.beta += mv.ry*5; 
            if (mv.rz)  GdeviceOrientation.alpha += mv.rz*5; 
        } else if (mv.x || mv.y || mv.z) {
            PositionObject.gsmdisplacementx += (mv.x|0)*this.keyhorizstep; 
            PositionObject.gsmdisplacementy += (mv.y|0)*this.keyhorizstep; 
            PositionObject.gsmdisplacementz += (mv.z|0)*this.keyaltstep; 
            PositionObject.SetCameraPositionG(); 
            PositionObject.TrailUpdate(); 
        }
    }, 
    
    devorientationevent: function(event)
    {
        if (event.acceleration.z > this.accthresh) {
            if (event.acceleration.z > this.maxaccz) {
                this.maxaccz = event.acceleration.z; 
            }
        } else if (event.acceleration.z < -this.accthresh) {
            if (event.acceleration.z < this.maxaccz) {
                this.maxaccz = event.acceleration.z; 
            }
        } else {
            if ((this.maxaccz > 0.0) && (PositionObject.hopmode == 0)) {
                if (this.hopsuppresstime > clock.elapsedTime) { 
                    PositionObject.ZhopGo((this.maxaccz-5.5)*(this.maxaccz-5.5)*300); 
                    document.getElementById('debugtext').textContent = this.maxaccz.toFixed(3); 
                }
            } else if (this.maxaccz < 0.0) {
                if (PositionObject.hopmode == 2) {
                    PositionObject.ZhopGo(0); 
                } else {
                    this.hopsuppresstime = clock.elapsedTime + 2; 
                }
            }
            this.maxaccz = 0.0; 
        }
    }

};
