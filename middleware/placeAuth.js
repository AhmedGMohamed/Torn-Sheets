import { auth } from "../index.js";

function placeAuth(req, _res, next) {
	req.body.google_auth = auth;
	next();
}

export default placeAuth;
