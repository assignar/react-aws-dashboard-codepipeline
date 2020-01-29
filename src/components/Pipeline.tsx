import * as React from 'react';
import { useState, useEffect } from 'react';
import * as Cache from 'lscache';
import { CodePipelineService } from '../services/CodePipelineService';
import { PipelineModel } from '../models/PipelineModel';
import * as _ from 'lodash';
import { EnvironmentModel } from '../models/EnvironmentModel';
import { StageModel } from '../models/StageModel';
import { Stage } from './Stage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRedo } from '@fortawesome/free-solid-svg-icons';

interface PipelineProps {
  pipeline: PipelineModel;
  environment: EnvironmentModel;
}

async function restartPipeline(
  callback: Function,
  pipeline: PipelineModel,
  environment: EnvironmentModel
): Promise<void> {
  const codepipeline = new CodePipelineService(environment.config);
  const result = await codepipeline.startPipelineExecution(pipeline);
  if (result.fail) {
    console.error(result.fail.message);
  }
  callback(true);
}

async function getPipeline(
  pipeline: PipelineModel,
  environment: EnvironmentModel,
  force: boolean
): Promise<PipelineModel | undefined> {
  Cache.setExpiryMilliseconds(1000);
  Cache.setBucket(environment.name);

  const cachedPipeline = Cache.get(pipeline.name);
  if (cachedPipeline && !force) return cachedPipeline;

  const codepipeline = new CodePipelineService(environment.config);
  let mergedPipeline: PipelineModel | undefined = undefined;

  const pipelineResult = await codepipeline.getPipeline(pipeline.name);
  if (pipelineResult.fail) {
    console.error(pipelineResult.fail.message);
  }
  const stateResult = await codepipeline.getPipelineState(pipeline.name);
  if (stateResult.fail) {
    console.error(stateResult.fail.message);
  }

  if (pipelineResult.success && stateResult.success) {
    mergedPipeline = _.merge(
      pipelineResult.success.response,
      stateResult.success.response
    ) as PipelineModel;

    Cache.setBucket(environment.name);
    Cache.set(pipeline.name, mergedPipeline, 10);
  }
  return mergedPipeline;
}

export const Pipeline: React.FC<PipelineProps> = ({
  pipeline,
  environment
}: PipelineProps) => {
  const [pipelineState, setPipelineState] = useState<PipelineModel>();
  const [bustCache, setBustCache] = useState<boolean>(false);
  const [refreshInterval, setRefreshInterval] = useState<number>(60 * 1000);

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      const p = await getPipeline(pipeline, environment, bustCache);
      // If any of the pipeline stages are in progess, set the refresh rate to 5 seconds.
      if (p && p.stages) {
        const inprogress = !p.stages.every(
          (stage: StageModel) => stage.status !== 'InProgress'
        );
        if (inprogress) {
          setRefreshInterval(5 * 1000);
        } else {
          setRefreshInterval(60 * 1000);
        }
        setPipelineState(p);
        setBustCache(false);
      }
    };

    // Fetch Data Immediately
    fetchData();
    // Fetch Data every refreshInterval milliseconds
    const timerId = setInterval(fetchData, refreshInterval);

    return (): void => clearInterval(timerId);
  }, [pipeline, environment, refreshInterval, bustCache]);

  return (
    <>
      {pipelineState && (
        <>
          <section className="panel">
            <div className="panel-heading has-text-grey-darker">
              <div className="columns">
                <div className="column  is-four-fifths">
                  <h6 className="title is-6">{pipeline.name}</h6>
                </div>
                <div className="column  is-one-fifth">
                  <a className="icon" onClick={(): void => setBustCache(true)}>
                    <FontAwesomeIcon icon={faRedo} />
                  </a>
                </div>
              </div>
            </div>
            <ul className="stages">
              {pipelineState.stages &&
                pipelineState.stages.map((stage: StageModel) => (
                  <Stage
                    key={stage.name}
                    callback={setBustCache}
                    stage={stage}
                    pipeline={pipelineState}
                    environment={environment}
                  />
                ))}
            </ul>
            <button
              className="button is-light is-pulled-right"
              onClick={async (): Promise<void> =>
                restartPipeline(setBustCache, pipeline, environment)
              }
            >
              Restart Pipeline
            </button>
          </section>
        </>
      )}
    </>
  );
};
