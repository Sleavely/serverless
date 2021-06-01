'use strict';

const chai = require('chai');
const overrideEnv = require('process-utils/override-env');

const proxyquire = require('proxyquire');

const { expect } = chai;

chai.use(require('chai-as-promised'));

describe('test/unit/lib/cli/interactive-setup/utils.test.js', () => {
  describe('isUserLoggedIn', () => {
    it('correctly resolves if SERVELRESS_ACCESS_KEY present in env', () => {
      const { isUserLoggedIn } = require('../../../../../lib/cli/interactive-setup/utils');
      overrideEnv({ variables: { SERVERLESS_ACCESS_KEY: 'some-key' } }, () => {
        expect(isUserLoggedIn()).to.be.true;
      });
    });

    it('correctly resolves if there is logged in user', () => {
      const { isUserLoggedIn } = proxyquire('../../../../../lib/cli/interactive-setup/utils', {
        '@serverless/utils/config': {
          getLoggedInUser: () => ({}),
        },
      });
      expect(isUserLoggedIn()).to.be.true;
    });

    it('correctly resolves if there isnt logged in user', () => {
      const { isUserLoggedIn } = proxyquire('../../../../../lib/cli/interactive-setup/utils', {
        '@serverless/utils/config': {
          getLoggedInUser: () => null,
        },
      });
      expect(isUserLoggedIn()).to.be.false;
    });
  });

  describe('doesServiceInstanceHaveLinkedProvider', () => {
    const configuration = {
      app: 'someapp',
      service: 'someservice',
      org: 'someorg',
    };
    const options = {};

    it('correctly resolves when credentials resolved', async () => {
      const { doesServiceInstanceHaveLinkedProvider } = proxyquire(
        '../../../../../lib/cli/interactive-setup/utils',
        {
          '@serverless/dashboard-plugin/lib/resolveProviderCredentials': () => {
            return {
              accessKeyId: 'someaccess',
              secretAccessKey: 'somesecret',
              sessionToken: 'sometoken',
            };
          },
        }
      );
      expect(await doesServiceInstanceHaveLinkedProvider({ configuration, options })).to.be.true;
    });

    it('correctly resolves when credentials missing', async () => {
      const { doesServiceInstanceHaveLinkedProvider } = proxyquire(
        '../../../../../lib/cli/interactive-setup/utils',
        {
          '@serverless/dashboard-plugin/lib/resolveProviderCredentials': () => {
            return null;
          },
        }
      );
      expect(await doesServiceInstanceHaveLinkedProvider({ configuration, options })).to.be.false;
    });

    it('throws when credentials resolution results in an error', async () => {
      const { doesServiceInstanceHaveLinkedProvider } = proxyquire(
        '../../../../../lib/cli/interactive-setup/utils',
        {
          '@serverless/dashboard-plugin/lib/resolveProviderCredentials': () => {
            const err = new Error('Error');
            err.statusCode = 500;
            throw err;
          },
        }
      );
      expect(
        doesServiceInstanceHaveLinkedProvider({ configuration, options })
      ).to.eventually.be.rejected.and.have.property('code', 'DASHBOARD_UNAVAILABLE');
    });
  });
});
