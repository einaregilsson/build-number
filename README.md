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
    - name: Another step
      uses: actions/hello-world-docker-action@v1
      with:
        who-to-greet: ${{ steps.buildnumber.outputs.build_number }}
```

## Getting the build number in other jobs

For other steps in the same job you can use the methods above, to actually get the build number in other jobs you need some extra scripting, since jobs are run in a completely clean environment. You need to use the ```actions/upload-artifact@v1``` action to save the build number as a workflow artifact, then download it at the start of the next job with ```actions/download-artifact@v1``` and make it into an environment variable there again.

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
    - name: Save build number
      run: echo $BUILD_NUMBER > BUILD_NUMBER
    - name: Upload build number
      uses: actions/upload-artifact@v1
        with:
          name: BUILD_NUMBER
          path: BUILD_NUMBER
          
  job2:
    runs-on: ubuntu-latest
    steps:
      -name: Download build number
       uses: actions/download-artifact@v1
        with:
          name: BUILD_NUMBER
      -name: Create environment variable
      shell: bash
        run: |
          BUILD_NUMBER=`cat BUILD_NUMBER/BUILD_NUMBER`
          echo 
          expr ${value} \* 9 > homework/math-homework.txt
    # Now you can pass ${{ steps.buildnumber.outputs.build_number }} to the next steps.
    - name: Another step
      uses: actions/hello-world-docker-action@v1
      with:
        who-to-greet: ${{ steps.buildnumber.outputs.build_number }}
```

