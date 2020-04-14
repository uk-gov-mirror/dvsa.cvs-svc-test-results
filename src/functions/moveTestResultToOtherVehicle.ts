import {TestResultsDAO} from "../models/TestResultsDAO";
import {TestResultsService} from "../services/TestResultsService";
import {HTTPResponse} from "../models/HTTPResponse";
import {MESSAGES} from "../assets/Enums";
import {ISubSeg} from "../models/ISubSeg";
/* workaround AWSXRay.captureAWS(...) call obscures types provided by the AWS sdk.
https://github.com/aws/aws-xray-sdk-node/issues/14
*/
/* tslint:disable */
let AWS: any;
if (process.env._X_AMZN_TRACE_ID) {
  /* tslint:disable */
  AWS = require("aws-xray-sdk");
} else {
  console.log("Serverless Offline detected; skipping AWS X-Ray setup");
}
/* tslint:enable */

export const moveTestResultToOtherVehicle = async (event: { pathParameters: { systemNumber: any; }; body: any; }) => {
  let subseg: ISubSeg | null = null;
  if (process.env._X_AMZN_TRACE_ID) {
    const segment = AWS.getSegment();
    AWS.capturePromise();
    if (segment) {
      subseg = segment.addNewSubsegment("updateTestResults");
    }
  }
  const testResultsDAO = new TestResultsDAO();
  const testResultsService = new TestResultsService(testResultsDAO);

  const systemNumber = event.pathParameters.systemNumber;
  const newSystemNumber = event.body.newSystemNumber;
  const testResultId = event.body.testResultId;
  const msUserDetails = event.body.msUserDetails;

  try {
    if (!newSystemNumber || !testResultId) {
      const errorMessage = MESSAGES.BAD_REQUEST + " newSystemNumber and testResultId are mandatory";
      if (subseg) {
        subseg.addError(errorMessage);
      }
      return Promise.resolve(new HTTPResponse(400, errorMessage));
    }
    if (!msUserDetails || !msUserDetails.msUser || !msUserDetails.msOid) {
      const errorMessage = MESSAGES.BAD_REQUEST + " msUserDetails not provided";
      if (subseg) {
        subseg.addError(errorMessage);
      }
      return Promise.resolve(new HTTPResponse(400, errorMessage));
    }

    return testResultsService.moveTestResultToOtherVehicle(systemNumber, {newSystemNumber, testResultId}, msUserDetails)
      .then((data) => {
        return new HTTPResponse(200, data);
      })
      .catch((error) => {
        console.log("Error in updateTestResults > updateTestResults: ", error);
        if (subseg) {
          subseg.addError(error.body);
        }
        return new HTTPResponse(error.statusCode, error.body);
      });
  } finally {
    if (subseg) {
      subseg.close();
    }
  }
};
