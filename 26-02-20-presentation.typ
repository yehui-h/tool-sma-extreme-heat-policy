#import "lib.typ": *

#set text(font: "Lato")
#show math.equation: set text(font: "Lato Math")
#show raw: set text(font: "Fira Code")

#show: project.with(
  title: "",
  sub-title: "SMA Tool: Planned Feature Updates",
  author: "",
  date: "19 Feb 2026",
  index-title: "Planned Features",
  logo: image("./images/hhrc.png"),
  logo-light: image("./images/hhrc.png"),
  cover: image("./images/buildings.jpg"),
  main-color: rgb("#E30512"),
  lang: "en",
)

== Install on Mobile Devices

#columns-content(
  colwidths: (2fr, 3fr),
  gutter: 0.6cm,
  [
    Add this app to your home screen for quick access.
  ],
  [
    #image("./images/PWA.png", width: 100%, height: 100%, fit: "contain")
  ],
)

== Share Sport and Location with a Link

#columns-content(
  colwidths: (2fr, 3fr),
  gutter: 0.6cm,
  [
    Share Sport and Location with one link.
    #linebreak()
    #linebreak()
    Keep selected Sport and Location saved for next visit.
  ],
  [
    #image("./images/URL.png", width: 100%, height: 100%, fit: "contain")
  ],
)

== Find Locations Faster

#columns-content(
  colwidths: (2fr, 3fr),
  gutter: 0.6cm,
  [
    Start typing, then tap a suggested location quickly.
  ],
  [
    #image("./images/suggestion.png", width: 100%, height: 100%, fit: "contain")
  ],
)

== Choose Your Language

#columns-content(
  colwidths: (2fr, 3fr),
  gutter: 0.6cm,
  [
    Change language so each user can read guidance clearly.
  ],
  [
    #image("./images/language.png", width: 100%, height: 100%, fit: "contain")
  ],
)

== Profiles for Adults and Kids

#columns-content(
  colwidths: (2fr, 3fr),
  gutter: 0.6cm,
  [
    Pick adult or kids mode for clearer guidance.
  ],
  [
    #image("./images/Profiles.png", width: 100%, height: 100%, fit: "contain")
  ],
)

== See Risk and Raw Data

#columns-content(
  colwidths: (2fr, 3fr),
  gutter: 0.6cm,
  [
    View the risk level with the raw data behind it.
  ],
  [
    #image("./images/rawdata.png", width: 100%, height: 100%, fit: "contain")
  ],
)

== Show This on Any Website

#columns-content(
  colwidths: (2fr, 3fr),
  gutter: 0.6cm,
  [
    Partners can place this tool directly on their websites.
  ],
  [
    #image("./images/iframe.jpeg", width: 100%, height: 100%, fit: "contain")
  ],
)

== Use Current Location

#columns-content(
  colwidths: (2fr, 3fr),
  gutter: 0.6cm,
  [
    Use your current location to get risk results.
  ],
  [
    #image("./images/GPS.png", width: 100%, height: 100%, fit: "contain")
  ],
)

== Login

#columns-content(
  colwidths: (2fr, 3fr),
  gutter: 0.6cm,
  [
    Log in to save personal settings and profiles.
  ],
  [
    #image("./images/login.png", width: 100%, height: 100%, fit: "contain")
  ],
)
