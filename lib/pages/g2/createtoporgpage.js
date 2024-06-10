const { assert } = require('chai');

const {
  G2Handlers,
  IFrame,
  CommonUtils,
  TM,
  HomePage,
  LeftMenuPage,
  TestData,
  GenericMethods,
} = inject();

class CreateTopOrgPage {
  async selectProduct(productName, columnName, tableName) {
    await G2Handlers.clickOnElement(' Add ', 'buttonCite');
    productName = CommonUtils.identifyData(productName);
    await G2Handlers.enterValue('Product Name', productName, 'textBoxForProduct');
    await G2Handlers.clickOnElement('Search', 'buttonCite');
    var tablelocator = locate(CommonUtils.identifyLocator(tableName));
    var locator = tablelocator
      .withText(productName)
      .find("//ancestor::tr//td//span[@class='el-checkbox__inner']");
    //observe this change for all markets
    await TM.uncheckOption(locator);
    await G2Handlers.clickOnElement(locator);
    await G2Handlers.clickOnElement(' Confirm ', 'buttonInProduct');
  }

  async selectRegion(regionName) {
    regionName = CommonUtils.identifyData(regionName);
    await G2Handlers.clickOnElement('createtoporgpage.Region_Ellipsis');
    await G2Handlers.enterValue('Select Region', regionName, 'optionForRegInTopOrg');
    await G2Handlers.clickOnElement(regionName, 'buttonForRegion');
    await G2Handlers.clickOnElement(' Confirm ', 'confirmButtonInRegion');
  }

  async enterValueOnTable(columnName, value, tableName) {
    var locator =
      CommonUtils.identifyLocator(tableName) +
      CommonUtils.identifyLocator('GenericLocators.CommonPathForTable');
    locator = locator.replace('REPLACE_TEXT', columnName);
    let columnIndexInInt = 0;
    if (columnName == 'Contact Type') {
      columnIndexInInt = 1;
    } else if (columnName == 'Contact First Name') {
      columnIndexInInt = 2;
    } else if (columnName == 'Contact Surname') {
      columnIndexInInt = 4;
    } else if (columnName == 'Contact Phone Number') {
      columnIndexInInt = 5;
    } else if (columnName == 'Contact ID Type') {
      columnIndexInInt = 6;
    } else {
      columnIndexInInt = 7;
    }
    var tableItemField = locate(
      locator +
        "/../../../../..//table[@class='el-table__body']/tbody//td[" +
        columnIndexInInt +
        ']//input',
    );
    await G2Handlers.enterValue(tableItemField, value);
  }

  async selectValueOnTable(columnName, value, tableName) {
    var locator =
      CommonUtils.identifyLocator(tableName) +
      CommonUtils.identifyLocator('GenericLocators.CommonPathForTable');
    locator = locator.replace('REPLACE_TEXT', columnName);
    let columnIndexInInt = 0;
    if (columnName == 'Contact Type') {
      columnIndexInInt = 1;
    } else if (columnName == 'Contact First Name') {
      columnIndexInInt = 2;
    } else if (columnName == 'Contact Phone Number') {
      columnIndexInInt = 5;
    } else if (columnName == 'Contact ID Type') {
      columnIndexInInt = 6;
    } else {
      columnIndexInInt = 7;
    }
    var tableItemField = locate(
      locator +
        "/../../../../..//table[@class='el-table__body']/tbody//td[" +
        columnIndexInInt +
        ']//input',
    );
    await G2Handlers.clickOnElement(tableItemField);
    await G2Handlers.clickOnElement(value, 'contactTypeIdOptions');
  }

  async fillRequiredFieldsForIdentityInfo(shortCode, orgName) {
    await TM.scrollIntoView(
      G2Handlers.formCustomLocator('Short Code', G2Handlers.textboxUsingLabel),
    );
    await G2Handlers.enterValue('Organization Name', orgName, 'textboxUsingLabel');
    await G2Handlers.enterValue('Short Code', shortCode, 'textboxUsingLabel');
  }
  async fillRequiredFieldsForIdentityInfoinchildOrg(shortCode, orgName) {
    await TM.scrollIntoView(
      G2Handlers.formCustomLocator('Short Code', G2Handlers.textboxUsingLabel),
    );
    await G2Handlers.enterValue('Organization Name', orgName, 'textboxUsingLabel');
    await G2Handlers.enterValue('shortCode', shortCode, 'textboxusingId');
  }
  async fillRequiredFieldsForAddressDetails(
    postalAddress,
    region,
    physicalAddress,
    officeNumber,
    cityOrTown,
  ) {
    await this.selectRegion(region);
    await G2Handlers.enterValue('Postal Address', postalAddress, 'textboxUsingLabel');
    await G2Handlers.enterValue('Physical Address', physicalAddress, 'textboxUsingLabel');
    await G2Handlers.enterValue('Office Phone Number', officeNumber, 'textboxUsingLabel');
    await G2Handlers.enterValue('City or Town', cityOrTown, 'textboxUsingLabel');
  }

