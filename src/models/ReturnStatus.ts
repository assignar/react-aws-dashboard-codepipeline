import { PipelineModel } from './PipelineModel';
import { EnvironmentModel } from './EnvironmentModel';
import { LogModel } from './LogModel';
import { ArtifactModel } from './ArtifactModel';

export interface ReturnStatus {
  fail?: {
    message: string;
  };
  success?: {
    response:
      | PipelineModel[]
      | PipelineModel
      | EnvironmentModel
      | LogModel
      | ArtifactModel
      | undefined;
  };
}
