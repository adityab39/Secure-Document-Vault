import crypto from "crypto";
import {
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand
} from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({ region: "us-east-2" });

function generateSecretHash(username, clientId, clientSecret) {
  return crypto
    .createHmac("SHA256", clientSecret)
    .update(username + clientId)
    .digest("base64");
}

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { email, confirmationCode } = body;

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Please enter email address." })
      };
    }

    const clientId = process.env.COGNITO_CLIENT_ID;
    const clientSecret = process.env.COGNITO_CLIENT_SECRET;
    const secretHash = generateSecretHash(email, clientId, clientSecret);

    const params = {
      ClientId: clientId,
      Username: email,
      ConfirmationCode: confirmationCode,
      SecretHash: secretHash
    };

    const command = new ConfirmSignUpCommand(params);
    const response = await client.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "User confirmed successfully",
        confirmResponse: response
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "OTP verification failed",
        message: err.message
      })
    };
  }
};