import * as AWS from 'aws-sdk';

export interface EnvironmentModel {
  name: string;
  config: AWS.Config;
}
