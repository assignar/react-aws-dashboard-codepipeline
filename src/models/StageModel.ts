import { ActionModel } from './ActionModel';

export interface StageModel {
  name: string;
  id?: string;
  status?: string;
  actions: ActionModel[];
}
