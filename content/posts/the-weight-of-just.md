+++
draft = false
date = 2026-07-22T12:00:00-04:00
title = "The Weight of \"Just\""
description = "On the four-letter word that diminishes work and erodes trust."
slug = "the-weight-of-just"
authors = ["Brenton Mallen"]
tags = ["communication", "career", "engineering"]
category = "communication"
+++

_"Can't you just retrain the model?"_

I've heard some version of this sentence more times than I can count, and if I'm
being honest, I've said my fair share of them too. It sounds harmless. Its
usage has become so common that its presence seems to go unnoticed, but it's
already doing damage, because under that "just"
sits an iceberg: figuring out whether the data drifted or the labels did,
sourcing new labels, rebuilding the feature pipeline that quietly broke two
months ago, validating against the old model, regression testing, and the
deployment, all while wrestling the compounding interest of tech debt. This is really the
three sprints that "retrain" actually costs.

"Just" is how work sounds when it belongs to someone else. Or, as I've said
often enough that it's become a personal motto: _problems are easier when
they're not yours._

That's the whole post, really. But if you've got a minute, I'd like to unpack
why such a small word carries so much weight, because I've come to believe it
does more harm than good and that most of us (myself included) should mostly
stop using it.


# What "Just" Actually Does

Linguistically, "just" is a minimizer. It presupposes that the thing being
described is small, and the listener inherits that presupposition before any
actual discussion happens. The work gets priced before it gets scoped.

The way I see it, that plays out as three distinct harms:

1. **It devalues completed work.** "I just pulled the numbers" erases the
metric-definition archaeology, the three sources that disagreed with each
other, and the join in the pipeline that silently dropped half the rows until you caught it.
2. **It sets false expectations for future work.** "Just add that column as a
feature" anchors the estimate before the person doing the work has said a
word, before anyone's checked for leakage, figured out the backfill, or made
the join point-in-time correct. Any honest estimate now has to negotiate *up*
from a number that was never real.
3. **It manufactures shame.** When the "just" task takes two weeks, the gap
between the word and reality reads as *your* incompetence rather than the
word's dishonesty.

Here's a test: delete "just" from almost any sentence and
nothing breaks. "Can you retrain the model?" carries every bit of the meaning
and none of the smuggled pricing. If the sentence survives the deletion (and
I bet it will), the word wasn't information; it was a discount
sticker.


# When We Say It About Ourselves

This is the version I'm most guilty of. "Oh, I just cleaned up the data a
bit." (After a week of untangling timezone-mangled timestamps, duplicate IDs,
and a categorical column with fourteen different spellings of the same
value.)

I get why we do it. Modesty norms, imposter syndrome,
and a whole culture of effortless genius where competence is supposed to
look easy, so we narrate it that way. It feels humble in the moment.

But there's a compounding cost. Every self-"just" trains your audience that
your work is cheap. You are, one sentence at a time, writing the appraisal
document for your own labor and appraising it to be near zero. Then review season
comes around and the reward isn't proportional to the effort, and some part
of us is surprised. It shouldn't be; we set that price ourselves.


# When It Comes From Above

Now flip it around. "It's just a quick query." "We just need a quick win." or "Can't we just throw an LLM at it?"

When this comes from product or leadership, the word works as a
pre-negotiation tactic, whether it's intended as one or not. The scope is
anchored before the person who'll actually do the work has spoken.

Distance makes everything smaller. This is where the motto earns its keep;
*problems are easier when they're not yours*, and "just" is the sound of that
distance. The further someone is from the work, the more "just" the work
appears.

To be fair, most people saying it aren't being manipulative. They can't see the
iceberg, and that's kind of the point. "Just" is confidence in proportion to
ignorance of the details.

The part that gets me is what happens when the word travels up the chain.
Picture a manager telling a stakeholder, "so-and-so is just going to refresh
the model and we'll have the accuracy back up." Nobody wins that exchange:

