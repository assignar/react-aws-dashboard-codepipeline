import * as React from 'react';
import { useState, useEffect } from 'react';
import * as Cache from 'lscache';
import { StageModel } from '../models/StageModel';
import { ActionModel } from '../models/ActionModel';
import classnames from 'classnames';
import { EnvironmentModel } from '../models/EnvironmentModel';
import { PipelineModel } from '../models/PipelineModel';
import { CodePipelineService } from '../services/CodePipelineService';
import { Action } from './Action';
import { ArtifactModel } from '../models/ArtifactModel';

interface StageProps {
  callback: (state: boolean) => void;
  stage: StageModel;
  pipeline: PipelineModel;
  environment: EnvironmentModel;
}

async function getArtifact(
  props: StageProps
): Promise<ArtifactModel | undefined> {
  Cache.setExpiryMilliseconds(1000);
  Cache.setBucket(props.environment.name);
  const cachedArtifact = Cache.get(props.stage.id as string);
  if (cachedArtifact) return cachedArtifact;

  const codepipeline = new CodePipelineService(props.environment.config);
  const result = await codepipeline.getPipelineExecution(
    props.pipeline,
    props.stage
  );

  let resultArtifact: ArtifactModel | undefined = undefined;
  if (result.fail) {
    console.error(result.fail.message);
  }

  if (result.success) {
    resultArtifact = result.success.response as ArtifactModel;
    Cache.setBucket(props.environment.name);
    Cache.set(props.stage.id as string, resultArtifact, 30);
  }

  return resultArtifact;
}

async function retryStage(props: StageProps): Promise<void> {
  const codepipeline = new CodePipelineService(props.environment.config);
  const result = await codepipeline.retryStageExecution(
    props.pipeline,
    props.stage
  );
  if (result.fail) {
    console.error(result.fail.message);
  }
  props.callback(true);
}

export const Stage: React.FC<StageProps> = ({
  callback,
  stage,
  pipeline,
  environment
}: StageProps) => {
  const [artifact, setArtifact] = useState<ArtifactModel>();

  useEffect(() => {
    let cancelled = false;

    const fetchData = async (): Promise<void> => {
      if (!cancelled) {
        const artifact = await getArtifact({
          callback,
          stage,
          pipeline,
          environment
        });
        setArtifact(artifact);
      }
    };
    fetchData();
    return (): void => {
      cancelled = true;
    };
  }, [callback, pipeline, stage, environment]);

  return (
    <li
      className={classnames('panel-block stage', {
        success: stage.status === 'Succeeded',
        danger: stage.status === 'Failed',
        info: stage.status === 'InProgress'
      })}
    >
      <div className="container">
        <div className="columns">
          <div className="column is-two-thirds">
            <h6 className="title is-6">{stage.name}</h6>

            {stage.status === 'Failed' && (
              <button
                className="button is-pulled-right is-danger is-outlined is-rounded is-fullwidth"
                onClick={async (): Promise<void> =>
                  retryStage({ callback, stage, pipeline, environment })
                }
              >
                Retry Stage
              </button>
            )}
          </div>
          <div className="column is-one-third">
            <span
              className={classnames('tag is-pulled-right', {
                'has-background-success has-text-white':
                  stage.status === 'Succeeded',
                'has-background-danger has-text-white':
                  stage.status === 'Failed',
                'has-background-info has-text-white':
                  stage.status === 'InProgress'
              })}
            >
              {stage.status}
            </span>
          </div>
        </div>
        <div className="columns">
          <div className="column">
            {artifact && (
              <>
                <span>Artifact: </span>
                <a href={artifact.url}>{artifact.id.substring(0, 7)}</a>
              </>
            )}
          </div>
        </div>
        {stage.actions.map((action: ActionModel) => (
          <Action key={action.name} environment={environment} action={action} />
        ))}
      </div>
    </li>
  );
};
