import express from "express";
import path from "path";
import process from "process";
import { itemsRouter } from "./routes/prices";

const app = express();
const port = process.env.PORT || 3000;

// Provide the css files as static files
app.use(express.static(path.resolve("public")));

// Gets the main page that includes documentation on request
app.get("/", (_req, res) => {
	console.log("main page GET request recieved!");
	res.sendFile(path.resolve("index.html"));
});

app.use("/items", itemsRouter);

//Initializes the server with the port
app.listen(port, () => {
	console.log(`Server started!\nlocalhost:${port}`);
});

export default app;
