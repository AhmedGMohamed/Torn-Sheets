import getRepeatCellRequest from "./repeatCellRequest.js";
import { sheets_v4 } from "googleapis";

/**
 * clears the spreadsheet formatting for use
 *
 * @param {sheets_v4.Sheets} sheets a spreadsheets instance
 */
async function clearSpreadsheetFormatting(sheets, spreadsheetId) {
	try {
		let backgroundColorStyleDefault = {
				rgbColor: {
					red: 1,
					green: 1,
					blue: 1,
					alpha: 1
				}
			},
			foregroundColorStyleDefault = {
				rgbColor: {
					red: 0,
					green: 0,
					blue: 0,
					alpha: 0
				}
			},
			requests = [
				getRepeatCellRequest(
					[0, 0, 1000, 0, 1000],
					null,
					backgroundColorStyleDefault,
					foregroundColorStyleDefault,
					10,
					false,
					null,
					null
				)
			];
		await sheets.spreadsheets.batchUpdate({
			spreadsheetId: spreadsheetId,
			requestBody: {
				requests: requests
			}
		});
	} catch (error) {
		console.error("an error occured while clearing the spreadsheet", error);
	}
}

export default clearSpreadsheetFormatting