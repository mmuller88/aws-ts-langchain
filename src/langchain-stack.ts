import * as core from 'aws-cdk-lib';
import * as ddb from 'aws-cdk-lib/aws-dynamodb';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

import { Construct } from 'constructs';

export interface LangchainStackProps extends core.StackProps {}

export class LangchainStack extends core.Stack {
  constructor(scope: Construct, id: string, props: LangchainStackProps) {
    super(scope, id, props);
    const openAiSecret = new secretsmanager.Secret(this, 'OpenAiKey');

    const langChainLambda = new nodejs.NodejsFunction(this, 'lambda', {
      timeout: core.Duration.seconds(30),
      runtime: lambda.Runtime.NODEJS_18_X,
      environment: {
        OPENAI_API_KEY_SECRET_ID: openAiSecret.secretName,
      },
    });
    const functionUrl = langChainLambda.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    });

    langChainLambda.addToRolePolicy(
      new PolicyStatement({
        actions: ['secretsmanager:GetSecretValue'],
        resources: [openAiSecret.secretArn],
      }),
    );

    new core.CfnOutput(this, 'FunctionUrl', { value: functionUrl.url });

    const langChainMemoryTable = new ddb.Table(this, 'LangChainMemoryTable', {
      partitionKey: {
        name: 'user',
        type: ddb.AttributeType.STRING,
      },
    });

    const langChainMemoryLambda = new nodejs.NodejsFunction(this, 'memory', {
      timeout: core.Duration.seconds(30),
      runtime: lambda.Runtime.NODEJS_18_X,
      environment: {
        OPENAI_API_KEY_SECRET_ID: openAiSecret.secretName,
        TABLE_NAME: langChainMemoryTable.tableName,
      },
    });
    const functionUrlMemory = langChainMemoryLambda.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    });

    langChainMemoryLambda.addToRolePolicy(
      new PolicyStatement({
        actions: ['secretsmanager:GetSecretValue'],
        resources: [openAiSecret.secretArn],
      }),
    );

    langChainMemoryTable.grantReadWriteData(langChainMemoryLambda);

    new core.CfnOutput(this, 'MemoryFunctionUrl', {
      value: functionUrlMemory.url,
    });

    const langChainLocalLambda = new lambda.DockerImageFunction(
      this,
      'LocalLambda',
      {
        code: lambda.DockerImageCode.fromImageAsset('./src/lambda'),
        memorySize: 10240,
        timeout: core.Duration.minutes(15),
        architecture: lambda.Architecture.ARM_64,
      },
    );

    // const langChainLocalLambda = new nodejs.NodejsFunction(this, 'local', {
    //   timeout: core.Duration.seconds(30),
    //   memorySize: 5120,
    //   bundling: {
    //     commandHooks: {
    //       beforeBundling(inputDir: string, outputDir: string): string[] {
    //         return [
    //           'pwd',
    //           'ls -la',
    //           `cp -r ${inputDir}/ggml-alpaca-7b-q4.bin ${outputDir}/ggml-alpaca-7b-q4.bin`,
    //         ]; //adjust here
    //       },
    //       afterBundling(_inputDir: string, _outputDir: string): string[] {
    //         return [];
    //       },
    //       beforeInstall(_inputDir: string, _outputDir: string): string[] {
    //         return [];
    //       },
    //     },
    //   },
    // });

    const functionLocalUrl = langChainLocalLambda.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    });

    new core.CfnOutput(this, 'LocalFunctionUrl', {
      value: functionLocalUrl.url,
    });
  }
}
