/**
 * Collection of page object models to be registered in the
 * TestMaiT dependency injection container and included
 * in tests via the testmait.conf.js configuration file
 */
module.exports = {
  Login: './lib/pages/lmp/login.js',
  LoginPage: './lib/pages/g2/loginpage.js',
  HomePage: './lib/pages/g2/homepage.js',
  CreateTopOrgPage: './lib/pages/g2/createtoporgpage.js',
  LeftMenuPage: './lib/pages/g2/leftmenupage.js',
  GenericMethods: './lib/pages/g2/genericMethods.js',
  AdminPage: './lib/pages/g2/adminpage.js',
  SearchPage: './lib/pages/g2/searchpage.js',
  CustomerInfoPage: './lib/pages/g2/customerinfopage.js',
  HotWheelPage: './lib/pages/hotwheels/web.page.js',
};
