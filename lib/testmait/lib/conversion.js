function convertBDDToCode(cmd) {
  const conversionRules = [
    {
      regex: /When I fill field for "([^"]*)" with value "([^"]*)"/i,
      template: "fillField('$var1', '$var2')",
    },
    {
      regex: /When I click "([^"]*)"/i,
      template: "TM.click('$var1')",
    },
    {
      regex: /When I login to eShipper Portal with user "([^"]*)" and password "([^"]*)"/i,
      template:
        "TM.fillField('Enter your username', '$var1') TM.fillField('Enter your password', '$var2') TM.wait(2) TM.click('Login')",
    },

    {
      regex: /Then I logout/i,
      template: "TM.click({ id: 'profile__dropdown' }) TM.click({ id: 'app__logout' }) ",
    },

    {
      regex: /When I select courier service at position (\d+)/i,
      template: "TM.click(//jhi-rate-line['$var1']);",
    },

    {
      regex: /When I fill field for "([^"]*)" at position (\d+) with value "([^"]*)"/i,
      template: "TM.fillField('(//input[@placeholder=\"$var1\"])[$var2]','$var3')",
    },

    {
      regex: /When I fill field for textarea "([^"]*)" at position (\d+) with value "([^"]*)"/i,
      template: "TM.fillField('(//textarea[@placeholder=\"$var1\"])[$var2]','$var3')",
    },

    {
      regex: /When I click on input for "([^"]*)" at position (\d+)"/i,
      template: 'TM.click(\'(//input[@placeholder="$var1"])[$var2]\')',
    },

    {
      regex: /When I click on list for "([^"]*)" at position (\d+)"/i,
      template: 'TM.click(\'(//mat-select[@placeholder="$var1"])[$var2]\')',
    },

    {
      regex: /When I click on input for "([^"]*)"/i,
      template: 'TM.click(\'(//input[@placeholder="$var1"])\')',
    },

    {
      regex: /When I pick "([^"]*)" from option "([^"]*)"/i,
      template: "TM.click('$var1') TM.click('$var2') ",
    },

    {
      regex: /When I pick option "([^"]*)" from "([^"]*)"/i,
      template:
        'TM.click(`//span[contains(text(), "${var2}")]`) TM.click(`//span[contains(text(), "${var1}")]`)',
    },
    {
      regex: /When I click on button "([^"]*)"/i,
      template: 'TM.click(`//button[contains(text(), "${var1}")]`)',
    },

    {
      regex: /When I click on "([^"]*)"/i,
      template: 'TM.click(`//span[(text()="${$var1}")]`)',
    },

    {
      regex: /When I select option "([^"]*)" from "([^"]*)" at position (\d+)/i,
      template:
        "TM.click('(//mat-select[@ng-reflect-placeholder=\"$var2\"])[$var3]') TM.click(locate('span.mat-option-text').withText($var1))",
    },

    {
      regex: /When I select "([^"]*)" from "([^"]*)" dropdown/i,
      template: "TM.click('$var2') TM.click('$var1)",
    },

    {
      regex: /When I click on apply/i,
      template: "TM.click('//div[contains(@class, 'mat-menu-content')]//button[(text()='Apply')]')",
    },

    {
      regex: /Then I see "([^"]*)"/i,
      template: "TM.see('var1')",
    },

    {
      regex: /Then I see "([^"]*)" in current url"/i,
      template: "TM.seeInCurrentUrl('var1')",
    },

    {
      regex: /Then I see "([^"]*)" in title"/i,
      template: "TM.seeInTitle('var1')",
    },

    {
      regex: /I see title is "([^"]*)""/i,
      template: "TM.seeTitleEquals('var1')",
    },

    {
      regex: /I see "([^"]*)" in source"/i,
      template: "TM.seeInSource('var1')",
    },

    // Add more conversion rules for other commands as needed
  ];

  let convertedOutput = cmd; // Default to the original cmd if no match found

  for (const rule of conversionRules) {
    const match = cmd.match(rule.regex);
    let var1 = null;
    let var2 = null;
    let var3 = null;

    if (match && match[1]) {
      var1 = match[1].trim(); // Trim whitespace from the captured value
    }
    if (match && match[2]) {
      var2 = match[2].trim(); // Trim whitespace from the captured value
    }

    if (match && match[3]) {
      var3 = match[3].trim(); // Trim whitespace from the captured value
    }

    if (match) {
      convertedOutput = rule.template.replace(/\$([0-9]+)/g, (match, index) => {
        return match === '$1' ? match : match[index];
      });
      const replacedString = convertedOutput.replace('$var1', var1);
      const replacedString2 = replacedString.replace('$var2', var2);
      const replacedString3 = replacedString2.replace('$var3', var3);
      convertedOutput = replacedString3.replace(/"'/g, '"').replace(/'"/g, '"');
      break; // Stop after the first match
    }
  }
  return convertedOutput;
}

module.exports = { convertBDDToCode };
