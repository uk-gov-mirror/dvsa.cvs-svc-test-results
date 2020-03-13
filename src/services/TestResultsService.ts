import { HTTPError } from "../models/HTTPError";
import { TestResultsDAO } from "../models/TestResultsDAO";
import * as dateFns from "date-fns";
import { GetTestResults } from "../utils/GetTestResults";
import { v4 as uuidv4 } from "uuid";
import {
  MESSAGES,
  ERRORS,
  VEHICLE_TYPES,
  TEST_TYPE_CLASSIFICATION,
  TEST_RESULT,
  TEST_STATUS,
  HGV_TRL_ROADWORTHINESS_TEST_TYPES, TEST_VERSION
} from "../assets/Enums";
import testResultsSchemaHGVCancelled from "../models/TestResultsSchemaHGVCancelled";
import testResultsSchemaHGVSubmitted from "../models/TestResultsSchemaHGVSubmitted";
import testResultsSchemaPSVCancelled from "../models/TestResultsSchemaPSVCancelled";
import testResultsSchemaPSVSubmitted from "../models/TestResultsSchemaPSVSubmitted";
import testResultsSchemaTRLCancelled from "../models/TestResultsSchemaTRLCancelled";
import testResultsSchemaTRLSubmitted from "../models/TestResultsSchemaTRLSubmitted";
import testResultsSchemaLGVCancelled from "../models/TestResultsSchemaLGVCancelled";
import testResultsSchemaLGVSubmitted from "../models/TestResultsSchemaLGVSubmitted";
import testResultsSchemaCarCancelled from "../models/TestResultsSchemaCarCancelled";
import testResultsSchemaCarSubmitted from "../models/TestResultsSchemaCarSubmitted";
import testResultsSchemaMotorcycleCancelled from "../models/TestResultsSchemaMotorcycleCancelled";
import testResultsSchemaMotorcycleSubmitted from "../models/TestResultsSchemaMotorcycleSubmitted";
import { ITestResultPayload } from "../models/ITestResultPayload";
import { ITestResultData } from "../models/ITestResultData";
import { ITestResultFilters } from "../models/ITestResultFilter";
import { ITestResult, TestType } from "../models/ITestResult";
import { HTTPResponse } from "../models/HTTPResponse";
import {ValidationResult} from "joi";
import * as Joi from "joi";
import * as _ from "lodash";
import {IMsUserDetails} from "../models/IMsUserDetails";

/**
 * Service for retrieving and creating Test Results from/into the db
 * @returns Promise
 */
export class TestResultsService {
  public readonly testResultsDAO: TestResultsDAO;

  constructor(testResultsDAO: TestResultsDAO) {
    this.testResultsDAO = testResultsDAO;
  }

  public async getTestResults(filters: ITestResultFilters): Promise<any> {
    if (filters) {
      if (Object.keys(filters).length !== 0) {
        if (filters.fromDateTime && filters.toDateTime) {
          if (!GetTestResults.validateDates(filters.fromDateTime, filters.toDateTime)) {
            console.log("Invalid Filter Dates");
            return Promise.reject(new HTTPError(400, MESSAGES.BAD_REQUEST));
          }
        }
        console.log("THESE ARE YOUR FILTERS", filters);
        if (filters.systemNumber) {
          return this.testResultsDAO.getBySystemNumber(filters.systemNumber).then((result) => {
             console.log("THIS IS YOUR RESULT ->", result);
             const response: ITestResultData = {Count: result.Count, Items: result.Items};
             return this.applyTestResultsFilters(response, filters);
          }).catch((error: HTTPError) => {
            if (!(error instanceof HTTPError)) {
              console.log(error);
              error = new HTTPError(500, MESSAGES.INTERNAL_SERVER_ERROR);
            }
            throw error;
          });
        } else if (filters.testerStaffId) {
          const results = await this.testResultsDAO.getByTesterStaffId(filters.testerStaffId)
            .catch((error: HTTPError) => {
              if (!(error instanceof HTTPError)) {
                console.log(error);
                error = new HTTPError(500, MESSAGES.INTERNAL_SERVER_ERROR);
              }
              throw error;
            });
          const response: ITestResultData = {Count: results.Count, Items: results.Items};
          return this.applyTestResultsFilters(response, filters);
        } else {
          console.log("Filters object invalid");
          return Promise.reject(new HTTPError(400, MESSAGES.BAD_REQUEST));
        }
      } else {
        console.log("Filters object empty");
        return Promise.reject(new HTTPError(400, MESSAGES.BAD_REQUEST));
      }
    } else {
      console.log("Missing filters object");
      return Promise.reject(new HTTPError(400, MESSAGES.BAD_REQUEST));
    }
  }

