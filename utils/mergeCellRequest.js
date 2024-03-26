import getGridRange from "./gridRange";
import { sheets_v4 } from "googleapis";
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
