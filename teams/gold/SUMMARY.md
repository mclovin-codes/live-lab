# Team Gold, Phase 4: Rush as a place you play against people

URL: https://mclovin-codes.github.io/live-lab/teams/gold/app/

**The idea in one sentence:** every screen puts a person in front of you, either your matchup opponent, the Field or the room for a game, and your Stack is the one number that follows you everywhere.

**What to tap first:** open Home, tap Challenge on any player, then open the Matchup tab. Three seconds later they accept, and you see the two of you face to face with your Stacks and the gap. Then tap Lounge and open the Week 10 room.

## Navigation and why
- Five tabs: Home, Board, Matchup, Lounge, Me.
- Matchup takes the old Slips tab, because the 1v1 is one of the two reasons to open the app. The Lounge is the other, and it keeps its tab.
- Every page has the same top bar: your avatar on the left opens your profile, the page name sits in the middle, and your Stack on the right opens the Stack sheet.

## Home
Home shows four blocks in eye order:
1. **The contest card:** your rank as a huge number, your Stack, how far you've moved since Tuesday, and a strip showing where you sit in the Field. It has two buttons: Make picks and Ranks.
2. **Your matchup:** before Thursday 7:00 PM, a countdown to the auto pairing and three players close to your Stack to challenge now. After the pairing, the two avatars face to face with a tug bar and "You lead by 120".
3. **Lounge rooms:** a swipe row of game rooms with the score or the start time and who is in each room.
4. **The Field:** the top five plus you. Every avatar and name opens that player's profile.

## The contest and matchups
- **Ranks:** a podium for the top three, then the whole Field ordered by Stack. Tied Stacks share a rank.
- **Matchup tab:** your Week 10 matchup and your Challenges, each with its own view.
- The opponent's Slip is shown as locked rows. Each pick opens when its game kicks off, with a countdown to that kickoff.
- The higher Stack on Monday night takes the matchup.

## The social space
The Lounge stops being one chat feed and becomes rooms you walk into:
- **The Week room** for the whole Field, all week.
- **One room per game,** live games first.
- **Inside a game room:**
  - a big scoreboard;
  - "How the room leans": the bar of who is on each side;
  - "On this game": who is in, with their side hidden until kickoff;
  - one-tap reactions (Lock it, Fade, Sweating, Called it);
  - the talk, with every name and avatar opening a profile.

What makes it a place to hang out: you go where the game is, you see who is there, and you see what they are on once it kicks off.

## Profile
- **Your profile (Me tab, or your avatar):** a big avatar, your Stack, this week's rank, your season record, your Season 1 weeks as green or red tiles, your Slips (Open and Settled), and this week's rival.
- **Another player's profile (tap any name or avatar, anywhere):** their Stack, rank and record, a Challenge button, and their picks, which appear only as each game kicks off.
- **Tap your Stack (top right on every page):** a sheet with your Stack, your rank, your Stack free to stake, your open Slips, the free Reload when you have busted, and links to your profile and the Board.

## Where Slips went
Slips live in two places: the Stack sheet (open Slips, one tap from anywhere) and the profile (Open and Settled). The old Slips page still exists for Board links.

## What I cut
- Create a contest, commissioner mode, Squads and the contest switcher.
- Units, everywhere a player looks. SIM names that carried Units or Points are renamed on screen.
- The name step: you are signed in as nross and entered automatically.
- Prize figures, since "$" is off the word list.

## What is unfinished or faked
- **The Field and the room talk are SIM players.** Room talk is seeded from short lines, so it repeats, and your own posts stay on your phone.
- **Challenges are on this phone only,** and a SIM player accepts after 3 seconds.
- **The challenge record isn't counted yet.** The season record comes from the engine's season table.
- **The Week 10 pairing is the engine's rival pick,** shown as your opponent after Thursday 7:00 PM. Before that, Matchup shows the countdown and challenges.
- **The Board and the game page are the existing pages** under the new tab bar, not redrawn.
- **Who leans which way in a room is simulated.**
