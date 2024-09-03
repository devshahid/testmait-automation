@webScraping!
Feature: Web Scrapping for Hot Wheels

@scrapping1!
Scenario:To fetch data from hotwheels
  Given I open the url "https://hotwheels.fandom.com/wiki/Hot_Wheels"
  When I click "//a[contains(text(),'1969')]"
  Then I get current url and store it in "webURL"
  # Then here grab the number of cars available loop over it
  Then I grab the total number of cars category
  Then I download hotwheels data "1969" for "1" car of range "1"
