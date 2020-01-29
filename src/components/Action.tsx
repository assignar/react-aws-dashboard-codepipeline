import * as React from 'react';
import { ActionModel } from '../models/ActionModel';
import classnames from 'classnames';
import { EnvironmentModel } from '../models/EnvironmentModel';
import { LogModel } from '../models/LogModel';
import { CodeBuildService } from '../services/CodeBuildService';
import { CWLogsService } from '../services/CWLogsService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleDown } from '@fortawesome/free-solid-svg-icons';

interface ActionProps {
  environment: EnvironmentModel;
  action: ActionModel;
}

async function getLogs(
  environment: EnvironmentModel,
  build: string
): Promise<LogModel | undefined> {
  const codeBuildService: CodeBuildService = new CodeBuildService(environment);
  let logs: LogModel | undefined = undefined;

  const cbResult = await codeBuildService.getBuildLogLocation(build);
  if (cbResult.fail) {
    console.error(cbResult.fail.message);
  }

  if (cbResult.success) {
    const logLocation: LogModel = cbResult.success.response as LogModel;
    const cwlService: CWLogsService = new CWLogsService(environment);
    const cwlResult = await cwlService.getLogs(logLocation);
    if (cwlResult.fail) {
      console.log(cwlResult.fail.message);
    }

    if (cwlResult.success) {
      logs = cwlResult.success.response as LogModel;
    }
  }
  return logs;
}

async function openLogs(
  environment: EnvironmentModel,
  build: string
): Promise<void> {
  const o = window.open();
  if (o !== null) {
    const response = await getLogs(environment, build);
    if (response) {
      o.document.write('<pre>');
      o.document.write((response.logs as string[]).join(''));
      o.document.write('</pre>');
    }
  }
}

//https://stackoverflow.com/questions/8211744/convert-time-interval-given-in-seconds-into-more-human-readable-form
function millisecondToHumanReadable(milliseconds: number): string {
  const seconds = milliseconds / 1000;
  const levels = [
    [Math.floor(seconds / 31557600), 'years'],
    [Math.floor((seconds % 31557600) / 86400), 'days'],
    [Math.floor(((seconds % 31557600) % 86400) / 3600), 'hours'],
    [Math.floor((((seconds % 31557600) % 86400) % 3600) / 60), 'minutes']
  ];
  const calcSeconds = [
    Math.floor((((seconds % 31536000) % 86400) % 3600) % 60),
    'seconds'
  ];
  let returntext = '';

  for (let i = 0, max = levels.length; i < max; i++) {
    if (levels[i][0] === 0) continue;
    returntext +=
      ' ' +
      levels[i][0] +
      ' ' +
      (levels[i][0] === 1
        ? (levels[i][1] as string).substr(
            0,
            (levels[i][1] as string).length - 1
          )
        : levels[i][1]);
  }
  returntext = returntext.trim();
  if (returntext === '') {
    returntext =
      calcSeconds[0] +
      ' ' +
      (calcSeconds[0] === 1
        ? (calcSeconds[1] as string).substr(
            0,
            (calcSeconds[1] as string).length - 1
          )
        : calcSeconds[1]);
  }
  return returntext + ' ago';
}

export const Action: React.FC<ActionProps> = ({
  environment,
  action
}: ActionProps) => (
  <div
    className={classnames('action', {
      success: action.status === 'Succeeded',
      danger: action.status === 'Failed',
      info: action.status === 'InProgress'
    })}
  >
    <div className="columns">
      <div className="column is-two-thirds">
        <h6 className="title is-6">
          {action.name} ({action.type})
        </h6>
        <p className="subtitle is-6">
          {action.statusTime &&
            millisecondToHumanReadable(
              new Date().getTime() - new Date(action.statusTime).getTime()
            )}
        </p>
      </div>
      <div className="column is-one-third">
        <span
          className={classnames('tag is-pulled-right', {
            'has-background-success has-text-white':
              action.status === 'Succeeded',
            'has-background-danger has-text-white': action.status === 'Failed',
            'has-background-info has-text-white': action.status === 'InProgress'
          })}
        >
          {action.status}
        </span>
      </div>
    </div>
    {action.repo && <p>Repository: {action.repo}</p>}
    {action.branch && <p>Branch: {action.branch}</p>}
    {action.details && (
      <div className="dropdown is-hoverable">
        <div className="dropdown-trigger">
          <button
            disabled={!action.details ? true : false}
            className="button"
            aria-haspopup="true"
            aria-controls="dropdown-menu4"
          >
            <span>Details</span>
            <span className="icon is-small">
              <FontAwesomeIcon icon={faAngleDown} />
            </span>
          </button>
        </div>
        <div className="dropdown-menu" id="dropdown-menu4" role="menu">
          <div className="dropdown-content newlines delayhover">
            <div className="dropdown-item">{action.details}</div>
          </div>
        </div>
      </div>
    )}
    {action.type === 'CodeBuild' && window !== null && (
      <button
        className="button"
        onClick={async (): Promise<void> =>
          openLogs(environment, action.id as string)
        }
      >
        Fetch Build Logs
      </button>
    )}
    <div></div>
  </div>
);
