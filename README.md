# github_pull_request_manager
Github pull request manager node.js

Prompt of this project initially :

Using the GitHub API ( https://developer.github.com/v3 ), we ask that you build
a Node.js app that displays info for the open pull requests in a GitHub repository. The
interface can take whatever form you like and should accept a repository URL, for
example https://github.com/hapijs/hapi. It should display a list of open pull requests
along with the number of commits in that PR, the number of comments on the PR, and
the user that opened it.

In order to test this node app you need to pass it an url of a github repository.

Example : node index.js https://github.com/google/filament

There is something on the api side that limits the capabilites of this app. There is a limit to how many request you can make in an
hour. If you pass it a repo with a 10+ pull requests you may see this error since this app can only request 60 times an hour. 
