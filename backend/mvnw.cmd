@REM ----------------------------------------------------------------------------
@REM Licensed to the Apache Software Foundation (ASF) under one
@REM or more contributor license agreements.  See the NOTICE file
@REM distributed with this work for additional information
@REM regarding copyright ownership.  The ASF licenses this file
@REM to you under the Apache License, Version 2.0 (the
@REM "License"); you may not use this file except in compliance
@REM with the License.  You may obtain a copy of the License at
@REM
@REM    https://www.apache.org/licenses/LICENSE-2.0
@REM
@REM Unless required by applicable law or agreed to in writing,
@REM software distributed under the License is distributed on an
@REM "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
@REM KIND, either express or implied.  See the License for the
@REM specific language governing permissions and limitations
@REM under the License.
@REM ----------------------------------------------------------------------------

@REM ----------------------------------------------------------------------------
@REM Maven Start Up Batch script
@REM
@REM Required ENV Vars:
@REM JAVA_HOME - location of a JDK home dir
@REM
@REM optional ENV vars
@REM MAVEN_BATCH_ECHO - set to 'on' to enable the echoing of the input cmd
@REM MAVEN_BATCH_PAUSE - set to 'on' to wait at the end of the cmd
@REM MAVEN_OPTS - parameters to passed to the Java VM when running Maven
@REM     e.g. to debug Maven itself, use
@REM set MAVEN_OPTS=-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=y,address=8000
@REM MAVEN_SKIP_RC - flag to disable loading of mavenrc files
@REM ----------------------------------------------------------------------------

@REM Begin all REM lines with '@' in case MAVEN_BATCH_ECHO is 'on'
@echo off
@REM set title of command prompt
title %0
@REM enable echoing by setting MAVEN_BATCH_ECHO to 'on'
@if "%MAVEN_BATCH_ECHO%"=="on" echo %MAVEN_BATCH_ECHO%

@setlocal

set ERROR_CODE=0

@REM set %HOME% to equivalent of $HOME
if "%HOME%" == "" (set "HOME=%HOMEDRIVE%%HOMEPATH%")

@REM Execute a user defined script before this one
if not "%MAVEN_SKIP_RC%"=="" goto skipRcPre
@REM Personal look up
if exist "%HOME%\mavenrc_pre.bat" call "%HOME%\mavenrc_pre.bat"
@REM System look up
if exist "%ProgramData%\mavenrc_pre.bat" call "%ProgramData%\mavenrc_pre.bat"
:skipRcPre

@setlocal EnableExtensions EnableDelayedExpansion

if not "%MAVEN_USER_HOME%"=="" goto valMvnUserHome
set "MAVEN_USER_HOME=%HOME%\.m2"
:valMvnUserHome

if not "%MAVEN_PROJECTBASEDIR%"=="" goto valBaseDir
set "MAVEN_PROJECTBASEDIR=%~dp0"
:valBaseDir

set "WRAPPER_JAR=%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.jar"
set "WRAPPER_PROP=%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.properties"

if exist "%WRAPPER_JAR%" goto runMvn

if not exist "%WRAPPER_PROP%" (
  echo Could not find %WRAPPER_PROP%
  goto error
)

for /F "usebackq tokens=1,2 delims==" %%A in ("%WRAPPER_PROP%") do (
  if "%%A"=="wrapperUrl" set WRAPPER_URL=%%B
)

if "%WRAPPER_URL%"=="" (
  echo Could not find wrapperUrl in %WRAPPER_PROP%
  goto error
)

echo Downloading %WRAPPER_URL% to %WRAPPER_JAR%
powershell -Command "&{[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object Net.WebClient).DownloadFile('%WRAPPER_URL%', '%WRAPPER_JAR%')}"
if ERRORLEVEL 1 goto error

:runMvn
for /F "usebackq tokens=1,2 delims==" %%A in ("%WRAPPER_PROP%") do (
  if "%%A"=="distributionUrl" set MAVEN_DIST_URL=%%B
)

if not "%JAVA_HOME%"=="" (
  set "JAVACMD=%JAVA_HOME%\bin\java.exe"
) else (
  set "JAVACMD=java.exe"
)

if not exist "%JAVACMD%" (
  echo The JAVA_HOME environment variable is not defined correctly,
  echo this environment variable is needed to run this program.
  goto error
)

"%JAVACMD%" -classpath "%WRAPPER_JAR%" "-Dmaven.multiModuleProjectDirectory=%MAVEN_PROJECTBASEDIR%" org.apache.maven.wrapper.MavenWrapperMain %*
if ERRORLEVEL 1 goto error
goto end

:error
set ERROR_CODE=1

:end
@endlocal & set ERROR_CODE=%ERROR_CODE%

if not "%MAVEN_SKIP_RC%"=="" goto skipRcPost
@REM Personal look up
if exist "%HOME%\mavenrc_post.bat" call "%HOME%\mavenrc_post.bat"
@REM System look up
if exist "%ProgramData%\mavenrc_post.bat" call "%ProgramData%\mavenrc_post.bat"
:skipRcPost

if "%MAVEN_BATCH_PAUSE%"=="on" pause

if "%NDDEBUG%"=="true" echo on

exit /B %ERROR_CODE%
