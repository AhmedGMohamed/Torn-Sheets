/**
 * Formats the spreadsheet after filling using the fillSpreadsheet() function
 *
 * @param {google.auth.OAuth2} auth an instance of the authenticated Google Oauth client
 */
async function formatSpreadsheet(auth) {
	const sheets = google.sheets({ version: "v4", auth });
	const itemsList = await getItemCodeList(ITEMS_PATH);
	const itemsListLength = itemsList.length;
	let requests = [];

	//TODO: remove the requests and acquire them using a parameter that's passed to the function
	//TODO: Place the requests in the prices.js router file
	requests.push(...getMergeCellsRequests(itemsList));
	requests.push(...getHeaderRequests(itemsListLength));
	let itemTiersRequests = await getItemTierColoringRequests(itemsList);
	requests.push(...itemTiersRequests);
	try {
		await sheets.spreadsheets.batchUpdate({
			spreadsheetId: SPREADSHEET_ID,
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

export default formatSpreadsheet;