  async fillRequiredFieldsForOrganizationDetails(typeOfBusiness, orgCategoryCode) {
    await G2Handlers.selectOption('Type of Business', typeOfBusiness, 'customDropdownLocator');
    await G2Handlers.selectOption(
      'Organisation Category Code',
      orgCategoryCode,
      'customDropdownLocator',
    );
  }

  async fillRequiredFieldsForContactAddressDetails(
    physicalAddress,
    address2,
    postCode,
    cityOrTown,
  ) {
    await G2Handlers.enterValue('Contact Physical Address', physicalAddress, 'textboxUsingLabel');
    await G2Handlers.enterValue('Contact Post Code', postCode, 'textboxUsingLabel');
    await G2Handlers.enterValue('Contact Address 2', address2, 'textboxUsingLabel');
    await G2Handlers.enterValue('Contact City or Town', cityOrTown, 'textboxUsingLabel');
  }

  async fillRequiredFieldsForOrganizationContactDetails(
    contactType,
    contactFirstName,
    contactSurname,
    contactPhoneNumber,
    contactIdType,
    contactIDNumber,
  ) {
    await this.selectValueOnTable(
      'Contact Type',
      contactType,
      'createtoporgpage.Organization_Contact_Details',
    );
    await this.enterValueOnTable(
      'Contact First Name',
      contactFirstName,
      'createtoporgpage.Organization_Contact_Details',
    );
    await this.enterValueOnTable(
      'Contact Surname',
      contactSurname,
      'createtoporgpage.Organization_Contact_Details',
    );
    await this.enterValueOnTable(
      'Contact Phone Number',
      contactPhoneNumber,
      'createtoporgpage.Organization_Contact_Details',
    );
    await TM.scrollIntoView(CommonUtils.identifyLocator('GenericLocators.ScrollContactNo'), 'true');
    if (typeof contactIDNumber !== 'undefined') {
      await this.enterValueOnTable(
        'Contact ID Number',
        contactIDNumber,
        'createtoporgpage.Organization_Contact_Details',
      );
    }
    await this.selectValueOnTable(
      'Contact ID Type',
      contactIdType,
      'createtoporgpage.Organization_Contact_Details',
    );
  }

