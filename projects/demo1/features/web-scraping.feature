@webScraping!
Feature: Web Scrapping for Hot Wheels

  @scrapping1!
  Scenario:To fetch data from hotwheels
    Given I open the url "https://hotwheels.fandom.com/wiki/List_of_2024_Hot_Wheels"
    # When I click "//a[contains(text(),'1977')]"
    Then I get current url and store it in "webURL"

    #  add this-> listAndCategoryNameCheck key in table and make it true to only check
    Then I download hotwheels data with below instructions
      | year | categoryName | categoryLoop | from | to |
      | 2024 | all          | all          | 10   | 12 |

  @scrapping2!
  Scenario:To fetch data from hotwheels
    Given I open the url "https://hotwheels.fandom.com/wiki/List_of_2025_Hot_Wheels"
    # When I click "//a[contains(text(),'1977')]"
    Then I get current url and store it in "webURL"

    #  add this-> listAndCategoryNameCheck key in table and make it true to only check
    Then I download hotwheels data with below instructions
      | year | categoryName | categoryLoop | from | to  |
      | 2025 | all          | all          | all  | all |