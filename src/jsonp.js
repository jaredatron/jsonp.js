// Requires Prototoype

(function() {

  this.JSONP = JSONP = {};

  // Usage:
  //   new JSONP.Request('http://www.yahoo.com/search',{
  //     timeout: 10, // timeout in seconds (optional)
  //     params:{
  //       qs: 'something fun'
  //     },
  //     onSuccess: function(data, jsonpRequestObject){
  //       console.log(data);
  //     },
  //     onTimeout: function(jsonpRequestObject){
  //       //throw hands up
  //     },
  //     onFailure: function(jsonpRequestObject){
  //       //exactly the same as onTimeout
  //     },
  //     onComplete: function(jsonpRequestObject){
  //       //called on success or timeout
  //     }
  //   })

  JSONP.Request = Class.create({
    callbackName: 'callback',
    DEFAULT_OPTIONS:{
      requestNow: true,
      asynchronous: true,
      timeout: 10, // defualts to 10 seconds
      onCreate:   Prototype.emptyFunction,
      onSuccess:  Prototype.emptyFunction,
      onTimeout:  Prototype.emptyFunction,
      onFailure:  Prototype.emptyFunction,
      onComplete: Prototype.emptyFunction,
      onException: Prototype.emptyFunction
    },
    initialize: function(url, options) {
      this.url = url;
      this.options = Object.extend(Object.clone(this.DEFAULT_OPTIONS),options);

      if (this.options.requestNow) this.request();
    },
    log: function(){
      if (!console) return;
      if (console.info) return Function.prototype.apply.apply(console.info, [console,arguments]);
      if (console.log) return Function.prototype.apply.apply(console.log, [console,arguments]);
    },
    request: function(){
      // setup time out handling
      var timed_out = false,
          timeout = null,
          timeout_handler = function(){
            timed_out = true;
            this.options.onTimeout(this);
            JSONP.Responders.dispatch('onTimeout', this);
            this.options.onFailure(this);
            JSONP.Responders.dispatch('onFailure', this);
            this.options.onComplete(this);
            JSONP.Responders.dispatch('onComplete', this);
            destroy_script_element();
          }.bind(this);

      // create global callback handler
      var callback_function_name = 'window';
      while (!Object.isUndefined(window[callback_function_name]))
        callback_function_name = 'jsonp_'+new Date().getTime()+'_'+Math.floor(Math.random()*11000);

      window[callback_function_name] = function(data){
        try{
          if (!timed_out){
            clearTimeout(timeout);
            this.log('<- JSONP '+this.url, {
              URL:this.url,
              params:params,
              'FULL URL':full_url,
              response:data
            });
            this.respond(data);
          }
          delete window[callback_function_name];
          destroy_script_element();
        }catch(e){
          this.dispatchException(e);
        }
      }.bind(this);


      // build the url
      var params = Object.clone(this.options.params);
      params[this.callbackName] = callback_function_name;

      var full_url = this.toQueryString(params);

      this.log('-> JSONP '+this.url, {
        URL:this.url,
        params:params,
        'FULL URL':full_url,
        options:this.options
      });

      // make the request
      var script_element = new Element('script', {src: full_url, type:'text/javascript'});
      var destroy_script_element = function(){
        script_element.parentNode && script_element.remove();
      };

      $$('head').first().insert(script_element);
      this.options.onCreate(this);
      JSONP.Responders.dispatch('onCreate', this);


      if (this.options.timeout)
        timeout = timeout_handler.delay(this.options.timeout);

      return this;
    },
    toQueryString: function(params){
      params = params || this.options.params;
      return this.url + (this.url.indexOf('?') == -1 ? '?' : '&') + Object.toQueryString(params);
    },
    respond: function(data){
      try{
        this.options.onSuccess(data, this);
        JSONP.Responders.dispatch('onSuccess', data, this);
        this.options.onComplete(this);
        JSONP.Responders.dispatch('onComplete', this);
      }catch(e){
        this.dispatchException(e);
      }
      return this;
    },
    dispatchException: function(exception) {
      this.options.onException(this, exception);
      Ajax.Responders.dispatch('onException', this, exception);
    }
  });

  JSONP.Responders = Object.clone(Ajax.Responders);
  JSONP.Responders.responders = [];

  JSONP.activeRequestCount = 0;
  JSONP.Responders.register({
    onCreate:   function() { JSONP.activeRequestCount++; },
    onComplete: function() { JSONP.activeRequestCount--; }
  });

})();







