# react-aws-dashboard-codepipeline

A react component which provides an graphical interface to adminster AWS CodePipeline. This is completely client side and requires no backend to function.

## Installation

```
yarn add react-aws-dashboard-codepipeline
```

## Features

- Restart Pipelines
- Restart Stages
- Get CodeBuild Logs
- Show Git source provider commit details
- Show Deployment details
- Search Pipelines



## Example (with create-react-app)

1. Create new react app and add react-aws-dashboard-codepipeline
```bash
yarn create react-app my-app --template typescript
cd my-app
yarn add react-aws-dashboard-codepipeline aws-sdk
```

2. Replace src/App.tsx with the following code importing the react-aws-dashboard-codepipeline component.
```typescript
import React from "react";
import AWS from "aws-sdk";
import Environment from "react-aws-dashboard-codepipeline";

const App: React.FC = () => {
  const config = new AWS.Config();
  config.accessKeyId = "AKIAIOSFODNN7EXAMPLE";
  config.secretAccessKey = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";
  config.region = "ap-southeast-2";

  return <Environment name="Test" config={config} />;
};

export default App;
```

3. Run the example
```bash
yarn start
```

Please note, due to the sensitive nature of the AWS credentials, this example is only suitable to run locally and should never be deployed to a remote location. [Consider using AWS Cognito or Federated Identities](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-browser-credentials-federated-id.html) if you wish to deploy this solution to a website.

## Screenshot

![Screenshot](https://raw.githubusercontent.com/assignar/react-aws-dashboard-codepipeline/master/images/screenshot.png?token=AJ2OJHTP3N7YSQ5HCXBC5BS6HODUY)