  public checkTestResults(data: ITestResultData) {
    if (data) {
      if (!data.Count) {
        throw new HTTPError(404, ERRORS.NoResourceMatch);
      }
    }
    return data.Items;
  }

  public applyTestResultsFilters(data: ITestResultData, filters: ITestResultFilters) {
    let testResults = this.checkTestResults(data);
    if (filters.testVersion === TEST_VERSION.ALL) {
      return testResults;
    }
    testResults = GetTestResults.filterTestResultsByTestVersion(testResults, filters.testVersion);
    testResults = GetTestResults.filterTestResultByDate(testResults, filters.fromDateTime, filters.toDateTime);
    if (filters.testStatus) {
      testResults = GetTestResults.filterTestResultsByParam(testResults, "testStatus", filters.testStatus);
    }
    if (filters.testStationPNumber) {
      testResults = GetTestResults.filterTestResultsByParam(testResults, "testStationPNumber", filters.testStationPNumber);
    }
    testResults = GetTestResults.filterTestResultsByDeletionFlag(testResults);
    testResults = GetTestResults.filterTestTypesByDeletionFlag(testResults);

    if (testResults.length === 0) {
      throw new HTTPError(404, ERRORS.NoResourceMatch);
    }
    testResults = GetTestResults.removeTestResultId(testResults);
    return testResults;
  }

  public updateTestResult(systemNumber: string, payload: ITestResult, msUserDetails: IMsUserDetails) {
    this.removeNonEditableAttributes(payload);
    const validationSchema = this.getValidationSchema(payload.vehicleType, payload.testStatus);
    const validation: ValidationResult<any> | any | null = Joi.validate(payload, validationSchema);

    if (validation !== null && validation.error) {
      return Promise.reject(new HTTPError(400,
          {
            errors: validation.error.details.map((detail: { message: string; }) => {
              return detail.message;
            })
          }));
    }
    return this.testResultsDAO.getBySystemNumber(systemNumber)
        .then((result) => {
          const response: ITestResultData = {Count: result.Count, Items: result.Items};
          const testResults = this.checkTestResults(response);
          const oldTestResult = this.getTestResultToArchive(testResults, payload.testResultId);
          const newTestResult: ITestResult = _.cloneDeep(oldTestResult);
          newTestResult.testVersion = TEST_VERSION.CURRENT;
          oldTestResult.testVersion = TEST_VERSION.ARCHIVED;
          delete payload.systemNumber; // user not allowed to update systemNumber or VIN
          delete payload.vin;
          _.mergeWith(newTestResult, payload);
          this.setAuditDetails(newTestResult, oldTestResult, msUserDetails);
          newTestResult.testResultId = uuidv4();
          return this.testResultsDAO.updateTestResult(newTestResult, oldTestResult)
              .then((data) => {
                return newTestResult;
              }).catch((error) => {
                throw new HTTPError(500, error.message);
              });
        }).catch((error) => {
          throw new HTTPError(error.statusCode, error.body);
        });
  }

  public getTestResultToArchive(testResults: ITestResult[], testResultId: string): ITestResult {
    testResults = testResults.filter((testResult) => {
      return testResult.testResultId === testResultId;
    });
    if (testResults.length !== 1) {
      throw new HTTPError(404, ERRORS.NoResourceMatch);
    }
    return testResults[0];
  }

  public removeNonEditableAttributes(testResult: ITestResult) {
    for (const testType of testResult.testTypes) {
      delete testType.testCode;
      delete testType.testNumber;
      delete testType.testAnniversaryDate;
      delete testType.createdAt;
      delete testType.lastUpdatedAt;
      delete testType.certificateLink;
      delete testType.testTypeClassification;
    }
    delete testResult.vehicleId;
  }

