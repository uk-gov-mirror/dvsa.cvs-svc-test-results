import {moveTestResultToOtherVehicle} from "../../src/functions/moveTestResultToOtherVehicle";
import {TestResultsService} from "../../src/services/TestResultsService";
import {HTTPResponse} from "../../src/models/HTTPResponse";
import {HTTPError} from "../../src/models/HTTPError";
jest.mock("../../src/services/TestResultsService");

describe("moveTestResultToOtherVehicle Function", () => {
  let event: any;
  beforeEach(() => {
    event = {
      pathParameters: {
        systemNumber: 1
      },
      body: {}
    };
  });

  afterEach(() => {
    event = null;
  });

  context("when newSystemNumber is not present on the payload", () => {
    it("should return Error 400 Bad request newSystemNumber and testResultId are mandatory", async () => {
      expect.assertions(3);
      const result = await moveTestResultToOtherVehicle(event);
      expect(result).toBeInstanceOf(HTTPResponse);
      expect(result.statusCode).toEqual(400);
      expect(result.body).toEqual(JSON.stringify("Bad request newSystemNumber and testResultId are mandatory"));
    });
  });

  context("when testResultId is not present on the payload", () => {
    it("should return Error 400 Bad request newSystemNumber and testResultId are mandatory", async () => {
      expect.assertions(3);
      const result = await moveTestResultToOtherVehicle(event);
      expect(result).toBeInstanceOf(HTTPResponse);
      expect(result.statusCode).toEqual(400);
      expect(result.body).toEqual(JSON.stringify("Bad request newSystemNumber and testResultId are mandatory"));
    });
  });

  context("when msUserDetails object is not present on the payload", () => {
    it("should return Error 400 Bad request msUserDetails not provided", async () => {
      const testResultsMock = jest.fn().mockResolvedValue("Failure");
      TestResultsService.prototype.moveTestResultToOtherVehicle = testResultsMock;
      event.body = {newSystemNumber: "123", testResultId: "123"};

      expect.assertions(3);
      const result = await moveTestResultToOtherVehicle(event);
      expect(result).toBeInstanceOf(HTTPResponse);
      expect(result.statusCode).toEqual(400);
      expect(result.body).toEqual(JSON.stringify("Bad request msUserDetails not provided"));
    });
  });

  context("Service call fails", () => {
    it("returns Error", async () => {
      const myError = new HTTPError(418, "It Broke!");
      TestResultsService.prototype.moveTestResultToOtherVehicle = jest.fn().mockRejectedValue(myError);
      event.body = {newSystemNumber: "123", testResultId: "123"};
      event.body.msUserDetails = {msOid: "2", msUser: "dorel"};

      expect.assertions(3);
      const result = await moveTestResultToOtherVehicle(event);
      expect(result).toBeInstanceOf(HTTPResponse);
      expect(result.statusCode).toEqual(418);
      expect(result.body).toEqual(JSON.stringify("It Broke!"));
    });
  });

  context("Service call succeeds", () => {
    it("returns 200 + data", async () => {
      const testResultsMock = jest.fn().mockResolvedValue("Success");
      TestResultsService.prototype.moveTestResultToOtherVehicle = testResultsMock;

      event.body = {newSystemNumber: "123", testResultId: "123"};
      event.body.msUserDetails = {msOid: "2", msUser: "dorel"};

      expect.assertions(3);
      const result = await moveTestResultToOtherVehicle(event);
      expect(result).toBeInstanceOf(HTTPResponse);
      expect(result.statusCode).toEqual(200);
      expect(result.body).toEqual(JSON.stringify("Success"));
    });
  });
});
