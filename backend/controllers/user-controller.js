const AWS = require('aws-sdk');
const { registerUser, authenticateUser, confirmUser } = require('../services/cognito-service');
const { saveUserMetadata } = require('../services/dynamoDb-service');
const { getUserInfo: getUserFromDb } = require('../services/dynamoDb-service');

const register = async (req, res) => {
  const { email, password, name } = req.body;

  try {
    const registerResponse = await registerUser(email, password);
    await saveUserMetadata(email, name);
    res.status(200).json({ message: 'User registered successfully', registerResponse });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed', message: err.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const authResponse = await authenticateUser(email, password);
    res.status(200).json({ message: 'Login successful', authResponse });
  } catch (err) {
    res.status(500).json({ error: 'Login failed', message: err.message });
  }
};

const confirmOtp = async (req, res) => {
  const { email, confirmationCode } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'PLease enter email address.' });
  }

  try {
    const confirmResponse = await confirmUser(email, confirmationCode);
    res.status(200).json({ message: 'User confirmed successfully', confirmResponse });
  } catch (err) {
    res.status(500).json({ error: 'OTP verification failed', message: err.message });
  }
};


const getUserInfo = async (req, res) => {
  const email = req.user.email;
  if (!email) {
    return res.status(400).json({ error: 'Email not found in token' });
  }

  try {
    const user = await getUserFromDb(email);
    res.status(200).json({ message: 'User info fetched successfully', user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user info', message: err.message });
  }
};




module.exports = { register, login, confirmOtp, getUserInfo};
