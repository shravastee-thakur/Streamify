import request from "supertest";
import app from "../src/app.js";

describe("Base Express Application", () => {
  it("should return 404 for an unknown route", async () => {
    const response = await request(app).get(
      "/api/v1/this-route-does-not-exist",
    );
    expect(response.status).toBe(404);
  });
});
