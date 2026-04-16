1. User and Authentication System
   Users log in using Google through Clerk
   A user account is automatically created in your database
   Users stay logged in (session handled by Clerk)
   What users can do:
   Create or join a team
   View contests
   Open problems
   Submit code
   View their submissions
   View leaderboard
2. Team System
   A user must be in a team to participate in a contest
   Features:
   Create a team (user becomes leader)
   Generate a join code or link
   Join a team using that code
   Rules:
   Maximum 3 members per team
   One team per contest
   Cannot change team after contest starts
   Team dashboard shows:
   Team name
   Members
   Invite link
3. Contest System
   Features:
   Admin creates contests
   Each contest has:
   Title
   Start time
   End time
   Status
   Status types:
   DRAFT
   UPCOMING
   RUNNING
   ENDED
   Rules:
   Users can submit only when contest is RUNNING
   Teams are locked after contest starts
4. Problem System
   Problems belong to a contest
   Each problem has:
   Title (A, B, C…)
   Description
   Input/output format
   Constraints
   Time limit
5. Testcase System
   Each problem has testcases
   Types:
   Public testcases (visible to user)
   Hidden testcases (used only for judging)
   Rules:
   Testcases cannot be changed after contest starts
6. Submission System
   Users write code using Monaco Editor
   Features:
   Select programming language
   Submit code multiple times
   Each submission is stored
   Important:
   Submission is linked to user, not team
7. Code Execution (Judge System)
   Code is executed using Judge0
   Process:
   Code runs against each testcase
   Output is compared with expected output
   Possible results:
   Accepted
   Wrong Answer
   Time Limit Exceeded
   Runtime Error
   Compilation Error
8. Testcase Result System
   Each submission stores:
   Result for each testcase
   Execution time
   Output
9. Scoring System (Basic Idea)
   Every submission result is used for scoring
   Only two important outcomes:
   Accepted
   Wrong attempt
10. ICPC Team Scoring System
    Rules:
    Only the first correct solution counts for a team
    If one member solves a problem, it is solved for the whole team
    Multiple solves of the same problem are ignored
    Wrong attempts are counted
    Penalty calculation:
    penalty = (wrong attempts × 20 minutes) + time taken to solve
11. Team Score Tracking

For each team, system stores:

Number of problems solved
Total penalty
Time of last correct submission 12. Leaderboard System
Features:
Shows ranking of all teams
Sorting rules:
More problems solved is better
Lower penalty is better
Earlier solve time is better 13. API System
Public APIs:
Get contests
Get problems
Get leaderboard
Protected APIs:
Submit code
Join team
View submissions
Admin APIs:
Create contest
Add problems
Add testcases
Start/end contest 14. Admin System
Access:
Only admin users can access
Features:
Create contest
Add problems
Add testcases
Change contest status
Interface:
Simple UI (or Postman if needed) 15. Submission History
Users can:
See all their submissions
Filter by problem
Filter by result 16. Security
Authentication handled by Clerk
Admin routes are protected
Basic validation on inputs 17. Performance (Basic)
Efficient database queries
Leaderboard computed correctly
Simple polling instead of real-time sockets 18. Deployment
Stack:
Frontend: Vite + React
Backend: Node.js + Express
Database: Neon
Auth: Clerk
Judge: Judge0
