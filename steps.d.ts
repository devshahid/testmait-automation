/// <reference types='testmait' />
type steps_file = typeof import('./steps_file.js');
type TestData = typeof import('./lib/configs/global_test_data.js');
type Login = typeof import('./lib/pages/lmp/login.js');
type LoginPage = typeof import('./lib/pages/g2/loginpage.js');
type HomePage = typeof import('./lib/pages/g2/homepage.js');
type CreateTopOrgPage = typeof import('./lib/pages/g2/createtoporgpage.js');
type LeftMenuPage = typeof import('./lib/pages/g2/leftmenupage.js');
type GenericMethods = typeof import('./lib/pages/g2/genericMethods.js');
type AdminPage = typeof import('./lib/pages/g2/adminpage.js');
type Assert = typeof import('./lib/components/assert.js');
type ButtonLink = typeof import('./lib/components/button.js');
type CheckBox = typeof import('./lib/components/checkbox.js');
type DatePicker = typeof import('./lib/components/date_picker.js');
type Dropdown = typeof import('./lib/components/dropdown.js');
type Filter = typeof import('./lib/components/filter.js');
type LmpApi = typeof import('./lib/components/lmp/lmp_api_handler.js');
type Mobile = typeof import('./lib/components/mobile_handlers.js');
type OpenApi = typeof import('./lib/components/open_api/open_api_handler.js');
type Table = typeof import('./lib/components/table.js');
type Textbox = typeof import('./lib/components/textbox.js');
type SoapApi = typeof import('./lib/components/soap_api_handler.js');
type USSD = typeof import('./lib/components/mobile/ussd.js');
type MobileComponent = typeof import('./lib/components/mobile/mobilecomponent.js');
type G2Ussd = typeof import('./lib/components/mobile/g2ussd.js');
type G2Handlers = typeof import('./lib/components/g2handlers.js');
type IFrame = typeof import('./lib/components/frame.js');
type CommonUtils = typeof import('./lib/utils/common.js');
type Csv = typeof import('./lib/utils/csv.js');
type Email = typeof import('./lib/utils/email.js');
type LoggerFactory = typeof import('./lib/utils/logging.js');
type ChaiWrapper = import('testmait-chai');
type Reporter = import('./lib/helpers/reporter.js');
type SearchPage = typeof import('./lib/pages/g2/searchpage.js');
type CustomerInfoPage = typeof import('./lib/pages/g2/customerinfopage.js');

declare namespace TestMaiT {
  interface SupportObject {
    TM: TM;
    current: any;
    TestData: TestData;
    Login: Login;
    LoginPage: LoginPage;
    HomePage: HomePage;
    CreateTopOrgPage: CreateTopOrgPage;
    LeftMenuPage: LeftMenuPage;
    GenericMethods: GenericMethods;
    AdminPage: AdminPage;
    Assert: Assert;
    ButtonLink: ButtonLink;
    CheckBox: CheckBox;
    DatePicker: DatePicker;
    Dropdown: Dropdown;
    Filter: Filter;
    LmpApi: LmpApi;
    Mobile: Mobile;
    OpenApi: OpenApi;
    Table: Table;
    Textbox: Textbox;
    SoapApi: SoapApi;
    USSD: USSD;
    MobileComponent: MobileComponent;
    G2Ussd: G2Ussd;
    G2Handlers: G2Handlers;
    IFrame: IFrame;
    CommonUtils: CommonUtils;
    Csv: Csv;
    Email: Email;
    LoggerFactory: LoggerFactory;
    SearchPage: SearchPage;
    CustomerInfoPage: CustomerInfoPage;
  }
  interface Methods extends Appium, ChaiWrapper, FileSystem, Reporter, Webdriver {}
  interface TM
    extends ReturnType<steps_file>,
      WithTranslation<ChaiWrapper>,
      WithTranslation<Reporter>,
      WithTranslation<FileSystem> {}
  namespace Translation {
    interface Actions {}
  }
}
