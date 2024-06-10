#!/bin/bash

if [ $# -lt 2 ]
then
        echo "ERROR: Argument missing"
        echo "Usage: execute.sh <project name> <list of test cases>"
        echo "Example: execute.sh demo1 TC1 TC2 TC3" 
        echo "OR execute.sh demo1 dry-run" 
        exit 1
fi

export AI_PROJECT_NAME=$1
echo "Project name is $AI_PROJECT_NAME"

if [ "$2" = "dry-run" ]; then
    export AI_DRY_RUN=enabled
fi

shift
## Getting total number of test cases
export NUMBER_OF_TCS=$#

## Getting list of test cases and storing in an array
export TEST_LIST=( "$@" )
## Getting last test case name ro replace later without suffix
export LAST_TC=${TEST_LIST[$NUMBER_OF_TCS-1]}

## Adding suffix ^| at the end of each test case
export TEST_LIST_WITH_SUFFIX=( $(echo ${TEST_LIST[*]}|sed "s/\(\b[^ ]\+\)/\1|/g") )

## Removing suffix from last test case
#
TEST_LIST_WITH_SUFFIX[$NUMBER_OF_TCS-1]=${LAST_TC}

echo "TEST CASE LIST ${TEST_LIST_WITH_SUFFIX[@]}"
## Preparing string to pass to node command

#export COMPLETE_COMMAND='"\"'${TEST_LIST_WITH_SUFFIX[@]}'\""'
export COMPLETE_COMMAND=${TEST_LIST_WITH_SUFFIX[@]}
COMPLETE_COMMAND="$(echo -e "${COMPLETE_COMMAND}" | tr -d '[:space:]')"

if [ "$AI_DRY_RUN" = "enabled" ]; then
    npx testmait dry-run
else    
  node lib/main.js run --steps --grep "\"${COMPLETE_COMMAND}\""
  allure generate output/allure/results --clean -o ./generated/allure-report
fi