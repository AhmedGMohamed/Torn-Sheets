import { sheets_v4 } from "googleapis";
import getRepeatCellRequest from "./repeatCellRequest.js";
/**
 * Creates an array containing requests for formatting a header row
 *
 * @param {number} itemsListLength the number of items that have been queried
 * @param {number} sheetId the ID of the sheet to operate on (not to confuse with spreadsheet ID)
 * @param {sheets_v4.Schema$ColorStyle} backgroundColorStyle the background color for the header row
 * @param {sheets_v4.Schema$ColorStyle} foregroundColorStyle the foreground (text) color for the header row
 * @returns {sheets_v4.Schema$Request[]} an array containing requests for formatting the header row
 */
function getHeaderRequests(itemsListLength, sheetId, backgroundColorStyle, foregroundColorStyle) {
	let requests = [],
		repeatCell,
		updateSheetProperties,
		gridData,
		numberFormat = null,
		fontSize = 12,
		bold = true,
		horizontalAlignment = "CENTER",
		verticalAlignment = null;

	gridData = [0, 0, 1, 0, itemsListLength * 2];

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
				sheetId: sheetId,
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

export default getHeaderRequests