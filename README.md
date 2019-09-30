# build-number
GitHub action for generating sequential build numbers for GitHub actions. The build number is stored in your GitHub repository as a ref, it doesn't add any extra commits to your repository. Use in your workflow like so:

```
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - name: Generate build number
      uses: einaregilsson/build-number@v1 
      with:
        token: ${{secrets.github_token}}        
    - name: Print new build number
      run: echo Build number is $BUILD_NUMBER
```

After that runs the subsequent steps in your job will have the environment variable ```BUILD_NUMBER``` available. If you prefer to be more explicit you can use the output of the step, like so:

```
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - name: Generate build number
      id: buildnumber
      uses: einaregilsson/build-number@v1 
      with:
        token: ${{secrets.github_token}}        
    
    # Now you can pass ${{ steps.buildnumber.outputs.build_number }} to the next steps.
    - name: Another step as an example
      uses: actions/hello-world-docker-action@v1
      with:
        who-to-greet: ${{ steps.buildnumber.outputs.build_number }}
```
The `GITHUB_TOKEN` environment variable is defined by GitHub already for you. See [virtual environments for GitHub actions](https://help.github.com/en/articles/virtual-environments-for-github-actions#github_token-secret) for more information.

## Getting the build number in other jobs

For other steps in the same job you can use the methods above, to actually get the build number in other jobs you need some extra actions, since jobs are run in a completely clean environment. You need to use the ```actions/upload-artifact@v1``` action to save the build number as a workflow artifact, then download it at the start of the next job with ```actions/download-artifact@v1``` and then run the build number job to make it into an environment variable there again.

```
jobs:
  job1:
    runs-on: ubuntu-latest
    steps:
    - name: Generate build number
      id: buildnumber
      uses: einaregilsson/build-number@v1 
      with:
        token: ${{secrets.github_token}}        
    - name: Upload build number
      uses: actions/upload-artifact@v1
      with:
        name: BUILD_NUMBER
        path: BUILD_NUMBER
          
  job2:
    runs-on: ubuntu-latest
    steps:
    - name: Download build number
      uses: actions/download-artifact@v1
      with:
        name: BUILD_NUMBER
    - name: Restore build number
      id: buildnumber
      uses: einaregilsson/build-number@v1 
    
    # Don't need to add Github token here, since you're only getting an artifact.
    # After this runs you'll again have the $BUILD_NUMBER environment variable, and 
    # the ${{ steps.buildnumber.outputs.build_number }} output.
```


## Setting the initial build number.

If you're moving from another build system, you might want to start from some specific number. The ```build-number``` action simply uses a special tag name to store the build number, ```build-number-x```, so you can just create and push a tag with the number you want to start on. E.g. do

```
git tag build-number-500
git push origin build-number-500
```

and then your next build number will be 501. The action will always delete older refs that start with ```build-number-```, e.g. when it runs and finds ```build-number-500``` it will create a new tag, ```build-number-501``` and then delete ```build-number-500```.

## Branches and build numbers

The build number generator is global, there's no concept of special build numbers for special branches, it's probably something you would just use on builds from your master branch. It's just one number that gets increased every time the action is run.

So, that's it. Hope you can use it. You can read more about how it works in this blog post: http://einaregilsson.com/a-github-action-for-generating-sequential-build-numbers/