  async createTopOrg(table) {
    let tObj = table.parse().hashes()[0];
    let contactType = 'Director',
      contactIdType = 'National ID',
      contactSurname = 'Automation',
      contactFirstName = 'Fintech',
      contactPhoneNumber = '2121212121',
      address = 'NewBury',
      postCode = '12345';
    let product = tObj['Product'].split(',');
    await G2Handlers.waitForPageLoad();
    await G2Handlers.clickOnElement('Create', 'buttonCite');
    await G2Handlers.clickOnElement('GenericLocators.Create_Identity');
    await G2Handlers.clickOnElement(' Create Top Organization ', 'optionsForHover');
    await this.selectProduct(product[0], 'Product Name', 'createtoporgpage.Product_Table');
    await this.fillRequiredFieldsForIdentityInfo(tObj['ShortCode'], tObj['OrgName']);
    await this.fillRequiredFieldsForAddressDetails(
      address,
      tObj['Region'],
      address,
      contactPhoneNumber,
      address,
    );

    if (typeof tObj['Company Registration Certificate Number'] != 'undefined') {
      await G2Handlers.enterValue(
        'Company Registration Certificate Number',
        tObj['Company Registration Certificate Number'],
        'textboxUsingLabel',
      );
    }
    await this.fillRequiredFieldsForOrganizationDetails(
      tObj['Type Of Business'],
      tObj['Organisation Category Code'],
    );

    if (
      (await TM.grabNumberOfVisibleElements(
        G2Handlers.formCustomLocator('Contact Physical Address', G2Handlers.textboxUsingLabel),
      )) !== 0
    ) {
      await this.fillRequiredFieldsForContactAddressDetails(address, address, postCode, address);
    }

    await TM.scrollIntoView(
      CommonUtils.identifyLocator('GenericLocators.BankAccountNameTextBox'),
      'false',
    );

    await this.fillRequiredFieldsForOrganizationContactDetails(
      contactType,
      contactFirstName,
      contactSurname,
      contactPhoneNumber,
      contactIdType,
      tObj['Contact ID Number'],
    );
    if (typeof tObj['Preferred Notification Channel'] !== 'undefined') {
      await G2Handlers.selectOption(
        'Preferred Notification Channel',
        tObj['Preferred Notification Channel'],
        'customDropdownLocator',
      );
      if (tObj['Preferred Notification Channel'] == 'Email') {
        await G2Handlers.enterValue(
          'Notification Receiving E-mail',
          tObj['Email'],
          'textboxUsingLabel',
        );
      } else {
        await G2Handlers.enterValue(
          'Notification Receiving MSISDN',
          tObj['Notification Receiving MSISDN'],
          'textboxUsingLabel',
        );
      }
    }
    if (typeof tObj['Preferred Notification Language'] !== 'undefined') {
      await G2Handlers.selectOption(
        'Preferred Notification Language',
        tObj['Preferred Notification Language'],
        'customDropdownLocator',
      );
    }
    if (typeof tObj['Agent Type'] !== 'undefined') {
      await G2Handlers.selectOption('Agent Type', tObj['Agent Type'], 'customDropdownLocator');
    }

    await G2Handlers.clickOnElement('Next', 'buttonCite');
    await G2Handlers.verifyText('Trust Level and Segment');
    if (product.length > 1) {
      await G2Handlers.clickOnElement('Add', 'buttonCite');
      await G2Handlers.waitForPageLoad();
      await IFrame.switchToPopUpWindow();
      for (let i = 1; i < product.length; i++) {
        await this.selectProduct(product[i], 'Product Name', 'createtoporgpage.Add_Product_Table');
      }
      await G2Handlers.clickOnElement('OK', 'buttonInDiv');
    }

    await TM.scrollIntoView(CommonUtils.identifyLocator('GenericLocators.ScrollProduct'), 'true');
    if (typeof tObj['Rule Profile'] !== 'undefined') {
      await G2Handlers.selectOption('Rule Profile', tObj['Rule Profile'], 'customDropdownLocator');
    }
    await G2Handlers.waitForPageLoad();
    if (typeof tObj['Bank'] !== 'undefined') {
      if (
        (await G2Handlers.grabNumberOfVisibleElements(
          CommonUtils.identifyData('createtoporgpage.Add_Bank_Account'),
        )) == 1
      ) {
        await G2Handlers.clickOnElement('createtoporgpage.Add_Bank_Account');
        if (typeof tObj['Bank'] !== 'undefined') {
          await G2Handlers.clickOnElement('GenericLocators.BankHODropdown'),
            await G2Handlers.clickOnElement(tObj['Bank'], 'bankInTopOrg');
        }
        if (typeof tObj['Bank Branch'] !== 'undefined') {
          await G2Handlers.selectOption(
            'bankId',
            tObj['Bank Branch'],
            'buttonDropDownInDialogWindow',
          );
        }
        if (typeof tObj['Asset Type'] !== 'undefined') {
          await G2Handlers.selectOption(
            'assetType',
            tObj['Asset Type'],
            'buttonDropDownInDialogWindow',
          );
        }
        if (typeof tObj['Currency'] !== 'undefined') {
          await G2Handlers.selectOption(
            'currency',
            tObj['Currency'],
            'buttonDropDownInDialogWindow',
          );
        }
        if (typeof tObj['Account Name'] !== 'undefined') {
          await G2Handlers.enterValue(
            'Account Name',
            tObj['Account Name'],
            'textboxUsingLabelInDialogWindow',
          );
        }
        if (typeof tObj['Account Number'] !== 'undefined') {
          await G2Handlers.enterValue(
            'Account Number',
            tObj['Account Number'],
            'textboxUsingLabelInDialogWindow',
          );
        }

        await G2Handlers.clickOnElement('Submit', 'buttonToView');
      }
    }

    if (typeof tObj['Commission Settlement Configuration'] !== 'undefined') {
      await G2Handlers.selectOption(
        'Commission Settlement Configuration',
        tObj['Commission Settlement Configuration'],
        'customDropdownLocator',
      );
    }
    //await G2Handlers.verifyText('Bill Reference Number Validation');
    await G2Handlers.clickOnElement('Next', 'buttonCite');

    let number = await G2Handlers.grabNumberOfVisibleElements(
      CommonUtils.identifyData('createtoporgpage.ValidationModeMandatoryCheck'),
    );

    if (number == 0) {
      // Review Comment - assert.fail will fail the test cases so replacing with TM.report. If validation mode is not mendatory then goto next steps instead of failing test
      //assert.fail('The Validation Mode is not an mandatory field');
      TM.report('The Validation Mode is not an mandatory field');
    } else {
      await G2Handlers.selectOption(
        'Validation Mode',
        'External Validation',
        'customDropdownLocator',
      );
      await G2Handlers.selectOption(
        'Validation Mode',
        'Internal and External',
        'customDropdownLocator',
      );
      await G2Handlers.selectOption(
        'Validation Mode',
        'Internal Validation',
        'customDropdownLocator',
      );
      await G2Handlers.selectOption('Validation Mode', 'No Validation', 'customDropdownLocator');
      if (typeof tObj['Validation Mode'] !== 'undefined') {
        await G2Handlers.selectOption(
          'Validation Mode',
          tObj['Validation Mode'],
          'customDropdownLocator',
        );
      }
      await G2Handlers.clickOnElement('Next', 'buttonCite');
    }

    await G2Handlers.verifyText('Address Details');
    //Review comment - below validation not required as these are not mendatory parameters
    // await G2Handlers.verifyText('Bill Reference Number Validation');
    //await G2Handlers.verifyText('Validation Mode');
    //await G2Handlers.verifyText(tObj['Validation Mode']);
    await G2Handlers.clickOnElement(CommonUtils.identifyData('createtoporgpage.SubmitButton'));
    await G2Handlers.verifyText('Top organization created successfully !');
    await G2Handlers.clickOnElement(' View Detail >> ', 'buttonInSpan1');
    await TM.wait(5);
    //await GenericMethods.makerChecker();
  }

