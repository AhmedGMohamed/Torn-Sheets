/**
 * Fills the spreadsheet with the prices and quantities of items in bazaars
 *
 * @param {google.auth.OAuth2} auth an instance of the authenticated Google Oauth client
 */
async function fillSpreadsheet(auth) {
	const sheets = google.sheets({ version: "v4", auth });
	//TODO: Remove these 2 lines and place them in the prices.js router
	const itemsList = await getItemCodeList(ITEMS_PATH);
	let batchData = await getFormattedBatchDataValues(itemsList);

	try {
		//TODO: Remove the clear function calls and place them in the prices.js router file
		await clearSpreadsheetValues(sheets);
		await clearSpreadsheetFormatting(sheets);
		const res = await sheets.spreadsheets.values.batchUpdate({
			spreadsheetId: SPREADSHEET_ID,
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