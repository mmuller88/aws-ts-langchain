import { awscdk } from 'projen';
import { TrailingComma } from 'projen/lib/javascript';

const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '2.96.2',
  defaultReleaseBranch: 'main',
  name: 'aws-ts-langchain',
  projenrcTs: true,

  eslint: true,
  prettier: true,
  prettierOptions: {
    settings: {
      singleQuote: true,
      trailingComma: TrailingComma.ALL,
    },
  },

  deps: [
    '@types/aws-lambda',
    'node-llama-cpp',
    'langchain',
    '@aws-sdk/client-secrets-manager',
    '@aws-sdk/client-dynamodb',
  ],
  // deps: [],                /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // devDeps: [],             /* Build dependencies for this module. */
  // packageName: undefined,  /* The "name" in package.json. */
  gitignore: ['src/lambda/dist', 'src/lambda/llama-2-7b.Q4_0.gguf'],
});
project.synth();
