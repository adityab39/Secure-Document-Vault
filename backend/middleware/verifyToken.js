require('dotenv').config();
const jwt = require('jsonwebtoken');
const jwkToPem = require('jwk-to-pem');
const axios = require('axios');

const REGION = process.env.COGNITO_REGION;
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const ISSUER = `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`;
let pems;


const fetchPems = async () => {
  const url = `${ISSUER}/.well-known/jwks.json`;
  const { data } = await axios.get(url);

  const newPems = {};
  data.keys.forEach(key => {
    newPems[key.kid] = jwkToPem(key);
  });

  pems = newPems;
};

const verifyToken = async (req, res, next) => {
  if (!pems) {
    try {
      await fetchPems();
    } catch (err) {
      return res.status(500).json({ message: 'Failed to fetch JWKs', error: err.message });
    }
  }

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Missing token' });

  const decoded = jwt.decode(token, { complete: true });
  if (!decoded) return res.status(401).json({ message: 'Invalid token' });

  const pem = pems[decoded.header.kid];
  if (!pem) return res.status(401).json({ message: 'Unknown key ID' });

  jwt.verify(token, pem, { issuer: ISSUER }, (err, payload) => {
    if (err) return res.status(401).json({ message: 'Token verification failed', error: err.message });

    req.user = payload;
    next();
  });
};

module.exports = verifyToken;