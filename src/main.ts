import { App } from 'aws-cdk-lib';
import { LangchainStack } from './langchain-stack';

const env = {
  account: '981237193288',
  region: 'us-east-1',
};

const app = new App();

new LangchainStack(app, 'langchain-stack', { env });

app.synth();
