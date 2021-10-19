import AWS from "aws-sdk";

const secretManager = new AWS.SecretsManager();

export const getAWSSecrets = async <T>(secretPath: string): Promise<T> => {
  const secret = await secretManager
    .getSecretValue({ SecretId: secretPath })
    .promise();
  const secretAsString = secret.SecretString as string;

  const awsSecrets: T = JSON.parse(secretAsString);

  return awsSecrets;
};