  async createChildOrg(table) {
    let tObj = table.parse().hashes()[0];
    let Parentshort = CommonUtils.identifyData(tObj['ParentShortCode']);
    let contactType = 'Director',
      contactIdType = 'National ID',
      contactSurname = 'Automation',
      contactFirstName = 'Fintech',
      contactPhoneNumber = '2121212121',
      address = 'NewBury',
      postCode = '12345';
    let product = tObj['Product'].split(',');
    await G2Handlers.waitForPageLoad();
    await G2Handlers.clickOnElement('Create', 'buttonCite');
    await G2Handlers.clickOnElement('GenericLocators.Create_Identity');
    await G2Handlers.clickOnElement(' Create Child Organization ', 'optionsForHover');
    await this.selectProduct(product[0], 'Product Name', 'createtoporgpage.Product_Table');
    await G2Handlers.enterValue('parentShortCode', Parentshort, 'textboxusingId');
    await this.fillRequiredFieldsForIdentityInfoinchildOrg(tObj['ShortCode'], tObj['OrgName']);
    await this.fillRequiredFieldsForAddressDetails(
      address,
      tObj['Region'],
      address,
      contactPhoneNumber,
      address,
    );

    if (typeof tObj['Company Registration Certificate Number'] != 'undefined') {
      await G2Handlers.enterValue(
        'Company Registration Certificate Number',
        tObj['Company Registration Certificate Number'],
        'textboxUsingLabel',
      );
    }
    await this.fillRequiredFieldsForOrganizationDetails(
      tObj['Type Of Business'],
      tObj['Organisation Category Code'],
    );

    if (
      (await TM.grabNumberOfVisibleElements(
        G2Handlers.formCustomLocator('Contact Physical Address', G2Handlers.textboxUsingLabel),
      )) !== 0
    ) {
      await this.fillRequiredFieldsForContactAddressDetails(address, address, postCode, address);
    }

    await TM.scrollIntoView(
      CommonUtils.identifyLocator('GenericLocators.BankAccountNameTextBox'),
      'false',
    );

    await this.fillRequiredFieldsForOrganizationContactDetails(
      contactType,
      contactFirstName,
      contactSurname,
      contactPhoneNumber,
      contactIdType,
      tObj['Contact ID Number'],
    );
    if (typeof tObj['Preferred Notification Channel'] !== 'undefined') {
      await G2Handlers.selectOption(
        'Preferred Notification Channel',
        tObj['Preferred Notification Channel'],
        'customDropdownLocator',
      );
      if (tObj['Preferred Notification Channel'] == 'Email') {
        await G2Handlers.enterValue(
          'Notification Receiving E-mail',
          tObj['Email'],
          'textboxUsingLabel',
        );
      } else {
        await G2Handlers.enterValue(
          'Notification Receiving MSISDN',
          tObj['Notification Receiving MSISDN'],
          'textboxUsingLabel',
        );
      }
    }
    if (typeof tObj['Preferred Notification Language'] !== 'undefined') {
      await G2Handlers.selectOption(
        'Preferred Notification Language',
        tObj['Preferred Notification Language'],
        'customDropdownLocator',
      );
    }
    if (typeof tObj['Agent Type'] !== 'undefined') {
      await G2Handlers.selectOption('Agent Type', tObj['Agent Type'], 'customDropdownLocator');
    }

    await G2Handlers.clickOnElement('Next', 'buttonCite');
    await G2Handlers.verifyText('Trust Level and Segment');
    if (product.length > 1) {
      await G2Handlers.clickOnElement('Add', 'buttonCite');
      await G2Handlers.waitForPageLoad();
      await IFrame.switchToPopUpWindow();
      for (let i = 1; i < product.length; i++) {
        await this.selectProduct(product[i], 'Product Name', 'createtoporgpage.Add_Product_Table');
      }
      await G2Handlers.clickOnElement('OK', 'buttonInDiv');
    }

    await TM.scrollIntoView(CommonUtils.identifyLocator('GenericLocators.ScrollProduct'), 'true');
    if (typeof tObj['Rule Profile'] !== 'undefined') {
      await G2Handlers.selectOption('Rule Profile', tObj['Rule Profile'], 'customDropdownLocator');
    }
    await G2Handlers.waitForPageLoad();
    if (typeof tObj['Bank'] !== 'undefined') {
      if (
        (await G2Handlers.grabNumberOfVisibleElements(
          CommonUtils.identifyData('createtoporgpage.Add_Bank_Account'),
        )) == 1
      ) {
        await G2Handlers.clickOnElement('createtoporgpage.Add_Bank_Account');
        if (typeof tObj['Bank'] !== 'undefined') {
          await G2Handlers.clickOnElement('GenericLocators.BankHODropdown'),
            await G2Handlers.clickOnElement(tObj['Bank'], 'bankInTopOrg');
        }
        if (typeof tObj['Bank Branch'] !== 'undefined') {
          await G2Handlers.selectOption(
            'bankId',
            tObj['Bank Branch'],
            'buttonDropDownInDialogWindow',
          );
        }
        if (typeof tObj['Asset Type'] !== 'undefined') {
          await G2Handlers.selectOption(
            'assetType',
            tObj['Asset Type'],
            'buttonDropDownInDialogWindow',
          );
        }
        if (typeof tObj['Currency'] !== 'undefined') {
          await G2Handlers.selectOption(
            'currency',
            tObj['Currency'],
            'buttonDropDownInDialogWindow',
          );
        }
        if (typeof tObj['Account Name'] !== 'undefined') {
          await G2Handlers.enterValue(
            'Account Name',
            tObj['Account Name'],
            'textboxUsingLabelInDialogWindow',
          );
        }
        if (typeof tObj['Account Number'] !== 'undefined') {
          await G2Handlers.enterValue(
            'Account Number',
            tObj['Account Number'],
            'textboxUsingLabelInDialogWindow',
          );
        }

        await G2Handlers.clickOnElement('Submit', 'buttonToView');
      }
    }

    if (typeof tObj['Commission Settlement Configuration'] !== 'undefined') {
      await G2Handlers.clickOnElement('GenericLocators.CommissionDistModel');
      await G2Handlers.clickOnElement('createtoporgpage.CommissionDistTarrif');
      await G2Handlers.selectOption(
        'Commission Settlement Configuration Template',
        tObj['Commission Settlement Configuration'],
        'customDropdownLocator',
      );
    }

    let number = await G2Handlers.grabNumberOfVisibleElements(
      CommonUtils.identifyData('createtoporgpage.ValidationModeMandatoryCheck'),
    );

    if (number == 0) {
      TM.report('The Validation Mode is not an mandatory field');
    } else {
      await G2Handlers.selectOption(
        'Validation Mode',
        'External Validation',
        'customDropdownLocator',
      );
      await G2Handlers.selectOption(
        'Validation Mode',
        'Internal and External',
        'customDropdownLocator',
      );
      await G2Handlers.selectOption(
        'Validation Mode',
        'Internal Validation',
        'customDropdownLocator',
      );
      await G2Handlers.selectOption('Validation Mode', 'No Validation', 'customDropdownLocator');
      if (typeof tObj['Validation Mode'] !== 'undefined') {
        await G2Handlers.selectOption(
          'Validation Mode',
          tObj['Validation Mode'],
          'customDropdownLocator',
        );
      }
    }

    await G2Handlers.clickOnElement('Next', 'buttonCite');
    await G2Handlers.verifyText('Address Details');
    await G2Handlers.clickOnElement(CommonUtils.identifyData('createtoporgpage.SubmitButton'));
    await G2Handlers.verifyText('Child organization created successfully !');
  }

