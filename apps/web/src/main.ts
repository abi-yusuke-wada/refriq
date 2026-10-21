import { createHttpReviewerClient } from "./http-client.js";
import { mountReviewerApp } from "./reviewer.js";
import "./styles.css";
const root = document.querySelector<HTMLElement>("#app");
if (root) mountReviewerApp(root, createHttpReviewerClient("/api/reviewer"));
