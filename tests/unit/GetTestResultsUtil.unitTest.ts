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
    context("when testVersion is CURRENT", () => {
      it("should return all test-results with testVersion=current or which don't have testVersion attribute", () => {
        const myObject = [
          {
            testVersion: "current",
            param1: "thing"
          },
          {
            param1: "something else"
          },
          {
            testVersion: "archived",
            param1: "another thing"
          },
        ];
        const result = GetTestResults.filterTestResultsByTestVersion(myObject, TEST_VERSION.CURRENT);
        expect(result).toEqual([{testVersion: "current", param1: "thing"}, {param1: "something else"}]);
      });
    });

    context("when testVersion is ARCHIVED", () => {
      it("should return all test-results with testVersion=archived", () => {
        const myObject = [
          {
            testVersion: "current",
            param1: "thing"
          },
          {
            param1: "something else"
          },
          {
            testVersion: "archived",
            param1: "another thing"
          },
        ];
        const result = GetTestResults.filterTestResultsByTestVersion(myObject, TEST_VERSION.ARCHIVED);
        expect(result).toEqual([{testVersion: "archived", param1: "another thing"}]);
      });
    });
  });
});