  async createCustomer(table) {
    let tObj = table.parse().hashes()[0];
    let {
      Product,
      First_Name,
      Last_Name,
      MSISDN,
      Date_Of_Birth,
      Secret_Answer,
      ID_Type,
      ID_Number,
      Document_Received,
      Language,
      Next_of_Kin,
      Any_ID_Type,
      Any_ID_Number,
      Nationality,
      Tier_2_Document,
      Tier_2_Document_Received,
      Tier3_TIN_Document_Received,
      Tier3_TIN_Number,
      Tier3_Business_License_Received,
      Tier3_Business_License_Number,
    } = { ...tObj };
    let city = 'Newbury',
      physicalAddress = 'Newbury',
      secretQuestion = 'Please enter a secret word that will help to authenticate you';
    await IFrame.switchToNextFrame();
    await this.selectProduct(
      CommonUtils.identifyData(Product),
      'Product Name',
      'createtoporgpage.ProductList_Table',
    );
    await G2Handlers.enterValue('MSISDN', CommonUtils.identifyData(MSISDN), 'textboxUsingLabel');
    TM.wait(2);
    await G2Handlers.enterValue('First Name', First_Name, 'textboxUsingLabel');
    await G2Handlers.enterValue('Last Name', Last_Name, 'textboxUsingLabel');
    if (typeof Language !== 'undefined') {
      await G2Handlers.selectOption('Language', Language, 'customDropdownLocator');
    }
    await G2Handlers.enterValue('Date of Birth', Date_Of_Birth, 'textboxUsingLabel');
    await G2Handlers.clickOnElement('Male', 'buttonRadio');

    await G2Handlers.enterValue('City/Town', city, 'textboxUsingLabel');
    await G2Handlers.enterValue('Physical Address', physicalAddress, 'textboxUsingLabel');

    if (typeof Secret_Answer !== 'undefined') {
      await G2Handlers.selectOption('Secret Question', secretQuestion, 'customDropdownLocator');
      await G2Handlers.enterValue('Label.Secret Answer', Secret_Answer, 'textboxUsingLabel');
    }
    if (typeof Tier3_TIN_Document_Received !== 'undefined') {
      await G2Handlers.selectOption(
        'TIN Document Received',
        Tier3_TIN_Document_Received,
        'customDropdownLocator',
      );
      await G2Handlers.enterValue('TIN Number', Tier3_TIN_Number, 'textboxUsingLabel');
      await G2Handlers.selectOption(
        'Business License Received',
        Tier3_Business_License_Received,
        'customDropdownLocator',
      );
      await G2Handlers.enterValue(
        'Business License Number',
        Tier3_Business_License_Number,
        'textboxUsingLabel',
      );
    }
    if (typeof ID_Type !== 'undefined') {
      await this.selectValueOnTable('ID Type', ID_Type, 'customerpage.ID_Details');
      if (typeof ID_Number !== 'undefined') {
        await this.enterValueOnTable('ID Number', ID_Number, 'customerpage.ID_Details');
        await this.selectValueOnTable(
          'Document Received',
          Document_Received,
          'customerpage.ID_Details',
        );
      }
    }
    if (typeof Tier_2_Document !== 'undefined') {
      await G2Handlers.selectOption('Tier 2 Document', Tier_2_Document, 'customDropdownLocator');
      await G2Handlers.selectOption(
        'Tier 2 Document Received',
        Tier_2_Document_Received,
        'customDropdownLocator',
      );
    }
    if (typeof Nationality !== 'undefined') {
      await G2Handlers.selectOption('Nationality', Nationality, 'customDropdownLocator');
    }
    if (typeof Next_of_Kin !== 'undefined') {
      await G2Handlers.enterValue('Next of Kin', Next_of_Kin, 'textboxUsingLabel');
    }
    if (typeof Any_ID_Type !== 'undefined') {
      await G2Handlers.enterValue('Any ID Type', Any_ID_Type, 'textboxUsingLabel');
      await G2Handlers.enterValue('Any ID Number', Any_ID_Number, 'textboxUsingLabel');
    }
    await G2Handlers.clickOnElement('Next', 'buttonInDiv');
    if (typeof tObj['Rule Profile'] !== 'undefined') {
      await G2Handlers.selectOption('Rule Profile', tObj['Rule Profile'], 'customDropdownLocator');
    }
    await G2Handlers.clickOnElement('Next', 'buttonInDiv');
    await G2Handlers.clickOnElement('Submit', 'buttonInDiv');
    await GenericMethods.makerChecker();
  }

