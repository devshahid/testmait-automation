@webScraping!
Feature: Web Scrapping for Hot Wheels

@scrapping1!
Scenario:To fetch data from hotwheels
  Given I open the url "https://hotwheels.fandom.com/wiki/Hot_Wheels"
  When I click "//a[contains(text(),'1974')]"
  Then I get current url and store it in "webURL"
  Then I download hotwheels data with below instructions
      | year | categoryName | categoryLoop | from | to  |
      | 1974 | all          | all          | all  | all |