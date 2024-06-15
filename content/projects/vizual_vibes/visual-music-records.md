+++
title = "Visual Music Records"
slug = "visual-music-records"
date = 2024-06-14
tags = ["digital signal processing","image processing", "art"]
category = ["signal processing"]
description = "Creating images from music"
+++

# Inspiration
A while ago I had come across this product that was a display of the average color of each
frame in a movie shown as vertical lines.  The idea was that, as you moved from left to right,
you'd be scrubbing through the movie in time and seeing how the colors and mood change as the film
progresses. In certain films, you would be able to even point out some of your favorite scenes.

I wanted to explore the idea of being able to do something adjacent to this for music.  Music has
always been present in my life, and so I figured, with my experience in image processing, acoustic
signal processing, and my inability to deny my curiosities, why not? I also figured that, if I could
make this process reproducible and visually appealing, I could potentially have a product on my hands.

# Best Laid Plans
After noodling on the idea for a bit, I came up with specific goals I wanted to accomplish so that
I could make sure the end result, should I get there, would match what I had imagined.

- Most importantly, I wanted the result to be visually appealing; I was out to make art and what good is it
if no one wants to look at it.
- I wanted the project to be reproducible and idempotent; meaning, for a given song, I want the process
to yield the same result.
- I wanted the approach to use signal processing techniques; meaning, the result should be dependent on 
the various acoustic properties of the song.
- By using a signal processing approach, the desire for each result to be unique was also covered.
- As I thought more about the product aspect, I found that I wanted there to be a way for the beholder
to have a means to listen to the song from which the result was derived.

With all this (and more) in mind, I figured I was good to get started.

# From Sound to Color
The immediate challenge I faced was **_how in the world do I go about converting sound to color?_**

Furthermore, music is dynamic. Trying to figure out ways to capture the dynamic essence of each song is _instrumental_
(_I see what I did there_) in being able to convey its personality through a different medium.
So, I started to think about what goes into making a song its own, and which of those has the potential
to aid me on this _journey_ (_don't stop, beleav..._). I landed on three main musical attributes and a vision of their
influence on the final product.

The **tempo** of a song can set the mood of a song, so I decided to use it to influence the underlying hue of each song. Think
of that adrenaline inducing, thunderous double base backed tune that helps you rage-cope after a run-in with that self-checkout
with an attitude or that sweet, smooth jazz that makes you just want to vibe out.

The **amplitude** of the song conveys the energy throughout the song and can change dramatically. Think of the classics
like Led Zeppelin's Stairway to Heaven; starting out mellow only to crescendo into a timeless guitar riff and powerful
vocals. Or The Isley Brothers' Shout; encouraging the crowd to take it _a little bit softer now_ just before pumping
up the energy to get everyone _a little bit louder now_ as your newly minted brother-in-law tries to convince a
bridesmaid that their hips do not, in fact, lie. So, to capture the intensity throughout a song, I decided to use it to
influence the song's color saturation.

And finally, the **pitch** of a song. The pitch changes all the time in songs and, in combination with the other attributes,
tells a tale of emotional expression. Think of any Adele song, using pitch elevation to accentuate an
emotional intensity. Or Queen's Bohemian Rhapsody; using shifts in pitch to enhance the storytelling right before you
attempt your best operatic solo in the mirror and notice you forgot to floss.

# Sum of its Parts

After a long time of experimentation, ideation, and frustration, I was able to put something together that I think
accomplishes the goals I set out for myself.  This is a visual record disk that shows a signature of the song, in time,
going from the outside towards the center; just like an actual vinyl record would be played.

| ![Stairway to Heaven - Led Zeppelin](/images/visual-music/StairwaytoHeaven-thumbnail.jpg "Stairway to Heaven - Led Zeppelin") |
|:-----------------------------------------------------------------------------------------------------------------------------:| 
|                                              _Stairway to Heaven - Led Zeppelin_                                              |


In the Stairway to Heaven sample above, we can see the song starting out dim, along the edge of the record. As the song
plays, and we move inward towards the center pinhole, we see the aforementioned crescendo taking place towards the end
of the song.  We see a common 'root' color as influenced by the tempo (bpm) of the song being swayed into other colors
by the pitch changes within the song.

The samples below are from the following songs from top to bottom, respectively: Kate Bush's Running up that Hill,
Thrice's Star at the Sun, and Journey's Don't Stop Believin'.  In each of them, we can see a tempo hue, the rise and
fall of energy, and alterations in pitch.

![Three Record Samples](/images/visual-music/threeRecords.png)


# One Thing Remains ... Well, Two

First, I mentioned that I wanted a way for the viewer to be able to interact with the piece; more specifically, I want a means
to unobtrusively allow the user to experience the song that they are seeing. This is where some previous, exploratory work,
I had done comes into _play_ (_weak, go home!_).  I'm referring to my attempt at making
[circular QR codes]({{< ref "/posts/circular_qr_code/circular_qr.md" >}} ). Combining this with the record image, allows
for a record label to be added that would, upon scan, brings the viewer to a web application (that I created - maybe another post later?)
that directs the user to listen to the song on their preferred platform.  Here's what that looks like:

![Record Label and Close Up](/images/visual-music/recordLabel.png)

Go on, give it a scan (_there goes my aws bill_).

# Last Thing
Naming a thing, is tough. I've gone with `VizualVibes Records` and I'm hoping to take this somewhere, but there's much to learn
about the business and production side of things. For I am a humble ADHD brain with many interests, and prolonged
pursuits are difficult.

### Thanks
Thank you for getting this far, I appreciate you for your time and I hope you found this project interesting. Feel
free to reach out with any questions or thoughts.
