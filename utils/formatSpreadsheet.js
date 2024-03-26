import { google, sheets_v4 } from "googleapis";

/**
 * Formats the spreadsheet after filling using the fillSpreadsheet() function
 *
 * @param {google.auth.OAuth2} auth an instance of the authenticated Google Oauth client
 * @param {sheets_v4.Schema$Request[]} requests an array containing the formatting requests
 */
async function formatSpreadsheet(auth, requests) {
	const sheets = google.sheets({ version: "v4", auth });
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
