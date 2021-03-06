/**
 * Copyright since 2007 PrestaShop SA and Contributors
 * PrestaShop is an International Registered Trademark & Property of PrestaShop SA
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Open Software License (OSL 3.0)
 * that is bundled with this package in the file LICENSE.md.
 * It is also available through the world-wide-web at this URL:
 * https://opensource.org/licenses/OSL-3.0
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@prestashop.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade PrestaShop to newer
 * versions in the future. If you wish to customize PrestaShop for your
 * needs please refer to https://devdocs.prestashop.com/ for more information.
 *
 * @author    PrestaShop SA and Contributors <contact@prestashop.com>
 * @copyright Since 2007 PrestaShop SA and Contributors
 * @license   https://opensource.org/licenses/OSL-3.0 Open Software License (OSL 3.0)
 */
require('module-alias/register');

const {expect} = require('chai');

// Import Utils
const helper = require('@utils/helpers');
const loginCommon = require('@commonTests/loginBO');

// Import data
const EmployeeFaker = require('@data/faker/employee');

// Import pages
const LoginPage = require('@pages/BO/login/index');
const DashboardPage = require('@pages/BO/dashboard/index');
const EmployeesPage = require('@pages/BO/advancedParameters/team/index');
const AddEmployeePage = require('@pages/BO/advancedParameters/team/add');
const ProductsPage = require('@pages/BO/catalog/products/index');
const OrdersPage = require('@pages/BO/orders/index');
const FOBasePage = require('@pages/FO/FObasePage');

// Import test context
const testContext = require('@utils/testContext');

const baseContext = 'functional_BO_advancedParams_team_employees_CRUDEmployee';

let browserContext;
let page;
let numberOfEmployees = 0;

const createEmployeeData = new EmployeeFaker({
  defaultPage: 'Products',
  language: 'English (English)',
  permissionProfile: 'Salesman',
});

const firstEditEmployeeData = new EmployeeFaker({
  password: '123456789',
  defaultPage: 'Orders',
  language: 'English (English)',
  permissionProfile: 'Salesman',
});

const secondEditEmployeeData = new EmployeeFaker({
  defaultPage: 'Orders',
  language: 'English (English)',
  permissionProfile: 'Salesman',
  active: false,
});

// Init objects needed
const init = async function () {
  return {
    loginPage: new LoginPage(page),
    dashboardPage: new DashboardPage(page),
    employeesPage: new EmployeesPage(page),
    addEmployeePage: new AddEmployeePage(page),
    productsPage: new ProductsPage(page),
    ordersPage: new OrdersPage(page),
    foBasePage: new FOBasePage(page),
  };
};

