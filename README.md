### ✨ Discord Terminal

An extensible Discord terminal client. Can be used with bot or user tokens.

**Disclaimer**: Self-bots are against ToS and therefore discouraged. I am not responsible for any loss or restriction whatsoever caused by using self-bots or this software.

Although it's intended to be used with a **bot token** which is 100% compliant with Discord's ToS.

### Screenshots

![Discord Terminal](https://i.imgur.com/CBbhXTP.gif)

### Get Started

Setting up is extremely easy. Just issue the following commands:

`$ npm install --global discord-term`

`$ dterm`

That's it! Although keep in mind that since the project is relatively new, you might encounter some bugs here and there.

**This project has been tested and verified as working on native Ubuntu terminal and Windows command prompt + PowerShell using Node.js 10**

Pst. Consider **starring** the repository if you like it! <3

### Tricks & Tips

1. **Get moving quickly!**
    You can easily switch between servers and channels using the **/tag** command.
    
    Example:

        For a channel:

        $ /tag dev 437051394592210944
        $ /c $dev

        Or for a guild:

        $ /tag gamingcorner 286352649610199052
        $ /g $gamingcorner

        Or for a user:

        $ /tag cloudrex 285578743324606482
        $ /dm $cloudrex hello

        You can even use them for normal messages!

        $ <@$cloudrex> => Would send the message: <@285578743324606482>

    Easy right?

    In Linux, you can also just click the channels ;)

2. **Change yo style!**
    Customizability is what this project is heading for. I'm planning on adding support for themes and plugins in the future! As of now, you can edit your message format.

    Example:

        $ /format {sender} ~> {message}

        Or even more fancy:

        $ /format [{sender}] => {message}

    Try it out and match your style. Shiny!
