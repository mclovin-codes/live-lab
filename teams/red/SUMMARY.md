# Team Red, Phase 4: summary

URL: https://mclovin-codes.github.io/live-lab/teams/red/app/

## The idea
Every screen answers two questions: who am I up against this week, and where is everyone talking about tonight's games.

## What to tap first
1. Open Home. Your matchup is the big card: two avatars, two Stacks, one bar. Tap it.
2. On Matchup, look at "Their Slip": your opponent's picks are locked cards with a countdown to kickoff.
3. Tap the Lounge tab. Each game tonight is a room. Open one, tap a reaction, say something.
4. Tap your avatar or your Stack at the top of any page. That is your profile.

## Navigation
Five tabs: Home, Board, Matchup, Ranks, Lounge.
- Matchup takes the old Slips spot, because the 1v1 is the reason to come back.
- Every page has the same top bar: your avatar and name on the left, your Stack on the right. There is no contest switcher and no "find or start a contest".

## Home
In order:
- The next game.
- Your matchup card, showing who leads and by how much.
- "Lounge rooms tonight": live games first, each with Join.
- The prize card.

There is no name step, because the signed-in player (stand-in: shotcaller) is entered in the week automatically.

## Contest and matchups
- Matchup page:
  - You vs your opponent, with big Stacks, a two-colour bar and a verdict (You lead by, Down, All square).
  - A countdown to the Thursday 7:00 PM pairing, then to the week's end.
  - Their Slip, sealed until each kickoff.
  - Your open picks.
  - Your season record: matchups, green weeks and challenges.
  - "Challenge a player" for anyone in the Field.
- Ranks orders the Field by Stack. Stack is the only number a player sees; Units are gone from every main screen.

## The social space: Lounge rooms
The Lounge is no longer one chat feed. It is a set of rooms:
- Your matchup room is pinned on top.
- Then live games (red LIVE tag, score and clock), then what is up next, then just finished.

Each room card shows how many people are in it, their faces and the last line said. Inside a room:
- The score.
- "Who is on what": the Field's split on each side, sealed until kickoff.
- Four one-tap reactions: Lock it, Fade, Sweating, Called it.
- The talk.

Every avatar and name opens that player's profile.

## Profile
- Your own: tap your avatar or your Stack in the top bar.
  - Your Stack, very large.
  - Chips: this week's gain or loss, Stack free to pick, Reload status.
  - Tiles: season record, your matchup (Up or Down vs whom), your rank.
  - A strip of your weeks.
  - In the Lounge: your latest posts, each one opening its room.
  - Challenges: the players you challenged, each one opening their profile.
  - Your Slips, with Open and Settled tabs.
- Another player's: tap any name or avatar in Ranks, the Lounge, Matchup or Home.
  - Their Stack, record, hit rate and sport mix.
  - Challenge and "Talk in the Lounge" buttons.
  - You vs them.
  - Their open picks, sealed until kickoff.

## Where Slips went
Into your profile. Tapping your Stack in the top bar opens the profile at your Slips. The old Slips page still exists but is out of the tab bar.

## What was cut
- Create a contest, commissioner tools, contest invites and the contest switcher are out of the navigation. The files are still in the folder.
- The "enter your name to play" step is gone.

## Unfinished or faked
- The Field is made of stand-in players. Their picks, the room head counts, reaction counts and Lounge lines are generated on the phone.
- Your posts, reactions and challenges stay on this phone only.
- Challenges are recorded as sent but never answered.
- Two stand-in Fields exist under the hood. Your opponent is chosen by name, so it stays the same everywhere, but your rank in the top bar can shift for a moment while the games load.
- Contest pages (contest.html, contests.html) still say Units in places, and they are no longer linked.
