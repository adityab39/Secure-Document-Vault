// /controllers/authController.js
const { registerUser, authenticateUser } = require('../services/cognito-service');
const { saveUserMetadata } = require('../services/dynamoDb-service');

const register = async (req, res) => {
  const { email, password, name } = req.body;

  try {
    console.log("inside try reg");
    const registerResponse = await registerUser(email, password);
    await saveUserMetadata(email, name); // Store user metadata in DynamoDB
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

module.exports = { register, login };
