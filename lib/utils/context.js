// Test execution context, populated via the TestMaiT listener plugin events
module.exports = {
  context: {
    feature: {
      // The description of the currently executed feature/suite
      description: '',
      // The title of the currently executed feature/suite
      title: '',
      // The tags of the currently executed feature/suite
      tags: [''],
    },
    scenario: {
      // The title of the currently executed scenario/test
      title: '',
      // The tags of the currently executed scenario/test
      tags: [''],
    },
  },
};
