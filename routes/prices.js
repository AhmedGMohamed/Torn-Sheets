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
import frozenRowRequests from "../utils/frozenRowRequest";
import formatSpreadsheet from "../utils/formatSpreadsheet.js";
import getRepeatCellRequest from "../utils/repeatCellRequest.js";
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
 * @param {string} tornKey a string containing the torn API key
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

/**
 * Determines the tier of the items using the average market price
 *
 * @param {number[]} itemPrices a number array containing each price for the item
 * @param {number} averagePrice the average market price for the item
 * @returns {string[]} an array containing the price tier of each item, ranging from A to F
 */
function getPriceTier(itemPrices, averagePrice) {
	let itemPriceTier = itemPrices.map((price) => {
		if (price < averagePrice - averagePrice * 0.5) {
			return "A";
		} else if (price < averagePrice - averagePrice * 0.2) {
			return "B";
		} else if (price < averagePrice + averagePrice * 0.2) {
			return "C";
		} else if (price < averagePrice + averagePrice * 0.5) {
			return "D";
		} else {
			return "F";
		}
	});
	return itemPriceTier;
}

/**
 * gets the market price for each item and returns an array of ColorStyle objects depending on the item's tier
 *
 * @param {string[]} itemsCodeList a list containing the code for each item
 * @param {{
 * A: sheets_v4.Schema$ColorStyle,
 * B: sheets_v4.Schema$ColorStyle,
 * C: sheets_v4.Schema$ColorStyle,
 * D: sheets_v4.Schema$ColorStyle,
 * F: sheets_v4.Schema$ColorStyle
 * }} colors a color pallette to use for the item grading system
 * @returns {Promise<Array<Array<sheets_v4.Schema$ColorStyle>>>} a 2d array cotaining ColorStyle objects that correspond to each item price's tier
 */
async function getItemsColoring(itemsCodeList, colorPallete) {
	let allItemsPriceTiers = [],
		currentItem = [],
		averagePrices = [],
		colorStyles = [];

	for (let item of itemsCodeList) {
		try {
			const res = await fetch(
				`https://api.torn.com/torn/${item}?key=${TORN_API_KEY}&selections=items&comment=CachePriceScript`
			);
			const marketValue = (await res.json()).items[item].market_value;
			averagePrices.push(+marketValue);
		} catch (error) {
			console.error(
				`Failed to fetch item ${item} average market price`,
				error
			);
		}
	}

	for (let i = 0; i < itemsCodeList.length; i++) {
		const item = itemsCodeList[i];
		let itemPriceTier;

		currentItem = await getBazaarPrices(TORN_API_KEY, item);
		currentItem = currentItem[0];
		currentItem.shift();
		itemPriceTier = getPriceTier(currentItem, averagePrices[i]);
		allItemsPriceTiers.push(itemPriceTier);
	}

	allItemsPriceTiers.forEach((item, index) => {
		let tempArray = [];
		item.forEach((priceTier) => {
			tempArray.push(colorPallete[priceTier]);
		});
		colorStyles.push(tempArray);
	});
	return colorStyles;
}

/**
 * creates a repeatCellRequest for each item and item tier
 *
 * @param {*} itemsList a list containing all the items' codes
 * @returns {Promise<Array<sheets_v4.Schema$RepeatCellRequest>>}
 */
async function getItemTierColoringRequests(itemsList) {
	// color schemes for each price tier
	const colors = {
		A: {
			// green
			rgbColor: {
				red: 44 / 255,
				green: 186 / 255,
				blue: 0,
				alpha: 1
			}
		},
		B: {
			// lime
			rgbColor: {
				red: 163 / 255,
				green: 255 / 255,
				blue: 0,
				alpha: 1
			}
		},
		C: {
			// yellow
			rgbColor: {
				red: 255 / 255,
				green: 244 / 255,
				blue: 0,
				alpha: 1
			}
		},
		D: {
			// orange
			rgbColor: {
				red: 255 / 255,
				green: 167 / 255,
				blue: 0,
				alpha: 1
			}
		},
		F: {
			// red
			rgbColor: {
				red: 255 / 255,
				green: 0,
				blue: 0,
				alpha: 1
			}
		}
	};
	const colorStyles = await getItemsColoring(itemsList, colors);
	let row = 1,
		col = 0; // increment row by 1 (starts from 1 to ignore header row) and increment col by 2 (to skip the item count column)
	let repeatCellRequests = [];

	colorStyles.forEach((item) => {
		item.forEach((price) => {
			const gridData = [0, row, row + 1, col, col + 1];

			const repeatCellRequest = getRepeatCellRequest(
				gridData,
				null,
				price,
				null,
				null,
				null,
				null,
				null
			);
			repeatCellRequests.push(repeatCellRequest);
			row++;
		});
		row = 1;
		col += 2;
	});
	return repeatCellRequests;
}
router.post("/", async (req, res) => {
	const auth = req.body.google_auth,
		spreadsheetId = req.body.spreadsheet_id,
		sheetId = req.body.sheet_id,
		itemsList = req.body.items,
		tornKey = req.body.torn_api_key;

	console.log("POST request to items recieved");

	let sheets = google.sheets({ version: "v4", auth });
	try {
		// Gets the data to use in the google sheets request
		let data = await getFormattedBatchDataValues(itemsList, tornKey);

		// clears the spreadsheet of any existing data or formats
		await clearSpreadsheetValues(sheets, spreadsheetId);
		await clearSpreadsheetFormatting(sheets, spreadsheetId);
		await fillSpreadsheet(auth, spreadsheetId, data);

		// an array that will contain all the requests that will be supplied to the formatSpreadsheet function
		let formatRequests = [];

		// Set the background and foreground colors of the header row
		let backgroundColorStyle = {
				rgbColor: {
					red: 0,
					green: 0,
					blue: 0,
					alpha: 1
				}
			},
			foregroundColorStyle = {
				rgbColor: {
					red: 1,
					green: 1,
					blue: 1,
					alpha: 1
				}
			};
		// get the header row (frozen row) requests (it's an array with a mergeCell Request and a updateSheetProperties Request)
		let headerRowRequests = frozenRowRequests(
			itemsList.length,
			sheetId,
			backgroundColorStyle,
			foregroundColorStyle
		);
		// get a coloring request for each bazaar item
		let itemColoringRequests = await getItemTierColoringRequests(itemsList);

		formatRequests.push(...headerRowRequests, itemColoringRequests);
		// Format the spreadsheet using the requests supplied
		await formatSpreadsheet(auth, formatRequests);

		res.status(200).send("Successfuly updated the spreadsheet");
	} catch (error) {
		res.status(500).send(
			`An error occurred while updating the spreadsheet\nError: ${error}`
		);
	}
});

export default router;
