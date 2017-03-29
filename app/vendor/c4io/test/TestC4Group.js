// Import chai.
const chai = require('chai'), chaiAsPromised = require("chai-as-promised");
const path = require('path');

chai.use(chaiAsPromised);
chai.should();

let C4Group = require(path.join(__dirname, '..', 'c4group'));

describe('C4Group', () => {
  describe('#constructor', () => {
    let group;

    it('loads a file', () => {
      promise = C4Group.fromFile('test/System.ocg').open();
      promise.should.be.fulfilled;
    });
  });

  describe('#read', () => {
    let promise;
    beforeEach(() => {
      group = C4Group.fromFile('test/System.ocg').open();
    });

    it('parses the file', (done) => {
      group.then((grp) => {
      grp.should.have.property('Header')
          .with.a.property('NumEntries')
            .that.is.a('number');

        done();
      }).catch((reason) => {
        console.info('failed with reason:', reason);
      });
    });

    it('has children', (done) => {
      group.then((grp) => {
        grp.should.respondTo('get');
        grp.get('Player.c').should.be.ok;
        done();
      });
    });
  });
});
