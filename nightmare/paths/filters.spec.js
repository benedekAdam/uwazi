/*eslint max-nested-callbacks: ["error", 10]*/
import { catchErrors } from 'api/utils/jasmineHelpers';
import config from '../helpers/config.js';
import selectors from '../helpers/selectors.js';
import createNightmare from '../helpers/nightmare';
import insertFixtures from '../helpers/insertFixtures';

const nightmare = createNightmare();

describe('filters path', () => {
  beforeAll(async () => insertFixtures());
  afterAll(async () => nightmare.end());

  describe('login', () => {
    it('should log in as admin then click the settings nav button', (done) => {
      nightmare
      .login('admin', 'admin')
      .wait(300)
      .waitToClick(selectors.navigation.settingsNavButton)
      .wait(200)
      .wait(selectors.settingsView.settingsHeader, 1000)
      .wait(200)
      .url()
      .then((url) => {
        expect(url).toBe(`${config.url}/settings/account`);
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('Filters tests', () => {
    it('should click Filters button and then click on Create Group button', (done) => {
      nightmare
      .waitToClick(selectors.settingsView.filtersButton)
      .waitToClick(selectors.settingsView.createFilterGroupButton)
      .wait(selectors.settingsView.newFilterGroupForm)
      .isVisible(selectors.settingsView.newFilterGroupForm)
      .then((result) => {
        expect(result).toBe(true);
        done();
      })
      .catch(catchErrors(done));
    });

    it('should create a group called Test Group', (done) => {
      nightmare
      .clearInput(selectors.settingsView.newFilterGroupForm)
      .write(selectors.settingsView.newFilterGroupForm, 'Test Group')
      .waitToClick(selectors.settingsView.filtrableTypesSaveButton)
      .wait('.alert.alert-success')
      .isVisible('.alert.alert-success')
      .then((result) => {
        expect(result).toBe(true);
        done();
      })
      .catch(catchErrors(done));
    });

    it('should delete the filters group', (done) => {
      nightmare
      .deleteItemFromList(selectors.settingsView.listOfFilterGroups, 'Test Group')
      .waitToClick(selectors.settingsView.filtrableTypesSaveButton)
      .wait('.alert.alert-success')
      .isVisible('.alert.alert-success')
      .then((result) => {
        expect(result).toBe(true);
        done();
      })
      .catch(catchErrors(done));
    });
  });
});
