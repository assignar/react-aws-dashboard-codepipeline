import * as AWS from 'aws-sdk';
import { ReturnStatus } from '../models/ReturnStatus';
import { PipelineModel } from '../models/PipelineModel';
import {
  StageState,
  PipelineSummary,
  ActionState,
  PipelineDeclaration,
  StageDeclaration,
  ActionDeclaration,
  ActionExecution,
  ArtifactRevision
} from 'aws-sdk/clients/codepipeline';
import { StageModel } from '../models/StageModel';
import { ArtifactModel } from '../models/ArtifactModel';

export class CodePipelineService {
  private client: AWS.CodePipeline;

  constructor(config: AWS.Config) {
    this.client = new AWS.CodePipeline(config);
  }

  public getPipelineExecution(
    pipeline: PipelineModel,
    stage: StageModel
  ): Promise<ReturnStatus> {
    return this.client
      .getPipelineExecution({
        pipelineName: pipeline.name,
        pipelineExecutionId: stage.id as string
      })
      .promise()
      .then(function(data: AWS.CodePipeline.GetPipelineExecutionOutput) {
        if (
          !data.pipelineExecution ||
          !data.pipelineExecution.artifactRevisions
        ) {
          const error: ReturnStatus = {
            fail: { message: 'could not find execution details' }
          };
          return error;
        }
        //TODO support multiple revisions
        const artifactRevision: ArtifactRevision =
          data.pipelineExecution.artifactRevisions[0];
        const artifact: ArtifactModel = {
          name: artifactRevision.name as string,
          id: artifactRevision.revisionId as string,
          summary: artifactRevision.revisionSummary as string,
          url: artifactRevision.revisionUrl as string
        };
        const success: ReturnStatus = {
          success: { response: artifact }
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

  public startPipelineExecution(
    pipeline: PipelineModel
  ): Promise<ReturnStatus> {
    return this.client
      .startPipelineExecution({ name: pipeline.name })
      .promise()
      .then(function() {
        const success: ReturnStatus = {
          success: {
            response: undefined
          }
        };
        return success;
      })
      .catch(function(err: AWS.AWSError) {
        const error: ReturnStatus = {
          fail: {
            message: err.message
          }
        };
        return error;
      });
  }

  public retryStageExecution(
    pipeline: PipelineModel,
    stage: StageModel
  ): Promise<ReturnStatus> {
    return this.client
      .retryStageExecution({
        pipelineExecutionId: stage.id as string,
        pipelineName: pipeline.name,
        retryMode: 'FAILED_ACTIONS',
        stageName: stage.name
      })
      .promise()
      .then(function() {
        const success: ReturnStatus = {
          success: { response: undefined }
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

  public listPipelines(): Promise<ReturnStatus> {
    return this.client
      .listPipelines({})
      .promise()
      .then(function(data: AWS.CodePipeline.ListPipelinesOutput) {
        const pipelines: PipelineModel[] = (data.pipelines as PipelineSummary[]).map(
          (pipeline: PipelineSummary) => {
            return {
              name: pipeline.name as string,
              version: pipeline.version as number,
              stages: []
            };
          }
        );

        const success: ReturnStatus = {
          success: { response: pipelines }
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

  public getPipeline(name: string): Promise<ReturnStatus> {
    return this.client
      .getPipeline({ name: name })
      .promise()
      .then(function(data: AWS.CodePipeline.GetPipelineOutput) {
        const pipelineData: PipelineDeclaration = data.pipeline as PipelineDeclaration;
        //Map AWS objects into our models
        const pipeline: PipelineModel = {
          name: pipelineData.name,
          version: pipelineData.version as number,
          stages: pipelineData.stages.map((stage: StageDeclaration) => {
            return {
              name: stage.name,
              status: undefined,
              actions: stage.actions.map((action: ActionDeclaration) => {
                return {
                  name: action.name,
                  type: action.actionTypeId.provider,
                  version: action.actionTypeId.version,
                  branch: action.configuration
                    ? action.configuration.Branch
                    : undefined,
                  repo: action.configuration
                    ? action.configuration.Repo
                    : undefined
                };
              })
            };
          })
        };

        const success: ReturnStatus = {
          success: { response: pipeline }
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

  public getPipelineState(name: string): Promise<ReturnStatus> {
    return this.client
      .getPipelineState({ name: name })
      .promise()
      .then(function(data: AWS.CodePipeline.GetPipelineStateOutput) {
        function getLatestExectionDetails(
          latestExecution?: ActionExecution
        ): string | undefined {
          if (!latestExecution) {
            return '';
          }

          if (latestExecution.status === 'Failed') {
            return latestExecution.errorDetails
              ? latestExecution.errorDetails.message
              : '';
          }

          return latestExecution.summary;
        }

        //Map AWS objects into our models
        const pipeline: PipelineModel = {
          name: data.pipelineName as string,
          version: data.pipelineVersion as number,
          stages: (data.stageStates as StageState[]).map(
            (stage: StageState) => {
              return {
                name: stage.stageName as string,
                id: stage.latestExecution
                  ? stage.latestExecution.pipelineExecutionId
                  : undefined,
                status: stage.latestExecution
                  ? stage.latestExecution.status
                  : 'Unknown',
                actions: (stage.actionStates as ActionState[]).map(
                  (actionState: ActionState) => {
                    return {
                      name: actionState.actionName as string,
                      id: actionState.latestExecution
                        ? actionState.latestExecution.externalExecutionId
                        : undefined,
                      status: actionState.latestExecution
                        ? actionState.latestExecution.status
                        : 'Unknown',
                      details: getLatestExectionDetails(
                        actionState.latestExecution
                      ),
                      statusTime: actionState.latestExecution
                        ? actionState.latestExecution.lastStatusChange
                        : undefined
                    };
                  }
                )
              };
            }
          )
        };

        const success: ReturnStatus = {
          success: { response: pipeline }
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
