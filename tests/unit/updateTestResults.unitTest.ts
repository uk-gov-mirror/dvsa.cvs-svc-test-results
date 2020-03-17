import {TestResultsService} from "../../src/services/TestResultsService";
import {HTTPError} from "../../src/models/HTTPError";
import fs from "fs";
import path from "path";
import {MESSAGES} from "../../src/assets/Enums";
import {cloneDeep} from "lodash";
import {ITestResult} from "../../src/models/ITestResult";

describe("updateTestResults", () => {
    let testResultsService: TestResultsService | any;
    let MockTestResultsDAO: jest.Mock;
    let testResultsMockDB: any;
    const msUserDetails = {
        msUser: "dorel",
        msOid: "123456"
    };
    beforeEach(() => {
        testResultsMockDB = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../resources/test-results.json"), "utf8"));
        MockTestResultsDAO = jest.fn().mockImplementation(() => {
            return {};
        });
        testResultsService = new TestResultsService(new MockTestResultsDAO());
    });

    afterEach(() => {
        testResultsMockDB = null;
        testResultsService = null;
        MockTestResultsDAO.mockReset();
    });

    context("when trying to update a test-result", () => {
        context("and the payload is valid", () => {
            context("and the test-result is found", () => {
                it("should return the updated test-result", () => {
                    MockTestResultsDAO = jest.fn().mockImplementation(() => {
                        return {
                            updateTestResult: () => {
                                return Promise.resolve({});
                            },
                            getBySystemNumber: () => {
                                return Promise.resolve({
                                    Items: Array.of(testResultsMockDB[1]),
                                    Count: 1
                                });
                            }
                        };
                    });

                    testResultsService = new TestResultsService(new MockTestResultsDAO());
                    expect.assertions(5);
                    const testToUpdate = testResultsMockDB[1];
                    testToUpdate.countryOfRegistration = "gb";
                    return testResultsService.updateTestResult(testToUpdate.systemNumber, testToUpdate, msUserDetails)
                        .then((returnedRecord: any) => {
                            expect(returnedRecord).not.toEqual(undefined);
                            expect(returnedRecord).not.toEqual({});
                            expect(returnedRecord).toHaveProperty("createdAt");
                            expect(returnedRecord).toHaveProperty("createdById");
                            expect(returnedRecord).toHaveProperty("createdByName");
                        });
                });
            });

            context("when updateTestResultDAO throws error", () => {
                it("should throw an error 500-Internal Error", () => {
                    MockTestResultsDAO = jest.fn().mockImplementation(() => {
                        return {
                            updateTestResult: () => {
                                return Promise.reject({statusCode: 500, message: MESSAGES.INTERNAL_SERVER_ERROR});
                            },
                            getBySystemNumber: () => {
                                return Promise.resolve({
                                    Items: Array.of(testResultsMockDB[1]),
                                    Count: 1
                                });
                            }
                        };
                    });

                    testResultsService = new TestResultsService(new MockTestResultsDAO());
                    expect.assertions(3);
                    const testToUpdate = testResultsMockDB[1];
                    testToUpdate.countryOfRegistration = "gb";
                    return testResultsService.updateTestResult(testToUpdate.systemNumber, testToUpdate, msUserDetails)
                        .catch((errorResponse: { statusCode: any; body: any; }) => {
                            expect(errorResponse).toBeInstanceOf(HTTPError);
                            expect(errorResponse.statusCode).toEqual(500);
                            expect(errorResponse.body).toEqual(MESSAGES.INTERNAL_SERVER_ERROR);
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
                    const testToUpdate = testResultsMockDB[1];
                    testToUpdate.countryOfRegistration = "gb";
                    return testResultsService.updateTestResult(testToUpdate.systemNumber, testToUpdate, msUserDetails)
                        .catch((errorResponse: { statusCode: any; body: any; }) => {
                            expect(errorResponse).toBeInstanceOf(HTTPError);
                            expect(errorResponse.statusCode).toEqual(404);
                            expect(errorResponse.body).toEqual("No resources match the search criteria");
                        });
                });
            });

            context("when could not uniquely identify the test to update", () => {
                it("should throw an error 404-No resources match the search criteria", () => {
                    MockTestResultsDAO = jest.fn().mockImplementation(() => {
                        return {
                            getBySystemNumber: () => {
                                return Promise.resolve({
                                    Items: Array.of(testResultsMockDB[0]),
                                    Count: 1
                                });
                            }
                        };
                    });

                    testResultsService = new TestResultsService(new MockTestResultsDAO());
                    expect.assertions(3);
                    const testToUpdate = testResultsMockDB[1];
                    testToUpdate.countryOfRegistration = "gb";
                    return testResultsService.updateTestResult(testToUpdate.systemNumber, testToUpdate, msUserDetails)
                        .catch((errorResponse: { statusCode: any; body: any; }) => {
                            expect(errorResponse).toBeInstanceOf(HTTPError);
                            expect(errorResponse.statusCode).toEqual(404);
                            expect(errorResponse.body).toEqual("No resources match the search criteria");
                        });
                });
            });
        });

        context("and the payload is invalid", () => {
            it("should return error 500 Invalid payload", () => {
                MockTestResultsDAO = jest.fn().mockImplementation(() => {
                    return {
                        updateTestResult: () => {
                            return Promise.resolve({});
                        },
                        getBySystemNumber: () => {
                            return Promise.resolve({
                                Items: Array.of(testResultsMockDB[1]),
                                Count: 1
                            });
                        }
                    };
                });

                testResultsService = new TestResultsService(new MockTestResultsDAO());
                testResultsMockDB[1].vehicleType = "trl";
                return testResultsService.updateTestResult(testResultsMockDB[1].systemNumber, testResultsMockDB[1], msUserDetails)
                    .catch((errorResponse: { statusCode: any; body: any; }) => {
                        expect(errorResponse).toBeInstanceOf(HTTPError);
                        expect(errorResponse.statusCode).toEqual(400);
                        expect(errorResponse.body).toEqual({errors: ["\"trailerId\" is required"]});
                    });
            });
        });
    });
});
