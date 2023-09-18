import * as lambda from 'aws-lambda';
import { LLMChain, SequentialChain } from 'langchain/chains';
import { LlamaCpp } from 'langchain/llms/llama_cpp';
import { PromptTemplate } from 'langchain/prompts';

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
  const { cuisine } = body;
  if (!cuisine) {
    return {
      statusCode: 405,
      body: JSON.stringify({
        message: `Missing cuisine property in json body`,
      }),
    };
  }

  // Get OpenAI API key from AWS Secrets Manager

  // Initialize LangChain
  const llm = new LlamaCpp({ modelPath: 'ggml-alpaca-7b-q4.bin' });

  const prompt = new PromptTemplate({
    inputVariables: ['cuisine'],
    template:
      'I want to open a restaurant for {cuisine} food. Suggest a fancy name for this',
  });

  const nameChain = new LLMChain({
    llm,
    prompt,
    outputKey: 'restaurant_name',
  });

  const promptItems = new PromptTemplate({
    inputVariables: ['restaurant_name'],
    template:
      'Suggest some menu items for {restaurant_name}. Return it as a comma-separated string',
  });

  const footItemsChain = new LLMChain({
    llm,
    prompt: promptItems,
    outputKey: 'menu_items',
  });

  const chain = new SequentialChain({
    chains: [nameChain, footItemsChain],
    inputVariables: ['cuisine'],
    outputVariables: ['restaurant_name', 'menu_items'],
  });

  const response = await chain.call({ cuisine });

  // cleaning the response like removing new lines
  const restaurant_name = (
    response.restaurant_name as string | undefined
  )?.replace(/  |\r\n|\n|\r/gm, '');
  const menu_items = (response.menu_items as string | undefined)?.replace(
    /  |\r\n|\n|\r/gm,
    '',
  );

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: { restaurant_name, menu_items },
    }),
  };
}
