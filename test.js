function convertBDDToCode(cmd) {
  const conversionRules = [
    {
      regex: /(?:fill|enter)(?:\s+\w+)*\s+"([^"]+)"(?:\s+\w+)*\s+"([^"]+)"/i,
      template: "fillField('$var1', '$var2')",
    },
    {
      regex: /click\s+on(?:\s+\w+)*\s+"([^"]+)"/i,
      template: "click('$var1')",
    },
    {
      regex: /When I login to eShipper Portal with user "([^"]*)" and password "([^"]*)"/i,
      template:
        "TM.fillField('Enter your username', $var1) TM.fillField('Enter your password', $var2) TM.click('//button[text()='Login'])",
    },

    // Add more conversion rules for other commands as needed
  ];

  let convertedOutput = cmd; // Default to the original cmd if no match found

  for (const rule of conversionRules) {
    const match = cmd.match(rule.regex);
    let var1 = null;
    let var2 = null;
    if (match && match[1]) {
      var1 = match[1].trim(); // Trim whitespace from the captured value
    }
    if (match && match[2]) {
      var2 = match[2].trim(); // Trim whitespace from the captured value
    }

    if (match) {
      convertedOutput = rule.template.replace(/\$([0-9]+)/g, (match, index) => {
        return match === '$1' ? match : match[index];
      });

      const replacedString = convertedOutput.replace('$var1', var1);
      const replacedString2 = replacedString.replace('$var2', var2);
      convertedOutput = replacedString2.replace(/"'/g, '"').replace(/'"/g, '"');
      break; // Stop after the first match
    }
  }
  return convertedOutput;
}

cmd = 'I login to eShipper Portal with user "test" and password "testpassword"';
console.log(`original command ${cmd}`);
cmd = convertBDDToCode(cmd);
console.log(`converted command ${cmd}`);
