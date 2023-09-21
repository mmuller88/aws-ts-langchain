# aws-ts-langchain

This is the demo Repo for the AWS TS Language Chain Meetup in Lisbon. It uses the [LangChain TypeScript library](https://github.com/hwchase17/langchainjs).

This Repo uses [Projen](https://github.com/projen/projen) for the project setup. Get familiar with it to understand the repo.

I have a recording on the AWS AI LangChain talk on Youtube. Feel free to watch it :) https://www.youtube.com/watch?v=PwvVkdpb1As

## Bootstrap

```bash
ACCOUNT_DEV_ID=981237193288
yarn cdk bootstrap aws://$ACCOUNT_DEV_ID/us-east-1
```

## Deploy

Load your AWS credentials into your shell environment like with your AWS SSO landing page like https://damadden.awsapps.com/start#/ .

```bash
yarn cdk deploy "langchain-stack" --require-approval never
```

After deploying you need to put your OpenAI Api Key into the AWS Secret named OpenAiKey...

## First LangChain App

This LangChain App chains to LLM Chains.

Prompt 1: I want to open a restaurant for {cuisine} food. Suggest a fancy name for this.

Prompt 2: Suggest some menu items for {restaurant_name}. Return it as a comma-separated string.

Those two prompts are chained and will return the name for the restaurant and suggestions for menu items.

```bash
URL=https://mlmtzplhdet2ha3yvxuegcnhze0qepwh.lambda-url.us-east-1.on.aws
curl -X POST $URL \
    -H 'Content-type: application/json' \
    -d '{"cuisine": "Spain"}' | jq .
```

## Second LangChain App

This LangChain App possesses an AWS DynamoDB Memory.

Prompt: I want to open a restaurant for {cuisine} food. Suggest a fancy name for this.

```bash
URL=https://a5ewfijwkvfgrptv7z336cnfvm0yxawl.lambda-url.us-east-1.on.aws
curl -X POST $URL \
    -H 'Content-type: application/json' \
    -d '{"cuisine": "French", "user": "martin"}' | jq .
```

## Third LangChain run LLM locally

I downloaded a gguf model from huggingface and stored it in src/lambda like this one https://huggingface.co/TheBloke/Llama-2-7B-GGUF and save it src/lambda/llama-2-7b.Q4_0.gguf

- https://js.langchain.com/docs/modules/model_io/models/llms/integrations/llama_cpp
- https://github.com/baileytec-labs/llama-on-lambda/tree/main

```bash
URL=https://vwoljomx7sjgdyziy5eiybk5oy0tsvrz.lambda-url.us-east-1.on.aws/prompt?cuisine=Italien
curl $URL | jq .
```

### Improvements

The Lambda needs to be kept warm for serving the response faster.

### Thanks

A huge thanks to [Sean Bailey](https://github.com/sean-bailey) for making the pioneer work for running Llama 2 models on AWS Lambda.

## Thx

- Thanks to codebasics to provide the Python LangChain Video which I used <https://www.youtube.com/watch?v=nAmC7SoVLd8>
- Thanks to Coding Crashcourses for another LangChain Tutorial video helping me to understand the LangChain features https://www.youtube.com/watch?v=a89vqgK-Qcs
