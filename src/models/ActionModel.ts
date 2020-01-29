export interface ActionModel {
  name: string;
  id?: string;
  type?: string;
  status?: string;
  details?: string;
  statusTime?: Date;
  branch?: string;
  repo?: string;
}