  public setAuditDetails(newTestResult: ITestResult, oldTestResult: ITestResult, msUserDetails: IMsUserDetails) {
    const date = new Date().toISOString();
    newTestResult.createdAt = date;
    newTestResult.createdByName = msUserDetails.msUser;
    newTestResult.createdById = msUserDetails.msOid;
    delete newTestResult.lastUpdatedAt;
    delete newTestResult.lastUpdatedById;
    delete newTestResult.lastUpdatedByName;

    oldTestResult.lastUpdatedAt = date;
    oldTestResult.lastUpdatedByName = msUserDetails.msUser;
    oldTestResult.lastUpdatedById = msUserDetails.msOid;

    newTestResult.shouldEmailCertificate = "false";
    oldTestResult.shouldEmailCertificate = "false;";
  }

  public getValidationSchema(vehicleType: string, testStatus: string) {
    switch (vehicleType + testStatus) {
      case "psvsubmitted":
        return testResultsSchemaPSVSubmitted;
      case "psvcancelled":
        return testResultsSchemaPSVCancelled;
      case "hgvsubmitted":
        return testResultsSchemaHGVSubmitted;
      case "hgvcancelled":
        return testResultsSchemaHGVCancelled;
      case "trlsubmitted":
        return testResultsSchemaTRLSubmitted;
      case "trlcancelled":
        return testResultsSchemaTRLCancelled;
      case "lgvsubmitted":
        return testResultsSchemaLGVSubmitted;
      case "lgvcancelled":
        return testResultsSchemaLGVCancelled;
      case "carsubmitted":
        return testResultsSchemaCarSubmitted;
      case "carcancelled":
        return testResultsSchemaCarCancelled;
      case "motorcyclesubmitted":
        return testResultsSchemaMotorcycleSubmitted;
      case "motorcyclecancelled":
        return testResultsSchemaMotorcycleCancelled;
      default:
        return null;
    }
  }

  public insertTestResult(payload: ITestResultPayload) {
    if (Object.keys(payload).length === 0) { // if empty object
      return Promise.reject(new HTTPError(400, ERRORS.PayloadCannotBeEmpty));
    }
    const validationSchema = this.getValidationSchema(payload.vehicleType, payload.testStatus);

    const validation: ValidationResult<any> | any | null = Joi.validate(payload, validationSchema);

    if (!this.reasonForAbandoningPresentOnAllAbandonedTests(payload)) {
      return Promise.reject(new HTTPError(400, MESSAGES.REASON_FOR_ABANDONING_NOT_PRESENT));
    }

    const fieldsNullWhenDeficiencyCategoryIsOtherThanAdvisoryResponse = this.fieldsNullWhenDeficiencyCategoryIsOtherThanAdvisory(payload);
    if (fieldsNullWhenDeficiencyCategoryIsOtherThanAdvisoryResponse.result) {
      return Promise.reject(new HTTPError(400, fieldsNullWhenDeficiencyCategoryIsOtherThanAdvisoryResponse.missingFields + " are null for a defect with deficiency category other than advisory"));
    }

    // CVSB-7964: Fields Validation for LEC Test Types
    const missingFieldsForLecTestType: string[] = this.validateLecTestTypeFields(payload);
    if (missingFieldsForLecTestType && missingFieldsForLecTestType.length > 0) {
      return Promise.reject(new HTTPError(400,  {errors: missingFieldsForLecTestType} ));
    }
    if (this.isMissingRequiredCertificateNumberOnAdr(payload)) {
      return Promise.reject(new HTTPError(400, ERRORS.NoCertificateNumberOnAdr));
    }
    if (this.isMissingRequiredCertificateNumberOnTir(payload)) {
      return Promise.reject(new HTTPError(400, ERRORS.NoCertificateNumberOnTir));
    }
    if (this.isPassAdrTestTypeWithoutExpiryDate(payload)) {
      return Promise.reject(new HTTPError(400, ERRORS.NoExpiryDate));
    }

    const missingMandatoryTestResultFields: string[] = this.validateMandatoryTestResultFields(payload);
    if (missingMandatoryTestResultFields.length > 0) {
      return Promise.reject(new HTTPError(400,  {errors: missingMandatoryTestResultFields} ));
    }

    if (validation !== null && validation.error) {
      return Promise.reject(new HTTPError(400,
        {
          errors: validation.error.details.map((detail: { message: string; }) => {
            return detail.message;
          })
        }));
    }

    payload = this.setCreatedAtAndLastUpdatedAtDates(payload);
    return this.getTestTypesWithTestCodesAndClassification(payload.testTypes, payload.vehicleType, payload.vehicleSize, payload.vehicleConfiguration,
        payload.noOfAxles, payload.euVehicleCategory, payload.vehicleClass.code, payload.vehicleSubclass ? payload.vehicleSubclass[0] : undefined, payload.numberOfWheelsDriven)
        .then((testTypesWithTestCodesAndClassification) => {
          payload.testTypes = testTypesWithTestCodesAndClassification;
        })
        .then(() => {
          return this.setTestNumber(payload)
              .then((payloadWithTestNumber) => {
                return this.generateExpiryDate(payloadWithTestNumber)
                    .then((payloadWithExpiryDate: any) => {
                      const payloadWithCertificateNumber = this.generateCertificateNumber(payloadWithExpiryDate);
                      const payloadWithAnniversaryDate = this.setAnniversaryDate(payloadWithCertificateNumber);
                      const payloadWithVehicleId = this.setVehicleId(payloadWithAnniversaryDate);
                      return this.testResultsDAO.createSingle(payloadWithVehicleId);
                    });
              });
        }).catch((error) => {
          if (error.statusCode === 400 && error.message === MESSAGES.CONDITIONAL_REQUEST_FAILED) {
            console.log("Error in insertTestResult > getTestTypesWithTestCodesAndClassification: Test Result id already exists", error);
            return Promise.reject(new HTTPResponse(201, MESSAGES.ID_ALREADY_EXISTS));
          }
          console.log("Error in insertTestResult > getTestTypesWithTestCodesAndClassification", error);
          return Promise.reject(new HTTPError(500, MESSAGES.INTERNAL_SERVER_ERROR));
        });
  }

