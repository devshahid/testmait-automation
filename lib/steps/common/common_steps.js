const { Assert, CommonUtils, TestData, TM } = inject();

/* eslint-disable no-undef */

Then(/^I generate name "([^"]*)" with value "([^"]*)"$/, async (outVar, randNum) => {
  await CommonUtils.generateRandomNumbers(outVar, randNum);
  TM.report('Generated random number ' + TestData.getField(outVar) + ' and stored it in ' + outVar);
});

Then(/^I check value of "([^"]*)" is "([^"]*)"$/, async (value1, value2) => {
  value1 = CommonUtils.identifyData(value1);
  value2 = CommonUtils.identifyData(value2);
  await Assert.verifyIfTwoStringsAreEqual(value1, value2);
  TM.report('Verified two strings ' + value1 + ' and ' + value2 + ' are equal');
});

Then(/^I check for the duplicate value in "([^"]*)"$/, async (outVar) => {
  const hasDuplicates = (array) => new Set(array).size !== array.length;
  const inputs = CommonUtils.identifyData(outVar);
  console.log(`Do we have duplicate values ${hasDuplicates(inputs)}`);
  if (hasDuplicates(inputs)) {
    Assert.fail('The array contains duplicate values.');
  } else {
    console.log('The array does not contain duplicate values.');
  }
});

Then(/^I check value of "([^"]*)" is in "([^"]*)" order$/, async (outVar, order) => {
  const inputs = CommonUtils.identifyData(outVar);

  const isDescendingOrder = (arr) =>
    arr.every((value, index, array) => index === 0 || value <= array[index - 1]);

  const isAscendingOrder = (arr) =>
    arr.every((value, index, array) => index === 0 || value >= array[index - 1]);

  const extractedNumbers = inputs.flatMap((str) => {
    const matches = str.match(/₹ (\d+)(?:₹ \d+)?% OFF/g) || [];
    return matches.map((match) => parseInt(match.replace(/₹|% OFF/g, ''), 10));
  });

  switch (order) {
    case 'descending':
      if (isDescendingOrder(extractedNumbers)) {
        console.log('Values are in Descending order.');
      } else {
        console.log('Values are not in Descending order.');
      }
      break;
    case 'ascending':
      if (isAscendingOrder(extractedNumbers)) {
        console.log('Values are in Ascending order.');
      } else {
        console.log('Values are not in Ascending order.');
      }
      break;
    default:
      console.log('Not a valid option to check');
  }
});

Then(/^I verify "([^"]*)" contains "([^"]*)"$/, async (str, expected) => {
  await Assert.verifyIfStringContains(
    CommonUtils.identifyData(str),
    CommonUtils.identifyData(expected),
  );
});

Then(/^I wait for "([^"]*)" $/, async (seconds) => {
  await TM.wait(seconds);
});

Then(/^I verify "([^"]*)" matched with "([^"]*)" list$/, async (value, list) => {
  list = CommonUtils.identifyData(list);
  for (let i of list) {
    await Assert.verifyIfTwoStringsAreEqual(
      CommonUtils.identifyData(i),
      CommonUtils.identifyData(value),
    );
  }
});

Then(/^I verify text "([^"]*)" contains in "([^"]*)" list$/, async (value, list) => {
  list = CommonUtils.identifyData(list);
  for (let i of list) {
    await Assert.verifyIfStringContains(
      CommonUtils.identifyData(i),
      CommonUtils.identifyData(value),
    );
  }
});

Then(/^I verify "([^"]*)" exist in "([^"]*)" list$/, async (value, list) => {
  list = CommonUtils.identifyData(list);
  value = CommonUtils.identifyData(value);
  let count = 0;
  for (let i of list) {
    if (value === i) {
      count++;
    }
  }
  if (count !== 1) {
    TM.fail('value does not exist');
  } else {
    TM.report('value exist in list');
  }
});

Then(/^I check value of "([^"]*)" is not equal to value of "([^"]*)"$/, async (value1, value2) => {
  value1 = CommonUtils.identifyData(value1);
  value2 = CommonUtils.identifyData(value2);
  await Assert.compareTwoStringsNotEqual(value1, value2);
  TM.report('Verified ' + value1 + ' is not equal to ' + value2);
});

Then(/^I verify "([^"]*)" exist in "([^"]*)"$/, async (value, list) => {
  list = CommonUtils.identifyData(list);
  for (let i of list) {
    await Assert.verifyIfTwoStringsAreEqual(
      CommonUtils.identifyData(i),
      CommonUtils.identifyData(value),
    );
  }
});
