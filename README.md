# github_pull_request_manager
Github pull request manager node.js


In order to test this node app you need to pass it an url of a github repository.

Example : node index.js https://github.com/google/filament

There is something on the api side that limits the capabilites of this app. There is a limit to how many request you can make in an
hour. If you pass it a repo with a 10+ pull requests you may see this error since this app can only request 60 times an hour. 
