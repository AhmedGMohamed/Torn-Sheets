import fs from "fs/promises";
import path from "path";
import process from "process";
import { authenticate } from "@google-cloud/local-auth";
import { google } from "googleapis";
import { sheets_v4 } from "googleapis";

// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), "token.json");
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");
const ITEMS_PATH = path.join(process.cwd(), "items.json");
const TORN_API_KEY = "s7kAPL0OcVwCvvKn";

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
	try {
		const content = await fs.readFile(TOKEN_PATH);
		const credentials = JSON.parse(content);
		return google.auth.fromJSON(credentials);
	} catch (err) {
		return null;
	}
}

/**
 * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
	const content = await fs.readFile(CREDENTIALS_PATH),
		keys = JSON.parse(content),
		key = keys.installed || keys.web,
		payload = JSON.stringify({
			type: "authorized_user",
			client_id: key.client_id,
			client_secret: key.client_secret,
			refresh_token: client.credentials.refresh_token
		});

	await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
	let client = await loadSavedCredentialsIfExist();

	if (client) {
		return client;
	}
	try {
		client = await authenticate({
			scopes: SCOPES,
			keyfilePath: CREDENTIALS_PATH
		});
	} catch (error) {
		console.error(
			"An error occurred while trying to authenticate google api",
			error
		);
	}
	if (client.credentials) {
		await saveCredentials(client);
	}
	return client;
}

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
 * Reads the json file and returns an array of itemIDs
 *
 * @param {string} path the name of the file containing the itemIDs to search
 * @return {Promise<Array<number>>} an array of numbers containing the itemIDs}
 */
async function getItemCodeList(path) {
	const data = await fs.readFile(path);
	const itemsList = JSON.parse(data);

	return itemsList.items;
}
/**
 * class that makes an iterable object that returns a string
 * in the form of character sequences e.x: ..., AZ, BA, BB, ...
 */
class StringIdGenerator {
	/**
	 * create an iterable list
	 *
	 * @param {string} chars the string of characters to use for ordering
	 */
	constructor(chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
		this._chars = chars;
		this._nextId = [0];
	}

	/**
	 * Get the current character sequence
	 *
	 * @return {string} the current character sequence
	 */
	current() {
		const r = [];
		for (const char of this._nextId) {
			r.unshift(this._chars[char]);
		}
		return r.join("");
	}

	/**
	 * gets the next character sequence in the list and returns it as a string
	 *
	 * @param {number} count the amount of iterations to perform
	 * @return {string} the current character sequence in the list
	 */
	next(count = 1) {
		const r = [];
		for (let index = 0; index < count; index++) {
			this._increment();
		}
		for (const char of this._nextId) {
			r.unshift(this._chars[char]);
		}
		return r.join("");
	}

	/**
	 * increments the character sequence and handles character array
	 * ending and reiteration ex: A, B, ..., Z, AA, AB, ...
	 */
	_increment() {
		for (let i = 0; i < this._nextId.length; i++) {
			const val = ++this._nextId[i];
			if (val >= this._chars.length) {
				this._nextId[i] = 0;
			} else {
				return;
			}
		}
		this._nextId.push(0);
	}

	/**
	 * iterates the character sequence using iterators ie ++
	 */
	*[Symbol.iterator]() {
		while (true) {
			yield this.next();
		}
	}
}

/**
 * gets the prices and formats them for the batchUpdate function
 *
 * @param {Array<Array<string|number>>} itemsList a 2d array supplied from
 * 		getBazaarPrices() that contains the item name, price and quantity
 * @return {Promise<sheets_v4.Schema$ValueRange[]>} check the format here:
 * https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values?authuser=0#ValueRange
 */
