import { google } from "googleapis";
import { sheets_v4 } from "googleapis";

/**
 * Fills the spreadsheet with the prices and quantities of items in bazaars
 *
 * @param {google.auth.OAuth2} auth an instance of the authenticated Google Oauth client
 * @param {string} spreadsheetId the id of the spreadsheet
 * @param {Array<sheets_v4.Schema$ValueRange[]>} data an array of ValueRange arrays
 */
async function fillSpreadsheet(auth, spreadsheetId, data) {
	const sheets = google.sheets({ version: "v4", auth });

	try {
		const res = await sheets.spreadsheets.values.batchUpdate({
			spreadsheetId: spreadsheetId,
			requestBody: {
				valueInputOption: "RAW",
				data: data
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
}

export default fillSpreadsheet;
