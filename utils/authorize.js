import { google } from "googleapis";
//TODO: require the variables in the parameter list

/**
 * request authorization to call the google API
 *
 * @param {string} clientEmail service account email address
 * @param {string} keyFile path to private key file
 * @param {string} key the value of the private key
 * @param {string|string[]} scopes list of required scopes or single scope
 * @returns
 */
function authorize(clientEmail, keyFile = null, key, scopes) {
	let client;
	try {
		client = new google.auth.JWT(
			clientEmail,
			keyFile,
			key,
			scopes
		);
		return client;
	} catch (error) {
		console.error(
			"An error occurred while trying to authenticate google api",
			error
		);
	}
}
