// build time tests for detect plugin
// see http://mochajs.org/

(function() {
  const detect = require('../client/detect'),
        expect = require('expect.js');

  describe('detect plugin', () => {
    describe('expand', () => {
      it('can make itallic', () => {
        var result = detect.expand('hello *world*');
        return expect(result).to.be('hello <i>world</i>');
      });
    });
  });

}).call(this);
