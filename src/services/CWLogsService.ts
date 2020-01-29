import * as AWS from 'aws-sdk';
import { EnvironmentModel } from '../models/EnvironmentModel';
import { LogModel } from '../models/LogModel';
import { ReturnStatus } from '../models/ReturnStatus';
import { OutputLogEvent } from 'aws-sdk/clients/cloudwatchlogs';

export class CWLogsService {
  private client: AWS.CloudWatchLogs;

  constructor(environment: EnvironmentModel) {
    this.client = new AWS.CloudWatchLogs(environment.config);
  }

  public getLogs(logLocation: LogModel): Promise<ReturnStatus> {
    return this.client
      .getLogEvents({
        logGroupName: logLocation.logGroup,
        logStreamName: logLocation.logStream
      })
      .promise()
      .then(function(data: AWS.CloudWatchLogs.GetLogEventsResponse) {
        if (!data.events) {
          const error: ReturnStatus = {
            fail: { message: 'Could not find logs' }
          };
          return error;
        }

        function convertTimestamp(timestamp: number): string {
          const d = new Date(timestamp); // Convert the passed timestamp to milliseconds
          const yyyy = d.getFullYear(),
            mm = ('0' + (d.getMonth() + 1)).slice(-2), // Months are zero based. Add leading 0.
            dd = ('0' + d.getDate()).slice(-2), // Add leading 0.
            hh = d.getHours(),
            min = ('0' + d.getMinutes()).slice(-2); // Add leading 0.

          let h = hh,
            ampm = 'AM';

          if (hh > 12) {
            h = hh - 12;
            ampm = 'PM';
          } else if (hh === 12) {
            h = 12;
            ampm = 'PM';
          } else if (hh === 0) {
            h = 12;
          }

          // ie: 2013-02-18, 8:35 AM
          return yyyy + '-' + mm + '-' + dd + ', ' + h + ':' + min + ' ' + ampm;
        }

        const logs: LogModel = {
          logs: data.events.map((event: OutputLogEvent) => {
            return (
              convertTimestamp(event.timestamp as number) + ': ' + event.message
            );
          }),
          logStream: logLocation.logStream,
          logGroup: logLocation.logGroup
        };

        const success: ReturnStatus = {
          success: { response: logs }
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
