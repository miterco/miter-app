This is the codebase for Miter, a web-based better-meetings app created by Miter, Inc., a startup that operated 2020-2022.
We have open-sourced as of December, 2022. Cheers.

# Setting Up Your Dev Environment

ℹ️ **THIS IS DEFINITELY OUT OF DATE**. If you run these instructions and debug something, **please let us know.**

⛔️ Note also that the **server tests will not all pass** right now. Most notably this is because I've removed the content
from `/server/testing/gcal-list-events-result.json` since it contained my actual personal calendar data. But in addition,
I did some batch scrubbing of team email addresses and other potentially-real info from our sample data. Mostly I did it
in a global-find-and-replace sort of way that should leave the tests intact but that may not be 100% true. If you find
errors, feel free to submit a PR!

## (1) Initial Setup

First, you'll get our main codebase (the `miter-app` repo) running. It contains the `client` and `server` projects, along with the `common` module that's shared between them.

### Part A: Platform-Specific Setup

Start with the platform-specific setup file in the `README-subpages` folder alongside this README.

[Mac - Initial Setup](./README-subpages/initial-setup-mac.md)

[Windows - Initial Setup with WSL](./README-subpages/initial-setup-windows.md)

[Linux - Initial Setup](./README-subpages/initial-setup-linux.md)

### Part B: Cross-Platform Setup

1. You'll need a [Google cloud project](https://developers.google.com/workspace/guides/create-project) to support both authentication and GCal access. We'd recommend having one for production, and one for development. For the latter, copy the client ID and client secret into your local server `.env` file. (And you'll need to do the equivalent on whatever platform you're hosting the server.) The's also a similar procedure for Hubspot if you want to use that. Where does that `.env` come from? Just make a copy of `sample.env`.

## (2) Running the App

- The repo contains several separate projects. It's possible for some very limited testing to run `server` and `web/client` side by side, but most of the time you'll first do an `npm run build` on client, which builds the client into a directory on the server.
- The `common` module is code shared between client and server.
- To run the server:
  1. `cd` into `server` and `npm run dev`. It should start a server at `[localhost:3000](http://localhost:3000)` and auto-restart it in response to code changes. 🔥 **This will fail the very first time you do it—it'll go into an infinite loop due to an as-yet-unfixed bug in our build system. Just `Ctrl-C` and do it again.**
  2. Use a service like [ngrok](https://ngrok.com/) to point a persistent domain at your local server. Then you can register that domain with your Google project.
  3. Note: Avoid using `npm run build` on the server locally. It will generate a whole log of JS files you then have to delete.

💡 That might be enough for now, but when you're ready for more, head on over to [Setup, Part Two](./README-subpages/setup-2.md).

## Known Issues

- In order to support `LESS` files directly (which made working with `antd` components easier), and to allow use of the `common` module, we use `craco` to support modification of the React build process without ejecting from `react-scripts`. We wish we hadn't done that, because that's blocked our ability to upgrade to `react-scripts` v4 (which `craco` still doesn't support). We've done most of the work to back out of direct `LESS` overrides for `antd`, and at this point moving over to `SASS` should be pretty easy. We still don't have a good answer on the `common` module. But the `react-scripts` issue is getting pretty severe, as newer functionality relies on v5 more and more. If we were continuing operations, we would probably drop everything for a week or two and fix this.
