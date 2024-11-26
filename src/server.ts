import express from "express";
import path from "path";
import process from "process";
import "dotenv/config";
import authorize from "./utils/prices/authorize";
import placeAuth from "./middleware/placeAuth";
import itemsRouter from "./routes/prices";
import tradingRouter from "./routes/trading";
//import estimatesRouter from "./routes/estimates.js";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const CLIENT_EMAIL = process.env.CLIENT_EMAIL as string;
const GOOGLE_API_KEY= process.env.PRIVATE_KEY as string;

const app = express();
const port = process.env.PORT || 3000;
export const auth = authorize(CLIENT_EMAIL, undefined, GOOGLE_API_KEY, SCOPES);

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

app.use("/trading", tradingRouter);
//app.use("/estimates", placeAuth, estimatesRouter);

//Initializes the server with the port
app.listen(port, () => {
	console.log(`Server started!\nlocalhost:${port}`);
});

export default app;
