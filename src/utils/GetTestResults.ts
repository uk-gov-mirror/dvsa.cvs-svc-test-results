import * as dateFns from "date-fns";
import * as _ from "lodash";
import {TEST_VERSION} from "../assets/Enums";


export class GetTestResults {
  public static validateDates(fromDateTime: string | number | Date, toDateTime: string | number | Date) {
    return _.isDate(new Date(fromDateTime)) && _.isDate( new Date(toDateTime)) && _.isFinite((new Date(fromDateTime)).getTime()) && _.isFinite((new Date(toDateTime)).getTime());
  }

  public static removeTestResultId(testResults: Array<{ testResultId: string | number; }>) {
    if (testResults.length > 0) {
      for (const [index, testResult] of testResults.entries()) {
        delete testResults[index].testResultId;
      }
    }
    return testResults;
  }

  public static filterTestResultsByParam(testResults: { filter: (arg0: (testResult: any) => boolean) => void; }, filterName: string | number, filterValue: any) {
    return testResults.filter((testResult) => {
      return testResult[filterName] === filterValue;
    });
  }

  public static filterTestResultByDate(testResults: any, fromDateTime: string | number | Date, toDateTime: string | number | Date) {

    return testResults.filter((testResult: { testStartTimestamp: string | number | Date; testEndTimestamp: string | number | Date; }) => {
      return dateFns.isAfter(testResult.testStartTimestamp, fromDateTime) && dateFns.isBefore(testResult.testEndTimestamp, toDateTime);
    });
  }

  public static filterTestResultsByTestVersion(testResults: { filter: (arg0: (testResult: any) => boolean) => void; }, testVersion: string = TEST_VERSION.CURRENT) {
    return testResults.filter((testResult) => {
      if (testVersion === TEST_VERSION.CURRENT) {
        return (!testResult.testVersion || testResult.testVersion === testVersion);
      } else {
        return testResult.testVersion === testVersion;
      }
    });
  }

  public static filterTestResultsByDeletionFlag(testResults: { filter: (arg0: (testResult: any) => boolean) => void; }) {
    return testResults.filter((testResult) => {
      return !testResult.deletionFlag === true;
    });
  }

  public static filterTestTypesByDeletionFlag(testResults: { forEach: (arg0: (testResult: any) => void) => void; }) {
    testResults.forEach((testResult) => {
      const filteredTestTypes = testResult.testTypes.filter((testType: { deletionFlag: any; }) => {
        return !testType.deletionFlag === true;
      });
      testResult.testTypes = filteredTestTypes;
    });
    return testResults;
  }
}
