import * as React from 'react';
import { useState, useEffect } from 'react';
import { CodePipelineService } from '../services/CodePipelineService';
import { Pipeline } from './Pipeline';
import { PipelineModel } from '../models/PipelineModel';
import { EnvironmentModel as EnvironmentProps } from '../models/EnvironmentModel';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

async function getPipelines(
  codePipeline: CodePipelineService
): Promise<PipelineModel[] | undefined> {
  const result = await codePipeline.listPipelines();
  if (result.success) {
    return result.success.response as PipelineModel[];
  }
  return undefined;
}

export const Environment: React.FC<EnvironmentProps> = environment => {
  const [loading, setLoading] = useState<boolean>(true);
  const [searchString, setSearchString] = useState<string>('');
  const [pipelines, setPipelines] = useState<PipelineModel[]>([]);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async (): Promise<void> => {
      setLoading(true);
      if (!cancelled) {
        const codePipeline: CodePipelineService = new CodePipelineService(
          environment.config
        );
        const result = await getPipelines(codePipeline);
        console.log(result);
        if (result) setPipelines(result);
        setSearchString('');
        setLoading(false);
      }
    };
    fetchData();
    return (): void => {
      cancelled = true;
    };
  }, [environment.name]);

  return (
    <div className="container">
      <h2 className="title is-2">{environment.name}</h2>
      {loading && (
        <progress
          className="progress-loader progress is-small is-primary"
          max="100"
        >
          15%
        </progress>
      )}
      {!loading && (
        <section className="columns-container">
          <section className="column is-half" style={{ paddingBottom: 0 }}>
            <div className="field is-grouped">
              <div className="control is-expanded">
                <input
                  className="input"
                  type="text"
                  placeholder="Search"
                  value={searchString}
                  onChange={(e): void => setSearchString(e.target.value)}
                />
              </div>
              <div className="control">
                <a
                  className="button has-text-grey"
                  onClick={(): void => setSearchString('')}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </a>
              </div>
            </div>
          </section>
          {pipelines &&
            pipelines
              .filter(pipe => pipe.name.includes(searchString))
              .map((pipeline: PipelineModel) => (
                <div
                  key={pipeline.name}
                  className="column is-3 is-half-mobile pipeline-column"
                >
                  <Pipeline
                    key={pipeline.name}
                    pipeline={pipeline}
                    environment={environment}
                  />
                </div>
              ))}
        </section>
      )}
    </div>
  );
};
export default Environment;