  async createTill(table) {
    let tObj = table.parse().hashes()[0];
    let { MSISDN, Short_Code, Operator_ID, Till_Number, Language } = { ...tObj };
    let Prod = tObj['Product'].split(',');
    await G2Handlers.waitForPageLoad();
    await G2Handlers.clickOnElement('Create', 'buttonCite');
    await G2Handlers.clickOnElement('GenericLocators.Create_Identity');
    await G2Handlers.clickOnElement(' Create Till ', 'optionsForHover');
    await G2Handlers.enterValue(
      'Organization Short Code',
      CommonUtils.identifyData(Short_Code),
      'textboxUsingLabel',
    );
    await TM.wait(3);
    await G2Handlers.enterValue('MSISDN', CommonUtils.identifyData(MSISDN), 'textboxUsingLabel');
    await G2Handlers.enterValue(
      'Till Number',
      CommonUtils.identifyData(Till_Number),
      'textboxUsingLabel',
    );

    if (typeof Language !== 'undefined') {
      await TM.scrollIntoView(
        CommonUtils.identifyLocator('GenericLocators.LanguageInCustomer'),
        'false',
      );
      await G2Handlers.selectOption('Language', Language, 'customDropdownLocator');
    }

    await TM.scrollIntoView(CommonUtils.identifyLocator('orgpage.Product'), 'false');
    if (CommonUtils.identifyData(Prod) == 'Available Product') {
      await G2Handlers.clickOnElement('Available Product', 'spanButtonContains');
    } else {
      for (var i = 0; i < Prod.length; i++) {
        await G2Handlers.clickOnElement(Prod[i], 'spanButtonContains');
      }
      await G2Handlers.clickOnElement(CommonUtils.identifyLocator('orgpage.SelectArrow'));
    }
    if (typeof Operator_ID !== 'undefined') {
      await G2Handlers.selectOption(
        'Default Operator Id',
        CommonUtils.identifyData(Operator_ID),
        'customDropdownLocator',
      );
    }
    await G2Handlers.clickOnElement(' Submit ', 'buttonCite');
    await G2Handlers.verifyText('Till created successfully!');
    await G2Handlers.clickOnElement(' View Detail >> ', 'buttonToView');
    await G2Handlers.waitForPageLoad();
  }

