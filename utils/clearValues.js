import getRepeatCellRequest from "./repeatCellRequest";
import { sheets_v4 } from "googleapis";

/**
 * clears the spreadsheet cells values for use
 *
 * @param {sheets_v4.Sheets} sheets a spreadsheets instance
 */
async function clearSpreadsheetValues(sheets) {
	try {
		await sheets.spreadsheets.values.clear({
			spreadsheetId: SPREADSHEET_ID,
			range: "Cache Prices!A1:ZZ1000"
		});
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
			};
		await sheets.spreadsheets.batchUpdate({
			spreadsheetId: SPREADSHEET_ID,
			requestBody: {
				requests: [
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
				]
			}
		});
	} catch (error) {
		console.error("an error occured while clearing the spreadsheet", error);
	}
}

export default clearSpreadsheetValues;
