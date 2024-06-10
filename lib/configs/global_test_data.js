const nestedProperty = require('nested-property');

class TestData {
  constructor() {
    this.testData = {};
  }
  setField = (field, value) => {
    nestedProperty.set(this.testData, field, value);
  };
  getField = (field) => {
    return nestedProperty.get(this.testData, field);
  };
  getLocator = (field) => {
    return nestedProperty.get(this.testData, 'LocatorList.' + field);
  };
  getData = (field) => {
    return nestedProperty.get(this.testData, 'DataList.' + field);
  };
}

module.exports = new TestData();
module.exports.TestData = TestData;
