# Lets
Collaborative environment for Windows shares

## History
I made Lets before I knew that I could use shared databases in WSH without running a server beyond that used for file sharing in Windows. I instead found that I could share a log file over a network, read-only, and multiple other clients could read it as it was written. As long as state was deterministic, clients could keep in sync. Also, each client has full control over its log file and which log files to read, allowing, for instance, blurring of single-player and multi-player games. I didn't have much trouble with log files getting too large, but the plan was to switch files using a notice at the end of a log and also including the current file in the user's configuration file, which is also shared read-only.

User choice powered the system, but you always knew what everyone was doing. To make the determinism less boring, I added a synchronized PRNG, which was enough for a feeling of unknown, even though it was predictable. I also developed a commit scheme, which was better at adding unknowns.

## Limitations 
I designed this for public access to log and status files, at least for reading. Setting permissions for private access files was not often done, due to increased complexity and decreased reliability. The only way to handle temporary secrets in public was a commitment scheme. I intend to include a revised version of the scheme eventually. It is based on pre-committing to help bind the actual commit to a single meaningful secret without losing security.

## Future
I am now working on a TypeScript implementation that includes more features to make it more useable.