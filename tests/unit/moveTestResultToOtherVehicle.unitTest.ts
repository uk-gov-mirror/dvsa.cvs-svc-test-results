import {TestResultsService} from "../../src/services/TestResultsService";
import {HTTPError} from "../../src/models/HTTPError";
import testResults from "../resources/test-results.json";
import {ERRORS, MESSAGES} from "../../src/assets/Enums";
import {cloneDeep} from "lodash";

describe("moveTestResultToOtherVehicle", () => {
  let testResultsService: TestResultsService | any;
  let MockTestResultsDAO: jest.Mock;
  let testResultsMockDB: any;
  let testToUpdate: any;
  let payload: any;
  let foundTechRecord: any;
  const msUserDetails = {
    msUser: "dorel",
    msOid: "123456"
  };
  const techRecord = {
    systemNumber: "9999999",
    vrms: [{vrm: "ABCD123", isPrimary: true}, {vrm: "GHJF987", isPrimary: false}],
    techRecord: [{
      vehicleType: "psv",
      vehicleSize: "small",
      vehicleConfiguration: "rigid",
      noOfAxles: 2,
      regnDate: "2018-08-09",
      numberOfSeatbelts: "45",
      vehicleClass: {
        description: "motorbikes over 200cc or with a sidecar",
        code: "2"
      },
    }]
  };
  beforeEach(() => {
    testResultsMockDB = testResults;
    MockTestResultsDAO = jest.fn().mockImplementation(() => {
      return {};
    });
    testResultsService = new TestResultsService(new MockTestResultsDAO());
    testToUpdate = cloneDeep(testResultsMockDB[30]);
    foundTechRecord = cloneDeep(techRecord);
    payload = {
      newSystemNumber: techRecord.systemNumber,
      testResultId: testToUpdate.testResultId
    };
  });

  afterEach(() => {
    testResultsMockDB = null;
    testResultsService = null;
    testToUpdate = null;
    payload = null;
    foundTechRecord = null;
    MockTestResultsDAO.mockReset();
  });

  context("when trying to move a test-result to another vehicle", () => {
    context("and the test-result is found", () => {
      context("and one vehicle is found", () => {
        it("should return the updated test-result with the new systemNumber", () => {
          MockTestResultsDAO = jest.fn().mockImplementation(() => {
            return {
              moveTestResultToOtherTechRecord: () => {
                return Promise.resolve({});
              },
              getBySystemNumber: () => {
                return Promise.resolve({
                  Items: Array.of(cloneDeep(testToUpdate)),
                  Count: 1
                });
              },
              getTechRecords: () => {
                return Promise.resolve([foundTechRecord]);
              }
            };
          });

          testResultsService = new TestResultsService(new MockTestResultsDAO());
          expect.assertions(10);
          return testResultsService.moveTestResultToOtherVehicle(testToUpdate.systemNumber, payload, msUserDetails)
            .then((returnedRecord: any) => {
              expect(returnedRecord).not.toEqual(undefined);
              expect(returnedRecord).not.toEqual({});
              expect(returnedRecord).toHaveProperty("createdAt");
              expect(returnedRecord).toHaveProperty("createdById");
              expect(returnedRecord).toHaveProperty("createdByName");
              expect(returnedRecord).toHaveProperty("testVersion");
              expect(returnedRecord.testVersion).toEqual("current");
              expect(returnedRecord).toHaveProperty("testHistory");
              expect(returnedRecord.testHistory[0].testVersion).toEqual("archived");
              expect(returnedRecord.systemNumber).toEqual(techRecord.systemNumber);
            });
        });
      });

      context("when changing an attribute that requires new testCode", () => {
        it("should call getTestCodesAndClassificationFromTestTypes and return the new testCode", () => {
          MockTestResultsDAO = jest.fn().mockImplementation(() => {
            return {
              moveTestResultToOtherTechRecord: () => {
                return Promise.resolve({});
              },
              getBySystemNumber: () => {
                return Promise.resolve({
                  Items: Array.of(cloneDeep(testToUpdate)),
                  Count: 1
                });
              },
              getTestCodesAndClassificationFromTestTypes: () => {
                return Promise.resolve({
                  defaultTestCode: "bde",
                  testTypeClassification: "Annual With Certificate"
                });
              },
              getTechRecords: () => {
                foundTechRecord.techRecord[0].noOfAxles = 10;
                return Promise.resolve([foundTechRecord]);
              }
            };
          });

          testResultsService = new TestResultsService(new MockTestResultsDAO());
          expect.assertions(4);
          return testResultsService.moveTestResultToOtherVehicle(testToUpdate.systemNumber, payload, msUserDetails)
            .then((returnedRecord: any) => {
              expect(returnedRecord).not.toEqual(undefined);
              expect(returnedRecord).not.toEqual({});
              expect(returnedRecord.testTypes[0].testCode).toEqual("bde");
              expect(returnedRecord.testTypes[0].testTypeClassification).toEqual("Annual With Certificate");
            });
        });
      });

      context("when moveTestResultToOtherTechRecord throws error", () => {
        it("should throw an error 500-Internal Error", () => {
          const existingTest = cloneDeep(testToUpdate);
          existingTest.testHistory = ["previously archived test"];
          MockTestResultsDAO = jest.fn().mockImplementation(() => {
            return {
              moveTestResultToOtherTechRecord: () => {
                return Promise.reject({statusCode: 500, message: MESSAGES.INTERNAL_SERVER_ERROR});
              },
              getBySystemNumber: () => {
                return Promise.resolve({
                  Items: Array.of(existingTest),
                  Count: 1
                });
              },
              getTechRecords: () => {
                return Promise.resolve([foundTechRecord]);
              }
            };
          });

          testResultsService = new TestResultsService(new MockTestResultsDAO());
          expect.assertions(3);
          return testResultsService.moveTestResultToOtherVehicle(testToUpdate.systemNumber, payload, msUserDetails)
            .catch((errorResponse: { statusCode: any; body: any; }) => {
              expect(errorResponse).toBeInstanceOf(HTTPError);
              expect(errorResponse.statusCode).toEqual(500);
              expect(errorResponse.body).toEqual(MESSAGES.INTERNAL_SERVER_ERROR);
            });
        });
      });

    });
    context("when no data was found", () => {
      it("should throw an error 404-No resources match the search criteria", () => {
        MockTestResultsDAO = jest.fn().mockImplementation(() => {
          return {
            getBySystemNumber: () => {
              return Promise.resolve({
                Items: [],
                Count: 0
              });
            }
          };
        });

        testResultsService = new TestResultsService(new MockTestResultsDAO());
        expect.assertions(3);
        return testResultsService.moveTestResultToOtherVehicle(testToUpdate.systemNumber, payload, msUserDetails)
          .catch((errorResponse: { statusCode: any; body: any; }) => {
            expect(errorResponse).toBeInstanceOf(HTTPError);
            expect(errorResponse.statusCode).toEqual(404);
            expect(errorResponse.body).toEqual("No resources match the search criteria");
          });
      });
    });
  });
});
