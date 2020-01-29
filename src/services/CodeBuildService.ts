import * as AWS from 'aws-sdk';
import { ReturnStatus } from '../models/ReturnStatus';
import { LogModel } from '../models/LogModel';
import { EnvironmentModel } from '../models/EnvironmentModel';

export class CodeBuildService {
  private client: AWS.CodeBuild;

  constructor(environment: EnvironmentModel) {
    this.client = new AWS.CodeBuild(environment.config);
  }

  public getBuildLogLocation(build: string): Promise<ReturnStatus> {
    return this.client
      .batchGetBuilds({ ids: [build] })
      .promise()
      .then(function(data: AWS.CodeBuild.BatchGetBuildsOutput) {
        if (!data.builds || !data.builds[0] || !data.builds[0].logs) {
          const error: ReturnStatus = {
            fail: {
              message: 'Could not find log details'
            }
          };
          return error;
        }

        const logLocation: LogModel = {
          logGroup: data.builds[0].logs.groupName as string,
          logStream: data.builds[0].logs.streamName as string
        };

        const success: ReturnStatus = {
          success: { response: logLocation }
        };
        return success;
      })
      .catch(function(err: AWS.AWSError) {
        const error: ReturnStatus = {
          fail: { message: err.message }
        };
        return error;
      });
  }
}
