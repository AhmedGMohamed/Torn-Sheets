import db from "../utils/trading/database";

/**
 * Maps an array of items to create new Item objects.
 *
 * @param {Array<Object>} items - The array of items to create Item objects from.
 * @return {Array<Item | null>} An array of newly created Item objects.
 */
function createItemsFromDBQuery(items) {
	if (items) {
		return items.map(
			(item) =>
				new Item(
					item.ItemID,
					item.BuyPrice,
					item.BuyQuantity,
					item.SellerID,
					item.BuyTimestamp,
					item.SellQuantity,
					item.ItemBoughtID
				)
		);
	}
	return null;
}

export class Item {
	/**
	 * Constructor for creating a new Item object.
	 *
	 * @param {number} itemID - the game id of the item
	 * @param {number} price - the price of the item
	 * @param {number} quantity - the quantity of the item
	 * @param {number} sellerID - the ID of the user the item was bought from
	 * @param {number} buyTimestamp - timestamp of buying the item
	 * @param {boolean} sellQuantity- a boolean represnting the amount of items sold so far
	 * @param {number} itemBoughtID - optional database primary key ID of the item bought
	 */
	constructor(
		itemID,
		price,
		quantity,
		sellerID,
		buyTimestamp,
		sellQuantity,
		itemBoughtID = null
	) {
		this.itemBoughtID = +itemBoughtID;
		this.itemID = +itemID;
		this.price = +price;
		this.quantity = +quantity;
		this.sellerID = +sellerID;
		this.buyTimestamp = +buyTimestamp;
		this.sellQuantity = +sellQuantity;
	}

	/**
	 * Returns an array containing the item ID, quantity, price, ID of the user the item was bought from, and the timestamp of buying the item.
	 *
	 * @return {number[]} An array containing the item ID, quantity, price, ID of the user the item was bought from, and the timestamp of buying the item.
	 */
	getDataArray() {
		return [
			this.itemID,
			this.price,
			this.quantity,
			this.sellerID,
			this.buyTimestamp,
			this.sellQuantity
		];
	}

	/**
	 * Returns an object containing details of the item including itemBoughtID, itemID, price, quantity, sellerID, buyTimestamp, and sellQuantity.
	 *
	 * @return {Object} An object containing the item details.
	 */
	getDataObject() {
		return {
			itemBoughtID: this.itemBoughtID,
			itemID: this.itemID,
			price: this.price,
			quantity: this.quantity,
			sellerID: this.sellerID,
			buyTimestamp: this.buyTimestamp,
			sellQuantity: this.sellQuantity
		};
	}

	/**
	 * Retrieves the database ID of the item.
	 *
	 * @return {number} The database ID of the item.
	 */
	getDBID() {
		return this.itemBoughtID;
	}
}

export class ItemsStore {
	/**
	 * A function to insert an item into the database.
	 *
	 * @param {Item} item - The item object to be inserted.
	 * @return {Promise<Item[]> | null} A Promise that resolves with the result of the insertion.
	 */
	async create(item) {
		try {
			const insertResult = await db.execute(
				"INSERT INTO ItemsBought (ItemID, BuyPrice, BuyQuantity, SellerID, BuyTimestamp, SellQuantity) VALUES (?,?,?,?,?)",
				item.getData()
			);
			if (insertResult[0].insertId != undefined) {
				throw new Error("Insertion failed");
			}
			const insertedId = insertResult[0].insertId;
			const result = await db.execute(
				"SELECT * FROM ItemsBought WHERE ItemBoughtID = ?",
				[insertedId]
			);
			return createItemsFromDBQuery(result[0]);
		} catch (error) {
			console.error(error);
			return null;
		}
	}

	/**
	 * Retrieves all items from the database.
	 *
	 * @return {Promise<Item[] | null>} A Promise that resolves with the result of the query.
	 */
	async findAll() {
		try {
			const result = await db.execute("SELECT * FROM ItemsBought");
			return createItemsFromDBQuery(result[0]);
		} catch (error) {
			console.error(error);
			return null;
		}
	}

