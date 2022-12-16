# Setup, Part II

# Additional Server Setup

## Google Calendar

Our setup for talking to GCal is a multi-part thing involving login tokens, sync tokens, push channels and push tokens, and scheduled jobs.

The setup under Supporting User Logins above will get you connected to Google Calendar via our test Google developer project. The only missing piece is the push channel, which allows Google to ping us when a user's calendar changes. Since we _also_ grab calendar events on demand when we don't have them, you'll rarely need a push channel in your local testing but can set one up via [ngrok](https://ngrok.com/) if you do:

1. Edit `GCAL_PUSH_ENDPOINT` in your server `.env`: just replace `[your_ngrok_subdomain]` with whatever you want to use.
2. Install `ngrok`.
3. Start our server via `npm run dev`.
4. Run `ngrok http -subdomain=[your_ngrok_subdomain] 3000`.
5. Your local server should now be available at `https://[your_ngrok_subdomain].ngrok.io`, and the associated line in `.env` will cause it to register that address with Google when setting up push channels.

## Email via SendGrid

We send summary emails (and, eventually, others) via SendGrid. The following environment variables should be set to get that working:

- `ENABLE_EXTERNAL_EMAIL`: Keep this set to `false` unless you have a good reason not to. It prevents the server from emailing anyone outside our domain, so you don't accidentally spam people while testing.
- `EMAIL_WHITELIST`: Exceptions to `ENABLE_EXTERNAL_EMAIL`.
- `SENDGRID_API_KEY`: Get this from your SendGrid account.
- `SUMMARY_EMAIL_TEMPLATE_ID`: The template used to send summary emails. Should be up to date in `sample.env`?

# The Extension

<aside>
⚠️ **Important:** When testing the extension locally, it will expect a full production build of our other code and look for the React app at `localhost:3000/app`, not `:8000`. So before testing via the extension, you'll need to cd into `/client` and do an `npm run build` to build the React app into the server folder.

</aside>

### Building

Even if you're not working with the extension directly, you'll sometimes need to build it in order to test our whole experience end to end. To do so:

1. Clone `chrome-extension` and `npm install`.
2. `npm run dev` to build it to connect to a local dev server. `npm run test` to connect to our Heroku test server. `npm run build` to make a production build.
3. Go to `chrome://extensions`. Enable developer mode if you haven't already. Click on Load Unpacked, select the `dist` directory created by the build process, and the extension should be installed.

# Code linting and auto-formatting

Every project contains a `.eslintrc.js` file that defines the code style rules for the project. You will need to setup your IDE to automatically format the code files on save.

### VSCode

1. Go to the **Extensions** tab in the sidebar and install the **ESLint** extension in VSCode
2. Press **Ctrl+Shift+P** or **Cmd+Shift+P** and select **Preferences: Open Settings (JSON)**
3. Replace the empty JSON config with the following:

```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": ["typescript", "typescriptreact"]
}
```

1. Restart VSCode.
