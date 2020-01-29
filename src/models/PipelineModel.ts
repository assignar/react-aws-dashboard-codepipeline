import { StageModel } from './StageModel';

export interface PipelineModel {
  name: string;
  version: number;
  stages: StageModel[];
}
