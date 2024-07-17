import db from "../utils/database";

export class Item {
	/**
	 * Constructor for creating a new Item object.
	 *
	 * @param {number} itemID - the id of the item
	 * @param {number} price - the price of the item bought
	 * @param {number} quantity - the quantity of the item bought
	 * @param {number} boughtFrom - the ID of the user the item was bought from
	 * @param {number} buyTimestamp - timestamp of buying the item
	 */
	constructor(itemID, price, quantity, sellerID, buyTimestamp) {
		this.itemID = itemID;
		this.price = price;
		this.quantity = quantity;
		this.sellerID = sellerID;
		this.buyTimestamp = buyTimestamp;
		this.sold = 0
	}

	/**
	 * Returns an array containing the item ID, quantity, price, ID of the user the item was bought from, and the timestamp of buying the item.
	 *
	 * @return {number[]} An array containing the item ID, quantity, price, ID of the user the item was bought from, and the timestamp of buying the item.
	 */
	getData() {
		return [
			this.itemID,
			this.price,
			this.quantity,
			this.boughtFrom,
			this.buyTimestamp,
			this.sold
		];
	}
}

export class ItemsStore {

	/**
	 * A function to insert an item into the database.
	 *
	 * @param {Item} item - The item object to be inserted.
	 * @return {Promise} A Promise that resolves with the result of the insertion.
	 */
	async create(item) {
		try {
			return db.execute(
				"INSERT INTO ItemsBought (ItemID, BuyPrice, BuyQuantity, SellerID, BuyTimestamp, Sold) VALUES (?,?,?,?,?)",
				item.getData()
			);
		} catch (error) {
			console.log(error);
		}
	}

	/**
	 * Retrieves all items from the database.
	 *
	 * @return {Promise} A Promise that resolves with the result of the query.
	 */
	async findAll() {
		return db.execute("SELECT * FROM ItemsBought");
	}

	/**
	 * Finds an item in the database by its item bought ID.
	 *
	 * @param {number} itemBoughtID - The ItemBoughtID of the item to search for.
	 * @return {Promise} A Promise that resolves with the result of the query.
	 */
	async findByItemBoughtID(itemBoughtID) {
		return db.execute("SELECT * FROM ItemsBought WHERE ItemBoughtID = ?", [
			itemBoughtID
		]);
	}

	/**
	 * Finds an item in the database by its item ID.
	 *
	 * @param {number} itemID - The ID of the item to search for.
	 * @return {Promise} A Promise that resolves with the result of the query.
	 */
	async findByItemID(itemID) {
		return db.execute("SELECT * FROM ItemsBought WHERE itemID = ?", [
			itemID
		]);
	}

	/**
	 * Retrieves all sold items from the database.
	 *
	 * @return {Promise} A Promise that resolves with the result of the query.
	 */
	async findSold() {
		return db.execute("SELECT * FROM ItemsBought WHERE sold = 1");
	}

	/**
	 * Finds a sold item in the database by its item ID.
	 *
	 * @param {number} itemID - The ID of the item to search for.
	 * @return {Promise} A Promise that resolves with the result of the query.
	 */
	async findSoldByItemID(itemID) {
		return db.execute(
			"SELECT * FROM ItemsBought WHERE ItemID = ? AND Sold = 1",
			[itemID]
		);
	}

	/**
	 * Updates the quantity of an item in the database.
	 *
	 * @param {number} updatedQuantity - The new quantity of the item.
	 * @param {number} itemID - The ID of the item to update.
	 * @param {boolean} sold - Whether the item has been sold in the bazaar yet.
	 * @return {Promise} A Promise that resolves with the result of the update query.
	 */
	async update(updatedQuantity, updatedPrice, sold, itemID) {
		return db.execute(
			"UPDATE ItemsBought SET quantity = ?, Sold = ? WHERE ItemID = ?",
			[updatedQuantity, updatedPrice, sold, itemID]
		);
	}

	async deleteByItemBoughtID(itemID) {
		return db.execute("DELETE FROM ItemsBought WHERE ItemID = ?", [itemID]);
	}
	/**
	 * Deletes an item from the database based on its item ID.
	 *
	 * @param {itemID} itemID - The ID of the item to be deleted.
	 * @return {Promise} A Promise that resolves with the result of the deletion.
	 */
	async deleteByItemID(itemID) {
		return db.execute("DELETE FROM ItemsBought WHERE ItemID = ?", [itemID]);
	}
}