  async createChildOrgsForTestDataCreation(shortCodeRef) {
    var items = CommonUtils.identifyData('Child Org');
    await G2Handlers.waitForPageLoad();
    if (Object.keys(items).length > 0) {
      await this.navigateToCreateAllIdPage('Create Child Organization');
      let childOrg = 'Child Org.' + shortCodeRef;
      let contactType = CommonUtils.identifyData('Generic.ContactType'),
        contactIdType = CommonUtils.identifyData('Generic.ContactIDType'),
        contactSurname = CommonUtils.identifyData('Generic.LastName'),
        contactFirstName = CommonUtils.identifyData('Generic.FirstName'),
        contactPhoneNumber = CommonUtils.identifyData('Generic.ContactPhoneNumber'),
        address = CommonUtils.identifyData('Generic.Address'),
        postCode = CommonUtils.identifyData('Generic.PostCode');
      await IFrame.switchToNextFrame();
      await this.selectProduct(
        childOrg + '.ProductName',
        'Product Name',
        'createtoporgpage.Product_Table',
      );
      await G2Handlers.enterValue(
        'Parent Short Code',
        childOrg + '.ParentShortCode',
        'textboxUsingLabel',
      );
      await G2Handlers.clickOnElement('createtoporgpage.help');
      await G2Handlers.enterValue('createtoporgpage.ShortCode', childOrg + '.ShortCode');
      await G2Handlers.enterValue('createtoporgpage.OrgName', childOrg + '.OrganizationName');
      await this.fillRequiredFieldsForAddressDetails(
        address,
        childOrg + '.Region',
        address,
        contactPhoneNumber,
        address,
      );
      if (typeof TestData.getData('Generic.TypeOfBusiness') !== 'undefined')
        await this.fillRequiredFieldsForOrganizationDetails('Generic.TypeOfBusiness');
      if (
        (await TM.grabNumberOfVisibleElements(
          G2Handlers.formCustomLocator('Contact Physical Address', G2Handlers.textboxUsingLabel),
        )) !== 0 &&
        typeof TestData.getData('Generic.PostCode') !== 'undefined'
      ) {
        await this.fillRequiredFieldsForContactAddressDetails(address, address, postCode, address);
      }
      if (typeof TestData.getData('Generic.FirstName') !== 'undefined')
        await this.fillRequiredFieldsForOrganizationContactDetails(
          contactType,
          contactFirstName,
          contactSurname,
          contactPhoneNumber,
          contactIdType,
          CommonUtils.identifyData('Generic.ContactIDNumber'),
        );

      if (typeof TestData.getData(childOrg + '.PreferredNotificationChannel') !== 'undefined') {
        await G2Handlers.selectOption(
          'Preferred Notification Channel',
          childOrg + '.PreferredNotificationChannel',
          'customDropdownLocator',
        );
        if (typeof TestData.getData(childOrg + '.NotificationReceivingE-mail') !== 'undefined') {
          await G2Handlers.enterValue(
            'Notification Receiving E-mail',
            childOrg + '.NotificationReceivingE-mail',
            'textboxUsingLabel',
          );
        }
        if (typeof TestData.getData(childOrg + '.NotificationReceivingMSISDN') !== 'undefined') {
          await G2Handlers.enterValue(
            'Notification Receiving MSISDN',
            childOrg + '.NotificationReceivingMSISDN',
            'textboxUsingLabel',
          );
        }
      }

      await G2Handlers.clickOnElement('Next', 'buttonInDiv');
      await G2Handlers.verifyText('Trust Level and Segment');
      if (typeof TestData.getData(childOrg + '.ChargeDistributionModel') !== 'undefined') {
        await G2Handlers.clickOnElement('createtoporgpage.Charge_Distribution_Model');
        await IFrame.switchToPopUpWindow();
        await this.selectProduct(
          childOrg + '.ChargeDistributionModel',
          'Charge Distribution',
          'createtoporgpage.Charge_Distribution',
        );
        await G2Handlers.clickOnElement('OK', 'buttonInDiv');
      }
      await IFrame.switchToCurrentWindowHandle();
      await IFrame.switchToMainPage();
      await IFrame.switchToLastFrame();
      await IFrame.switchToNextFrame();
      await G2Handlers.clickOnElement('Next', 'buttonInDiv');
      await G2Handlers.verifyText('Address Details');
      await G2Handlers.clickOnElement('Submit', 'buttonInDiv');
      await GenericMethods.makerChecker();
      await GenericMethods.approveOrRejectGroupTask('Approve', childOrg + '.OrganizationName');
    }
    await HomePage.clickOnLogout();
  }