  public fieldsNullWhenDeficiencyCategoryIsOtherThanAdvisory(payload: ITestResultPayload) {
    const missingFields: string[] = [];
    let bool = false;
    if (payload.testTypes) {
      payload.testTypes.forEach((testType: { defects: { forEach: (arg0: (defect: any) => void) => void; }; }) => {
        if (testType.defects) {
          testType.defects.forEach((defect) => {
            if (defect.deficiencyCategory !== "advisory") {
              if (defect.additionalInformation.location === null) {
                missingFields.push("location");
                bool = true;
              }
              if (defect.deficiencyText === null) {
                missingFields.push("deficiencyText");
                bool = true;
              }
              if (defect.stdForProhibition === null) {
                missingFields.push("stdForProhibition");
                bool = true;
              }
            }
          });
        }
      });
    }
    let missingFieldsString = "";
    missingFields.forEach((missingField) => {
      missingFieldsString = missingFieldsString + "/" + missingField;
    });
    return { result: bool, missingFields: missingFieldsString };
  }

  public setTestNumber(payload: ITestResultPayload) {
    const promiseArray: any[] = [];
    if (payload.testTypes) {
      payload.testTypes.forEach((testType: { testNumber: any; }) => {
        const promise = this.testResultsDAO.getTestNumber()
          .then((testNumberResponse: { testNumber: any; }) => {
            testType.testNumber = testNumberResponse.testNumber;
          });

        promiseArray.push(promise);
      });
      return Promise.all(promiseArray).then(() => {
        return payload;
      });
    } else {
      return Promise.resolve(payload);
    }
  }

  public reasonForAbandoningPresentOnAllAbandonedTests(payload: ITestResultPayload) {
    let bool = true;
    if (payload.testTypes) {
      if (payload.testTypes.length > 0) {
        payload.testTypes.forEach((testType: { testResult: string; reasonForAbandoning: any; }) => {
          if (testType.testResult === TEST_RESULT.ABANDONED && !testType.reasonForAbandoning) {
            bool = false;
          }
        });
      }
    }
    return bool;
  }

