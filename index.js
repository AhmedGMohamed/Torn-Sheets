import express from "express";
import path from "path";
import process from "process";
import "dotenv/config";
import itemsRouter from "./routes/prices.js";
import authorize from "./utils/authorize.js";
import placeAuth from "./middleware/placeAuth.js";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const CLIENT_EMAIL = process.env.CLIENT_EMAIL;
const GOOGLE_API_KEY = process.env.PRIVATE_KEY;

const app = express();
const port = process.env.PORT || 3000;
export const auth = authorize(CLIENT_EMAIL, null, GOOGLE_API_KEY, SCOPES);

// parse the body as JSON objects
app.use(express.json());

// Provide the css files as static files
app.use(express.static(path.resolve("public")));

// Gets the main page that includes documentation on request
app.get("/", (_req, res) => {
	console.log("main page GET request recieved!");
	res.sendFile(path.resolve("index.html"));
});

// Handle requests for getting item prices and placing them in the spreadsheet
app.use("/items", placeAuth, itemsRouter);

//Initializes the server with the port
app.listen(port, () => {
	console.log(`Server started!\nlocalhost:${port}`);
});

export default app;
