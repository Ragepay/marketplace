import { Router } from "express";
import auth from "../middlewares/auth.js";
import { getReviewsForUser, createReview } from "../controllers/review.controllers.js";

const app = Router();

app.get("/user/:userId", getReviewsForUser);
app.post("/", auth, createReview);

export default app;