  public setCreatedAtAndLastUpdatedAtDates(payload: ITestResultPayload): ITestResultPayload {
    if (payload.testTypes.length > 0) {
      payload.testTypes.forEach((testType: any) => {
        Object.assign(testType,
          {
            createdAt: new Date().toISOString(), lastUpdatedAt: new Date().toISOString()
          });
      });
    }
    return payload;
  }

  public generateExpiryDate(payload: ITestResultPayload) {
    if (payload.testStatus !== TEST_STATUS.SUBMITTED) {
      return Promise.resolve(payload);
    } else {
      return this.getMostRecentExpiryDateOnAllTestTypesBySystemNumber(payload.systemNumber)
          .then((mostRecentExpiryDateOnAllTestTypesBySystemNumber: any) => {
            payload.testTypes.forEach((testType: any, index: number) => {
              if (testType.testTypeClassification === TEST_TYPE_CLASSIFICATION.ANNUAL_WITH_CERTIFICATE &&
                  (testType.testResult === TEST_RESULT.PASS || testType.testResult === TEST_RESULT.PRS)) {
                  payload.testTypes[index] = testType;
                  if (payload.vehicleType === VEHICLE_TYPES.PSV) {
                    if (dateFns.isEqual(mostRecentExpiryDateOnAllTestTypesBySystemNumber, new Date(1970, 1, 1))
                        || dateFns.isBefore(mostRecentExpiryDateOnAllTestTypesBySystemNumber, dateFns.startOfDay(new Date()))
                        || dateFns.isAfter(mostRecentExpiryDateOnAllTestTypesBySystemNumber, dateFns.addMonths(new Date(), 2))) {
                      testType.testExpiryDate = dateFns.subDays(dateFns.addYears(new Date(), 1), 1).toISOString();
                      payload.testTypes[index] = testType;
                    } else if (dateFns.isToday(mostRecentExpiryDateOnAllTestTypesBySystemNumber)) {
                      testType.testExpiryDate = dateFns.addYears(new Date(), 1).toISOString();
                      payload.testTypes[index] = testType;
                    } else if (dateFns.isBefore(mostRecentExpiryDateOnAllTestTypesBySystemNumber, dateFns.addMonths(new Date(), 2)) && dateFns.isAfter(mostRecentExpiryDateOnAllTestTypesBySystemNumber, new Date())) {
                      testType.testExpiryDate = dateFns.addYears(mostRecentExpiryDateOnAllTestTypesBySystemNumber, 1).toISOString();
                      payload.testTypes[index] = testType;
                    }
                  } else if (payload.vehicleType === VEHICLE_TYPES.HGV || payload.vehicleType === VEHICLE_TYPES.TRL) {
                    // Applying CVSB-8658 logic changes if vehicle doesn't currently have an existing expiry date
                    const regOrFirstUseDate = payload.vehicleType === VEHICLE_TYPES.HGV ? payload.regnDate : payload.firstUseDate;
                    // preparaing compare date for CVSB-9187 to compare first test/retest conducted after anniversary date
                    const firstTestAfterAnvCompareDate = dateFns.addYears(dateFns.startOfMonth(regOrFirstUseDate!), 1);
                    // Checks for testType = First test or First test Retest AND test date is 1 year from the month of first use or registration date
                    if (this.isFirstTestRetestTestType(testType) && dateFns.isAfter(new Date(), firstTestAfterAnvCompareDate)) {
                      testType.testExpiryDate = this.lastDayOfMonthInNextYear(new Date()).toISOString();
                    } else if (this.isFirstTestRetestTestType(testType) && dateFns.isEqual(mostRecentExpiryDateOnAllTestTypesBySystemNumber, new Date(1970, 1, 1))) {
                      const anvDateForCompare = regOrFirstUseDate ? dateFns.endOfDay(this.lastDayOfMonthInNextYear(regOrFirstUseDate)).toISOString() : undefined;
                      // If anniversaryDate is not populated in tech-records OR test date is 2 months or more before the Registration/First Use Anniversary for HGV/TRL
                      console.log(`Current date: ${new Date()}, annv Date: ${anvDateForCompare}`);
                      if (!anvDateForCompare || dateFns.isBefore(new  Date(), dateFns.subMonths(anvDateForCompare, 2))) {
                        testType.testExpiryDate = this.lastDayOfMonthInNextYear(new Date()).toISOString();
                        console.log(`Setting expiryDate: ${testType.testExpiryDate}`);
                      } else {
                        // less than 2 months then set expiryDate 1 year after the Registration/First Use Anniversary date
                        testType.testExpiryDate = dateFns.addYears(anvDateForCompare, 1).toISOString();
                        console.log(`Setting expiryDate as 1yr from RegDate: ${testType.testExpiryDate}`);
                      }
                    } else {
                      if (dateFns.isAfter(mostRecentExpiryDateOnAllTestTypesBySystemNumber, new Date()) && dateFns.isBefore(mostRecentExpiryDateOnAllTestTypesBySystemNumber, dateFns.addMonths(new Date(), 2))) {
                        testType.testExpiryDate = this.lastDayOfMonthInNextYear(mostRecentExpiryDateOnAllTestTypesBySystemNumber).toISOString();
                      } else {
                        testType.testExpiryDate = this.lastDayOfMonthInNextYear(new Date()).toISOString();
                      }
                    }
                  }

              }
            });
            console.log("generateExpiryDate payload", payload.testTypes);
            return Promise.resolve(payload);
          }).catch((error: any) => {
            console.log("Error in error generateExpiryDate > getMostRecentExpiryDateOnAllTestTypesBySystemNumber", error);
            throw new HTTPError(500, MESSAGES.INTERNAL_SERVER_ERROR);
          });
    }
  }

