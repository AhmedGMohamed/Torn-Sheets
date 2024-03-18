import getGridRange from "./gridRange";
/**
 * creates an RepeatCellRequest object that createse a header row
 *
 * @param {number[]}  gridData an array containing the sheetId, start and end indices of both rows and columns
 * @param {sheets_v4.Schema$NumberFormat|null} numberFormat
 * @param {sheets_v4.Schema$ColorStyle|null} backgroundColorStyle
 * @param {sheets_v4.Schema$ColorStyle|null} foregroundColorStyle
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
		[
			sheetId,
			startRowIndex,
			endRowIndex,
			startColumnIndex,
			endColumnIndex
		] = gridData;
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
			fields: "userEnteredFormat(numberFormat, backgroundColorStyle, horizontalAlignment, verticalAlignment, textFormat)"
		}
	};
	return repeatCell;
}

export default getRepeatCellRequest;
