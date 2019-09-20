//Trying to avoid any npm installs or anything that takes extra time...
const   https = require('https'),
        zlib = require('zlib'),
        env = process.env;

function fail(message, exitCode=1) {
    console.error(message);
    process.exit(1);
}


console.error('JUST AN ERROR');
console.log('::error::ACTION ERROR');

for (let k in env) {
        console.log(k + ' : ' + env[k]);
}
function request(method, path, data, callback) {
    
    try {
        if (data) {
            data = JSON.stringify(data);
        }  
        const options = {
            hostname: 'api.github.com',
            port: 443,
            path,
            method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data ? data.length : 0,
                'Accept-Encoding' : 'gzip',
                'Authorization' : `token ${env.GITHUB_TOKEN}`,
                'User-Agent' : 'GitHub Action - development'
            }
        }
        const req = https.request(options, res => {
    
            let chunks = [];
            res.on('data', d => chunks.push(d));
            res.on('end', () => {
                let buffer = Buffer.concat(chunks);
                if (res.headers['content-encoding'] === 'gzip') {
                    zlib.gunzip(buffer, (err, decoded) => {
                        if (err) {
                            callback(err);
                        } else {
                            callback(null, res.statusCode, decoded && JSON.parse(decoded));
                        }
                    });
                } else {
                    callback(null, res.statusCode, buffer.length > 0 ? JSON.parse(buffer) : null);
                }
            });
    
            req.on('error', err => callback(err));
        });
    
        if (data) {
            req.write(data);
        }
        req.end();
    } catch(err) {
        callback(err);
    }
}


function main() {

    //Some sanity checking:
    for (let varName of ['GITHUB_TOKEN', 'GITHUB_REPOSITORY', 'GITHUB_SHA']) {
        if (!env[varName]) {
            fail(`ERROR: Environment variable ${varName} is not defined.`);
        }
    }

    request('GET', `/repos/${env.GITHUB_REPOSITORY}/git/refs/tags/build-number-`, null, (err, status, result) => {
    
        let nextBuildNumber, nrTags;
    
        if (status === 404) {
            console.log('No build-number ref available, starting at 1.');
            nextBuildNumber = 1;
            nrTags = [];
        } else if (status === 200) {
            nrTags = result.filter(d => d.ref.match(/\/build-number-(\d+)$/));
            
            const MAX_OLD_NUMBERS = 5; //One or two ref deletes might fail, but if we have lots then there's something wrong!
            if (nrTags.length > MAX_OLD_NUMBERS) {
                fail(`ERROR: Too many build-number- refs in repository, found ${nrTags.length}, expected only 1. Check your tags!`);
            }
            
            //Existing build numbers:
            let nrs = nrTags.map(t => parseInt(t.ref.match(/-(\d+)$/)[1]));
    
            let currentBuildNumber = Math.max(...nrs);
            console.log(`Current build nr is ${currentBuildNumber}.`);
    
            nextBuildNumber = currentBuildNumber + 1;
            console.log(`Updating build counter to ${nextBuildNumber}...`);
        } else {
            if (err) {
                fail(`Failed to get refs. Error: ${err}, status: ${status}`);
            } else {
                fail(`Getting build-number refs failed with http status ${status}, error: ${JSON.stringify(result)}`);
            } 
        }

        let newRefData = {
            ref:`refs/tags/build-number-${nextBuildNumber}`, 
            sha: env.GITHUB_SHA
        };
    
        request('POST', `/repos/${env.GITHUB_REPOSITORY}/git/refs`, newRefData, (err, status, result) => {
            if (status !== 201 || err) {
                fail(`Failed to create new build-number ref. Status: ${status}, err: ${err}, result: ${JSON.stringify(result)}`);
            }

            console.log(`Successfully updated build number to ${nextBuildNumber}`);
            
            //Setting the output and a environment variable to new build number...
            console.log(`::set-env name=BUILD_NUMBER::${nextBuildNumber}`);
            console.log(`::set-output name=build_number::${nextBuildNumber}`);
            
            //Cleanup
            if (nrTags) {
                console.log(`Deleting ${nrTags.length} older build counters...`);
            
                for (let nrTag of nrTags) {
                    request('DELETE', `/repos/${env.GITHUB_REPOSITORY}/git/${nrTag.ref}`, null, (err, status, result) => {
                        if (status !== 204 || err) {
                            console.warn(`Failed to delete ref ${nrTag.ref}, status: ${status}, err: ${err}, result: ${JSON.stringify(result)}`);
                        } else {
                            console.log(`Deleted ${nrTag.ref}`);
                        }
                    });
                }
                }

        });
    });
}

main();



