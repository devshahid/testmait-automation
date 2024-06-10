@ECHO OFF
::Example command execute.bat demo1 "@TC1" "@TC2"
if "%~2"=="" (
    echo ERROR: Argument missing
    echo Usage: execute.bat ^<project name^> ^<list of test cases^>
    echo Example: execute.bat demo1 TC1 TC2 TC3
    echo OR execute.bat demo1 dry-run
    exit /b 1
)
:: Setting up variables
SET TEST_IDS=
SET AI_PROJECT_NAME=
set AI_DRY_RUN=

SET AI_PROJECT_NAME=%~1

if "%~2"=="dry-run" (
    set AI_DRY_RUN=enabled
    GOTO execute

)

SHIFT

:generate_ids
IF "%1"=="" GOTO execute
SET TEST_IDS=%TEST_IDS% %1
SHIFT
GOTO generate_ids

:execute
SET TEST_IDS=%TEST_IDS:~1%
ECHO %TEST_IDS%
SET TEST_IDS=%TEST_IDS: =^^^|%
ECHO %TEST_IDS%

if "%AI_DRY_RUN%"=="enabled" (
    npx testmait dry-run
) else (
    node lib\main.js run --steps --grep "\"%TEST_IDS%\"
    allure generate output/allure/results --clean -o ./generated/allure-report
)
