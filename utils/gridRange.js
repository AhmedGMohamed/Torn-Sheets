import { sheets_v4 } from "googleapis";

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

export default getGridRange;
