@webScraping!
Feature: Web Scrapping for Hot Wheels

@scrapping1!
Scenario:To fetch data from hotwheels
  Given I open the url "https://hotwheels.fandom.com/wiki/List_of_1974_Hot_Wheels"
  # When I click "//a[contains(text(),'1977')]"
  Then I get current url and store it in "webURL"

  #  add this-> listAndCategoryNameCheck key in table and make it true to only check
  Then I download hotwheels data with below instructions
      | year | categoryName | categoryLoop | from | to  |
      | 1974 | all          | all          | 24   | all |