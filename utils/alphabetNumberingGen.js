/**
 * class that makes an iterable object that returns a string
 * in the form of character sequences e.x: AA, AB, ..., AZ, BA, BB, ...
 */
class Generator {
	/**
	 * create an iterable list
	 *
	 * @param {string} chars the string of characters to use for ordering
	 */
	constructor(chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
		this._chars = chars;
		this._nextId = [0];
	}

	/**
	 * Get the current character sequence
	 *
	 * @return {string} the current character sequence
	 */
	current() {
		const r = [];
		for (const char of this._nextId) {
			r.unshift(this._chars[char]);
		}
		return r.join("");
	}

	/**
	 * gets the next character sequence in the list and returns it as a string
	 *
	 * @param {number} count the amount of iterations to perform
	 * @return {string} the current character sequence in the list
	 */
	next(count = 1) {
		const r = [];
		for (let index = 0; index < count; index++) {
			this._increment();
		}
		for (const char of this._nextId) {
			r.unshift(this._chars[char]);
		}
		return r.join("");
	}

	/**
	 * increments the character sequence and handles character array
	 * ending and reiteration ex: A, B, ..., Z, AA, AB, ...
	 */
	_increment() {
		for (let i = 0; i < this._nextId.length; i++) {
			const val = ++this._nextId[i];
			if (val >= this._chars.length) {
				this._nextId[i] = 0;
			} else {
				return;
			}
		}
		this._nextId.push(0);
	}

	/**
	 * iterates the character sequence using iterators ie ++
	 */
	*[Symbol.iterator]() {
		while (true) {
			yield this.next();
		}
	}
}

export default Generator