  private lastDayOfMonthInNextYear(inputDate: Date): Date {
    return dateFns.lastDayOfMonth(dateFns.addYears(inputDate, 1));
  }

  public isFirstTestRetestTestType(testType: any): boolean {
    const adrTestTypeIds = ["41", "64", "65", "66", "67", "95", "102", "103", "104"];
    return adrTestTypeIds.includes(testType.testTypeId);
  }
  public getMostRecentExpiryDateOnAllTestTypesBySystemNumber(systemNumber: any) {
    let maxDate = new Date(1970, 1, 1);
    return this.getTestResults({
      systemNumber,
      testStatus: TEST_STATUS.SUBMITTED,
      fromDateTime: new Date(1970, 1, 1),
      toDateTime: new Date()
    })
        .then((testResults) => {
          const filterTestTypes: any[] = [];
          testResults.forEach((testResult: { testTypes: any; vehicleType: any; vehicleSize: any; vehicleConfiguration: any; noOfAxles: any; }) => {
            testResult.testTypes.forEach((testType: { testExpiryDate: string; }) => {
              if (testType.testExpiryDate) {
                filterTestTypes.push(testType);
              }
            });
          });
          return filterTestTypes;
        }).then((testTypes) => {
          testTypes.forEach((testType) => {
            if (dateFns.isAfter(testType.testExpiryDate, maxDate) && testType.testExpiryDate) {
              maxDate = testType.testExpiryDate;
            }
          });
          return maxDate;
        }).catch(() => {
          console.log("Something went wrong in getMostRecentExpiryDateOnAllTestTypesBySystemNumber > getTestResults. Returning default test date.");
          return maxDate;
        });
  }

  public getTestTypesWithTestCodesAndClassification(testTypes: Array<{ testTypeClassification: any; testTypeId: any; testCode?: any; }>, vehicleType: any, vehicleSize: any, vehicleConfiguration: any, noOfAxles: any,
                                                    euVehicleCategory: any, vehicleClass: any, vehicleSubclass: any, numberOfWheelsDriven: any) {
    const promiseArray: any = [];
    if (testTypes === undefined) {
      testTypes = [];
    }
    testTypes.forEach((testType, index) => {
      const promise = this.testResultsDAO.getTestCodesAndClassificationFromTestTypes(testType.testTypeId, vehicleType, vehicleSize, vehicleConfiguration, noOfAxles, euVehicleCategory, vehicleClass, vehicleSubclass, numberOfWheelsDriven)
        .then((currentTestCodesAndClassification: { defaultTestCode: any; testTypeClassification: any; linkedTestCode: any; }) => {
          if (testTypes.length === 1) {
            testTypes[index].testCode = currentTestCodesAndClassification.defaultTestCode;
            testTypes[index].testTypeClassification = currentTestCodesAndClassification.testTypeClassification;
          } else {
            if (currentTestCodesAndClassification.linkedTestCode) {
              testTypes[index].testCode = currentTestCodesAndClassification.linkedTestCode;
            } else {
              testTypes[index].testCode = currentTestCodesAndClassification.defaultTestCode;
            }
            testTypes[index].testTypeClassification = currentTestCodesAndClassification.testTypeClassification;
          }
        });
      promiseArray.push(promise);
    });
    return Promise.all(promiseArray).then(() => {
      return Promise.resolve(testTypes);
    });
  }

