(function(document) {
  var areas = {};

  /**
   * Plugin constructor
   */
  var ObjectStandOut = function(el, o) {
    this.el = el;
    this.elMask = null;

    this.o = this.mergeOptions(o);

  };


  /**
   * Merge options with default values
   */
  ObjectStandOut.prototype.mergeOptions = function(options) {
    var o = options || {};

    o.breakpoint = o.breakpoint || 767;
    o.mobileBlock = o.mobileBlock || "mobile";
    o.img = o.img || null;
    o.width = o.width || this.el.offsetWidth;
    o.height = o.height || null;
    o.areas = o.areas || [];
    o.messageActiveClass = o.messageActiveClass || 'message-active';

    this.ctx = null;
    this.areas = [];
    this.activeArea = null;
    this.ratio = 1;

    return o;
  };



  /**
   * Render view
   */
  ObjectStandOut.prototype.render = function() {
    var img;

    if (!this.o.height && this.o.img) {
      img = new Image;
      img.onload = (function() {
        this.o.imgSize = {height: img.height, width: img.width};
        this.o.height = img.height;
        this.updateRatio();
        console.log(this.o);
        // if (this.o.width < img.width) {
        //   this.ratio = this.o.width / img.width;
        //   this.o.height = Math.round(img.height * this.ratio);
        // } else {
        //   this.ratio = 1;
        //   this.o.width = img.width;
        //   this.o.height = img.height;
        // }

        this._initialize();
      }).bind(this);
      img.src = this.o.img;
    } else {
      this._initialize();
    }
  };


  /**
   * Update ratio8
   */
  ObjectStandOut.prototype.updateRatio = function()
  {
    this.o.width = this.el.offsetWidth;
    this.o.height = null;

    if (this.o.width < this.o.imgSize.width) {
      this.ratio = this.o.width / this.o.imgSize.width;
      this.o.height = Math.round(this.o.imgSize.height * this.ratio);
    } else {
      this.ratio = 1;
      this.o.width = this.o.imgSize.width;
      this.o.height = this.o.imgSize.height;
    }
    if(this.elMask) {
      this.elMask.width = this.o.width;
      this.elMask.height = this.o.height;
      // console.log(this.elMask.width, this.elMask.height, this.o.width, this.o.height, this.tempCanvas.width, this.tempCanvas.height);
    }
    if(this.tempCanvas) {
      this.tempCanvas.width = this.o.width;
      this.tempCanvas.height = this.o.height;
    }
  }


  /**
   * Add area
   */
  ObjectStandOut.prototype.addArea = function(data) {
    var area,
      triggerButton;
    data = data || {};
    data.type || (data.type = "polygon");

    if (!areas[data.type]) {
      throw Error("Area type is not found: " + data.type);
    }

    area = new (areas[data.type])(this, data);

    this.areas.push(area);

    if(area.o.trigger && (triggerButton = this.el.querySelector(area.o.trigger))) {

      triggerButton.addEventListener('click', function(){
        if(this.activeArea == area) {
          this.clear();
          return;
        }
        if (this.activeArea && this.activeArea !== area) {
          this.clear();
        }

        if (area && this.activeArea !== area) {
          this.renderArea(area);
        }
      }.bind(this), false);
    }

    return area;
  };


  /**
   * Get area on point
   */
  ObjectStandOut.prototype.getAreaOnPoint = function(point) {
    for(var i=0; i<this.areas.length; i++) {
      if (this.areas[i].isInside(point)) {
        return this.areas[i];
      }
    }

    return null;
  };


  /**
   * Clear canvas
   */
  ObjectStandOut.prototype.clear = function() {
    var message = this.el.querySelector("." + this.o.messageActiveClass);
    if (message) {
      message.className = message.className.replace(" " + this.o.messageActiveClass, '');
    }


    if(!this.activeArea) {
      return;
    }
    this.activeArea.clear(this.ctx);

    this.ctx.clearRect(0, 0, this.elMask.width, this.elMask.height);

    this.activeArea = null;

    // Mobile
    this.mobileBlock.removeChild(this.mobileInfo);
    this.mobileBlock.style.display = "none";

  };

  /**
   * Render area
   */
  ObjectStandOut.prototype.renderArea = function(area) {
    var message;

    console.log(this.elMask.width, this.elMask.height, 'this');
    this.ctx.clearRect(0, 0, this.elMask.width, this.elMask.height);
    
    // hardcode class
    var img = document.getElementById("features-image");

    this.tCtx.drawImage(img,0,0,this.elMask.width, this.elMask.height);
    this.ctx.fillStyle = this.ctx.createPattern(this.tempCanvas, "no-repeat");

    // var pat = this.ctx.createPattern(img, 'no-repeat');
    // this.ctx.fillStyle = pat;
    this.ctx.filter = 'blur(5px) grayscale(75%) saturate(180%)';

    console.log(this.elMask.width,this.elMask.height);

    // this.ctx.fillStyle = "rgba(0,0,0,0.65)";
    this.ctx.beginPath();

    area.render(this.ctx);

    this.ctx.rect(this.elMask.width, 0, -1 * this.elMask.width, this.elMask.height);
    // this.ctx.rect(0,0,img.width,img.height);
    this.ctx.fill('evenodd');

    if (area.o.messageSelector && (message = this.el.querySelector(area.o.messageSelector))) {
      message.classList ? message.classList.add(this.o.messageActiveClass) : message.className += " " + this.o.messageActiveClass;
    }

    this.mobileContent(message);

    this.activeArea = area;
  };


  /**
   * Initialize
   */
  ObjectStandOut.prototype._initialize = function() {
    this._createElements();
    this._addAreas();
    this._bindListeners();
    this._bindResize();
    this.responsiveClasses();
  };

  /**
   * Create elements
   */
  ObjectStandOut.prototype._createElements = function() {
    this.el.style.position = "relative";
    
    this.el.className += " canvas-loaded";

    this.elMask = document.createElement("canvas");
    this.elMask.width = this.o.width;
    this.elMask.height = this.o.height;
    this.el.appendChild(this.elMask);
    this.ctx = this.elMask.getContext('2d');

    this.mobileInfo = null;
    this.mobileBlock = document.getElementById(this.o.mobileBlock);
    /** Temp canvas to apply image background w/ right dimension **/
    this.tempCanvas = document.createElement("canvas");
    this.tCtx = this.tempCanvas.getContext("2d");
    this.tempCanvas.width = this.o.width;
    this.tempCanvas.height = this.o.height;

    this.elTop = document.createElement("div");
    this.elTop.style.width = this.o.width;
    this.elTop.style.height = this.o.height;
    this.elTop.style.zindex = 100;
    this.elTop.style.position = "absolute";
    this.elTop.style.top = 0;
    this.elTop.style.bottom = 0;
    this.elTop.style.left = 0;
    this.elTop.style.right = 0;
    this.el.appendChild(this.elTop);

    if (this.o.img) {
      this.elMask.style.background = "url(" + this.o.img + ")";
      this.elMask.style.backgroundSize = "cover";
    }
  };


  /**
   * Add ares
   */
  ObjectStandOut.prototype._addAreas = function() {
    if (this.o.areas.length) {
      for (var i=0; i<this.o.areas.length; i++) {
        this.addArea(this.o.areas[i]);
      }
    }
  };


  /**
   * Bind listeners
   */
  ObjectStandOut.prototype._bindListeners = function() {
    this.elTop.addEventListener('click', this._onMouseAction.bind(this), false);
    document.getElementById("Panavision-mobileBlockClose").addEventListener('click', function(){
      // if(this.activeArea == area) {
        this.clear();
        return;
      // }
    }.bind(this), false);

    /** TODO
     * add mobile close button bind
    */ 


    // remove >>>>
    this.elTop.addEventListener('click', function(e) {
      var rect = this.el.getBoundingClientRect(),
        point = [e.clientX - rect.left, e.clientY - rect.top];

      this.editorPoints || (this.editorPoints = []);
      this.editorPoints.push(point);
      console.log(JSON.stringify(this.editorPoints));
    }.bind(this), false);
    // remove <<<
  };


  /**
   * On mouse action
   */
  ObjectStandOut.prototype._onMouseAction = function(e) {
    var rect = this.el.getBoundingClientRect(),
      point = [e.clientX - rect.left, e.clientY - rect.top],
      area = this.getAreaOnPoint(point);
      console.log(point, area);

      if(this.activeArea == area) {
        this.clear();
        return;
      }
      if (this.activeArea && this.activeArea !== area) {
        this.clear();
      }

      if (area && this.activeArea !== area) {
        this.renderArea(area);
      }
  };


  ObjectStandOut.addAreaType = function(name, AreaClass) {
    areas[name] = AreaClass;
  };



  /**
   * Check if has class
   */
  ObjectStandOut.prototype._hasClass = function(element, cls)
  {
    return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
  }

  ObjectStandOut.prototype.addEvent = function(object, type, callback)
  {
    if (object == null || typeof(object) == 'undefined') return;
    if (object.addEventListener) {
        object.addEventListener(type, callback, false);
    } else if (object.attachEvent) {
        object.attachEvent("on" + type, callback);
    } else {
        object["on"+type] = callback;
    }
  }

  /**
   * Window Resize
   */
  ObjectStandOut.prototype._bindResize = function()
  {
    // resize/reinitialize canvas
    this.addEvent(window, "resize", function(event) {
      this.responsiveClasses();
      this.updateRatio();
    }.bind(this));

  }

  ObjectStandOut.prototype.responsiveClasses = function()
  {
    if(this._checkMobile()) {
      if (!this._hasClass(this.el,'mode--mobile')) {
        this.el.className += " mode--mobile";
      }
    }
    else {
      this.el.className = this.el.className.replace(" mode--mobile", "");
    }
  }

  /**
    * Check if mobile
  */
  ObjectStandOut.prototype._checkMobile = function()
  {
    if(window.innerWidth < this.o.breakpoint) {
      return true;
    }
    else {
      return false
    }
  }

  /**
   * Mobile click
   */
  ObjectStandOut.prototype.mobileContent = function(message)
  {
    if(message) {
      this.mobileInfo = message.cloneNode(true);
      this.mobileBlock.appendChild(this.mobileInfo);
    }
    this.mobileBlock.style.display = "block";
  }


  /*--------------------------------------------------------------------------------------------------- Areas ---*/
  /**
   * Polygon area
   */
  var PolygonArea = function(standOut, o) {
    this.standOut = standOut;

    this.o = o || {};
    this.o.points = this.o.points || [];
  };


  /**
   * Render mask
   */
  PolygonArea.prototype.render = function(ctx)
  {
    var i, x, y, points = this.o.points;
    for(i = 0; i < points.length; i++) {
      x = Math.round(points[i][0] * this.standOut.ratio);
      y = Math.round(points[i][1] * this.standOut.ratio);
      if (i == 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
  };


  /**
   * Clear mask
   */
  PolygonArea.prototype.clear = function(ctx)
  {

  }


  /**
   * Is point inside
   */
  PolygonArea.prototype.isInside = function(point) {
    // ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
    var inside = false,
        x = Math.round(point[0] / this.standOut.ratio),
        y = Math.round(point[1] / this.standOut.ratio),
        vs = this.o.points;

    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i][0], yi = vs[i][1];
        var xj = vs[j][0], yj = vs[j][1];

        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
  };

  ObjectStandOut.addAreaType('polygon', PolygonArea);


  this.ObjectStandOut = ObjectStandOut;
}).call(this, document);
