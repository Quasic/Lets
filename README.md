# Lets
Collaborative environment for Windows shares

## History
I made Lets before I knew that I could use shared databases in WSH without running a server beyond that used for file sharing in Windows. I instead found that I could share a log file over a network, read-only, and multiple other clients could read it as it was written. As long as state was deterministic, clients could keep in sync. Also, each client has full control over its log file and which log files to read, allowing, for instance, blurring of single-player and multi-player games. I didn't have much trouble with log files getting too large, but the plan was to switch files using a notice at the end of a log and also including the current file in the user's configuration file, which is also shared read-only.

## Future
I am now working on a TypeScript implementation that includes more features to make it more useable.