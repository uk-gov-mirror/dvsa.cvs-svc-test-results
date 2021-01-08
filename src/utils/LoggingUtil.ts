import * as models from "../models";
import { TEST_STATUS, TEST_RESULT } from "../assets/Enums";

export class LoggingUtil {
    public static logDefectReportingSilently(testResult: models.ITestResultPayload): void {

        if (testResult.testStatus === TEST_STATUS.CANCELLED) { return; }

        testResult.testTypes.forEach((testType: models.TestType) => {
            if (testType.testResult !== TEST_RESULT.ABANDONED) {
                testType.defects.forEach((defect) => {
                    try {
                        console.log(`Test-result: ${testResult.vin} ${LoggingUtil.redactVrm(testResult.vrm)} ${testType.additionalNotesRecorded} Defects: ${defect.deficiencyRef} ${defect.deficiencyCategory} ${JSON.stringify(defect.additionalInformation.location)}`);
                    } catch (error) {
                        console.log("Could not log the defect information for test-result " + testResult.testResultId, error);
                    }
                });
            }

        });
    }

    private static redactVrm(vrm?: string) {
        if (!vrm) {return vrm; }
        return vrm.charAt(0) + "*".repeat(vrm.length - 2) + vrm.charAt(vrm.length - 1);
    }
}