- The stakeholder gets a distorted picture of what's actually going on.
- The manager is misrepresenting the effort of their own reports.
- The person doing the work is set up to either fail (it takes longer than
"just" implied, and now they look incompetent) or succeed invisibly (it gets
done, and the win is exactly as small as the word made it sound).

Chronic under-scoping leads to chronic overruns, and the folks doing the work end up
looking incapable when the estimate was poisoned from the beginning.


# There's No Such Thing

There's one more version that can get overlooked, and it comes in two
flavors.

There's no such thing as common sense. "Oh, that's just an embedding."
"That's just a left join." When you're explaining something to someone
unfamiliar with it, "just" tells them the concept is obvious, which means
*not* knowing it is a personal failing. It's dismissive, even when it's meant
kindly, and it can make someone feel dumb for not knowing what you know. The
ML/DS field is particularly bad about this one; there's a lot of accumulated
math, statistics, and tooling hiding behind every "just." Everyone has a different perspective, and what's obvious from yours maybe brand new to someone else's.

There's no such thing as unskilled labor. "It's just flipping burgers."
"They're just watching kids." "It's just cleaning." Every one of those jobs
looks simple from the outside and turns out to have depth the moment it's
yours; ask anyone who's worked a fry station during a lunch rush. "Just"
prices the labor without ever having performed it.

And this pattern isn't even a work thing. "Why don't you just cook at home?"
(to the person working two jobs). "Just sleep when the baby sleeps." (to the
new parent drowning in laundry and bottles). "Just don't worry about that." (to someone who suffers from crippling anxiety).

The common thread is that "just" is spoken from *outside* the labor, about the labor. The word marks the exact spot where the speaker's knowledge ends.


# The Trust Caveat

It's important to not that this isn't absolute.

Plenty of people use "just" as a filler word, and how it lands depends almost
entirely on the trust between the people talking. A teammate I've worked with
for years can say "can't we just..." and I hear brainstorming, not
diminishment, because we've built up enough history that I trust the intent.

But that's kind of the point: trust like that is built over time spent with each other, no matter
how much we'd like it to already be there so we can skip the effort of
communicating carefully. Until it exists, the word carries its full weight,
and the burden is on the speaker, not the listener.


# What to Say Instead

The good news is that the fix costs almost nothing. Mostly it's the same
sentence, minus the word. No corporate-speak substitute required; omission is
the fix.

And the trade is lopsided in your favor. Remove "just" and nothing is lost.
The request survives, the meaning survives, but something is quietly gained.
You're telling the other person you aren't going to price their work before
they've had a chance to. Do that consistently and it compounds. That's the
trust actually getting built, one sentence at a time.

A few situations, though, deserve slightly more:

- **When asking for work:** replace the anchor with a question; lead with curiosity. "How big
would retraining be?" hands the pricing to the person actually holding the
price list.
- **When describing your own work:** state what it took, plainly and without
theater. "That took a few days; the tricky part was getting the backfill
point-in-time correct." That's not bragging, it's invoicing. One sentence of
texture per task is enough to keep your work priced honestly. It also builds trust through
transparency.
- **When you hear it:** a gentle counter works. "What does 'just' mean in this case?" "I think that 'just' seems to be carrying a lot of weight." Cheerful, factual, once. You're
correcting an estimate, not a person, and building trust through an expression of understanding.

And to be clear, some uses of "just" are perfectly fine, mostly when limiting scope.
"Just the header, not the body" (precision) and "I just finished" (timing) aren't the problem.
The target is "just" the minimizer, the one that shrinks someone's work.


# It Was Never "Just" a Retrain

So let's replay the opener, with the fix applied:

_"How big would it be to retrain the model?"_

Same request. Nothing lost. But now the person who can see the iceberg gets
to describe it before anyone's priced it, and whatever effort follows gets to
be its actual size.

"Just" is a four-letter word. Not because it's rude, but because every time
it's spoken, someone's work gets devalued, and it's almost never the
speaker's.

Delete it. Nothing is lost. The sentence survives, and the work gets to keep
its weight. But something is gained, too: a little bit of trust, every time,
and trust pays dividends.

Just give it a try.


If you've made it this far, as always, thank you. 
