
var GitHub = require('github-api');
var rp = require('request-promise');
const _ = require("lodash");

var gh = new GitHub(
    );

(async ()=>{
    try {
    //grab github repository url from arguements
    let gitUrl = process.argv.slice(2)
    console.log(`Fetching pull requests for: ${gitUrl[0]}`);
    let result = await getPullR(gitUrl[0]);
    console.log(JSON.stringify(result));
    } catch (error) {
        //There is a limitation on the number of requests you can make in an hour (60 requests)
        if(typeof error !== "undefined" && typeof error.message !== "undefined" &&  
            error.message.includes("403") && typeof error.response !== "undefined" && 
            typeof error.response.status !== "undefined" &&  error.response.status == 403 && error.response.statusText == "Forbidden"){
                console.log("You have hit the Rate limiting of Git Api. See https://developer.github.com/v3/#rate-limiting for details.");
            }
        console.log(["error"], error);
        process.exit();
    }

})();

async function getPullR(gitUrl){
    console.log(`Searching git for: ${gitUrl.split("github.com/")[1]}`);
    //Since we do not have the owner of the repo we have to use the search API to find the repo and the owner
    try {
        let searchResult = await paginationRequest(`https://api.github.com/search/repositories?q=${gitUrl.split("github.com/")[1]}+in:html_url`)//await rp(options)
        if(typeof searchResult !== "undefined"){
            console.log(`Found ${searchResult.length} result/s`);
            
            // filter the results from the search Api to match the passed in url exactly
            let filteredSearch = searchResult.filter((item)=>{
                if(typeof item !== "undefined" && typeof item.html_url !== "undefined" && item.html_url == gitUrl){
                    return true
                } else {
                    return false;
                }
            });
            
            // Now that we have the filtered search complete and if successful the correct repository we can get the Rep
            if(typeof filteredSearch[0] !== "undefined" && typeof filteredSearch[0].owner !== "undefined" && typeof filteredSearch[0].owner.login !== "undefined"){
                let filterResult = filteredSearch[0], nextPage = true, pageNumber = 1, allPullRequests = [];
                
                //use npm package to create intance of the Repository class
                let repo =  await gh.getRepo(filterResult.owner.login,filterResult.name);
                console.log(`Found git repo after filter with owner ${filterResult.owner.login} and name ${filterResult.name}`)
                while(nextPage){

                    //use npm package to get all Pull Requests for this Repository
                    let pullRequests = await repo.listPullRequests({"state": "open", "page": pageNumber, "per_page": 100});
                    if(typeof pullRequests !== "undefined" && typeof pullRequests.data !== "undefined" && pullRequests.data.length > 0){
                        let promiseArray = pullRequests.data.map(async (pull) =>{
                            if(typeof pull !== "undefined"){
                                let commits = rp({uri : pull.commits_url, json : true,  headers: {
                                    'User-Agent': 'Request-Promise'
                                }});
                                let comments = rp({uri : pull.comments_url, json : true, headers: {
                                    'User-Agent': 'Request-Promise'}});

                                await Promise.all([commits, comments]);
                                if(typeof commits !== "undefined" && typeof commits.response !== "undefined" && typeof comments !== "undefiend" && typeof comments.response !== "undefiend"){
                                    allPullRequests.push({"pull_request": pull.title, "user" :pull.user.login, "commits": commits.response.body.length, "comments" : comments.response.body.length});
                                } else {
                                    throw `Unable to get commits or comments for pull request ${pull.title}`
                                }
                            } else{
                                return false;
                            }
                        });
                        await Promise.all(promiseArray);
                        if(pullRequests.data.length < 100){
                            nextPage = false
                        }
                        pageNumber++;
                    } else {
                        nextPage = false;
                    }

                }
                return allPullRequests;

            } else {
                throw `Did not find repository ${gitUrl}`;
            }
        } else {
            throw "Error"
        }

        
    } catch (error) {
        console.log(["error", "getPullR"], error)
        return [];
    }
}

/* 
@param uri {object} - uri for the github api to request along with q param
@return {Array} - The full list of all items from the Github Api

Future improvements, have the pull request logic also use this function to retrieve all pull requests
*/
async function paginationRequest(uri){
    let nextPage = true, pageNumber = 1, allPullRequests = [], page_per_count = 100;
    var options = {
        //the search api does not return anything if you include https://github.com
        uri: `${uri}&per_page=${page_per_count}&page=${pageNumber}`,
        headers: {
            'User-Agent': 'Request-Promise'
        },
        json: true 
    };
    try {
        while(nextPage){
            let response = await rp(options);
            if(typeof response !== "undefined" && typeof response.items !== "undefined"){
                allPullRequests.push(...response.items)
                if(response.items.length < page_per_count){
                    nextPage = false
                } else {
                    pageNumber++;
                }
            } else {
                nextPage = false
                throw `Response was emptry from ${options}`
            }
        }
        return allPullRequests;
    } catch (error) {
        console.log(["error", "paginationSearch"], `Error during request with options ${JSON.stringify(options)}. Error thrown ${error}`);
        return [];
    }
}