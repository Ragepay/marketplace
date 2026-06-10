import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";

// Tests de validación que no requieren base de datos
describe("POST /api/users/login", () => {
  it("devuelve 400 si faltan credenciales", async () => {
    const res = await request(app).post("/api/users/login").send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});

describe("POST /api/users/reset-password", () => {
  it("devuelve 400 si falta el token", async () => {
    const res = await request(app)
      .post("/api/users/reset-password")
      .send({ newPassword: "123456" });
    expect(res.status).toBe(400);
  });

  it("devuelve 400 si el token es inválido", async () => {
    const res = await request(app)
      .post("/api/users/reset-password")
      .send({ token: "no-es-un-jwt", newPassword: "123456" });
    expect(res.status).toBe(400);
  });
});

describe("Auth middleware", () => {
  it("bloquea rutas protegidas sin token", async () => {
    const res = await request(app).get("/api/chats");
    expect([401, 403]).toContain(res.status);
  });
});
