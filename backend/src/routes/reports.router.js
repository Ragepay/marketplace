import { Router } from "express";
import auth from "../middlewares/auth.js";
import { createReport, getReports, resolveReport } from "../controllers/report.controllers.js";

const app = Router();

app.post("/", auth, createReport);
app.get("/", auth, getReports);
app.patch("/:id/resolve", auth, resolveReport);

export default app;