  public insertTestResultsList(testResultsItems: ITestResult[]) {
    return this.testResultsDAO.createMultiple(testResultsItems)
      .then((data: any) => {
        if (data.UnprocessedItems) { return data.UnprocessedItems; }
      })
      .catch((error: any) => {
        if (error) {
          console.log("Error in insertTestResultsList: ", error);
          throw new HTTPError(500, MESSAGES.INTERNAL_SERVER_ERROR);
        }
      });
  }

  public deleteTestResultsList(testResultsSystemNumberIdPairs: any[]) {
    return this.testResultsDAO.deleteMultiple(testResultsSystemNumberIdPairs)
      .then((data: any) => {
        if (data.UnprocessedItems) {
          return data.UnprocessedItems;
        }
      })
      .catch((error: any) => {
        if (error) {
          console.log(error);
          throw new HTTPError(500, MESSAGES.INTERNAL_SERVER_ERROR);
        }
      });
  }

  private isMissingRequiredCertificateNumber(typeFunc: (testType: TestType) => boolean, payload: ITestResultPayload): boolean {
    let bool = false;
    if (payload.testTypes) {
      payload.testTypes.forEach((testType) => {
        if (typeFunc(testType) && testType.testResult === TEST_RESULT.PASS && payload.testStatus === TEST_STATUS.SUBMITTED && !testType.certificateNumber) {
          bool = true;
        }
      });
    }
    return bool;
  }

  public isMissingRequiredCertificateNumberOnAdr(payload: ITestResultPayload): boolean {
    return this.isMissingRequiredCertificateNumber(this.isTestTypeAdr, payload);
  }

  public isMissingRequiredCertificateNumberOnTir(payload: ITestResultPayload): boolean {
    return this.isMissingRequiredCertificateNumber(this.isTestTypeTir, payload);
  }

  public removeVehicleClassification(payload: { testTypes: { forEach: (arg0: (testType: any) => void) => void; }; }) {
    payload.testTypes.forEach((testType) => {
      delete testType.testTypeClassification;
    });
    return payload;
  }

  public setVehicleId(payload: ITestResultPayload): ITestResultPayload {
    payload.vehicleId = payload.vrm;
    return payload;
  }

  public setAnniversaryDate(payload: ITestResultPayload) {
    payload.testTypes.forEach((testType) => {
      if (testType.testExpiryDate) {
        if (payload.vehicleType === VEHICLE_TYPES.PSV) {
          testType.testAnniversaryDate = dateFns.addDays(dateFns.subMonths(testType.testExpiryDate, 2), 1).toISOString();
        } else {
          testType.testAnniversaryDate = testType.testExpiryDate;
        }
      }
    });
    return payload;
  }

  public isTestTypeAdr(testType: TestType): boolean {
    const adrTestTypeIds = ["50", "59", "60"];

    return adrTestTypeIds.includes(testType.testTypeId);
  }

  public isTestTypeTir(testType: TestType): boolean {
    const tirTestTypeIds = ["49", "56", "57"];

    return tirTestTypeIds.includes(testType.testTypeId);
  }

  public isTestTypeLec(testType: any): boolean {
    const lecTestTypeIds = ["39", "44", "45"];

    return lecTestTypeIds.includes(testType.testTypeId);
  }

  public isPassAdrTestTypeWithoutExpiryDate(payload: ITestResultPayload): boolean {
    let bool = false;
    if (payload.testTypes) {
      payload.testTypes.forEach((testType) => {
        if (this.isTestTypeAdr(testType) && testType.testResult === TEST_RESULT.PASS && payload.testStatus === TEST_STATUS.SUBMITTED && !testType.testExpiryDate) {
          bool = true;
        }
      });
    }
    return bool;
  }

