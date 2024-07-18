import db from "../utils/trading/database";

/**
 * Maps an array of items to create new Item objects.
 *
 * @param {Array<Object>} items - The array of items to create Item objects from.
 * @return {Array<Item>} An array of newly created Item objects.
 */
function createItemsFromDBQuery(items) {
	return items.map(
		(item) =>
			new Item(
				item.ItemID,
				item.BuyPrice,
				item.BuyQuantity,
				item.SellerID,
				item.BuyTimestamp,
				item.Sold,
				item.ItemBoughtID
			)
	);
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
	 * @param {boolean} sold - a boolean represnting if the item was already sold on the bazaar
	 * @param {number} itemBoughtID - optional database primary key ID of the item bought
	 */
	constructor(
		itemID,
		price,
		quantity,
		sellerID,
		buyTimestamp,
		sold,
		itemBoughtID = null
	) {
		this.itemBoughtID = itemBoughtID;
		this.itemID = itemID;
		this.price = price;
		this.quantity = quantity;
		this.sellerID = sellerID;
		this.buyTimestamp = buyTimestamp;
		this.sold = sold;
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
			this.sold
		];
	}

	getDataObject() {
		return {
			itemBoughtID: this.itemBoughtID,
			itemID: this.itemID,
			price: this.price,
			quantity: this.quantity,
			sellerID: this.sellerID,
			buyTimestamp: this.buyTimestamp,
			sold: this.sold
		};
	}

	getDBID() {
		return this.itemBoughtID;
	}
}

export class ItemsStore {
	/**
	 * A function to insert an item into the database.
	 *
	 * @param {Item} item - The item object to be inserted.
	 * @return {Promise<Item[]>} A Promise that resolves with the result of the insertion.
	 */
	async create(item) {
		try {
			const result = await db.execute(
				"INSERT INTO ItemsBought (ItemID, BuyPrice, BuyQuantity, SellerID, BuyTimestamp, Sold) VALUES (?,?,?,?,?) RETURNING *",
				item.getData()
			);
			return createItemsFromDBQuery(result[0]);
		} catch (error) {
			console.log(error);
		}
	}

	/**
	 * Retrieves all items from the database.
	 *
	 * @return {Promise<Item[]>} A Promise that resolves with the result of the query.
	 */
	async findAll() {
		try {
			const result = await db.execute("SELECT * FROM ItemsBought");
			return createItemsFromDBQuery(result[0]);
		} catch (error) {
			console.error(error);
		}
	}

	/**
	 * Finds an item in the database by its item bought ID.
	 *
	 * @param {number} itemBoughtID - The ItemBoughtID of the item to search for.
	 * @return {Promise<Item[]>} A Promise that resolves with the result of the query.
	 */
	async findByItemBoughtID(itemBoughtID) {
		const result = await db.execute(
			"SELECT * FROM ItemsBought WHERE ItemBoughtID = ?",
			[itemBoughtID]
		);
		return createItemsFromDBQuery(result[0]);
	}

	/**
	 * Finds an item in the database by its item ID.
	 *
	 * @param {number} itemID - The ID of the item to search for.
	 * @return {Promise<Item[]>} A Promise that resolves with the result of the query.
	 */
	async findByItemID(itemID) {
		const result = await db.execute(
			"SELECT * FROM ItemsBought WHERE itemID = ?",
			[itemID]
		);
		return createItemsFromDBQuery(result[0]);
	}

	/**
	 * Retrieves all sold items from the database.
	 *
	 * @return {Promise<Item[]>} A Promise that resolves with the result of the query.
	 */
	async findSold() {
		const result = await db.execute(
			"SELECT * FROM ItemsBought WHERE sold = 1"
		);
		return createItemsFromDBQuery(result[0]);
	}

	/**
	 * Finds a sold item in the database by its item ID.
	 *
	 * @param {number} itemID - The ID of the item to search for.
	 * @return {Promise<Item[]>} A Promise that resolves with the result of the query.
	 */
	async findSoldByItemID(itemID) {
		const result = await db.execute(
			"SELECT * FROM ItemsBought WHERE ItemID = ? AND Sold = 1",
			[itemID]
		);
		return createItemsFromDBQuery(result[0]);
	}

	/**
	 * Updates the quantity of an item in the database.
	 *
	 * @param {number} updatedQuantity - The new quantity of the item.
	 * @param {number} itemID - The ID of the item to update.
	 * @param {boolean} sold - Whether the item has been sold in the bazaar yet.
	 * @return {Promise<Item[]>} A Promise that resolves with the result of the update query.
	 */
	async update(updatedQuantity, updatedPrice, sold, itemID) {
		const result = await db.execute(
			"UPDATE ItemsBought SET quantity = ?, Sold = ? WHERE ItemID = ?",
			[updatedQuantity, updatedPrice, sold, itemID]
		);
		return createItemsFromDBQuery(result[0]);
	}

	/**
	 * Deletes an item from the database based on its PK (ItemBoughtID).
	 *
	 * @param {number} itemBoughtID - the PK (ItemBoughtID) of the item to be deleted
	 * @return {Promise<Item[]>} A Promise that resolves with the result of the delete query.
	 */
	async deleteByItemBoughtID(itemBoughtID) {
		const result = await db.execute(
			"DELETE FROM ItemsBought WHERE ItemBoughtID = ? RETURNING *",
			[itemBoughtID]
		);
		return createItemsFromDBQuery(result[0]);
	}
	/**
	 * Deletes an item from the database based on its item ID.
	 *
	 * @param {itemID} itemID - The ID of the item to be deleted.
	 * @return {Promise<Item[]>} A Promise that resolves with the result of the deletion.
	 */
	async deleteByItemID(itemID) {
		const result = await db.execute(
			"DELETE FROM ItemsBought WHERE ItemID = ? RETURNING *",
			[itemID]
		);
		return createItemsFromDBQuery(result[0]);
	}
}