	/**
	 * Finds an item in the database by its item bought ID.
	 *
	 * @param {number} itemBoughtID - The ItemBoughtID of the item to search for.
	 * @return {Promise<Item[] | null>} A Promise that resolves with the result of the query.
	 */
	async findByItemBoughtID(itemBoughtID) {
		try {
			const result = await db.execute(
				"SELECT * FROM ItemsBought WHERE ItemBoughtID = ?",
				[itemBoughtID]
			);

			return createItemsFromDBQuery(result[0]);
		} catch (error) {
			console.error(error);
			return null;
		}
	}

	/**
	 * Finds an item in the database by its item ID.
	 *
	 * @param {number} itemID - The ID of the item to search for.
	 * @return {Promise<Item[] | null>} A Promise that resolves with the result of the query.
	 */
	async findByItemID(itemID) {
		try {
			const result = await db.execute(
				"SELECT * FROM ItemsBought WHERE itemID = ?",
				[itemID]
			);

			return createItemsFromDBQuery(result[0]);
		} catch (error) {
			console.error(error);
			return null;
		}
	}

	/**
	 * Updates the quantity of an item in the database.
	 *
	 * @param {number} updatedQuantity - The new quantity of the item.
	 * @param {number} itemID - The ID of the item to update.
	 * @param {boolean} sellQuantity - the amount of items sold so far
	 * @return {Promise<Item[] | null>} A Promise that resolves with the result of the update query.
	 */
	async update(updatedQuantity, updatedPrice, sellQuantity, itemID) {
		try {
			const updateResult = await db.execute(
				"UPDATE ItemsBought SET quantity = ?, SellQuantity = ? WHERE ItemID = ?",
				[updatedQuantity, updatedPrice, sellQuantity, itemID]
			);
			if (updateResult[0].affectedRows == 0) {
				return null;
			}
			const updatedItems = await db.execute(
				"SELECT * FROM Itemsbought WHERE ItemID = ?",
				[itemID]
			);
			return createItemsFromDBQuery(updatedItems[0]);
		} catch (error) {
			console.error(error);
			return null;
		}
	}

	/**
	 * Deletes an item from the database based on its item ID.
	 *
	 * @param {itemID} itemID - The ID of the item to be deleted.
	 * @return {Promise<number | null>} A Promise that resolves with the number of rows deleted
	 */
	async deleteByItemID(itemID) {
		try {
			const result = await db.execute(
				"DELETE FROM ItemsBought WHERE ItemID = ?",
				[itemID]
			);
			return +result[0].affectedRows;
		} catch (error) {
			console.error(error);
			return null;
		}
	}

	/**
	 * Retrieves all sold items from the database.
	 *
	 * @return {Promise<Item[] | null>} A Promise that resolves with the result of the query.
	 */
	async findSold() {
		try {
			const result = await db.execute(
				"SELECT * FROM ItemsBought WHERE SellQuantity = BuyQuantity"
			);
			return createItemsFromDBQuery(result[0]);
		} catch (error) {
			console.error(error);
			return null;
		}
	}

	/**
	 * Finds a sold item in the database by its item ID.
	 *
	 * @param {number} itemID - The ID of the item to search for.
	 * @return {Promise<Item[] | null>} A Promise that resolves with the result of the query.
	 */
	async findSoldByItemID(itemID) {
		try {
			const result = await db.execute(
				"SELECT * FROM ItemsBought WHERE ItemID = ? AND SellQuantity = BuyQuantity",
				[itemID]
			);
			return createItemsFromDBQuery(result[0]);
		} catch (error) {
			console.error(error);
			return null;
		}
	}

	/**
	 * Deletes an item from the database based on its PK (ItemBoughtID).
	 *
	 * @param {number} itemBoughtID - the PK (ItemBoughtID) of the item to be deleted
	 * @return {Promise<number | null>} A Promise that resolves with the number of deleted rows.
	 */
	async deleteByItemBoughtID(itemBoughtID) {
		try {
			const result = await db.execute(
				"DELETE FROM ItemsBought WHERE ItemBoughtID = ?",
				[itemBoughtID]
			);
			return +result[0].affectedRows;
		} catch (error) {
			console.error(error);
			return null;
		}
	}
}