async function getFormattedBatchDataValues(itemsList) {
	let columns = new StringIdGenerator(),
		batchData = [];

	for (let item of itemsList) {
		const prices = await getBazaarPrices(TORN_API_KEY, item);
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
 * clears the spreadsheet for use
 *
 * @param {sheets_v4.Sheets} sheets a spreadsheets instance
 */
async function clearSpreadsheet(sheets) {
	try {
		await sheets.spreadsheets.values.clear({
			spreadsheetId: "1Dr2Z99FPIMcYpAXdWVebGlw9Kt7jVDM30eYp93aKWp4",
			range: "Cache Prices!A1:Z100"
		});
	} catch (error) {
		console.error("an error occured while clearing the spreadsheet", error);
	}
}

/**
 * Fills the spreadsheet with the prices and quantities of items in bazaars
 *
 * @param {google.auth.OAuth2} auth an instance of the authenticated Google Oauth client
 */
async function fillSpreadsheet(auth) {
	const sheets = google.sheets({ version: "v4", auth });
	const itemsList = await getItemCodeList(ITEMS_PATH);
	let batchData = await getFormattedBatchDataValues(itemsList);

	try {
		await clearSpreadsheet(sheets);
		const res = await sheets.spreadsheets.values.batchUpdate({
			spreadsheetId: "1Dr2Z99FPIMcYpAXdWVebGlw9Kt7jVDM30eYp93aKWp4",
			requestBody: {
				valueInputOption: "RAW",
				data: batchData
			}
		});
		const totalUpdatedColumns = res.data.totalUpdatedColumns;
		const totalUpdatedCells = res.data.totalUpdatedCells;

		if (!totalUpdatedColumns) {
			console.log("No data has been updated.");
			return;
		}
		console.log(
			`Number of columns updated: ${totalUpdatedColumns}\nNumber of cells updated: ${totalUpdatedCells}`
		);
	} catch (error) {
		console.error(
			"An error occured while sending a request to spreadsheet API",
			error
		);
	}
	return batchData;
}

/**
 * creates a GridRange object from the parameters passed
 *
 * @param {number} sheetId the gid of the sheet
 * @param {number} startRowIndex the start index of the row (inclusive)
 * @param {number} endRowIndex the end index of the row (exclusive)
 * @param {number} startColumnIndex the start index of the column (inclusive)
 * @param {number} endColumnIndex the end index of the column (exclusive)
 * @returns {sheets_v4.Schema$GridRange}
 * check the format of GridRange here: https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets/other?authuser=0#GridRange
 */
function getGridRange(
	sheetId,
	startRowIndex = null,
	endRowIndex = null,
	startColumnIndex = null,
	endColumnIndex = null
) {
	const gridRange = {
		sheetId: sheetId,
		startRowIndex: startRowIndex,
		endRowIndex: endRowIndex,
		startColumnIndex: startColumnIndex,
		endColumnIndex: endColumnIndex
	};
	return gridRange;
}

/**
 * Creates a formatted Schema$Request array with Schema$MergeCellsRequest objects for
 * merging two columns per item in the list in the first row
 * @param {number[]} itemsList - an array of items IDs that represent the total columns
 * @return {Promise<sheets_v4.Schema$MergeCellsRequest[]>}
 * Check the format of MergeCellsRequest here:
 * https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets/request?authuser=0#mergetype
 */
function getMergeCellsRequests(itemsList) {
	let requestList = [],
		col = 0;

	itemsList.forEach(() => {
		const gridRange = getGridRange(0, 0, 1, col, col + 2);
		const mergeCellsRequest = {
			mergeCells: {
				range: gridRange,
				mergeType: "MERGE_ROWS"
			}
		};
		requestList.push(mergeCellsRequest);
		col += 2;
	});
	return requestList;
}

/**
 * @param {}

 */
/**
 * creates an RepeatCellRequest object that createse a header row
 *
 * @param {number[]}  gridData an array containing the sheetId, start and end indices of both rows and columns
 * @param {sheets_v4.Schema$NumberFormat} numberFormat
 * @param {sheets_v4.Schema$ColorStyle} backgroundColorStyle
 * @param {sheets_v4.Schema$ColorStyle} foregroundColorStyle
 * @param {number|null} fontSize
 * @param {boolean|null} bold
 * @param {string|null} horizontalAlignment
 * @param {string|null} verticalAlignment
 * @return {sheets_v4.Schema$RepeatCellRequest} check the format here:
 * https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets/request?authuser=0#RepeatCellRequest
 */
function getRepeatCellRequest(
	gridData,
	numberFormat,
	backgroundColorStyle,
	foregroundColorStyle,
	fontSize,
	bold,
	horizontalAlignment,
	verticalAlignment
) {
	let repeatCell,
		range,
		{
			sheetId,
			startRowIndex,
			endRowIndex,
			startColumnIndex,
			endColumnIndex
		} = gridData;

	range = getGridRange(
		sheetId,
		startRowIndex,
		endRowIndex,
		startColumnIndex,
		endColumnIndex
	);
	repeatCell = {
		repeatCell: {
			range: range,
			cell: {
				userEnteredFormat: {
					numberFormat: numberFormat,
					backgroundColorStyle: backgroundColorStyle,
					horizontalAlignment: horizontalAlignment,
					verticalAlignment: verticalAlignment,
					textFormat: {
						foregroundColorStyle: foregroundColorStyle,
						fontSize: fontSize,
						bold: bold
					}
				}
			},
			fields: "userEnteredFormat(numberFormat, backgroundColor, horizontalAlignment, verticalAlignment textFormat)"
		}
	};
	return repeatCell;
}

/**
 * Creates an array containing requests for formatting a header row
 *
 * @param {number} itemsListLength the number of items that have been queried
 * @returns {sheets_v4.Schema$Request[]} an array containing requests for formatting the header row
 */
function getHeaderRequests(itemsListLength) {
	let requests = [],
		repeatCell,
		updateSheetProperties,
		gridData,
		numberFormat = null,
		backgroundColorStyle,
		foregroundColorStyle,
		fontSize,
		bold,
		horizontalAlignment,
		verticalAlignment = null;

	gridData = [0, 0, 1, 0, itemsListLength * 2];
	backgroundColorStyle = {
		rgbColor: {
			red: 0,
			green: 0,
			blue: 0
		}
	};
	foregroundColorStyle = {
		rgbColor: {
			red: 1,
			green: 1,
			blue: 1
		}
	};
	fontSize = 12;
	bold = true;
	horizontalAlignment = "CENTER";
	repeatCell = getRepeatCellRequest(
		gridData,
		numberFormat,
		backgroundColorStyle,
		foregroundColorStyle,
		fontSize,
		bold,
		horizontalAlignment,
		verticalAlignment
	);
	updateSheetProperties = {
		updateSheetProperties: {
			properties: {
				sheetId: SHEET_ID,
				gridProperties: {
					frozenRowCount: 1
				}
			},
			fields: "gridProperties.frozenRowCount"
		}
	};
	requests.push(repeatCell, updateSheetProperties);
	return requests;
}

/**
 * Determines the tier of the items using the average market price
 *
 * @param {number[]} itemPrices a number array containing each price for the item
 * @param {number} averagePrice the average market price for the item
 * @returns {string[]} an array containing the price tier of each item, ranging from A to F
 */
function getPriceTiers(itemPrices, averagePrice) {
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
 * @param {string[]} itemsCodeList
 * @param {{
 * A: sheets_v4.Schema$ColorStyle,
 * B: sheets_v4.Schema$ColorStyle,
 * C: sheets_v4.Schema$ColorStyle,
 * D: sheets_v4.Schema$ColorStyle,
 * E: sheets_v4.Schema$ColorStyle
 * }} colors
 */
async function getItemsColoring(itemsCodeList, colorPallete) {
	let allItemsPriceTiers = [],
		currentItem = [],
		averagePrices = [],
		colorStyles = [];

	itemsCodeList = await getItemCodeList(ITEMS_PATH);
	for (item of itemsCodeList) {
		try {
			const res = await fetch(
				`https://api.torn.com/torn/${item}?key=${TORN_API_KEY}}&selections=items&comment=CachePriceScript`
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

	for (let i = 0; i < itemsCodeList.length(); i++) {
		const item = itemsCodeList[i];
		let itemPriceTier;

		currentItem = await getBazaarPrices(TORN_API_KEY, item);
		currentItem = currentItem[0];
		currentItem.shift();
		itemPriceTier = getPriceTiers(currentItem, averagePrices[i]);
		allItemsPriceTiers.push(itemPriceTier);
	}

	allItemsPriceTiers.forEach((item, index) => {
		item.forEach((priceTier) => {
			colorStyles[index].push(colorPallete[priceTier]);
		});
	});
	return colorStyles;
}

/**
 * Formats the spreadsheet after filling using the fillSpreadsheet() function
 *
 * @param {google.auth.OAuth2} auth an instance of the authenticated Google Oauth client
 * @param {sheets_v4.Schema$ValueRange[]} batchData an array containing the mergeCell requests (only used for getting the values inside it)
 */
async function formatSpreadsheet(auth) {
	const sheets = google.sheets({ version: "v4", auth });
	const itemsList = await getItemCodeList(ITEMS_PATH);
	const itemsListLength = itemsList.length;
	let requests = [],
		value,
		counter = 0;

	requests.push(...getMergeCellsRequests(itemsList));
	requests.push(...getHeaderRequests(itemsListLength));
	requests.push(...getItemTierColoringRequests());
	try {
		await sheets.spreadsheets.batchUpdate({
			spreadsheetId: "1Dr2Z99FPIMcYpAXdWVebGlw9Kt7jVDM30eYp93aKWp4",
			requestBody: {
				requests: requests
			}
		});
	} catch (error) {
		console.error(
			"An error occured while trying to format the spreadsheet",
			error
		);
	}
}

const auth = await authorize();
const batchData = await fillSpreadsheet(auth);
await formatSpreadsheet(auth, batchData);