// Create, Read, Update and Delete Employee in BO
describe('Create, Read, Update and Delete Employee in BO', async () => {
  // before and after functions
  before(async function () {
    browserContext = await helper.createBrowserContext(this.browser);
    page = await helper.newTab(browserContext);

    // Init page objects
    this.pageObjects = await init();
  });

  after(async () => {
    await helper.closeBrowserContext(browserContext);
  });

  // Login from BO and go to "Advanced parameters>Team" page
  loginCommon.loginBO();

  it('should go to "Advanced parameters>Team" page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToAdvancedParamsPage', baseContext);

    await this.pageObjects.dashboardPage.goToSubMenu(
      this.pageObjects.dashboardPage.advancedParametersLink,
      this.pageObjects.dashboardPage.teamLink,
    );

    await this.pageObjects.employeesPage.closeSfToolBar();

    const pageTitle = await this.pageObjects.employeesPage.getPageTitle();
    await expect(pageTitle).to.contains(this.pageObjects.employeesPage.pageTitle);
  });

  it('should reset all filters and get number of employees', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'resetFilterFirst', baseContext);
    numberOfEmployees = await this.pageObjects.employeesPage.resetAndGetNumberOfLines();
    await expect(numberOfEmployees).to.be.above(0);
  });

  // 1 : Create employee and go to FO to check sign in is OK
  describe('Create employee in BO and check Sign in in BO', async () => {
    it('should go to add new employee page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'goToNewEmployeePage', baseContext);

      await this.pageObjects.employeesPage.goToAddNewEmployeePage();
      const pageTitle = await this.pageObjects.addEmployeePage.getPageTitle();
      await expect(pageTitle).to.contains(this.pageObjects.addEmployeePage.pageTitleCreate);
    });

    it('should create employee and check result', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'createEmployee', baseContext);

      const textResult = await this.pageObjects.addEmployeePage.createEditEmployee(createEmployeeData);
      await expect(textResult).to.equal(this.pageObjects.employeesPage.successfulCreationMessage);

      const numberOfEmployeesAfterCreation = await this.pageObjects.employeesPage.getNumberOfElementInGrid();
      await expect(numberOfEmployeesAfterCreation).to.be.equal(numberOfEmployees + 1);
    });

    // Logout into BO
    loginCommon.logoutBO();

    it('should sign in with new account and verify the default page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'signInWithCreatedEmployee', baseContext);

      await this.pageObjects.loginPage.login(createEmployeeData.email, createEmployeeData.password);
      const pageTitle = await this.pageObjects.productsPage.getPageTitle();
      await expect(pageTitle).to.contains(this.pageObjects.productsPage.pageTitle);
    });

    // Logout into BO
    loginCommon.logoutBO();
  });

  // 2 : Update employee and check that employee can't sign in in BO (enabled = false)
  describe('Update the employee created', async () => {
    // Login into BO
    loginCommon.loginBO();

    describe('Update the password and the default page', async () => {
      it('should go to Employees page', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'goToEmployeePageForUpdate', baseContext);

        await this.pageObjects.dashboardPage.goToSubMenu(
          this.pageObjects.dashboardPage.advancedParametersLink,
          this.pageObjects.dashboardPage.teamLink,
        );

        const pageTitle = await this.pageObjects.employeesPage.getPageTitle();
        await expect(pageTitle).to.contains(this.pageObjects.employeesPage.pageTitle);
      });

      it('should filter list by email', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'filterForUpdate', baseContext);

        await this.pageObjects.employeesPage.filterEmployees(
          'input',
          'email',
          createEmployeeData.email,
        );

        const textEmail = await this.pageObjects.employeesPage.getTextColumnFromTable(1, 'email');
        await expect(textEmail).to.contains(createEmployeeData.email);
      });

      it('should go to edit employee page', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'goToEditEmployeePage', baseContext);

        await this.pageObjects.employeesPage.goToEditEmployeePage(1);
        const pageTitle = await this.pageObjects.addEmployeePage.getPageTitle();
        await expect(pageTitle).to.contains(this.pageObjects.addEmployeePage.pageTitleEdit);
      });

      it('should update the employee account', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'updateEmployee', baseContext);

        const textResult = await this.pageObjects.addEmployeePage.createEditEmployee(firstEditEmployeeData);
        await expect(textResult).to.equal(this.pageObjects.addEmployeePage.successfulUpdateMessage);
      });

      it('should click on cancel and verify the new employee\'s number', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'verifyNumberOfEmployeeAfterUpdate', baseContext);

        await this.pageObjects.addEmployeePage.cancel();

        const numberOfEmployeesAfterUpdate = await this.pageObjects.employeesPage.resetAndGetNumberOfLines();
        await expect(numberOfEmployeesAfterUpdate).to.be.equal(numberOfEmployees + 1);
      });

      // Logout into BO
      loginCommon.logoutBO();

      it('should sign in with edited account and verify the default page', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'signInWithUpdatedEmployee', baseContext);
        await this.pageObjects.loginPage.login(firstEditEmployeeData.email, firstEditEmployeeData.password);
        const pageTitle = await this.pageObjects.ordersPage.getPageTitle();
        await expect(pageTitle).to.contains(this.pageObjects.ordersPage.pageTitle);
      });

      // Logout into BO
      loginCommon.logoutBO();
    });
    describe('Disable the employee and check it', async () => {
      // Login into BO
      loginCommon.loginBO();

      it('should go to Employees page', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'goToEmployeesPageToDisable', baseContext);

        await this.pageObjects.dashboardPage.goToSubMenu(
          this.pageObjects.dashboardPage.advancedParametersLink,
          this.pageObjects.dashboardPage.teamLink,
        );

        const pageTitle = await this.pageObjects.employeesPage.getPageTitle();
        await expect(pageTitle).to.contains(this.pageObjects.employeesPage.pageTitle);
      });

      it('should filter list by email', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'filterEmployeesToDisable', baseContext);

        await this.pageObjects.employeesPage.filterEmployees(
          'input',
          'email',
          firstEditEmployeeData.email,
        );

        const textEmail = await this.pageObjects.employeesPage.getTextColumnFromTable(1, 'email');
        await expect(textEmail).to.contains(firstEditEmployeeData.email);
      });

      it('should go to edit employee page', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'goToEditEmployeePageToDisable', baseContext);

        await this.pageObjects.employeesPage.goToEditEmployeePage(1);
        const pageTitle = await this.pageObjects.addEmployeePage.getPageTitle();
        await expect(pageTitle).to.contains(this.pageObjects.addEmployeePage.pageTitleEdit);
      });

      it('should disable the employee account', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'disableEmployee', baseContext);

        const textResult = await this.pageObjects.addEmployeePage.createEditEmployee(secondEditEmployeeData);
        await expect(textResult).to.equal(this.pageObjects.addEmployeePage.successfulUpdateMessage);
      });

      // Logout into BO
      loginCommon.logoutBO();

      it('should test sign in with the disabled employee', async function () {
        await testContext.addContextItem(this, 'testIdentifier', 'signInWithDisabledEmployee', baseContext);

        await this.pageObjects.loginPage.login(secondEditEmployeeData.email, secondEditEmployeeData.password, false);
        const loginError = await this.pageObjects.loginPage.getLoginError();
        await expect(loginError).to.contains(this.pageObjects.loginPage.loginErrorText);
      });
    });
  });

  // 5 : Delete employee
  describe('Delete employee', async () => {
    // Login into BO
    loginCommon.loginBO();

    it('should go to Employees page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'goToEmployeesPageToDelete', baseContext);

      await this.pageObjects.dashboardPage.goToSubMenu(
        this.pageObjects.dashboardPage.advancedParametersLink,
        this.pageObjects.dashboardPage.teamLink,
      );

      const pageTitle = await this.pageObjects.employeesPage.getPageTitle();
      await expect(pageTitle).to.contains(this.pageObjects.employeesPage.pageTitle);
    });

    it('should filter list by email', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'filterEmployeesToDelete', baseContext);

      await this.pageObjects.employeesPage.filterEmployees(
        'input',
        'email',
        secondEditEmployeeData.email,
      );

      const textEmail = await this.pageObjects.employeesPage.getTextColumnFromTable(1, 'email');
      await expect(textEmail).to.contains(secondEditEmployeeData.email);
    });

    it('should delete employee', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'deleteEmployee', baseContext);

      const textResult = await this.pageObjects.employeesPage.deleteEmployee(1);
      await expect(textResult).to.equal(this.pageObjects.employeesPage.successfulDeleteMessage);
    });

    it('should reset filter and check the number of employees', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'resetAfterDelete', baseContext);

      const numberOfEmployeesAfterDelete = await this.pageObjects.employeesPage.resetAndGetNumberOfLines();
      await expect(numberOfEmployeesAfterDelete).to.be.equal(numberOfEmployees);
    });
  });
});
