import {GetTestResults} from "../../src/utils/GetTestResults";
import {TEST_VERSION} from "../../src/assets/Enums";

describe("GetTestResult Util functions", () => {
  describe("filterTestResultsByParam", () => {
    it("filters passed object based on passed param having the passed value", () => {
      const myObject = [
        {
          param1: "thing"
        },
        {
          param1: "something else"
        }
      ];
      const result = GetTestResults.filterTestResultsByParam(myObject, "param1", "thing");
      expect(result).toEqual([{param1: "thing"}]);
    });
  });

  describe("filterTestResultsByTestVersion", () => {
    let myObject: any[];
    beforeEach(() => {
      myObject = [
        {
          testVersion: "current",
          param1: "thing",
          testHistory: [{param2: "archived record"}]
        }
      ];
    });
    context("when testVersion is CURRENT", () => {
      it("should return test-results without the testHistory array", () => {
        const result = GetTestResults.filterTestResultsByTestVersion(myObject, TEST_VERSION.CURRENT);
        expect(result).toEqual([{testVersion: "current", param1: "thing"}]);
      });
    });

    context("when testVersion is ARCHIVED", () => {
      it("should return only the testHistory array", () => {
        const result = GetTestResults.filterTestResultsByTestVersion(myObject, TEST_VERSION.ARCHIVED);
        expect(result).toEqual([{param2: "archived record"}]);
      });
    });

    context("when testVersion is ALL", () => {
      it("should return test-results with testHistory array", () => {
        const result = GetTestResults.filterTestResultsByTestVersion(myObject, TEST_VERSION.ALL);
        expect(result).toEqual(myObject);
      });
    });
  });
});
