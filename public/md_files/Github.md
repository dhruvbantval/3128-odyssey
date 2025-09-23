# Robot-Github
## Preamble
This documentation outlines the various practices that we want to uphold to keep our Github organization clear, streamlined, and structured for our robot repositories. 
This does NOT include ROBOT CODE STRUCTURE.

Authors: William Yuan (Wallim)

## Prefix Info
There will be NO FORKS, ONLY BRANCHES

__Defining “good enough”:__

- Code reviewed
- Tested on physical components (Off robot testing)
- Can vary specifically per project (Milestones)
  - Criteria based off of functionalities implemented by strat and mech
  - Quantify success criteria with verification process
  - Goal oriented enhancements

__Defining “push often” (NOT time based):__

- Code does not need to be complete when pushed
- Code should not have broken code, compilable
  - If something is crucially incomplete, put a comment or a placeholder:
  ```
  //TODO
  //FIX THIS
  //NOTE
  temp variables
  ```
  - Should be able to be searched up to be corrected
 
__Code reviewing__

- EVERYONE can code review, in fact it is encouraged
  - However, this does not entail that you are allowed to accept pull requests
- Being a Request Manager
  - Software Lead + Dept Coord
  - Experienced upperclassmen, project-lead
  - Understand issues
    - Sloppiness, awful structure
    - Logic flaw (typically very hidden, hard to detect)
  - Multiple request managers can review a pull request
 
__Repository creation__

- A MAX of TWO new robot repositories will be created each year
  - ONE will be the compszn robot
  - ONE will depend from year to year, but would be a offszn/preszn robot if we decide to create one
- NAMING
  - COMPSZN ROBOT:
  - > “3128-robot-{year}”
  - OFFSZN/PRESZN ROBOT:
  - > “3128-prebot-{year}”
  - The year is the year the game came out for that robot
  - > EX. 23-24 school year, say 2024

## Repository Structure and Branches

### MAIN 
This is the __ROOT__ branch, also known as the __COMP READY BRANCH__

__NO JUNK IN MAIN__ Code here should be clean, “good enough” to compete  

__DEV -> MAIN__ Only branch that can push to main is the dev branch

Once there is a new push, the latest one will be given a new tag as a marker of known WORKING CODE, in case we have to roll back code

- Program Lead + Dept Coord Job

### COMP
__Branches only off main__

__Purpose__ make any quick (sloppy) changes that are inevitable during comp, away from MAIN

__MAIN -> COMP -> DEV__ once the comp is OVER, this branch will NOT be pushed back into main, rather worked on/clean up/corrected in dev

__Naming__

- Branch:
> {comp}_{year}
- Push to branch:
> {comp} day {1,2,3...} {datetime}
> __(Should be done every night after a comp day)__

### DEV
__Dirty work__ happens here

- Integration, cleaning code, prepping for comp, edge cases, etc.

__Any push__ (milestone met) to dev will be in the form of a request and code reviewed 

- Code review will not be from those working on that project, external viewer

__DEV -> MAIN__ once "good enough", deemed by leaders and/or robot owner, push to main

- Code will be reviewed in a request

### Project
__Only branches off of dev__ 

__Within the branch__ people SHOULD:

- Push OFTEN, even if it is not done (every GOOD change, “working not done”)
- __PROJECT->DEV__ Once a milestone is met, push into dev, then continue working on the branch
- Work toward ONE milestone at a time, chronologically

__Merging Procedures__

- Once a project pushes ANY milestone into dev, it is the other people’s job working on other projects to sync with dev
- __FIRST PUSH WINS__

__Naming Standards__

- Branch:
> {project name}_{project leader}
- Pushes to a branch:
> {person}_{datetime}
- Pushes to dev:
> {project name}_{milestone name}

### Deleting Branches
__RESPONSIBILITY OF SOFT LEAD + DEPT COORD__