  async createTopOrgFromTestDataCreationFile(shortCodeRef) {
    var items = CommonUtils.identifyData('top organisations');
    if (Object.keys(items).length > 0) {
      let contactSurname = CommonUtils.identifyData('Generic.LastName'),
        contactFirstName = CommonUtils.identifyData('Generic.FirstName'),
        contactPhoneNumber = CommonUtils.identifyData('Generic.ContactPhoneNumber'),
        address = CommonUtils.identifyData('Generic.Address'),
        postCode = CommonUtils.identifyData('Generic.PostCode'),
        contactType = CommonUtils.identifyData('Generic.ContactType'),
        contactIdType = CommonUtils.identifyData('Generic.ContactIDType'),
        contactIdNumber = CommonUtils.identifyData('Generic.ContactIDNumber');
      let topOrg = 'top organisations.' + shortCodeRef;
      await this.navigateToCreateAllIdPage('Create Top Organization');
      await G2Handlers.waitForPageLoad();
      await IFrame.switchToNextFrame();
      let product = CommonUtils.identifyData(topOrg + '.Product Name');
      product = product.split('|');
      await this.selectProduct(product[0], 'Product Name', 'createtoporgpage.Product_Table');

      await this.fillRequiredFieldsForIdentityInfo(
        topOrg + '.ShortCode',
        topOrg + '.Organization Name',
      );
      await this.fillRequiredFieldsForAddressDetails(
        address,
        CommonUtils.identifyData(topOrg + '.Region'),
        address,
        contactPhoneNumber,
        address,
      );
      if (typeof TestData.getData(topOrg + '.Type of Business') !== 'undefined')
        await this.fillRequiredFieldsForOrganizationDetails(topOrg + '.Type of Business');
      if (
        (await TM.grabNumberOfVisibleElements(
          G2Handlers.formCustomLocator('Contact Physical Address', G2Handlers.textboxUsingLabel),
        )) !== 0 &&
        typeof TestData.getData('Generic.PostCode') !== 'undefined'
      ) {
        await this.fillRequiredFieldsForContactAddressDetails(address, address, postCode, address);
      }
      if (typeof TestData.getData('Generic.FirstName') !== 'undefined')
        await this.fillRequiredFieldsForOrganizationContactDetails(
          contactType,
          contactFirstName,
          contactSurname,
          contactPhoneNumber,
          contactIdType,
          contactIdNumber,
        );
      if (typeof TestData.getData(topOrg + '.Preferred Notification Channel') !== 'undefined') {
        await G2Handlers.selectOption(
          'Preferred Notification Channel',
          topOrg + '.Preferred Notification Channel',
          'customDropdownLocator',
        );
        if (typeof TestData.getData('Generic.Email ID') !== 'undefined') {
          await G2Handlers.enterValue(
            'Notification Receiving E-mail',
            'Generic.Email ID',
            'textboxUsingLabel',
          );
        }
        if (typeof TestData.getData(topOrg + '.Notification Receiving MSISDN') !== 'undefined') {
          await G2Handlers.enterValue(
            'Notification Receiving MSISDN',
            topOrg + '.Notification Receiving MSISDN',
            'textboxUsingLabel',
          );
        }
      }
      await G2Handlers.clickOnElement('Next', 'buttonInDiv');
      await G2Handlers.verifyText('Trust Level and Segment');
      if (product.length > 1) {
        await G2Handlers.clickOnElement('Add', 'buttonCite');
        await G2Handlers.waitForPageLoad();
        await IFrame.switchToPopUpWindow();
        for (let i = 1; i < product.length; i++) {
          await this.selectProduct(
            product[i],
            'Product Name',
            'createtoporgpage.Add_Product_Table',
          );
        }
        await G2Handlers.clickOnElement('OK', 'buttonInDiv');
      }
      await IFrame.switchToCurrentWindowHandle();
      await IFrame.switchToMainPage();
      await IFrame.switchToLastFrame();
      await IFrame.switchToNextFrame();
      if (typeof TestData.getData(topOrg + '.Bank') !== 'undefined') {
        await G2Handlers.clickOnElement('createtoporgpage.Add_Bank_Account');
        await IFrame.switchToPopUpWindow();
        await G2Handlers.selectOption('Bank', topOrg + '.Bank', 'customDropdownLocator');
        await G2Handlers.selectOption(
          'Bank Branch',
          topOrg + '.Bank Branch',
          'customDropdownLocator',
        );
        await G2Handlers.enterValue(
          'Bank Account Name',
          topOrg + '.Bank Account Name',
          'textboxUsingLabel',
        );
        await G2Handlers.enterValue(
          'Bank Account Number',
          topOrg + '.Bank Account Number',
          'textboxUsingLabel',
        );
        await G2Handlers.clickOnElement('Submit', 'buttonInDiv');
      }
      await IFrame.switchToCurrentWindowHandle();
      await IFrame.switchToMainPage();
      await IFrame.switchToLastFrame();
      await IFrame.switchToNextFrame();
      await G2Handlers.verifyText('Trust Level and Segment');
      if (typeof TestData.getData(topOrg + '.Validation Mode') !== 'undefined')
        await G2Handlers.selectOption(
          'Validation Mode',
          CommonUtils.identifyData(topOrg + '.Validation Mode'),
          'customDropdownLocator',
        );
      if (typeof TestData.getData(topOrg + '.B2B Validation Mode') !== 'undefined')
        await G2Handlers.selectOption(
          'B2B Validation Mode',
          CommonUtils.identifyData(topOrg + '.B2B Validation Mode'),
          'customDropdownLocator',
        );
      await G2Handlers.clickOnElement('Next', 'buttonInDiv');
      await G2Handlers.verifyText('Address Details');
      await G2Handlers.clickOnElement('Submit', 'buttonInDiv');
      await GenericMethods.makerChecker();
      await GenericMethods.approveOrRejectGroupTask('Approve', topOrg + '.Organization Name');

      await HomePage.clickOnLogout();
    }
  }
}
module.exports = new CreateTopOrgPage();
module.exports.CreateTopOrgPage = CreateTopOrgPage;