  public generateCertificateNumber(payload: ITestResultPayload) {
    if (payload.testStatus === TEST_STATUS.SUBMITTED) {
      payload.testTypes.forEach((testType) => {
        // CVSB-7675 if vehicle type is HGV/TRL and testTypeId is Roadworthiness test and testResult is pass then testNumber = certificateNumber
       if (TestResultsService.isPassedRoadworthinessTestForHgvTrl(payload.vehicleType, testType.testTypeId, testType.testResult)
                    ||
            (TestResultsService.isAnnualTestTypeClassificationWithoutAbandonedResult(testType.testTypeClassification, testType.testResult) && !this.isTestTypeAdr(testType) && !this.isTestTypeLec(testType))
                  ) {
          testType.certificateNumber = testType.testNumber;
        }
      });
    }
    return payload;
  }

  private validateLecTestTypeFields(payload: ITestResultPayload): string[] {
    const missingFields: string[] = [];
    if (payload.testTypes) {
      payload.testTypes.forEach((testType: { testTypeId: string; certificateNumber: string; expiryDate: Date; modType: any; emissionStandard: string; fuelType: string;
        testExpiryDate: any; testResult: string; smokeTestKLimitApplied: any}) => {
        if (this.isTestTypeLec(testType) ) {
            if (testType.testResult === TEST_RESULT.PASS && payload.testStatus === TEST_STATUS.SUBMITTED ) {
            if (!testType.testExpiryDate) {
              missingFields.push(ERRORS.NoLECExpiryDate);
            }
            if (!testType.modType) {
              missingFields.push(ERRORS.NoModificationType);
            }
            if (!testType.emissionStandard) {
              missingFields.push(ERRORS.NoEmissionStandard);
            }
            if (!testType.fuelType) {
              missingFields.push(ERRORS.NoFuelType);
            }
            if (!testType.smokeTestKLimitApplied) {
              missingFields.push(ERRORS.NoSmokeTestKLimitApplied);
            }
          }
        }
      });

    }
    return missingFields;
  }

  private validateMandatoryTestResultFields(payload: ITestResultPayload): string[] {
    const missingMandatoryFields: string[] = [];
    if (payload.testTypes.some((testType: TestType) => testType.testResult !== TEST_RESULT.ABANDONED) && payload.testStatus === TEST_STATUS.SUBMITTED) {
      if (!payload.countryOfRegistration) {
        missingMandatoryFields.push(ERRORS.CountryOfRegistrationMandatory);
      }
      if (!payload.euVehicleCategory) {
        missingMandatoryFields.push(ERRORS.EuVehicleCategoryMandatory);
      }

      if (payload.vehicleType === VEHICLE_TYPES.HGV || payload.vehicleType === VEHICLE_TYPES.PSV) {
        if (!payload.odometerReading) {
          missingMandatoryFields.push(ERRORS.OdometerReadingMandatory);
        }
        if (!payload.odometerReadingUnits) {
          missingMandatoryFields.push(ERRORS.OdometerReadingUnitsMandatory);
        }
      }
    }
    return missingMandatoryFields;
  }
  //#region Private Static Functions
  private static isHGVTRLRoadworthinessTest(testTypeId: string): boolean {
    return HGV_TRL_ROADWORTHINESS_TEST_TYPES.IDS.includes(testTypeId);
   }
   private static isHgvOrTrl(vehicleType: string): boolean {
    return vehicleType === VEHICLE_TYPES.HGV || vehicleType === VEHICLE_TYPES.TRL;
  }

  private static isPassedRoadworthinessTestForHgvTrl(vehicleType: string, testTypeId: string, testResult: string): boolean {
    return TestResultsService.isHgvOrTrl(vehicleType) && TestResultsService.isHGVTRLRoadworthinessTest(testTypeId) && testResult === TEST_RESULT.PASS;
  }

  private static isAnnualTestTypeClassificationWithoutAbandonedResult(testTypeClassification: string, testResult: string): boolean {
    return testTypeClassification === TEST_TYPE_CLASSIFICATION.ANNUAL_WITH_CERTIFICATE && testResult !== TEST_RESULT.ABANDONED;
  }

 //#endregion


}
