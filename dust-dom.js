(function(){


// Takes in a string and returns a document fragment containing that html as DOM
var strToDOM = (function(){
  var tmpRoot = document.createElement('div');
  var tmpNodes = tmpRoot.childNodes;

  return function(str_html) {
    var frag = document.createDocumentFragment();
    tmpRoot.innerHTML = str_html || '';

    while(tmpNodes.length) {
      frag.appendChild(tmpNodes[0]);
    }

    return frag;
  };

})();

function Morph(ctor, data, attrs) {
  if(!(this instanceof Morph))
    return new Morph(ctor, data, attrs);

  // Create a unique id for this morph operation
  var uid = this.uid = _.uniqueId("dust_morph_");

  // Make sure we have a cache registry
  if (!Morph.cache) {
    Morph.cache = {};
  }

  // Store this morph in the cache
  Morph.cache[uid] = this;

  this.ctor = ctor;
  this.data = data;
  this.attrs = attrs;
}

Morph.prototype.claim = function(anchor) {
  this.anchor = anchor;

  // Take out the trash
  delete Morph.cache[this.uid];

  // Instantiate the class for this component
  var cmp = new this.ctor(this);
};

// register a class to be used as a component in templates
// e.g. `{@Person class="ugly" /}` will instantiate new Person({ attrs: { class: "ugly" } });
dust.registerComponent = function(name, ctor) {

  // Register the helper
  dust.helpers[name] = function(chunk, ctx, bodies, params) {
    // Store the data being passed to the component helper in a side table
    var morph = Morph(ctor, ctx.current(), params);

    // write out a placeholder script element with the needed info to map back to this morph
    return chunk.write('<script type="text/x-dust-morph">' + morph.uid + '</script>');
  };
};

// Takes in an element ID and returns a render function from the template source
dust.compileDOM = function(id) {
  var raw = document.getElementById(id).innerHTML;
  var tpl = dust.compileFn(raw);

  return function(data, callback, ctx) {
    return tpl(data, function(err, str_html) {
      var frag = strToDOM(str_html);

      // Find all the script placeholders
      var morphEls = frag.querySelectorAll('script[type="text/x-dust-morph"]');

      for (var i = 0, len = morphEls.length; i < len; i++) {
        var current = morphEls[i];
        var morph = Morph.cache[current.innerHTML];

        // Finish the morph by giving it a dom node as an anchor
        morph.claim(current);
      }

      ctx ? callback.call(ctx, null, frag) : callback(null, frag);
    });
  };
};

dust.toDOMTemplate = function(tpl) {
  return function(data, callback, ctx) {
    return tpl.render(data, function(err, str_html) {
      var frag = strToDOM(str_html);

      // Find all the script placeholders
      var morphEls = frag.querySelectorAll('script[type="text/x-dust-morph"]');

      for (var i = 0, len = morphEls.length; i < len; i++) {
        var current = morphEls[i];
        var morph = Morph.cache[current.innerHTML];

        // Finish the morph by giving it a dom node as an anchor
        morph.claim(current);
      }

      ctx ? callback.call(ctx, null, frag) : callback(null, frag);
    });
  };
};

}());




