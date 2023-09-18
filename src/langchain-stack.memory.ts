import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import * as lambda from 'aws-lambda';
import { ConversationChain } from 'langchain/chains';
import { OpenAI } from 'langchain/llms/openai';
import { BufferMemory } from 'langchain/memory';
import { PromptTemplate } from 'langchain/prompts';
import { DynamoDBChatMessageHistory } from 'langchain/stores/message/dynamodb';

const { OPENAI_API_KEY_SECRET_ID, TABLE_NAME = '' } = process.env;

const command = new GetSecretValueCommand({
  SecretId: OPENAI_API_KEY_SECRET_ID,
});

const client = new SecretsManagerClient({ region: 'us-east-1' });

/**
 * @param event
 */
export async function handler(
  event: lambda.APIGatewayProxyEventV2,
): Promise<lambda.APIGatewayProxyResultV2> {
  console.debug(`event: ${JSON.stringify(event)}`);

  // check if method is POST
  if (event.requestContext.http.method !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({
        message: 'Method not allowed',
      }),
    };
  }

  // check if properties are in the body
  const body = event.body ? JSON.parse(event.body) : undefined;
  const { cuisine, user } = body;
  if (!cuisine) {
    return {
      statusCode: 405,
      body: JSON.stringify({
        message: 'Missing cuisine property in json body',
      }),
    };
  }

  if (!user) {
    return {
      statusCode: 405,
      body: JSON.stringify({
        message: 'Missing user property in json body',
      }),
    };
  }

  // Get OpenAI API key from AWS Secrets Manager
  const openAIApiKey = (await client.send(command)).SecretString;

  // or BufferWindowMemory with key for window
  const memory = new BufferMemory({
    chatHistory: new DynamoDBChatMessageHistory({
      tableName: TABLE_NAME,
      partitionKey: 'user',
      sessionId: user,
    }),
  });

  // Initialize LangChain
  const llm = new OpenAI({ temperature: 0.7, openAIApiKey });

  const prompt = new PromptTemplate({
    inputVariables: ['cuisine'],
    template:
      'I want to open a restaurant for {cuisine} food. Suggest a fancy name for this',
  });

  const nameChain = new ConversationChain({
    llm,
    prompt,
    outputKey: 'restaurant_name',
    memory,
  });

  const response = await nameChain.call({ cuisine });

  const chatHistory = await memory.chatHistory.getMessages();

  console.log(`chatHistory: ${JSON.stringify(chatHistory)}`);

  // cleaning the response like removing new lines
  const restaurant_name = (
    response.restaurant_name as string | undefined
  )?.replace(/  |\r\n|\n|\r/gm, '');

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: { restaurant_name },
      chatHistory,
    }),
  };
}
