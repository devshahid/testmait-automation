@webScraping!
Feature: Web Scrapping for Hot Wheels

  @scrapping1!
  Scenario:To fetch data from hotwheels
    Given I open the url "https://hotwheels.fandom.com/wiki/Action_Packs"
    Then I get current url and store it in "mainWebURL"
    Then I grab the total number of cars category for special edition
    Then I download hotwheels data with below instructions
      | year         | categoryName | categoryLoop | from | to  |
      | Action_Packs | all          | all          | all  | all |

  @scrapping2!
  Scenario:To fetch data from hotwheels
    Given I open the url "https://hotwheels.fandom.com/wiki/DC_Teen_Titans_Go!_Character_Cars"
    Then I get current url and store it in "webURL"
    Then I download hotwheels data with below instructions
      | year                             | categoryName | categoryLoop | from | to  | locator        |
      | DC_Teen_Titans_Go_Character_Cars | all          | all          | all  | all | updatedCarList |

  @scrapping3!
  Scenario:To fetch data from hotwheels
    Given I open the url "https://hotwheels.fandom.com/wiki/Avatar:_The_Last_Airbender_Character_Cars"
    Then I get current url and store it in "webURL"
    Then I download hotwheels data with below instructions
      | year                              | categoryName | categoryLoop | from | to  | locator             |
      | The_Last_Airbender_Character_Cars | all          | all          | all  | all | secondCarTableTitle |

  @scrapping4!
  Scenario:To fetch data from hotwheels
    Given I open the url "https://hotwheels.fandom.com/wiki/Hot_Wheels_Classics"
    Then I get current url and store it in "webURL"
    Then I download hotwheels data with below instructions
      | year                | categoryName | categoryLoop | from | to  | locator        |
      | Hot_Wheels_Classics | all          | all          | all  | all | updatedCarList |

  @scrapping5!
  Scenario:To fetch data from hotwheels
    Given I open the url "https://hotwheels.fandom.com/wiki/2024_Car_Culture"
    Then I get current url and store it in "webURL"
    Then I download hotwheels data with below instructions
      | year             | categoryName | categoryLoop | from | to  |
      | 2024 Car Culture | Race Day     | all          | 5    | all |
