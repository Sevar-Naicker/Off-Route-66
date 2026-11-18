OFF ROUTE 66 CARWASH
====================

Open index.html in a browser. No build step or server is needed. The photos
load from Unsplash, so they need an internet connection; without one, each
photo falls back to images/placeholder.svg.

PAGES
  index.html     Home: hero with the neon 66 logo and live OPEN sign, how it
                 works as road signs, the three washes, the route (the car
                 drives itself once when you reach it), photo strip, reviews,
                 Pull in band
  book.html      Wash builder, red summary card, booking form with real time
                 slots, booking ticket with an Add to calendar file
  gallery.html   Before-and-after slider, filterable photos, lightbox you can
                 step through with the arrows or the arrow keys
  about.html     The story and the questions
  find-us.html   Live map with the neon pin and Google Maps buttons,
                 directions, live hours table, contact

FILES YOU WILL EDIT
  css/styles.css   Every style. Colours, fonts, sizes and corner radii are
                   tokens in "Section: Tokens" at the top.
  js/site.js       The Config block at the top holds the opening hours, wash
                   names, prices, times, wash photos, extras and route stops.
                   Change them there and every page updates, including the
                   open sign, the hours lists and the booking times.
  fonts/           Anton, DM Sans and Yellowtail, hosted with the site.
  images/          Placeholder, favicon and the before/after illustrations.
  vendor/          Lenis (smooth scroll), GSAP and ScrollTrigger (scroll
                   animation) and Leaflet (the map), hosted with the site.

MAP
  - Set Config.Location in js/site.js to the carwash: in Google Maps,
    right-click the spot and click the numbers at the top to copy them, then
    paste them as Lat and Lng. The sample pin is central Johannesburg.
  - The map tiles are CARTO's dark map, tinted navy in the stylesheet
    (Section: Find us map). Directions open in Google Maps from the
    visitor's own location.
  - The page wheel only zooms the map after someone clicks it, so scrolling
    never gets stuck.

PAGE TRANSITION
  - Cartoon liquid, styled on the reference clips: clicking a link to
    another page pours water down from the top in round-ended drips (with a
    light rim, shine and falling drops) until it covers the screen and the
    66 shield floats in. The next page then pours in over the water the same
    way, leaving a few drops behind. Links to a #section on the same page
    just scroll. Section: Wash page transition in js/site.js, and the small
    script in each page's <head> that keeps the water up until it clears.

WATER BANDS
  - One section per page is drawn in the same flat cartoon water as the
    transition: a rolling surface on top with a light line, and drips of
    all sizes hanging underneath with swollen ends, a light outline and a
    shine. Each drip sways, slowly swells, lets a drop fall and pulls back,
    and the drips stretch as you scroll past. Section: Water bands in
    js/site.js; colours are --band and --band-light in css/styles.css.

SCROLL
  - Smooth scrolling, cards and headings rising in as they arrive, mile
    markers popping up, the road's centre line sliding as you scroll, the
    rocks drifting and the footer wordmark sliding up: all in Section:
    Scroll motion in js/site.js.
  - Visitors who turn on "reduce motion" on their device get none of it.

WHAT IS LIVE
  - The OPEN/CLOSED neon sign, the "Open now, closes at..." notes and the
    hours lists all come from Config.Hours and the visitor's clock.
  - Booking times only offer slots where the chosen wash and extras finish
    before closing; past times are hidden for today.
  - A booking ends on a ticket with a reference number and an .ics calendar
    file. Nothing is sent anywhere yet: send the Booking object in js/site.js
    (Section: Wash builder and booking) to your server to keep bookings.

SAMPLE CONTENT TO REPLACE BEFORE GOING LIVE
  - Opening hours in Config.Hours (sample: Mon to Fri 07:30 to 17:30, Sat
    08:00 to 16:00, Sun 08:00 to 13:00). The same text sits in the HTML as a
    fallback; search for "07:30" to update it.
  - Prices and times in Config.Washes and Config.Extras.
  - Photos: free Unsplash samples (Unsplash licence, no credit required).
    They show other people's cars, so swap them for your own before launch.
      Washes, gallery, home strip: mintosko, Andre Tan, Adrian Dascal,
        Ivan Kazlouskij, Eugene Chystiakov, Emile Guillemot, Luay Barani,
        Muhammad Saad
  - The before/after pictures are illustrations; replace them with two real
    photos taken from the same angle.
  - Square brackets mark the rest: address, phone, WhatsApp, email, social
    links (href="#"), reviews, the story, three FAQ answers, street names,
    directions, the Google Maps link and photo captions.

DESIGN RULES
  - Flat surfaces, no drop shadows; depth comes from colour.
  - Only the neon glows: the 66 logo, the script, the OPEN sign, the map pin.
  - No checkerboard strips: sections are split by space and the water bands.
  - Red for action and feature cards, purple for one review, yellow for
    tags, green for road signs, the how-it-works signs and mile markers.
  - Photos in the wash cards, home strip and gallery are shown in brand
    colours; hovering one in the strip or gallery shows its true colours, and
    the gallery lightbox always shows true colour.
  - Corners: 40px on cards, 20px on panels, full pills on buttons and inputs.
  - Big headings use Anton in capitals; body text is DM Sans Medium.
