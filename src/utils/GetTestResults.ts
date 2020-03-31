import * as dateFns from "date-fns";
import * as _ from "lodash";
import {TEST_VERSION} from "../assets/Enums";
import {ITestResult} from "../models/ITestResult";


export class GetTestResults {
  public static validateDates(fromDateTime: string | number | Date, toDateTime: string | number | Date) {
    return _.isDate(new Date(fromDateTime)) && _.isDate(new Date(toDateTime)) && _.isFinite((new Date(fromDateTime)).getTime()) && _.isFinite((new Date(toDateTime)).getTime());
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

  public static filterTestResultsByTestVersion(testResults: ITestResult[], testVersion: string = TEST_VERSION.CURRENT): ITestResult[] {
    let result: ITestResult[] = [];
    if (testVersion === TEST_VERSION.ALL) {
      return testResults;
    }
    for (const testResult of testResults) {
      if (testVersion === TEST_VERSION.CURRENT) {
        delete testResult.testHistory;
        result.push(testResult);
      } else if (testVersion === TEST_VERSION.ARCHIVED) {
        result = testResult.testHistory || [];
      }
    }
    return result;
  }

  public static removeTestHistory(testResults: ITestResult[]) {
    for (const testResult of testResults) {
      delete testResult.testHistory;
    }
    return testResults;
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
