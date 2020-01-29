import * as React from 'react';
import { EnvironmentModel as EnvironmentProps } from './src/models/EnvironmentModel';

declare class Environment extends React.Component<EnvironmentProps> {}

declare module 'react-aws-dashboard-codepipeline' {}

export default Environment;
