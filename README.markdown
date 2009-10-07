# JSONP

  A JSONP Request library built on Prototype
  
## Exmaple


    new JSONP.Request('http://www.yahoo.com/search',{
      timeout: 10, // timeout in seconds (optional)
      params:{
        qs: 'something fun'
      },
      onSuccess: function(data, jsonpRequestObject){
        console.log(data);
      },
      onTimeout: function(jsonpRequestObject){
        //throw hands up
      },
      onFailure: function(jsonpRequestObject){
        //exactly the same as onTimeout
      },
      onComplete: function(jsonpRequestObject){
        //called on success or timeout
      }
    });
