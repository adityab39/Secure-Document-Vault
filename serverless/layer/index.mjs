import axios from "axios";
import jwt from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";

let pems;

const REGION = process.env.COGNITO_REGION;
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const ISSUER = `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`;

async function fetchPems() {
  const { data } = await axios.get(`${ISSUER}/.well-known/jwks.json`);
  const newPems = {};
  data.keys.forEach((key) => {
    newPems[key.kid] = jwkToPem(key);
  });
  pems = newPems;
}

export async function verifyTokenFromHeader(authHeader) {
  if (!authHeader) throw new Error("Missing Authorization header");

  const token = authHeader.split(" ")[1];
  if (!token) throw new Error("Missing token");

  if (!pems) await fetchPems();

  const decoded = jwt.decode(token, { complete: true });
  if (!decoded) throw new Error("Invalid token");

  const pem = pems[decoded.header.kid];
  if (!pem) throw new Error("Unknown key ID");

  return new Promise((resolve, reject) => {
    jwt.verify(token, pem, { issuer: ISSUER }, (err, payload) => {
      if (err) reject(err);
      else resolve(payload);
    });
  });
}