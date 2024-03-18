// * maaaan this is gonna take a while...
//TODO: setup the itemPrices script in this file
//TODO: use the TODOs in the indexLegacy.js file to get this project going
//* figure out a way to get specific items from the user instead of using a local file - DONE
import express from "express";
import { google, sheets_v4 } from "googleapis";
import stringGenerator from "../utils/alphabetNumberingGen.js";
import clearSpreadsheetFormatting from "../utils/clearFormat.js";
import clearSpreadsheetValues from "../utils/clearValues.js";
import fillSpreadsheet from "../utils/fillSpreadsheet.js";

let router = express.Router();

/**
 * Gets the prices and quantities for the item corresponding itemID
 *
 * @description Creates a 2d array structured as follows:
 * 				['ITEM NAME', 'PRICE', 'PRICE', ...]
 * 				['ITEM NAME', 'COUNT', 'COUNT', ...]
 * @param {number} key the torn API key to authenticate with
 * @param {string} itemID the ID of the item to query
 * @return {Promise<Array<Array<number|string>>>} a 2d array containing the prices
 */
async function getBazaarPrices(key, itemID) {
	let pricesArray2d = [],
		array1 = [],
		array2 = [],
		prices,
		itemName,
		response;

	try {
		response = await fetch(
			`https://api.torn.com/market/${itemID}?key=${key}&selections=bazaar&comment=CachePriceScript`
		);
		prices = (await response.json()).bazaar;
		response = await fetch(
			`https://api.torn.com/torn/${itemID}?key=${key}&selections=items&comment=CachePriceScript`
		);
		itemName = (await response.json()).items[`${itemID}`].name;
	} catch (error) {
		console.error(
			"An error occured while fetching the price and name of an item",
			error
		);
	}
	array1 = [itemName];
	array2 = [itemName];
	if (prices) {
		prices.forEach((value) => {
			array1.push(value.cost);
			array2.push(value.quantity);
		});
	}
	pricesArray2d.push(array1, array2);
	return pricesArray2d;
}

/**
 * gets the prices and formats them for the batchUpdate function
 *
 * @param {Array<Array<string|number>>} itemsList a 2d array supplied from
 * 		getBazaarPrices() that contains the item name, price and quantity
 * @return {Promise<sheets_v4.Schema$ValueRange[]>} check the format here:
 * https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values?authuser=0#ValueRange
 */
async function getFormattedBatchDataValues(itemsList, tornKey) {
	let columns = new stringGenerator(),
		batchData = [];

	for (let item of itemsList) {
		const prices = await getBazaarPrices(tornKey, item);
		let valueRangeObject = {
			range: `Cache Prices!${columns.current()}:${columns.next(2)}`,
			majorDimension: "COLUMNS",
			values: prices
		};
		batchData.push(valueRangeObject);
	}
	return batchData;
}

router.post("/", async (req, res) => {
	const auth = req.body.google_auth,
		spreadsheetId = req.body.spreadsheet_id,
		itemsList = req.body.items,
		tornKey = req.body.torn_api_key;

	console.log("POST request to items recieved");

	let sheets = google.sheets({ version: "v4", auth });
	// Gets the data to use in the google sheets request
	let data = await getFormattedBatchDataValues(itemsList, tornKey);

	// clears the spreadsheet of any existing data or formats
	await clearSpreadsheetValues(sheets, spreadsheetId)
	await clearSpreadsheetFormatting(sheets, spreadsheetId)
	await fillSpreadsheet(auth, spreadsheetId, data)

	//TODO: Format the spreadsheet
});

export default router;
