# NOTICE: This action is no longer being maintained

Due the maintainer passing away, this action is no longer being maintained as of Janyary 2023.

Development has moved to [onyxmueller/build-tag-number](https://github.com/onyxmueller/build-tag-number) and the action is available on the Marketplace here: <https://github.com/marketplace/actions/build-tag-number>

Updating your existing Github Actions workflows should be as simple as replacing `einaregilsson/build-number@v3` with `onyxmueller/build-tag-number@v1`

See the repo linked above for more information.

## Update 2020-02-12

GitHub has just introduced new environment variables, `GITHUB_RUN_ID` and `GITHUB_RUN_NUMBER` which are unique numbers for each workflow run, so you're probably better off using those than this GitHub action. 🙂 See https://help.github.com/en/actions/configuring-and-managing-workflows/using-environment-variables#default-environment-variables

# build-number
GitHub action for generating sequential build numbers for GitHub actions. The build number is stored in your GitHub repository as a ref, it doesn't add any extra commits to your repository. Use in your workflow like so:

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - name: Generate build number
      uses: einaregilsson/build-number@v3
      with:
        token: ${{secrets.github_token}}        
    - name: Print new build number
      run: echo "Build number is $BUILD_NUMBER"
      # Or, if you're on Windows: echo "Build number is ${env:BUILD_NUMBER}"
```

After that runs the subsequent steps in your job will have the environment variable `BUILD_NUMBER` available. If you prefer to be more explicit you can use the output of the step, like so:

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - name: Generate build number
      id: buildnumber
      uses: einaregilsson/build-number@v3 
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

For other steps in the same job you can use the methods above,
to actually get the build number in other jobs you need to use [job outputs](https://help.github.com/en/actions/reference/workflow-syntax-for-github-actions#jobsjobs_idoutputs) mechanism:

```yaml
jobs:
  job1:
    runs-on: ubuntu-latest
    outputs:
      build_number: ${{ steps.buildnumber.outputs.build_number }}
    steps:
    - name: Generate build number
      id: buildnumber
      uses: einaregilsson/build-number@v3 
      with:
        token: ${{secrets.github_token}}
          
  job2:
    needs: job1
    runs-on: ubuntu-latest
    steps:
    - name: Another step as an example
      uses: actions/hello-world-docker-action@v1
      with:
        who-to-greet: ${{needs.job1.outputs.build_number}}
```

## Setting the initial build number.

If you're moving from another build system, you might want to start from some specific number. The `build-number` action simply uses a special tag name to store the build number, `build-number-x`, so you can just create and push a tag with the number you want to start on. E.g. do

```
git tag build-number-500
git push origin build-number-500
```

and then your next build number will be 501. The action will always delete older refs that start with `build-number-`, e.g. when it runs and finds `build-number-500` it will create a new tag, `build-number-501` and then delete `build-number-500`.

## Generating multiple independent build numbers

Sometimes you may have more than one project to build in one repository. For example you may have a client and a server in the same github repository that you would like to generate independent build numbers for. Another example is you have two Dockerfiles in one repo and you'd like to version each of the built images with their own numbers.  
To do this, use the `prefix` key, like so:

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - name: Generate build number
      id: buildnumber
      uses: einaregilsson/build-number@v3 
      with:
        token: ${{ secrets.github_token }}
        prefix: client
```

This will generate a git tag like `client-build-number-1`.

If you then do the same in another workflow and use `prefix: server` then you'll get a second build-number tag called `server-build-number-1`.

## Branches and build numbers

The build number generator is global, there's no concept of special build numbers for special branches unless handled manually with the `prefix` property. It's probably something you would just use on builds from your master branch. It's just one number that gets increased every time the action is run.

So, that's it. Hope you can use it. You can read more about how it works in this blog post: http://einaregilsson.com/a-github-action-for-generating-sequential-build-numbers/
