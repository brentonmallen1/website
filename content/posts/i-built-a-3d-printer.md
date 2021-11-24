+++
title = "I Built a 3D Printer"
slug = "3d-printer"
date = 2016-10-01T20:45:49-04:00
tags = ["3d printing", "hobbies"]
category = "hobbies"
description = "What I learned building a 3D-printer"
+++
{{< load-photoswipe >}}

For a while, I had been wanting to take on a project but I couldn't decide what I wanted to do.
 One thing lead to another and I settled on the idea of building a 3D printer.
 I shopped around online for a kit and found this one.  Three days after
 (including going through customs) what seemed to be a very shady online purchase, this box
 arrived at my door.

{{< gallery >}}
{{< better-figure src="/images/3d-printer/img_0222.jpg">}}
{{</gallery >}}

I opened it with anticipation, but I was honestly a bit overwhelmed by all of pieces that greeted me.

{{<gallery>}}
{{< better-figure src="/images/3d-printer/img_0223.jpg" >}}
{{</gallery>}}

After gleaming what I could from a manual of nothing put pictures of various
sections of the completed printer and a video of a man putting it together at
10x speed from 5 feet away, I was able to put the beast together.  I also got
a good amount of help from a set of very useful videos posted by
[iceman198](https://www.youtube.com/watch?v=_hA12yCDvVU&list=PLZkNQUudl37ZnbdR9JEziW1ghLiOhSSEN).


{{< gallery >}}
{{< better-figure src="/images/3d-printer/img_0224.jpg" >}}
{{< better-figure src="/images/3d-printer/img_0225.jpg" >}}
{{< better-figure src="/images/3d-printer/img_0231.jpg" >}}
{{< better-figure src="/images/3d-printer/img_0239.jpg" >}}
{{</gallery>}}

It only took a few weekends to have the whole thing assembled, but the tricky part
was dealing with the very sparingly commented (in Chinese) firmware.  The printer
came with a mostly working version but it needed to be tweaked to calibrate the
printer.  It was a frustrating and time consuming process but necessary and quite satisfying
when finished.  The pictures below shows a test box before and after calibration.

{{<gallery>}}
{{< better-figure src="/images/3d-printer/img_0248.jpg" >}}
{{< better-figure src="/images/3d-printer/img_0249.jpg" >}}
{{</gallery>}}

Overall, I'm quite happy with it.  The performance is pretty solid for the
most part (all 3D printers jam and require care). Customer support was also
surprisingly responsive and helpful.  Construction was a bit frustrating at
points, but that's part of the experience.  If it's something you've been
considering, I'd recommend this as a starting point.

{{<gallery>}}
{{< better-figure src="/images/3d-printer/img_0254.jpg" >}}
{{< better-figure src="/images/3d-printer/img_0263.jpg" >}}
{{< better-figure src="/images/3d-printer/img_0266.jpg" >}}
{{</gallery>}}

## Tips
Should you consider building printer like this one, I thought I would
share some tips and issues I ran into.

#### Extra Materials
1. [Stepper Motor Drivers](https://www.amazon.com/gp/product/B0166QZ5HO/ref=pd_sim_421_5?ie=UTF8&psc=1&refRID=AXM39J03965SBJSJYRVM)

2. [Hardware](https://www.amazon.com/Hilitchi-420pcs-Stainless-Socket-Assortment/dp/B014OO5KQG/ref=pd_bxgy_60_2?ie=UTF8&psc=1&refRID=Q4JCDXX7SD3PDWXKK6K6) and
[Heat Shrink](https://www.amazon.com/dp/B0156JYMLW?psc=1)

The kit was pretty complete but, with the lack of explicit instructions, I
found myself either not having enough of certain size screws.  I also found
myself needing more heat shrink tubing as I had to rewire a few times; especially
after breaking the very tiny thermistor. Oh yeah, I had to order a few more of
[those](https://www.amazon.com/HICTOP-Thermistors-Sensor-Reprap-printer/dp/B0150YLX9C/ref=pd_bxgy_328_img_2?ie=UTF8&psc=1&refRID=Z0JC5BN6ZC16QH01KXYG)
as well.

#### Calibration
Calibration is very time consuming and repetitive.  Be patient with it
and it'll work out...eventually.  A couple of things I ran into were bed
leveling, hot end alignment and extruder stepper rate.

The standard bed is a bit difficult to level and I've been looking into printing
something like [these](http://www.thingiverse.com/thing:1102325)
 to help since this is a crucial element to producing
accurate prints.  For this reason, looking back, I would have purchased the heated
bed kit.  This has a better means of leveling with screws and springs attaching
the bed to the frame.

The hot end alignment issue I ran into was caused by the connecting rods not being
the same length.  This is what they looked like before and the resulting hot end alignment:

{{<gallery>}}
{{< better-figure src="/images/3d-printer/img_0232.jpg" height="200">}}
{{< better-figure src="/images/3d-printer/img_0233.jpg" height="200">}}
{{</gallery>}}

Once I was able to make sure they were the same length, you could immediately see the difference:

{{<gallery>}}
{{< better-figure src="/images/3d-printer/img_0234.jpg" height="200">}}
{{</gallery>}}

Finally, I had a lot of frustration with the extruder stepper motor not extruding the
expected length of material.  This was because, for some reason, I was afraid to turn
the rate very low.  Don't worry about this, as long as the extruded material length is
what you expect, it's alright for the rate to be much lower than forums may lead you to believe.
