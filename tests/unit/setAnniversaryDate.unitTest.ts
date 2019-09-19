import { TestResultsService } from "../../src/services/TestResultsService";
import { expect } from "chai";

describe("TestResultsService calling setTestAnniversaryDate", () => {
    let testResultsService: TestResultsService | any;
    let MockTestResultsDAO: jest.Mock;

    beforeEach(() => {
        MockTestResultsDAO = jest.fn().mockImplementation(() => {
            return {};
        });
        testResultsService = new TestResultsService(new MockTestResultsDAO());
    });

    afterEach(() => {
        MockTestResultsDAO.mockReset();
    });

    context("if testResult is trl", () => {
        const hgvTestResultWithExpiryDate = JSON.parse(" {\n" +
            "    \"testerStaffId\": \"1\",\n" +
            "    \"testResultId\": \"1115\",\n" +
            "    \"testStartTimestamp\": \"2019-01-14T10:36:33.987Z\",\n" +
            "    \"testEndTimestamp\": \"2019-01-14T10:36:33.987Z\",\n" +
            "    \"testStatus\": \"submitted\",\n" +
            "    \"noOfAxles\": \"2\",\n" +
            "    \"testTypes\": [\n" +
            "      {\n" +
            "        \"prohibitionIssued\": false,\n" +
            "        \"additionalCommentsForAbandon\": \"none\",\n" +
            "        \"testTypeEndTimestamp\": \"2019-01-14T10:36:33.987Z\",\n" +
            "        \"reasonForAbandoning\": \"none\",\n" +
            "        \"testTypeId\": \"1\",\n" +
            "        \"testExpiryDate\": \"2020-09-20T10:36:33.987Z\",\n" +
            "        \"testTypeStartTimestamp\": \"2019-01-14T10:36:33.987Z\",\n" +
            "        \"certificateNumber\": \"W01A00209\",\n" +
            "        \"testTypeName\": \"Annual test\",\n" +
            "        \"additionalNotesRecorded\": \"VEHICLE FRONT REGISTRATION PLATE MISSING\",\n" +
            "        \"defects\": [\n" +
            "          {\n" +
            "            \"prohibitionIssued\": false,\n" +
            "            \"deficiencyCategory\": \"major\",\n" +
            "            \"deficiencyText\": \"missing.\",\n" +
            "            \"prs\": false,\n" +
            "            \"additionalInformation\": {\n" +
            "              \"location\": {\n" +
            "                \"axleNumber\": null,\n" +
            "                \"horizontal\": null,\n" +
            "                \"vertical\": null,\n" +
            "                \"longitudinal\": \"front\",\n" +
            "                \"rowNumber\": null,\n" +
            "                \"lateral\": null,\n" +
            "                \"seatNumber\": null\n" +
            "              },\n" +
            "              \"notes\": \"None\"\n" +
            "            },\n" +
            "            \"itemNumber\": 1,\n" +
            "            \"deficiencyRef\": \"1.1.a\",\n" +
            "            \"stdForProhibition\": false,\n" +
            "            \"deficiencySubId\": null,\n" +
            "            \"imDescription\": \"Registration Plate\",\n" +
            "            \"deficiencyId\": \"a\",\n" +
            "            \"itemDescription\": \"A registration plate:\",\n" +
            "            \"imNumber\": 1\n" +
            "          }\n" +
            "        ],\n" +
            "        \"name\": \"Annual test\",\n" +
            "        \"testResult\": \"pass\"\n" +
            "      }\n" +
            "    ],\n" +
            "    \"vehicleClass\": {\n" +
            "      \"description\": \"motorbikes over 200cc or with a sidecar\",\n" +
            "      \"code\": \"2\"\n" +
            "    },\n" +
            "    \"vin\": \"XMGDE02FS0H012999\",\n" +
            "    \"testStationName\": \"Rowe, Wunsch and Wisoky\",\n" +
            "    \"noOfAxles\": 2,\n" +
            "    \"vehicleType\": \"trl\",\n" +
            "    \"countryOfRegistration\": \"united kingdom\",\n" +
            "    \"preparerId\": \"ak4434\",\n" +
            "    \"preparerName\": \"Durrell Vehicles Limited\",\n" +
            "    \"vehicleConfiguration\": \"rigid\",\n" +
            "    \"testStationType\": \"gvts\",\n" +
            "    \"reasonForCancellation\": \"none\",\n" +
            "    \"testerName\": \"Dorel\",\n" +
            "    \"testStationPNumber\": \"87-1369569\",\n" +
            "    \"testerEmailAddress\": \"dorel.popescu@dvsagov.uk\",\n" +
            "    \"euVehicleCategory\": \"m1\",\n" +
            "    \"trailerId\": \"abcd\"\n" +
            "  }");

        it("should set anniversary date the same as expiryDate", () => {
            testResultsService = new TestResultsService(new MockTestResultsDAO());
            const testResultWithAnniversaryDate = testResultsService.setAnniversaryDate(hgvTestResultWithExpiryDate);
            expect(testResultWithAnniversaryDate.testTypes[0].testAnniversaryDate).to.not.be.eql(undefined);
            expect(testResultWithAnniversaryDate.testTypes[0].testAnniversaryDate).to.be.eql(testResultWithAnniversaryDate.testTypes[0].testExpiryDate);
        });
    });

    context("if testResult is hgv", () => {
        const hgvTestResultWithExpiryDate = JSON.parse(" {\n" +
            "    \"testerStaffId\": \"1\",\n" +
            "    \"testResultId\": \"1115\",\n" +
            "    \"testStartTimestamp\": \"2019-01-14T10:36:33.987Z\",\n" +
            "    \"testEndTimestamp\": \"2019-01-14T10:36:33.987Z\",\n" +
            "    \"testStatus\": \"submitted\",\n" +
            "    \"noOfAxles\": \"2\",\n" +
            "    \"testTypes\": [\n" +
            "      {\n" +
            "        \"prohibitionIssued\": false,\n" +
            "        \"additionalCommentsForAbandon\": \"none\",\n" +
            "        \"testTypeEndTimestamp\": \"2019-01-14T10:36:33.987Z\",\n" +
            "        \"reasonForAbandoning\": \"none\",\n" +
            "        \"testTypeId\": \"1\",\n" +
            "        \"testExpiryDate\": \"2020-09-20T10:36:33.987Z\",\n" +
            "        \"testTypeStartTimestamp\": \"2019-01-14T10:36:33.987Z\",\n" +
            "        \"certificateNumber\": \"W01A00209\",\n" +
            "        \"testTypeName\": \"Annual test\",\n" +
            "        \"additionalNotesRecorded\": \"VEHICLE FRONT REGISTRATION PLATE MISSING\",\n" +
            "        \"defects\": [\n" +
            "          {\n" +
            "            \"prohibitionIssued\": false,\n" +
            "            \"deficiencyCategory\": \"major\",\n" +
            "            \"deficiencyText\": \"missing.\",\n" +
            "            \"prs\": false,\n" +
            "            \"additionalInformation\": {\n" +
            "              \"location\": {\n" +
            "                \"axleNumber\": null,\n" +
            "                \"horizontal\": null,\n" +
            "                \"vertical\": null,\n" +
            "                \"longitudinal\": \"front\",\n" +
            "                \"rowNumber\": null,\n" +
            "                \"lateral\": null,\n" +
            "                \"seatNumber\": null\n" +
            "              },\n" +
            "              \"notes\": \"None\"\n" +
            "            },\n" +
            "            \"itemNumber\": 1,\n" +
            "            \"deficiencyRef\": \"1.1.a\",\n" +
            "            \"stdForProhibition\": false,\n" +
            "            \"deficiencySubId\": null,\n" +
            "            \"imDescription\": \"Registration Plate\",\n" +
            "            \"deficiencyId\": \"a\",\n" +
            "            \"itemDescription\": \"A registration plate:\",\n" +
            "            \"imNumber\": 1\n" +
            "          }\n" +
            "        ],\n" +
            "        \"name\": \"Annual test\",\n" +
            "        \"testResult\": \"pass\"\n" +
            "      }\n" +
            "    ],\n" +
            "    \"vehicleClass\": {\n" +
            "      \"description\": \"motorbikes over 200cc or with a sidecar\",\n" +
            "      \"code\": \"2\"\n" +
            "    },\n" +
            "    \"vin\": \"XMGDE02FS0H012999\",\n" +
            "    \"testStationName\": \"Rowe, Wunsch and Wisoky\",\n" +
            "    \"noOfAxles\": 2,\n" +
            "    \"vehicleType\": \"hgv\",\n" +
            "    \"countryOfRegistration\": \"united kingdom\",\n" +
            "    \"preparerId\": \"ak4434\",\n" +
            "    \"preparerName\": \"Durrell Vehicles Limited\",\n" +
            "    \"vehicleConfiguration\": \"rigid\",\n" +
            "    \"testStationType\": \"gvts\",\n" +
            "    \"reasonForCancellation\": \"none\",\n" +
            "    \"testerName\": \"Dorel\",\n" +
            "    \"testStationPNumber\": \"87-1369569\",\n" +
            "    \"testerEmailAddress\": \"dorel.popescu@dvsagov.uk\",\n" +
            "    \"euVehicleCategory\": \"m1\",\n" +
            "    \"trailerId\": \"abcd\"\n" +
            "  }");

        it("should set anniversary date the same as expiryDate", () => {
            testResultsService = new TestResultsService(new MockTestResultsDAO());
            const testResultWithAnniversaryDate = testResultsService.setAnniversaryDate(hgvTestResultWithExpiryDate);
            expect(testResultWithAnniversaryDate.testTypes[0].testAnniversaryDate).not.be.eql(undefined);
            expect(testResultWithAnniversaryDate.testTypes[0].testAnniversaryDate).to.be.eql(testResultWithAnniversaryDate.testTypes[0].testExpiryDate);
        });
    });

    context("if testResult is psv", () => {
        const psvTestResultWithExpiryDate = JSON.parse(" {\n" +
            "    \"testerStaffId\": \"1\",\n" +
            "    \"testResultId\": \"1115\",\n" +
            "    \"testStartTimestamp\": \"2019-01-14T10:36:33.987Z\",\n" +
            "    \"testEndTimestamp\": \"2019-01-14T10:36:33.987Z\",\n" +
            "    \"testStatus\": \"submitted\",\n" +
            "    \"noOfAxles\": \"2\",\n" +
            "    \"testTypes\": [\n" +
            "      {\n" +
            "        \"prohibitionIssued\": false,\n" +
            "        \"additionalCommentsForAbandon\": \"none\",\n" +
            "        \"testTypeEndTimestamp\": \"2019-01-14T10:36:33.987Z\",\n" +
            "        \"reasonForAbandoning\": \"none\",\n" +
            "        \"testTypeId\": \"1\",\n" +
            "        \"testExpiryDate\": \"2020-09-20T10:36:33.987Z\",\n" +
            "        \"testTypeStartTimestamp\": \"2019-01-14T10:36:33.987Z\",\n" +
            "        \"certificateNumber\": \"W01A00209\",\n" +
            "        \"testTypeName\": \"Annual test\",\n" +
            "        \"additionalNotesRecorded\": \"VEHICLE FRONT REGISTRATION PLATE MISSING\",\n" +
            "        \"defects\": [\n" +
            "          {\n" +
            "            \"prohibitionIssued\": false,\n" +
            "            \"deficiencyCategory\": \"major\",\n" +
            "            \"deficiencyText\": \"missing.\",\n" +
            "            \"prs\": false,\n" +
            "            \"additionalInformation\": {\n" +
            "              \"location\": {\n" +
            "                \"axleNumber\": null,\n" +
            "                \"horizontal\": null,\n" +
            "                \"vertical\": null,\n" +
            "                \"longitudinal\": \"front\",\n" +
            "                \"rowNumber\": null,\n" +
            "                \"lateral\": null,\n" +
            "                \"seatNumber\": null\n" +
            "              },\n" +
            "              \"notes\": \"None\"\n" +
            "            },\n" +
            "            \"itemNumber\": 1,\n" +
            "            \"deficiencyRef\": \"1.1.a\",\n" +
            "            \"stdForProhibition\": false,\n" +
            "            \"deficiencySubId\": null,\n" +
            "            \"imDescription\": \"Registration Plate\",\n" +
            "            \"deficiencyId\": \"a\",\n" +
            "            \"itemDescription\": \"A registration plate:\",\n" +
            "            \"imNumber\": 1\n" +
            "          }\n" +
            "        ],\n" +
            "        \"name\": \"Annual test\",\n" +
            "        \"testResult\": \"pass\"\n" +
            "      }\n" +
            "    ],\n" +
            "    \"vehicleClass\": {\n" +
            "      \"description\": \"motorbikes over 200cc or with a sidecar\",\n" +
            "      \"code\": \"2\"\n" +
            "    },\n" +
            "    \"vin\": \"XMGDE02FS0H012999\",\n" +
            "    \"testStationName\": \"Rowe, Wunsch and Wisoky\",\n" +
            "    \"noOfAxles\": 2,\n" +
            "    \"vehicleType\": \"psv\",\n" +
            "    \"countryOfRegistration\": \"united kingdom\",\n" +
            "    \"preparerId\": \"ak4434\",\n" +
            "    \"preparerName\": \"Durrell Vehicles Limited\",\n" +
            "    \"vehicleConfiguration\": \"rigid\",\n" +
            "    \"testStationType\": \"gvts\",\n" +
            "    \"reasonForCancellation\": \"none\",\n" +
            "    \"testerName\": \"Dorel\",\n" +
            "    \"testStationPNumber\": \"87-1369569\",\n" +
            "    \"testerEmailAddress\": \"dorel.popescu@dvsagov.uk\",\n" +
            "    \"euVehicleCategory\": \"m1\",\n" +
            "    \"trailerId\": \"abcd\"\n" +
            "  }");

        it("should set anniversary date two months before expiryDate", () => {
            testResultsService = new TestResultsService(new MockTestResultsDAO());
            const testResultWithAnniversaryDate = testResultsService.setAnniversaryDate(psvTestResultWithExpiryDate);
            expect(testResultWithAnniversaryDate.testTypes[0].testAnniversaryDate).not.be.eql(undefined);
            expect(testResultWithAnniversaryDate.testTypes[0].testAnniversaryDate).to.be.eql("2020-07-21T10:36:33.987Z");
        });
    });
});

