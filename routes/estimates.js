import express from "express";
import { google, sheets_v4 } from "googleapis";
import { RANKS, RANK_TRIGGERS } from "../utils/Data";
let router = express.Router();

function calculateEstimate(rank, level, crimes, networth) {
	rank = rank.match(/[A-Z][a-z ]+/g)[0].trim();

	const triggersLevel = RANK_TRIGGERS.level.filter((x) => x <= level).length;
	const triggersCrimes = RANK_TRIGGERS.crimes.filter(
		(x) => x <= crimes
	).length;
	const triggersNetworth = RANK_TRIGGERS.networth.filter(
		(x) => x <= networth
	).length;

	const triggersStats =
		RANKS[rank] - triggersLevel - triggersCrimes - triggersNetworth - 1;

	return RANK_TRIGGERS.stats[triggersStats] ?? "N/A";
}

/**
 * Gets the main statistics for a give user
 *
 * @param {number|string} userId a number containing the user ID to check
 * @param {string} apiKey The TORN API key to use
 * @return {Promise<object>} Returns an object containing important user information
 */
async function getTornStatistics(userID, apiKey) {
	try {
		const personalStatsEndpointData = await fetch(
			`https://api.torn.com/user/${userID}?key=${apiKey}&comment=Estimates&selections=personalstats`
		);
		const profileEndpointData = await fetch(
			`https://api.torn.com/user/${userID}?key=${apiKey}&comment=Estimates&selections=profile`
		);

		const data = {
			personalstats: personalStatsEndpointData,
			profile: profileEndpointData
		};
		return data;
	} catch (error) {
		console.error(
			`An error occurred while fetching the statistics for user ${userID}\nError:`,
			error
		);
	}
}

async function getEssentialStatistics(userID, apiKey) {
	const data = await getTornStatistics(userID, apiKey);
	const name = data.profile.name,
		age = data.profile.age,
		player_id = data.profile.player_id,
		rank = data.profile.rank,
		level = data.profile.level,
		criminaloffenses = data.personalstats.criminaloffenses,
		xantaken = data.personalstats.xantaken,
		useractivity = data.personalstats.useractivity,
		networth = data.personalstats.networth;

	let statEstimate = calculateEstimate(
		rank,
		level,
		criminaloffenses,
		networth
	);

	const mainData = {
		name: name,
		age: age,
		player_id: player_id,
		rank: rank,
		level: level,
		criminaloffenses: criminaloffenses,
		networth: networth,
		xantaken: xantaken,
		useractivity: useractivity,
		statestimate: statEstimate
	};
	return mainData;
}

/**
 * Gets a list of all user IDs in the faction
 *
 * @param {number|string} factionID a number corresponding to the faction ID to check
 * @param {string} apiKey The TORN API key to use
 * @returns {Promise<Array<number|string>>} Returns an array containing the user IDs inside the faction
 */
async function getFactionUserIDs(factionID, apiKey) {
	let userIDs = [];
	try {
		const factionData = await fetch(
			`https://api.torn.com/faction/${factionID}?key=${apiKey}&comment=Estimates`
		);

		for (let member in factionData.members) {
			userIDs.push(member);
		}
		return userIDs;
	} catch (error) {
		console.error(
			`An error occurred while fetching the user IDs from the faction ${factionID}\nError: ${error}`
		);
	}
}

async function getFactionStats(factionID, apiKey) {
	let userIDs = await getFactionUserIDs(factionID, tornApiKey);

	let usersStatistics = [];
	for (let userID of userIDs) {
		// Timeout to not overuse the api key limit
		setTimeout(async () => {
			const userStatistics = await getEssentialStatistics(userID, apiKey);
			usersStatistics.push(userStatistics);
		}, 500);
	}

	return usersStatistics;
}

router.post("/faction", async (req, res) => {
	const factionID = req.params.factionId,
		spreadsheetID = req.body.spreadsheet_id,
		sheetdID = req.body.sheet_id,
		tornApiKey = req.body.torn_api_key;

	try {
		const factionData = await getFactionStats(factionID, tornApiKey);
		// TODO: Fill the spreadsheet with the data
		// TODO: Format the spreadsheet
		res.status(200).send(
			`Successfully calculated the stat estimate for faction ${factionID}`
		);
	} catch (error) {
		res.status(500).send(
			`An error occurred while trying to retrieve the statistics for faction ${factionID}\nError:${error}`
		);
	}
});

// TODO: implement the /user endpoint
router.post("/user", async (req, res) => {
	const userID = req.params.userId,
		spreadsheetID = req.body.spreadsheet_id,
		sheetdID = req.body.sheet_id,
		tornApiKey = req.body.torn_api_key;

	try {
		const userData = await getEssentialStatistics(userID, tornApiKey);

		// TODO: Fill the spreadsheet with the data
		// TODO: Format the spreadsheet
		res.status(200).send(
			`Successfully calculated the stat estimate for user ${userID}`
		);
	} catch (error) {
		res.status(500).send(
			`An error occurred while trying to retrieve the statistics for user ${userID}\nError:${error}`
		);
	}
});

export default router;
